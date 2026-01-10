/**
 * Poseidon2 Hash Utility
 *
 * Implements Poseidon2 hashing compatible with Noir's std::hash::poseidon2::Poseidon2::hash
 * Used for computing note commitments and nullifiers in the frontend.
 */

import { poseidon2Hash } from '@zkpassport/poseidon2';

// ============================================================================
// Constants
// ============================================================================

const FIELD_MODULUS = BigInt(
    '21888242871839275222246405745257275088548364400416034343698204186575808495617'
);

// ============================================================================
// Initialization (no-op for this library but kept for API compatibility)
// ============================================================================

/**
 * Initialize the Poseidon2 hasher.
 * This library auto-initializes, so this is a no-op kept for API compatibility.
 */
export async function initPoseidon(): Promise<void> {
    // @zkpassport/poseidon2 auto-initializes, nothing to do
}

// ============================================================================
// Hash Functions
// ============================================================================

/**
 * Compute Poseidon2 hash of multiple field elements.
 *
 * @param inputs - Array of bigint field elements
 * @returns The hash as a bigint
 */
export function poseidonHashFn(inputs: bigint[]): bigint {
    const normalizedInputs = inputs.map((x) => x % FIELD_MODULUS);
    return poseidon2Hash(normalizedInputs);
}

/**
 * Compute the commitment for a note.
 * commitment = poseidon2(owner, value, secret)
 *
 * Mirrors Note::commit() in models.nr
 */
export function computeNoteCommitment(
    owner: bigint,
    value: bigint,
    secret: bigint
): bigint {
    return poseidonHashFn([owner, value, secret]);
}

/**
 * Compute the nullifier for a note.
 * nullifier = poseidon2(commitment, secret)
 *
 * Mirrors Note::generate_nullifier() in models.nr
 */
export function computeNullifier(commitment: bigint, secret: bigint): bigint {
    return poseidonHashFn([commitment, secret]);
}

/**
 * Compute nullifier directly from note components.
 * Convenience function that computes commitment first.
 */
export function computeNullifierFromNote(
    owner: bigint,
    value: bigint,
    secret: bigint
): bigint {
    const commitment = computeNoteCommitment(owner, value, secret);
    return computeNullifier(commitment, secret);
}

/**
 * Compute ownership hash for ownership proofs.
 * ownership_hash = poseidon2(commitment, secret, context)
 *
 * Mirrors compute_ownership_hash() in ownership.nr
 */
export function computeOwnershipHash(
    commitment: bigint,
    secret: bigint,
    context: bigint
): bigint {
    return poseidonHashFn([commitment, secret, context]);
}

// ============================================================================
// Field Utilities
// ============================================================================

/**
 * Convert a bigint to a hex string (0x prefixed, 64 chars)
 */
export function fieldToHex(value: bigint): string {
    const HEX_CHARS = 64;
    return '0x' + value.toString(16).padStart(HEX_CHARS, '0');
}

/**
 * Convert a hex string to bigint
 */
export function hexToField(hex: string): bigint {
    const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
    return BigInt('0x' + cleanHex);
}

/**
 * Generate a random field element (for secrets)
 */
export function randomField(): bigint {
    const BYTES_COUNT = 32;
    const bytes = new Uint8Array(BYTES_COUNT);
    crypto.getRandomValues(bytes);
    let value = BigInt(0);
    for (let i = 0; i < BYTES_COUNT; i++) {
        value = (value << BigInt(8)) | BigInt(bytes[i]);
    }
    return value % FIELD_MODULUS;
}
