/**
 * Circuit Service - ZK Proof Generation
 *
 * This service handles proof generation for the Noir circuits.
 * It lazy-loads the proving backend to minimize initial bundle size.
 *
 * Circuits:
 * - Deposit: Shield public funds into a private note
 * - Withdraw: Unshield private note to public funds
 * - Transfer: Private-to-private transfer
 * - Ownership: Prove note ownership without revealing details
 */

import {
    CircuitType,
    type Note,
    type ProofResult,
    type DepositPublicInputs,
    type WithdrawPublicInputs,
    type TransferPublicInputs,
    type OwnershipPublicInputs,
} from './circuitTypes';
import {
    initPoseidon,
    computeNoteCommitment,
    computeNullifierFromNote,
    computeOwnershipHash,
    fieldToHex,
} from '../utils/poseidonHash';

// ============================================================================
// Types for Noir.js (lazy-loaded)
// ============================================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Noir = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Backend = any;

interface CircuitInstance {
    noir: Noir;
    backend: Backend;
}

// ============================================================================
// Circuit Cache (lazy-loaded)
// ============================================================================

const circuitCache: Map<CircuitType, CircuitInstance> = new Map();
let poseidonInitialized = false;

// ============================================================================
// Circuit Artifact Paths
// ============================================================================

const CIRCUIT_PATHS: Record<CircuitType, string> = {
    [CircuitType.DEPOSIT]: '/circuits/deposit.json',
    [CircuitType.TRANSFER]: '/circuits/transfer.json',
    [CircuitType.WITHDRAW]: '/circuits/withdraw.json',
    [CircuitType.OWNERSHIP]: '/circuits/ownership.json',
};

// ============================================================================
// Lazy Loading
// ============================================================================

/**
 * Initialize the Poseidon hasher (required before proof generation)
 */
export async function initCircuitService(): Promise<void> {
    if (!poseidonInitialized) {
        await initPoseidon();
        poseidonInitialized = true;
    }
}

/**
 * Lazy-load a circuit and its backend.
 * Caches the result for subsequent calls.
 */
/**
 * Lazy-load a circuit and its backend.
 * Caches the result for subsequent calls.
 */
async function loadCircuit(circuitType: CircuitType): Promise<CircuitInstance> {
    // Return cached if available
    const cached = circuitCache.get(circuitType);
    if (cached) {
        return cached;
    }

    // Dynamically import Noir.js 1.0 and bb.js modules
    const [{ Noir }, { UltraHonkBackend, Barretenberg }] = await Promise.all([
        import('@noir-lang/noir_js'),
        import('@aztec/bb.js'),
    ]);

    // Fetch circuit artifact
    const circuitPath = CIRCUIT_PATHS[circuitType];
    const response = await fetch(circuitPath);
    if (!response.ok) {
        throw new Error(`Failed to load circuit: ${circuitPath}`);
    }
    const circuit = await response.json();

    // Initialize Barretenberg API (required for UltraHonkBackend)
    // The .new() method might be required if it exists, otherwise use constructor if simpler, 
    // but typically Barretenberg.new() is standard for async wasm init.
    // However, recent versions might expose it differently. 
    // Let's assume Barretenberg.new() or equivalent. 
    // Checking previous d.ts: "export class Barretenberg { ... static new(threads?: number): Promise<Barretenberg>; }"
    const api = await Barretenberg.new();

    // Initialize backend and noir instance
    // UltraHonkBackend(acirBytecode: string, api: Barretenberg)
    const backend = new UltraHonkBackend(circuit.bytecode, api);
    const noir = new Noir(circuit);

    // Noir.init() might not be needed if we pass circuit to constructor, but logic in beta-17 seemed to suggest checking it.
    // The previous d.ts snippet showed "init(): Promise<void>;" so we call it.
    await noir.init();

    const instance: CircuitInstance = { noir, backend };
    circuitCache.set(circuitType, instance);

    return instance;
}

// ============================================================================
// Deposit Proof Generation
// ============================================================================

export interface DepositInput {
    note: Note;
}

/**
 * Generate a deposit proof.
 * Proves knowledge of a note's preimage and that deposit_amount matches note.value
 */
export async function generateDepositProof(
    input: DepositInput
): Promise<ProofResult<DepositPublicInputs>> {
    await initCircuitService();

    const { note } = input;
    const commitment = computeNoteCommitment(note.owner, note.value, note.secret);

    // Load circuit
    const { noir, backend } = await loadCircuit(CircuitType.DEPOSIT);

    // Prepare inputs matching compiled circuit ABI (flat structure)
    const circuitInputs = {
        note_owner: note.owner.toString(),
        note_value: note.value.toString(),
        note_secret: note.secret.toString(),
        commitment: commitment.toString(),
        deposit_amount: note.value.toString(),
    };

    // Generate witness and proof
    const { witness } = await noir.execute(circuitInputs);
    const proof = await backend.generateProof(witness);

    const publicInputs: DepositPublicInputs = {
        commitment: fieldToHex(commitment),
        depositAmount: note.value.toString(),
    };

    return { proof: proof.proof, publicInputs };
}

// ============================================================================
// Withdraw Proof Generation
// ============================================================================

export interface WithdrawInput {
    note: Note;
    recipient: bigint;
    withdrawAmount: bigint;
    relayerFee: bigint;
    merklePath: bigint[];
    pathIndices: boolean[];
    merkleRoot: bigint;
}

/**
 * Generate a withdraw proof.
 * Proves ownership of a note in the Merkle tree and correct nullifier computation.
 */
