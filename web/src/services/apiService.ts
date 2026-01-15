/**
 * API Service - Indexer & Relayer Communication
 *
 * Provides HTTP clients for the PayV backend services:
 * - Indexer (port 8080): Merkle proofs, note access, transaction details
 * - Relayer (port 8081): Transaction submission and status tracking
 */

// ============================================================================
// Configuration
// ============================================================================

const INDEXER_BASE_URL = import.meta.env.VITE_INDEXER_URL || 'http://localhost:8080';
const RELAYER_BASE_URL = import.meta.env.VITE_RELAYER_URL || 'http://localhost:8081';

// Default relayer fee (0 for now, configurable)
const DEFAULT_RELAYER_FEE = '0';

// ============================================================================
// API Response Types
// ============================================================================

export interface MerkleProofResponse {
    path: string[];
    indices: number[];
    root: string;
    leaf: string;
}

export interface MerkleRootResponse {
    root: string;
}

export interface CanViewNoteResponse {
    can_view: boolean;
    notes?: EncryptedNoteResponse[];
}

export interface EncryptedNoteResponse {
    encrypted_data: string;
    commitment_hash: string;
}

export interface TransactionResponse {
    type: string;
    tx_hash: string;
    block_number: number;
    commitment_hash?: string;
    nullifier?: string;
}

export interface RelayerSubmitResponse {
    transactionId: string;
    status: RelayerTransactionStatus;
    message: string;
}

export enum RelayerTransactionStatus {
    PENDING = 'PENDING',
    SUBMITTED = 'SUBMITTED',
    CONFIRMED = 'CONFIRMED',
    FAILED = 'FAILED',
}

export interface RelayerTransactionStatusResponse {
    ID: string;
    Type: string;
    Status: RelayerTransactionStatus;
    TxHash: string;
    BlockNumber: number;
    GasUsed: number;
    Error: string | null;
    CreatedAt: string;
    UpdatedAt: string;
}

// ============================================================================
// Request Types
// ============================================================================

export interface DepositRequest {
    proof: string;
    publicInputs: string[];
    encryptedNote: string;
    amount: string;
    userAddress: string;
}

export interface TransferRequest {
    proof: string;
    publicInputs: string[];
    encryptedNote: string;
    userAddress: string;
}

export interface WithdrawRequest {
    proof: string;
    publicInputs: string[];
    encryptedNote: string;
    recipient: string;
    relayerFee: string;
    userAddress: string;
}

// ============================================================================
// API Error Handling
// ============================================================================

export class ApiError extends Error {
    constructor(
        message: string,
        public statusCode: number,
        public endpoint: string
    ) {
        super(message);
        this.name = 'ApiError';
    }
}

async function handleResponse<T>(response: Response, endpoint: string): Promise<T> {
    if (!response.ok) {
        const errorBody = await response.text();
        let message = `API request failed: ${response.statusText}`;
        try {
            const parsed = JSON.parse(errorBody);
            message = parsed.error || message;
        } catch {
            // Use default message if parsing fails
        }
        throw new ApiError(message, response.status, endpoint);
    }
    return response.json();
}

// ============================================================================
// Indexer API Functions
// ============================================================================

/**
 * Get Merkle proof for a commitment hash
 */
export async function getMerkleProof(commitment: string): Promise<MerkleProofResponse> {
    const endpoint = `/api/v1/proof/${commitment}`;
    const response = await fetch(`${INDEXER_BASE_URL}${endpoint}`);
    return handleResponse<MerkleProofResponse>(response, endpoint);
}

/**
 * Get current Merkle root from indexer
 */
export async function getMerkleRoot(): Promise<string> {
    const endpoint = '/api/v1/merkle-root';
    const response = await fetch(`${INDEXER_BASE_URL}${endpoint}`);
    const data = await handleResponse<MerkleRootResponse>(response, endpoint);
    return data.root;
}

/**
 * Check if user can view an encrypted note
 */
