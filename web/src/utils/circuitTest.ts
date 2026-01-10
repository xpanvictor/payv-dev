/**
 * Circuit Test Utility
 *
 * Run these tests from the browser console or import in a component.
 * Usage: import { runAllTests } from './utils/circuitTest';
 *        await runAllTests();
 */

import {
    initPoseidon,
    computeNoteCommitment,
    computeNullifier,
    computeNullifierFromNote,
    randomField,
    fieldToHex,
    poseidonHashFn,
} from './poseidonHash';
import {
    generateDepositProof,
    generateWithdrawProof,
    initCircuitService,
    type WithdrawInput,
} from '../services/circuitService';
import type { Note } from '../services/circuitTypes';

// ============================================================================
// Test Helpers
// ============================================================================

function log(message: string, data?: unknown) {
    console.log(`[CircuitTest] ${message}`, data ?? '');
}

function logSuccess(testName: string) {
    console.log(`✅ ${testName} PASSED`);
}

function logError(testName: string, error: unknown) {
    console.error(`❌ ${testName} FAILED:`, error);
}

// ============================================================================
// Individual Tests
// ============================================================================

export async function testPoseidonInit(): Promise<boolean> {
    const testName = 'Poseidon Initialization';
    try {
        await initPoseidon();
        logSuccess(testName);
        return true;
    } catch (error) {
        logError(testName, error);
        return false;
    }
}

export async function testCommitmentComputation(): Promise<boolean> {
    const testName = 'Commitment Computation';
    try {
        await initPoseidon();

        const owner = BigInt('0xabc123');
        const value = BigInt(1000);
        const secret = BigInt(12345);

        const commitment1 = computeNoteCommitment(owner, value, secret);
        const commitment2 = computeNoteCommitment(owner, value, secret);

        // Same inputs should produce same commitment
        if (commitment1 !== commitment2) {
            throw new Error('Commitment is not deterministic');
        }

        // Different secret should produce different commitment
        const commitment3 = computeNoteCommitment(owner, value, BigInt(99999));
        if (commitment1 === commitment3) {
            throw new Error('Different secrets produced same commitment');
        }

        log('Commitment:', fieldToHex(commitment1));
        logSuccess(testName);
        return true;
    } catch (error) {
        logError(testName, error);
        return false;
    }
}

export async function testNullifierComputation(): Promise<boolean> {
    const testName = 'Nullifier Computation';
    try {
        await initPoseidon();

        const owner = BigInt('0xabc123');
        const value = BigInt(1000);
        const secret = BigInt(12345);

        const commitment = computeNoteCommitment(owner, value, secret);
        const nullifier1 = computeNullifier(commitment, secret);
        const nullifier2 = computeNullifierFromNote(owner, value, secret);

        // Both methods should produce same nullifier
        if (nullifier1 !== nullifier2) {
            throw new Error('Nullifier computation methods disagree');
        }

        log('Nullifier:', fieldToHex(nullifier1));
        logSuccess(testName);
        return true;
    } catch (error) {
        logError(testName, error);
        return false;
    }
}

export async function testRandomFieldGeneration(): Promise<boolean> {
    const testName = 'Random Field Generation';
    try {
        const field1 = randomField();
        const field2 = randomField();

        if (field1 === field2) {
            throw new Error('Random fields are not unique');
        }

        if (field1 <= BigInt(0)) {
            throw new Error('Random field is not positive');
        }

        log('Random field 1:', fieldToHex(field1));
        log('Random field 2:', fieldToHex(field2));
        logSuccess(testName);
        return true;
    } catch (error) {
        logError(testName, error);
        return false;
    }
}

export async function testDepositProofGeneration(): Promise<boolean> {
    const testName = 'Deposit Proof Generation';
    try {
        log('Initializing circuit service...');
        await initCircuitService();

        const note: Note = {
            owner: BigInt('0xabc123'),
            value: BigInt(1000),
            secret: randomField(),
        };

        log('Generating deposit proof (this may take 10-30 seconds)...');
        const startTime = Date.now();

        const result = await generateDepositProof({ note });

        const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
        log(`Proof generated in ${elapsed}s`);
        log('Commitment:', result.publicInputs.commitment);
        log(`Proof size: ${result.proof.length} bytes`);

        if (!result.proof || result.proof.length === 0) {
            throw new Error('Empty proof generated');
        }

        logSuccess(testName);
        return true;
    } catch (error) {
        logError(testName, error);
        return false;
    }
}