export async function generateWithdrawProof(
    input: WithdrawInput
): Promise<ProofResult<WithdrawPublicInputs>> {
    await initCircuitService();

    const { note, recipient, withdrawAmount, relayerFee, merklePath, pathIndices, merkleRoot } =
        input;

    const nullifier = computeNullifierFromNote(note.owner, note.value, note.secret);

    // Load circuit
    const { noir, backend } = await loadCircuit(CircuitType.WITHDRAW);

    // Prepare inputs matching compiled circuit ABI (flat structure)
    const circuitInputs = {
        note_owner: note.owner.toString(),
        note_value: note.value.toString(),
        note_secret: note.secret.toString(),
        merkle_path: merklePath.map((p) => p.toString()),
        path_indices: pathIndices,
        nullifier: nullifier.toString(),
        merkle_root: merkleRoot.toString(),
        recipient: recipient.toString(),
        withdraw_amount: withdrawAmount.toString(),
        relayer_fee: relayerFee.toString(),
    };

    const { witness } = await noir.execute(circuitInputs);
    const proof = await backend.generateProof(witness);

    const publicInputs: WithdrawPublicInputs = {
        nullifier: fieldToHex(nullifier),
        merkleRoot: fieldToHex(merkleRoot),
        recipient: fieldToHex(recipient),
        withdrawAmount: withdrawAmount.toString(),
        relayerFee: relayerFee.toString(),
    };

    return { proof: proof.proof, publicInputs };
}

// ============================================================================
// Transfer Proof Generation
// ============================================================================

export interface TransferInput {
    inputNotes: Note[];
    outputNotes: Note[];
    merklePaths: bigint[][];
    pathIndices: boolean[][];
    merkleRoot: bigint;
}

/**
 * Generate a transfer proof.
 * Proves value conservation: sum(inputs) == sum(outputs)
 */
export async function generateTransferProof(
    input: TransferInput
): Promise<ProofResult<TransferPublicInputs>> {
    await initCircuitService();

    const { inputNotes, outputNotes, merklePaths, pathIndices, merkleRoot } = input;

    // Compute nullifiers and commitments
    const inputNullifiers = inputNotes.map((n) =>
        computeNullifierFromNote(n.owner, n.value, n.secret)
    );
    const outputCommitments = outputNotes.map((n) =>
        computeNoteCommitment(n.owner, n.value, n.secret)
    );

    // Load circuit
    const { noir, backend } = await loadCircuit(CircuitType.TRANSFER);

    // Prepare inputs
    const circuitInputs = {
        private_data: {
            input_notes: inputNotes.map((n) => ({
                owner: n.owner.toString(),
                value: n.value.toString(),
                secret: n.secret.toString(),
            })),
            output_notes: outputNotes.map((n) => ({
                owner: n.owner.toString(),
                value: n.value.toString(),
                secret: n.secret.toString(),
            })),
            merkle_paths: merklePaths.map((path) => path.map((p) => p.toString())),
            path_indices: pathIndices,
        },
        public_data: {
            input_nullifiers: inputNullifiers.map((n) => n.toString()),
            output_commitments: outputCommitments.map((c) => c.toString()),
            merkle_root: merkleRoot.toString(),
        },
    };

    const { witness } = await noir.execute(circuitInputs);
    const proof = await backend.generateProof(witness);

    const publicInputs: TransferPublicInputs = {
        inputNullifiers: inputNullifiers.map(fieldToHex),
        outputCommitments: outputCommitments.map(fieldToHex),
        merkleRoot: fieldToHex(merkleRoot),
    };

    return { proof: proof.proof, publicInputs };
}

// ============================================================================
// Ownership Proof Generation
// ============================================================================

export interface OwnershipInput {
    note: Note;
    merklePath: bigint[];
    pathIndices: boolean[];
    merkleRoot: bigint;
    context: bigint;
    minValue: bigint;
}

/**
 * Generate an ownership proof.
 * Proves you own a note in the tree without revealing exact value.
 */
export async function generateOwnershipProof(
    input: OwnershipInput
): Promise<ProofResult<OwnershipPublicInputs>> {
    await initCircuitService();

    const { note, merklePath, pathIndices, merkleRoot, context, minValue } = input;

    const commitment = computeNoteCommitment(note.owner, note.value, note.secret);
    const ownershipHash = computeOwnershipHash(commitment, note.secret, context);

    // Load circuit
    const { noir, backend } = await loadCircuit(CircuitType.OWNERSHIP);

    // Prepare inputs
    const circuitInputs = {
        private_data: {
            note: {
                owner: note.owner.toString(),
                value: note.value.toString(),
                secret: note.secret.toString(),
            },
            merkle_path: merklePath.map((p) => p.toString()),
            path_indices: pathIndices,
            context: context.toString(),
        },
        public_data: {
            merkle_root: merkleRoot.toString(),
            ownership_hash: ownershipHash.toString(),
            min_value: minValue.toString(),
        },
    };

    const { witness } = await noir.execute(circuitInputs);
    const proof = await backend.generateProof(witness);

    const publicInputs: OwnershipPublicInputs = {
        merkleRoot: fieldToHex(merkleRoot),
        ownershipHash: fieldToHex(ownershipHash),
        minValue: minValue.toString(),
    };

    return { proof: proof.proof, publicInputs };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check if a circuit is loaded and cached
 */
export function isCircuitLoaded(circuitType: CircuitType): boolean {
    return circuitCache.has(circuitType);
}

/**
 * Preload a circuit (useful for warming up before user action)
 */
export async function preloadCircuit(circuitType: CircuitType): Promise<void> {
    await loadCircuit(circuitType);
}

/**
 * Clear all cached circuits (for memory management)
 */
export function clearCircuitCache(): void {
    circuitCache.clear();
}
