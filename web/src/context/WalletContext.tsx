import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import {
    hasStoredWallet,
    getStoredAddress,
    loadWallet,
    saveWallet,
    deleteWallet,
    createWallet,
    importWallet,
    verifyPin,
    getPublicBalance,
    getPrivateBalance,
    setPrivateBalance,
    type WalletData,
    type CreatedWallet,
} from '../services/walletService';
import {
    saveNote,
    loadNotes,
    getPrivateBalanceFromNotes,
    markNoteSpent,
    type StoredNote,
} from '../services/noteStorage';
import { generateDepositProof } from '../services/circuitService';
import { randomField, hexToField } from '../utils/poseidonHash';
import { ProofStatus } from '../services/circuitTypes';

// ============================================================================
// Wallet State Types
// ============================================================================

export enum WalletStatus {
    LOADING = 'LOADING',
    NO_WALLET = 'NO_WALLET',
    LOCKED = 'LOCKED',
    UNLOCKED = 'UNLOCKED',
}

interface WalletContextState {
    status: WalletStatus;
    address: string | null;
    publicBalance: string | null;
    privateBalance: string | null;
    wallet: WalletData | null;
    pendingWallet: CreatedWallet | null;
    notes: StoredNote[];
    proofStatus: ProofStatus;
}

export interface ShieldResult {
    success: boolean;
    commitment?: string;
    error?: string;
}

export interface UnshieldResult {
    success: boolean;
    nullifier?: string;
    error?: string;
}

interface WalletContextActions {
    generateNewWallet: () => CreatedWallet;
    restoreWallet: (mnemonic: string) => CreatedWallet;
    confirmWalletCreation: (pin: string) => Promise<void>;
    unlock: (pin: string) => Promise<boolean>;
    lock: () => void;
    removeWallet: () => void;
    refreshBalances: () => Promise<void>;
    updatePrivateBalance: (amount: string) => void;
    setPendingWallet: (wallet: CreatedWallet | null) => void;
    shield: (amount: string, pin: string) => Promise<ShieldResult>;
    unshield: (noteNullifier: string, pin: string) => Promise<UnshieldResult>;
    refreshNotes: (pin: string) => Promise<void>;
}

type WalletContextType = WalletContextState & WalletContextActions;

