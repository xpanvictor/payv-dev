/**
 * Circuit Types - TypeScript interfaces matching Noir circuit structs
 *
 * These types mirror the public/private inputs defined in the Noir circuits
 * located at /circuit/payv_logic/src/
 */

// ============================================================================
// Core Types
// ============================================================================

/**
 * A private note in the system.
 * Mirrors the Note struct in models.nr
 */
export interface Note {
    /** Owner's address (as bigint for field compatibility) */
    owner: bigint;
    /** Value in the note (in smallest unit) */
    value: bigint;
    /** Secret known only to the owner (used for commitment & nullifier) */
    secret: bigint;
}

/**
 * Available circuit types
 */
export enum CircuitType {
    DEPOSIT = 'deposit',
    TRANSFER = 'transfer',
    WITHDRAW = 'withdraw',
    OWNERSHIP = 'ownership',
}

// ============================================================================
// Deposit Circuit Types
// ============================================================================

/**
 * Public inputs for the deposit circuit
 */
export interface DepositPublicInputs {
    /** The note commitment (Poseidon hash of owner, value, secret) */
    commitment: string;
    /** The public deposit amount (must match note.value) */
    depositAmount: string;
}

/**
 * Private inputs for the deposit circuit
 */
export interface DepositPrivateInputs {
    /** The private note being created */
    note: Note;
}

// ============================================================================
// Withdraw Circuit Types
// ============================================================================

/**
 * Public inputs for the withdraw circuit
 */
export interface WithdrawPublicInputs {
    /** Nullifier to prevent double-spending */
    nullifier: string;
    /** Current Merkle tree root */
    merkleRoot: string;
    /** Recipient address for the withdrawn funds */
    recipient: string;
    /** Amount to withdraw */
    withdrawAmount: string;
    /** Fee for relayer (0 for self-withdrawal) */
    relayerFee: string;
}

/**
 * Private inputs for the withdraw circuit
 */
export interface WithdrawPrivateInputs {
    /** The note being spent */
    note: Note;
    /** Merkle proof path (sibling hashes) */
    merklePath: bigint[];
    /** Path indices (left/right at each level) */
    pathIndices: boolean[];
}

// ============================================================================
// Transfer Circuit Types
// ============================================================================

/**
 * Public inputs for the transfer circuit
 */
export interface TransferPublicInputs {
    /** Nullifiers for input notes being spent */
    inputNullifiers: string[];
    /** Commitments for output notes being created */
    outputCommitments: string[];
    /** Current Merkle tree root */
    merkleRoot: string;
}

/**
 * Private inputs for the transfer circuit
 */
export interface TransferPrivateInputs {
    /** Input notes being spent */
    inputNotes: Note[];
    /** Output notes being created */
    outputNotes: Note[];
    /** Merkle proof paths for each input note */
    merklePaths: bigint[][];
    /** Path indices for each input note */
    pathIndices: boolean[][];
}

// ============================================================================
// Ownership Circuit Types
// ============================================================================

/**
 * Public inputs for the ownership proof circuit
 */
export interface OwnershipPublicInputs {
    /** Current Merkle tree root */
    merkleRoot: string;
    /** Context-bound ownership hash */
    ownershipHash: string;
    /** Minimum value required (0 to skip check) */
    minValue: string;
}

/**
 * Private inputs for the ownership proof circuit
 */
export interface OwnershipPrivateInputs {
    /** The note being proven */
    note: Note;
    /** Merkle proof path */
    merklePath: bigint[];
    /** Path indices */
    pathIndices: boolean[];
    /** Context data (e.g., timestamp, challenge) */
    context: bigint;
}

// ============================================================================
// Proof Result Types
// ============================================================================

/**
 * Result of proof generation
 */
export interface ProofResult<T> {
    /** The generated proof bytes */
    proof: Uint8Array;
    /** The public inputs used */
    publicInputs: T;
}

/**
 * Proof generation status for UI feedback
 */
export enum ProofStatus {
    IDLE = 'IDLE',
    LOADING_CIRCUIT = 'LOADING_CIRCUIT',
    GENERATING_PROOF = 'GENERATING_PROOF',
    COMPLETE = 'COMPLETE',
    ERROR = 'ERROR',
}
