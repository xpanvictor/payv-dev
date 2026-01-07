import { Wallet, HDNodeWallet, Mnemonic, JsonRpcProvider } from 'ethers';
import * as SecureStore from 'expo-secure-store';

// ============================================================================
// Network Configuration (no magic literals)
// ============================================================================

export enum NetworkName {
    MANTLE_TESTNET = 'Mantle Testnet',
}

export const MantleTestnet = {
    CHAIN_ID: 5001,
    RPC_URL: 'https://rpc.testnet.mantle.xyz',
    EXPLORER_URL: 'https://explorer.testnet.mantle.xyz',
    CURRENCY_SYMBOL: 'MNT',
    NETWORK_NAME: NetworkName.MANTLE_TESTNET,
} as const;

// ============================================================================
// Secure Storage Keys
// ============================================================================

enum StorageKey {
    WALLET_MNEMONIC = 'wallet_mnemonic',
    WALLET_ADDRESS = 'wallet_address',
}

// ============================================================================
// Wallet Types
// ============================================================================

export interface WalletData {
    address: string;
    mnemonic: string;
}

export interface CreatedWallet extends WalletData {
    privateKey: string;
}

// ============================================================================
// Wallet Service
// ============================================================================

/**
 * Generates a new HD wallet with a 12-word mnemonic phrase.
 * The wallet is NOT automatically saved — the user must confirm backup first.
 */
export function createWallet(): CreatedWallet {
    // Create random mnemonic (12 words by default with 128 bits entropy)
    const ENTROPY_BITS = 128;
    const mnemonic = Mnemonic.fromEntropy(Wallet.createRandom().mnemonic!.entropy);
    const wallet = HDNodeWallet.fromMnemonic(mnemonic);

    return {
        address: wallet.address,
        mnemonic: mnemonic.phrase,
        privateKey: wallet.privateKey,
    };
}

/**
 * Restores a wallet from an existing mnemonic phrase.
 * @throws Error if mnemonic is invalid
 */
export function importWallet(mnemonicPhrase: string): CreatedWallet {
    const normalizedPhrase = mnemonicPhrase.trim().toLowerCase();

    // Validate mnemonic
    if (!Mnemonic.isValidMnemonic(normalizedPhrase)) {
        throw new Error('Invalid mnemonic phrase. Please check your words and try again.');
    }

    const mnemonic = Mnemonic.fromPhrase(normalizedPhrase);
    const wallet = HDNodeWallet.fromMnemonic(mnemonic);

    return {
        address: wallet.address,
        mnemonic: mnemonic.phrase,
        privateKey: wallet.privateKey,
    };
}

/**
 * Securely stores the wallet mnemonic using device encryption.
 * Call this ONLY after the user confirms they've backed up the passphrase.
 */
export async function saveWallet(wallet: WalletData): Promise<void> {
    await SecureStore.setItemAsync(StorageKey.WALLET_MNEMONIC, wallet.mnemonic);
    await SecureStore.setItemAsync(StorageKey.WALLET_ADDRESS, wallet.address);
}

/**
 * Retrieves the stored wallet, if any.
 * @returns null if no wallet is stored
 */
export async function loadWallet(): Promise<WalletData | null> {
    const mnemonic = await SecureStore.getItemAsync(StorageKey.WALLET_MNEMONIC);
    const address = await SecureStore.getItemAsync(StorageKey.WALLET_ADDRESS);

    if (!mnemonic || !address) {
        return null;
    }

    return { mnemonic, address };
}

/**
 * Checks if a wallet is already stored on the device.
 */
export async function hasStoredWallet(): Promise<boolean> {
    const address = await SecureStore.getItemAsync(StorageKey.WALLET_ADDRESS);
    return address !== null;
}

/**
 * Deletes the stored wallet from secure storage.
 * Use with caution — this is irreversible.
 */
export async function deleteWallet(): Promise<void> {
    await SecureStore.deleteItemAsync(StorageKey.WALLET_MNEMONIC);
    await SecureStore.deleteItemAsync(StorageKey.WALLET_ADDRESS);
}

/**
 * Returns an ethers provider connected to Mantle Testnet.
 */
export function getMantleProvider(): JsonRpcProvider {
    return new JsonRpcProvider(MantleTestnet.RPC_URL, {
        chainId: MantleTestnet.CHAIN_ID,
        name: MantleTestnet.NETWORK_NAME,
    });
}

/**
 * Gets the current balance for a wallet address on Mantle Testnet.
 * @returns Balance in MNT as a formatted string
 */
export async function getBalance(address: string): Promise<string> {
    const provider = getMantleProvider();
    const balance = await provider.getBalance(address);
    // Format with 4 decimal places
    const DECIMALS_TO_SHOW = 4;
    const formatted = (Number(balance) / 1e18).toFixed(DECIMALS_TO_SHOW);
    return formatted;
}

/**
 * Validates a mnemonic phrase without creating a wallet.
 */
export function isValidMnemonic(phrase: string): boolean {
    try {
        return Mnemonic.isValidMnemonic(phrase.trim().toLowerCase());
    } catch {
        return false;
    }
}

/**
 * Splits a mnemonic phrase into individual words.
 */
export function getMnemonicWords(mnemonic: string): string[] {
    return mnemonic.trim().split(' ');
}