export async function canViewNote(
    commitment: string,
    userAddress: string
): Promise<CanViewNoteResponse> {
    const endpoint = `/api/v1/note/${commitment}/can-view?address=${userAddress}`;
    const response = await fetch(`${INDEXER_BASE_URL}${endpoint}`);
    return handleResponse<CanViewNoteResponse>(response, endpoint);
}

/**
 * Get transaction details from indexer
 */
export async function getIndexerTransaction(
    txHash: string,
    viewingKey?: string
): Promise<TransactionResponse> {
    const queryParam = viewingKey ? `?viewing_key=${viewingKey}` : '';
    const endpoint = `/api/v1/transaction/${txHash}${queryParam}`;
    const response = await fetch(`${INDEXER_BASE_URL}${endpoint}`);
    return handleResponse<TransactionResponse>(response, endpoint);
}

// ============================================================================
// Relayer API Functions
// ============================================================================

/**
 * Submit a deposit transaction to the relayer
 */
export async function submitDeposit(
    proof: string,
    publicInputs: string[],
    encryptedNote: string,
    amount: string,
    userAddress: string
): Promise<RelayerSubmitResponse> {
    const endpoint = '/api/v1/relayer/deposit';
    const body: DepositRequest = {
        proof,
        publicInputs,
        encryptedNote,
        amount,
        userAddress,
    };

    const response = await fetch(`${RELAYER_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });

    return handleResponse<RelayerSubmitResponse>(response, endpoint);
}

/**
 * Submit a transfer transaction to the relayer
 */
export async function submitTransfer(
    proof: string,
    publicInputs: string[],
    encryptedNote: string,
    userAddress: string
): Promise<RelayerSubmitResponse> {
    const endpoint = '/api/v1/relayer/transfer';
    const body: TransferRequest = {
        proof,
        publicInputs,
        encryptedNote,
        userAddress,
    };

    const response = await fetch(`${RELAYER_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });

    return handleResponse<RelayerSubmitResponse>(response, endpoint);
}

/**
 * Submit a withdraw transaction to the relayer
 */
export async function submitWithdraw(
    proof: string,
    publicInputs: string[],
    encryptedNote: string,
    recipient: string,
    userAddress: string,
    relayerFee: string = DEFAULT_RELAYER_FEE
): Promise<RelayerSubmitResponse> {
    const endpoint = '/api/v1/relayer/withdraw';
    const body: WithdrawRequest = {
        proof,
        publicInputs,
        encryptedNote,
        recipient,
        relayerFee,
        userAddress,
    };

    const response = await fetch(`${RELAYER_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });

    return handleResponse<RelayerSubmitResponse>(response, endpoint);
}

/**
 * Get transaction status from relayer
 */
export async function getRelayerTransactionStatus(
    transactionId: string
): Promise<RelayerTransactionStatusResponse> {
    const endpoint = `/api/v1/relayer/transaction/${transactionId}`;
    const response = await fetch(`${RELAYER_BASE_URL}${endpoint}`);
    return handleResponse<RelayerTransactionStatusResponse>(response, endpoint);
}

// ============================================================================
// Polling Utilities
// ============================================================================

const POLL_INTERVAL_MS = 2000;
const MAX_POLL_ATTEMPTS = 60; // 2 minutes max

/**
 * Poll for transaction confirmation
 * Returns when transaction is CONFIRMED or FAILED, or throws on timeout
 */
export async function pollTransactionStatus(
    transactionId: string,
    onStatusUpdate?: (status: RelayerTransactionStatusResponse) => void
): Promise<RelayerTransactionStatusResponse> {
    let attempts = 0;

    while (attempts < MAX_POLL_ATTEMPTS) {
        const status = await getRelayerTransactionStatus(transactionId);

        if (onStatusUpdate) {
            onStatusUpdate(status);
        }

        if (status.Status === RelayerTransactionStatus.CONFIRMED ||
            status.Status === RelayerTransactionStatus.FAILED) {
            return status;
        }

        await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
        attempts++;
    }

    throw new Error('Transaction polling timeout');
}
