use super::errors::{ERR_MERKLE_INVALID, ERR_OWNERSHIP_PROOF_INVALID};
use super::models::Note;
use super::utils::merkle::{MerkleTree, pad_proof_to_depth, verify_merkle};
use poseidon::poseidon2;

/// Ownership proof circuit - prove you own a note without revealing details
///
/// This circuit proves that:
/// 1. You know the secret of a note in the Merkle tree
/// 2. The note has at least a minimum value (optional range proof)
/// 3. Does NOT reveal: exact value, owner address, or the commitment itself
///
/// Use cases:
/// - Prove solvency without revealing exact balance
/// - Authentication without revealing identity
/// - Access control based on note ownership
///
/// Public inputs:
/// - merkle_root: Current root of the commitment tree
/// - ownership_hash: Hash binding the proof to a specific context (prevents replay)
/// - min_value: Minimum value the note must have (0 to skip check)
///
/// Private inputs:
/// - note: The full note
/// - merkle_path: Merkle proof
/// - path_indices: Path indices
/// - context: Optional context data for the ownership hash

pub struct OwnershipPublic {
    /// Current Merkle tree root
    pub merkle_root: Field,
    /// Context-bound ownership proof (hash of note + context)
    pub ownership_hash: Field,
    /// Minimum value required (0 to skip check)
    pub min_value: Field,
}

pub struct OwnershipPrivate<let DEPTH: u32> {
    /// The note being proven
    pub note: Note,
    /// Merkle proof path
    pub merkle_path: [Field; DEPTH],
    /// Path indices
    pub path_indices: [bool; DEPTH],
    /// Context data (e.g., timestamp, challenge, session ID)
    pub context: Field,
}

/// Prove ownership of a note with minimum value check
pub fn main<let DEPTH: u32>(private_data: OwnershipPrivate<DEPTH>, public_data: OwnershipPublic) {
    let note = private_data.note;
    let commitment = note.commit();

    // 1. Verify the note exists in the Merkle tree
    assert(
        verify_merkle(
            commitment,
            public_data.merkle_root,
            private_data.merkle_path,
            private_data.path_indices,
        ),
        ERR_MERKLE_INVALID,
    );

    // 2. Verify the ownership hash matches
    // ownership_hash = hash(commitment, secret, context)
    // This proves knowledge of the secret and binds to a specific context
    let ownership_input = [commitment, note.secret, private_data.context];
    let computed_hash = poseidon2::Poseidon2::hash(ownership_input, ownership_input.len());
    assert(computed_hash == public_data.ownership_hash, ERR_OWNERSHIP_PROOF_INVALID);

    // 3. Verify minimum value (if specified)
    // Cast to u64 for proper comparison since Fields don't support >=
    if public_data.min_value != 0 {
        let value_u64: u64 = note.value as u64;
        let min_u64: u64 = public_data.min_value as u64;
        assert(value_u64 >= min_u64, ERR_OWNERSHIP_PROOF_INVALID);
    }
}

/// Simple ownership proof without value check
pub fn prove_ownership<let DEPTH: u32>(
    note: Note,
    merkle_root: Field,
    merkle_path: [Field; DEPTH],
    path_indices: [bool; DEPTH],
    context: Field,
    expected_hash: Field,
) {
    let commitment = note.commit();

    // Verify Merkle inclusion
    assert(verify_merkle(commitment, merkle_root, merkle_path, path_indices), ERR_MERKLE_INVALID);

    // Verify ownership hash
    let ownership_input = [commitment, note.secret, context];
    let computed_hash = poseidon2::Poseidon2::hash(ownership_input, ownership_input.len());
    assert(computed_hash == expected_hash, ERR_OWNERSHIP_PROOF_INVALID);
}

/// Generate an ownership hash for a note and context (helper for off-chain use)
pub fn compute_ownership_hash(note: Note, context: Field) -> Field {
    let commitment = note.commit();
    let ownership_input = [commitment, note.secret, context];
    poseidon2::Poseidon2::hash(ownership_input, ownership_input.len())
}

// ------- tests -------

#[test]
pub fn test_ownership_proof_works() {
    let note = Note::new(0xabc, 1000, 12345);
    let commitment = note.commit();
    let context: Field = 0x123456; // e.g., timestamp or challenge

    let leaves: [Field; 4] = [commitment, 0, 0, 0];
    let tree: MerkleTree<4, 2> = MerkleTree::new(leaves);
    let small_proof = tree.generate_proof(0);
    let (full_root, full_proof) = pad_proof_to_depth::<2, 32>(tree.root, small_proof);

    let ownership_hash = compute_ownership_hash(note, context);

    let private_data: OwnershipPrivate<32> = OwnershipPrivate {
        note,
        merkle_path: full_proof.path,
        path_indices: full_proof.indices,
        context,
    };

    let public_data = OwnershipPublic { merkle_root: full_root, ownership_hash, min_value: 0 };

    main(private_data, public_data);
}