// ============================================================================
// Context Creation
// ============================================================================

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
    const [status, setStatus] = useState<WalletStatus>(WalletStatus.LOADING);
    const [address, setAddress] = useState<string | null>(null);
    const [publicBalance, setPublicBalance] = useState<string | null>(null);
    const [privateBalance, setPrivateBalanceState] = useState<string | null>(null);
    const [wallet, setWallet] = useState<WalletData | null>(null);
    const [pendingWallet, setPendingWallet] = useState<CreatedWallet | null>(null);
    const [notes, setNotes] = useState<StoredNote[]>([]);
    const [proofStatus, setProofStatus] = useState<ProofStatus>(ProofStatus.IDLE);

    // Initialize on mount
    useEffect(() => {
        const init = async () => {
            if (hasStoredWallet()) {
                const storedAddress = getStoredAddress();
                setAddress(storedAddress);
                setStatus(WalletStatus.LOCKED);
            } else {
                setStatus(WalletStatus.NO_WALLET);
            }
        };
        init();
    }, []);

    const generateNewWallet = useCallback((): CreatedWallet => {
        const newWallet = createWallet();
        setPendingWallet(newWallet);
        return newWallet;
    }, []);

    const restoreWallet = useCallback((mnemonic: string): CreatedWallet => {
        const restoredWallet = importWallet(mnemonic);
        setPendingWallet(restoredWallet);
        return restoredWallet;
    }, []);

    const confirmWalletCreation = useCallback(async (pin: string): Promise<void> => {
        if (!pendingWallet) {
            throw new Error('No pending wallet to confirm');
        }

        await saveWallet(
            { address: pendingWallet.address, mnemonic: pendingWallet.mnemonic },
            pin
        );

        setAddress(pendingWallet.address);
        setWallet({ address: pendingWallet.address, mnemonic: pendingWallet.mnemonic });
        setStatus(WalletStatus.UNLOCKED);
        setPendingWallet(null);

        // Fetch initial balances
        try {
            const pubBal = await getPublicBalance(pendingWallet.address);
            setPublicBalance(pubBal);
            setPrivateBalanceState(getPrivateBalance());
        } catch {
            setPublicBalance('0.0000');
            setPrivateBalanceState('0.0000');
        }
    }, [pendingWallet]);

    const unlock = useCallback(async (pin: string): Promise<boolean> => {
        try {
            const isValid = await verifyPin(pin);
            if (!isValid) return false;

            const walletData = await loadWallet(pin);
            if (!walletData) return false;

            setWallet(walletData);
            setStatus(WalletStatus.UNLOCKED);

            // Fetch balances
            try {
                const pubBal = await getPublicBalance(walletData.address);
                setPublicBalance(pubBal);
                setPrivateBalanceState(getPrivateBalance());
            } catch {
                setPublicBalance('0.0000');
                setPrivateBalanceState('0.0000');
            }

            return true;
        } catch {
            return false;
        }
    }, []);

    const lock = useCallback(() => {
        setWallet(null);
        setStatus(WalletStatus.LOCKED);
    }, []);

    const removeWallet = useCallback(() => {
        deleteWallet();
        setWallet(null);
        setAddress(null);
        setPublicBalance(null);
        setPrivateBalanceState(null);
        setStatus(WalletStatus.NO_WALLET);
    }, []);

    const refreshBalances = useCallback(async () => {
        if (!address) return;
        try {
            const pubBal = await getPublicBalance(address);
            setPublicBalance(pubBal);
            setPrivateBalanceState(getPrivateBalance());
        } catch {
            // Keep existing balances on error
        }
    }, [address]);

    const updatePrivateBalance = useCallback((amount: string) => {
        setPrivateBalance(amount);
        setPrivateBalanceState(amount);
    }, []);

    const refreshNotes = useCallback(async (pin: string) => {
        try {
            const userNotes = await loadNotes(pin);
            setNotes(userNotes);
            const totalPrivate = await getPrivateBalanceFromNotes(pin);
            const formattedBalance = (Number(totalPrivate) / 1e18).toFixed(4);
            setPrivateBalanceState(formattedBalance);
            setPrivateBalance(formattedBalance);
        } catch {
            // Keep existing notes on error
        }
    }, []);

    const shield = useCallback(async (amount: string, pin: string): Promise<ShieldResult> => {
        if (!address) {
            return { success: false, error: 'No wallet address' };
        }

        try {
            setProofStatus(ProofStatus.LOADING_CIRCUIT);

            const amountWei = BigInt(Math.floor(parseFloat(amount) * 1e18));
            const owner = hexToField(address);
            const secret = randomField();

            const note = { owner, value: amountWei, secret };

            setProofStatus(ProofStatus.GENERATING_PROOF);

            const result = await generateDepositProof({ note });

            // Save note to local storage
            await saveNote(note, pin);

            // Update private balance
            await refreshNotes(pin);

            setProofStatus(ProofStatus.COMPLETE);

            return {
                success: true,
                commitment: result.publicInputs.commitment,
            };
        } catch (err) {
            setProofStatus(ProofStatus.ERROR);
            return {
                success: false,
                error: err instanceof Error ? err.message : 'Shield failed',
            };
        }
    }, [address, refreshNotes]);

    const unshield = useCallback(async (noteNullifier: string, pin: string): Promise<UnshieldResult> => {
        try {
            // Mark note as spent locally
            const marked = await markNoteSpent(noteNullifier, pin);
            if (!marked) {
                return { success: false, error: 'Note not found' };
            }

            // Update balances
            await refreshNotes(pin);

            return {
                success: true,
                nullifier: noteNullifier,
            };
        } catch (err) {
            return {
                success: false,
                error: err instanceof Error ? err.message : 'Unshield failed',
            };
        }
    }, [refreshNotes]);

    // Memoize context value to prevent unnecessary re-renders of consumers
    const value: WalletContextType = useMemo(() => ({
        status,
        address,
        publicBalance,
        privateBalance,
        wallet,
        pendingWallet,
        notes,
        proofStatus,
        generateNewWallet,
        restoreWallet,
        confirmWalletCreation,
        unlock,
        lock,
        removeWallet,
        refreshBalances,
        updatePrivateBalance,
        setPendingWallet,
        shield,
        unshield,
        refreshNotes,
    }), [
        status,
        address,
        publicBalance,
        privateBalance,
        wallet,
        pendingWallet,
        notes,
        proofStatus,
        generateNewWallet,
        restoreWallet,
        confirmWalletCreation,
        unlock,
        lock,
        removeWallet,
        refreshBalances,
        updatePrivateBalance,
        shield,
        unshield,
        refreshNotes,
    ]);

    return (
        <WalletContext.Provider value={value}>
            {children}
        </WalletContext.Provider>
    );
}

export function useWallet(): WalletContextType {
    const context = useContext(WalletContext);
    if (context === undefined) {
        throw new Error('useWallet must be used within a WalletProvider');
    }
    return context;
}