export async function testWithdrawProofGeneration(): Promise<boolean> {
    const testName = 'Withdraw Proof Generation';
    try {
        log('Initializing circuit service for withdraw...');
        await initCircuitService();

        const note: Note = {
            owner: BigInt('0xabc123'),
            value: BigInt(1000),
            secret: randomField(),
        };

        const commitment = computeNoteCommitment(note.owner, note.value, note.secret);

        // Mock Merkle Path (Depth 32)
        const merklePath: bigint[] = [];
        const pathIndices: boolean[] = [];
        let currentHash = commitment;

        for (let i = 0; i < 32; i++) {
            const sibling = randomField();
            const isRight = Math.random() > 0.5;

            merklePath.push(sibling);
            pathIndices.push(isRight);

            if (isRight) {
                // indices[i] = true => Current is Right, Sibling is Left
                // Order: [Sibling, Current]
                currentHash = poseidonHashFn([sibling, currentHash]);
            } else {
                // indices[i] = false => Current is Left, Sibling is Right
                // Order: [Current, Sibling]
                currentHash = poseidonHashFn([currentHash, sibling]);
            }
        }
        const merkleRoot = currentHash;

        log('Generating withdraw proof (this may take 10-30 seconds)...');
        const startTime = Date.now();

        const input: WithdrawInput = {
            note,
            recipient: note.owner,
            withdrawAmount: note.value,
            relayerFee: BigInt(0),
            merklePath,
            pathIndices,
            merkleRoot,
        };

        const result = await generateWithdrawProof(input);

        const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
        log(`Withdraw proof generated in ${elapsed}s`);
        log('Nullifier:', result.publicInputs.nullifier);
        log(`Proof size: ${result.proof.length} bytes`);

        if (!result.proof || result.proof.length === 0) {
            throw new Error('Empty proof generated');
        }

        logSuccess(testName);
        return true;
    } catch (e: any) {
        logError(testName, e);
        return false;
    }
}

// ============================================================================
// Test Runner
// ============================================================================

export async function runAllTests(): Promise<void> {
    console.log('═══════════════════════════════════════════════════');
    console.log('           CIRCUIT INTEGRATION TESTS                ');
    console.log('═══════════════════════════════════════════════════');

    const results: { name: string; passed: boolean }[] = [];

    // Run tests in order
    results.push({
        name: 'Poseidon Init',
        passed: await testPoseidonInit(),
    });

    results.push({
        name: 'Commitment Computation',
        passed: await testCommitmentComputation(),
    });

    results.push({
        name: 'Nullifier Computation',
        passed: await testNullifierComputation(),
    });

    results.push({
        name: 'Random Field Generation',
        passed: await testRandomFieldGeneration(),
    });

    results.push({
        name: 'Deposit Proof Generation',
        passed: await testDepositProofGeneration(),
    });

    results.push({
        name: 'Withdraw Proof Generation',
        passed: await testWithdrawProofGeneration(),
    });

    // Summary
    console.log('═══════════════════════════════════════════════════');
    console.log('                   SUMMARY                         ');
    console.log('═══════════════════════════════════════════════════');

    const passed = results.filter((r) => r.passed).length;
    const total = results.length;

    results.forEach((r) => {
        console.log(`  ${r.passed ? '✅' : '❌'} ${r.name}`);
    });

    console.log('───────────────────────────────────────────────────');
    console.log(`  ${passed}/${total} tests passed`);
    console.log('═══════════════════════════════════════════════════');
}

// Export for browser console usage
if (typeof window !== 'undefined') {
    (window as unknown as Record<string, unknown>).runCircuitTests = runAllTests;
    (window as unknown as Record<string, unknown>).testDeposit = testDepositProofGeneration;
    (window as unknown as Record<string, unknown>).testWithdraw = testWithdrawProofGeneration;
}