#[test]
pub fn test_ownership_with_min_value() {
    let note = Note::new(0xabc, 1000, 12345);
    let commitment = note.commit();
    let context: Field = 0x123456;

    let leaves: [Field; 4] = [commitment, 0, 0, 0];
    let tree: MerkleTree<4, 2> = MerkleTree::new(leaves);
    let small_proof = tree.generate_proof(0);
    let (full_root, full_proof) = pad_proof_to_depth::<2, 32>(tree.root, small_proof);

    let ownership_hash = compute_ownership_hash(note, context);

    let private_data: OwnershipPrivate<32> = OwnershipPrivate {
        note,
        merkle_path: full_proof.path,
        path_indices: full_proof.indices,
        context,
    };

    // Prove we have at least 500 value
    let public_data = OwnershipPublic { merkle_root: full_root, ownership_hash, min_value: 500 };

    main(private_data, public_data);
}

#[test(should_fail_with = "1009")]
pub fn test_ownership_insufficient_value_fails() {
    let note = Note::new(0xabc, 100, 12345); // Only 100 value
    let commitment = note.commit();
    let context: Field = 0x123456;

    let leaves: [Field; 4] = [commitment, 0, 0, 0];
    let tree: MerkleTree<4, 2> = MerkleTree::new(leaves);
    let small_proof = tree.generate_proof(0);
    let (full_root, full_proof) = pad_proof_to_depth::<2, 32>(tree.root, small_proof);

    let ownership_hash = compute_ownership_hash(note, context);

    let private_data: OwnershipPrivate<32> = OwnershipPrivate {
        note,
        merkle_path: full_proof.path,
        path_indices: full_proof.indices,
        context,
    };

    // Try to prove we have at least 500 - should fail due to underflow
    let public_data = OwnershipPublic { merkle_root: full_root, ownership_hash, min_value: 500 };

    main(private_data, public_data);
}

#[test(should_fail_with = "1009")]
pub fn test_ownership_wrong_context_fails() {
    let note = Note::new(0xabc, 1000, 12345);
    let commitment = note.commit();
    let context: Field = 0x123456;
    let wrong_context: Field = 0x999999;

    let leaves: [Field; 4] = [commitment, 0, 0, 0];
    let tree: MerkleTree<4, 2> = MerkleTree::new(leaves);
    let small_proof = tree.generate_proof(0);
    let (full_root, full_proof) = pad_proof_to_depth::<2, 32>(tree.root, small_proof);

    // Hash computed with wrong context
    let ownership_hash = compute_ownership_hash(note, wrong_context);

    let private_data: OwnershipPrivate<32> = OwnershipPrivate {
        note,
        merkle_path: full_proof.path,
        path_indices: full_proof.indices,
        context, // Correct context in proof
    };

    let public_data = OwnershipPublic {
        merkle_root: full_root,
        ownership_hash, // But hash was made with wrong context
        min_value: 0,
    };

    main(private_data, public_data);
}

#[test(should_fail_with = "1003")]
pub fn test_ownership_wrong_merkle_fails() {
    let note = Note::new(0xabc, 1000, 12345);
    let commitment = note.commit();
    let context: Field = 0x123456;

    let leaves: [Field; 4] = [commitment, 0, 0, 0];
    let tree: MerkleTree<4, 2> = MerkleTree::new(leaves);
    let small_proof = tree.generate_proof(0);
    let (_, full_proof) = pad_proof_to_depth::<2, 32>(tree.root, small_proof);

    let ownership_hash = compute_ownership_hash(note, context);

    let private_data: OwnershipPrivate<32> = OwnershipPrivate {
        note,
        merkle_path: full_proof.path,
        path_indices: full_proof.indices,
        context,
    };

    let public_data = OwnershipPublic {
        merkle_root: 0xdeadbeef, // Wrong root!
        ownership_hash,
        min_value: 0,
    };

    main(private_data, public_data);
}

#[test]
pub fn test_ownership_hash_deterministic() {
    let note = Note::new(0xabc, 1000, 12345);
    let context: Field = 0x123456;

    let hash1 = compute_ownership_hash(note, context);
    let hash2 = compute_ownership_hash(note, context);

    assert(hash1 == hash2);
}

#[test]
pub fn test_ownership_hash_unique_per_context() {
    let note = Note::new(0xabc, 1000, 12345);

    let hash1 = compute_ownership_hash(note, 0x111);
    let hash2 = compute_ownership_hash(note, 0x222);

    assert(hash1 != hash2);
}
