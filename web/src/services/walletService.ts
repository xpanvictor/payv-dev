import { Wallet, HDNodeWallet, Mnemonic, JsonRpcProvider } from 'ethers';

// ============================================================================
// Network Configuration
// ============================================================================

export enum NetworkName {
    MANTLE_SEPOLIA = 'Mantle Sepolia',
}

// Use proxy in development to bypass CORS
const isDev = import.meta.env.DEV;
const RPC_URL = isDev ? `${window.location.origin}/rpc` : 'https://rpc.sepolia.mantle.xyz';

export const MantleTestnet = {
    CHAIN_ID: 5003,
    RPC_URL,
    EXPLORER_URL: 'https://sepolia.mantlescan.xyz',
    CURRENCY_SYMBOL: 'MNT',
    NETWORK_NAME: NetworkName.MANTLE_SEPOLIA,
} as const;

// ============================================================================
// Storage Keys
// ============================================================================

enum StorageKey {
    WALLET_MNEMONIC = 'vault3_wallet_mnemonic',
    WALLET_ADDRESS = 'vault3_wallet_address',
    WALLET_PIN_HASH = 'vault3_wallet_pin_hash',
    PRIVATE_BALANCE = 'vault3_private_balance',
    TRANSACTIONS = 'vault3_transactions',
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

export interface WalletBalances {
    publicBalance: string;
    privateBalance: string;
}

export type TransactionType = 'SEND' | 'RECEIVE' | 'SHIELD' | 'UNSHIELD';

export interface Transaction {
    id: string;
    type: TransactionType;
    amount: string;
    date: number;
    status: 'PENDING' | 'CONFIRMED' | 'FAILED';
    hash?: string;
    to?: string;
    from?: string;
}

// ============================================================================
// Encryption Helpers
// ============================================================================

/**
 * Simple XOR encryption for local storage obfuscation.
 * NOT for high-security purposes, just to prevent plain-text storage.
 */
function encryptData(text: string, key: string): string {
    let result = '';
    for (let i = 0; i < text.length; i++) {
        result += String.fromCharCode(
            text.charCodeAt(i) ^ key.charCodeAt(i % key.length)
        );
    }
    return btoa(result);
}

function decryptData(encryptedBase64: string, key: string): string {
    try {
        const text = atob(encryptedBase64);
        let result = '';
        for (let i = 0; i < text.length; i++) {
            result += String.fromCharCode(
                text.charCodeAt(i) ^ key.charCodeAt(i % key.length)
            );
        }
        return result;
    } catch {
        return '';
    }
}

// ============================================================================
// Wallet Service Functions
// ============================================================================

export function createWallet(): CreatedWallet {
    const mnemonic = Mnemonic.fromEntropy(Wallet.createRandom().mnemonic!.entropy);
    const wallet = HDNodeWallet.fromMnemonic(mnemonic);

    return {
        address: wallet.address,
        mnemonic: mnemonic.phrase,
        privateKey: wallet.privateKey,
    };
}

export function importWallet(mnemonicPhrase: string): CreatedWallet {
    const normalizedPhrase = mnemonicPhrase.trim().toLowerCase();

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

export async function saveWallet(wallet: WalletData, pin: string): Promise<void> {
    const encoder = new TextEncoder();
    const pinData = encoder.encode(pin);
    const pinHash = await crypto.subtle.digest('SHA-256', pinData);
    const pinHashHex = Array.from(new Uint8Array(pinHash))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

    const encryptedMnemonic = encryptData(wallet.mnemonic, pinHashHex);

    localStorage.setItem(StorageKey.WALLET_MNEMONIC, encryptedMnemonic);
    localStorage.setItem(StorageKey.WALLET_ADDRESS, wallet.address);
    localStorage.setItem(StorageKey.WALLET_PIN_HASH, pinHashHex);
}

export async function loadWallet(pin: string): Promise<WalletData | null> {
    const storedPinHash = localStorage.getItem(StorageKey.WALLET_PIN_HASH);
    const encryptedMnemonic = localStorage.getItem(StorageKey.WALLET_MNEMONIC);
    const address = localStorage.getItem(StorageKey.WALLET_ADDRESS);

    if (!storedPinHash || !encryptedMnemonic || !address) {
        return null;
    }

    const encoder = new TextEncoder();
    const pinData = encoder.encode(pin);
    const pinHash = await crypto.subtle.digest('SHA-256', pinData);
    const pinHashHex = Array.from(new Uint8Array(pinHash))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

    if (pinHashHex !== storedPinHash) {
        throw new Error('Incorrect PIN');
    }

    const mnemonic = decryptData(encryptedMnemonic, pinHashHex);

    return { mnemonic, address };
}

export function hasStoredWallet(): boolean {
    return localStorage.getItem(StorageKey.WALLET_ADDRESS) !== null;
}

export async function verifyPin(pin: string): Promise<boolean> {
    const storedPinHash = localStorage.getItem(StorageKey.WALLET_PIN_HASH);
    if (!storedPinHash) return false;

    const encoder = new TextEncoder();
    const pinData = encoder.encode(pin);
    const pinHash = await crypto.subtle.digest('SHA-256', pinData);
    const pinHashHex = Array.from(new Uint8Array(pinHash))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

    return pinHashHex === storedPinHash;
}

export function deleteWallet(): void {
    localStorage.removeItem(StorageKey.WALLET_MNEMONIC);
    localStorage.removeItem(StorageKey.WALLET_ADDRESS);
    localStorage.removeItem(StorageKey.WALLET_PIN_HASH);
}

export function getStoredAddress(): string | null {
    return localStorage.getItem(StorageKey.WALLET_ADDRESS);
}

export function getMantleProvider(): JsonRpcProvider {
    // Use staticNetwork to prevent ethers from querying the network on startup
    return new JsonRpcProvider(MantleTestnet.RPC_URL, {
        chainId: MantleTestnet.CHAIN_ID,
        name: MantleTestnet.NETWORK_NAME,
    }, { staticNetwork: true });
}

/**
 * @deprecated Use getPublicBalance instead for clarity
 */
export async function getBalance(address: string): Promise<string> {
    return getPublicBalance(address);
}

/**
 * Gets the public (on-chain) balance for a wallet address.
 * @returns Balance in MNT as a formatted string
 */
export async function getPublicBalance(address: string): Promise<string> {
    const provider = getMantleProvider();
    const balance = await provider.getBalance(address);
    const DECIMALS_TO_SHOW = 4;
    return (Number(balance) / 1e18).toFixed(DECIMALS_TO_SHOW);
}

/**
 * Gets the private (locally-stored) balance.
 * @returns Private balance as a formatted string, defaults to '0.0000'
 */
export function getPrivateBalance(): string {
    const DEFAULT_BALANCE = '0.0000';
    return localStorage.getItem(StorageKey.PRIVATE_BALANCE) ?? DEFAULT_BALANCE;
}

/**
 * Sets the private (locally-stored) balance.
 * @param amount - The balance amount as a string
 */
export function setPrivateBalance(amount: string): void {
    localStorage.setItem(StorageKey.PRIVATE_BALANCE, amount);
}

/**
 * Gets both public and private balances for a wallet.
 * @returns WalletBalances object with publicBalance and privateBalance
 */
export async function getWalletBalances(address: string): Promise<WalletBalances> {
    const publicBalance = await getPublicBalance(address);
    const privateBalance = getPrivateBalance();
    return { publicBalance, privateBalance };
}

export function isValidMnemonic(phrase: string): boolean {
    try {
        return Mnemonic.isValidMnemonic(phrase.trim().toLowerCase());
    } catch {
        return false;
    }
}

export function getMnemonicWords(mnemonic: string): string[] {
    return mnemonic.trim().split(' ');
}



export async function loadTransactions(pin: string): Promise<Transaction[]> {
    const storedData = localStorage.getItem(StorageKey.TRANSACTIONS);
    const storedPinHash = localStorage.getItem(StorageKey.WALLET_PIN_HASH);

    if (!storedData || !storedPinHash) {
        return [];
    }

    // Verify PIN first
    const encoder = new TextEncoder();
    const pinData = encoder.encode(pin);
    const pinHash = await crypto.subtle.digest('SHA-256', pinData);
    const pinHashHex = Array.from(new Uint8Array(pinHash))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

    if (pinHashHex !== storedPinHash) {
        throw new Error('Incorrect PIN');
    }

    try {
        const decryptedJson = decryptData(storedData, pinHashHex);
        return JSON.parse(decryptedJson);
    } catch {
        return [];
    }
}

export async function saveTransactions(transactions: Transaction[], pin: string): Promise<void> {
    const encoder = new TextEncoder();
    const pinData = encoder.encode(pin);
    const pinHash = await crypto.subtle.digest('SHA-256', pinData);
    const pinHashHex = Array.from(new Uint8Array(pinHash))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

    const json = JSON.stringify(transactions);
    const encryptedData = encryptData(json, pinHashHex);

    localStorage.setItem(StorageKey.TRANSACTIONS, encryptedData);
}
