use super::errors::{
    ERR_MERKLE_INVALID, ERR_NULLIFIER_INVALID, ERR_RECIPIENT_MISMATCH, ERR_WITHDRAW_AMOUNT_MISMATCH,
};
use super::models::Note;
use super::utils::merkle::{MerkleTree, pad_proof_to_depth, verify_merkle};

/// Withdraw circuit - converts a private note back to public funds
///
/// This circuit proves that:
/// 1. The spender knows the secret of the note being spent
/// 2. The note commitment exists in the Merkle tree (was deposited)
/// 3. The nullifier is correctly computed (prevents double-spending)
/// 4. The withdrawal amount matches the note value
/// 5. The recipient is committed to (prevents front-running)
///
/// Public inputs:
/// - nullifier: Unique identifier to prevent double-spending
/// - merkle_root: Current root of the commitment Merkle tree
/// - recipient: Address receiving the funds (hashed with relayer fee to prevent front-running)
/// - withdraw_amount: The amount being withdrawn
/// - relayer_fee: Fee paid to relayer (if any)
///
/// Private inputs:
/// - note: The full note being spent
/// - merkle_path: Path from note commitment to root
/// - path_indices: Indices for the Merkle path

pub struct WithdrawPublic {
    /// Nullifier to prevent double-spending
    pub nullifier: Field,
    /// Current Merkle tree root
    pub merkle_root: Field,
    /// Recipient address (public for contract to send funds)
    pub recipient: Field,
    /// Amount to withdraw (should equal note value minus fee)
    pub withdraw_amount: Field,
    /// Fee for relayer (can be 0 for self-withdrawal)
    pub relayer_fee: Field,
}

pub struct WithdrawPrivate<let DEPTH: u32> {
    /// The note being spent
    pub note: Note,
    /// Merkle proof path (sibling hashes)
    pub merkle_path: [Field; DEPTH],
    /// Path indices (left/right at each level)
    pub path_indices: [bool; DEPTH],
}

/// Main withdraw circuit with configurable Merkle tree depth
pub fn main<let DEPTH: u32>(private_data: WithdrawPrivate<DEPTH>, public_data: WithdrawPublic) {
    let note = private_data.note;
    let commitment = note.commit();

    // 1. Verify the nullifier is correctly computed
    let computed_nullifier = note.generate_nullifer();
    assert(computed_nullifier == public_data.nullifier, ERR_NULLIFIER_INVALID);

    // 2. Verify the note exists in the Merkle tree
    assert(
        verify_merkle(
            commitment,
            public_data.merkle_root,
            private_data.merkle_path,
            private_data.path_indices,
        ),
        ERR_MERKLE_INVALID,
    );

    // 3. Verify amount conservation: note.value = withdraw_amount + relayer_fee
    assert(
        note.value == public_data.withdraw_amount + public_data.relayer_fee,
        ERR_WITHDRAW_AMOUNT_MISMATCH,
    );

    // 4. Verify the recipient is the note owner (optional - can be removed for full privacy)
    // This ensures only the rightful owner can withdraw
    // Comment out if you want anyone with the secret to withdraw
    assert(note.owner == public_data.recipient, ERR_RECIPIENT_MISMATCH);
}

/// Alternative withdraw without owner check (Tornado Cash style)
/// Anyone with the secret can withdraw to any address
pub fn main_anonymous<let DEPTH: u32>(
    private_data: WithdrawPrivate<DEPTH>,
    public_data: WithdrawPublic,
) {
    let note = private_data.note;
    let commitment = note.commit();

    // Verify nullifier
    let computed_nullifier = note.generate_nullifer();
    assert(computed_nullifier == public_data.nullifier, ERR_NULLIFIER_INVALID);

    // Verify Merkle inclusion
    assert(
        verify_merkle(
            commitment,
            public_data.merkle_root,
            private_data.merkle_path,
            private_data.path_indices,
        ),
        ERR_MERKLE_INVALID,
    );

    // Amount conservation (no owner check)
    assert(
        note.value == public_data.withdraw_amount + public_data.relayer_fee,
        ERR_WITHDRAW_AMOUNT_MISMATCH,
    );
}

// ------- tests -------

#[test]
pub fn test_withdraw_works() {
    let owner = 0xabc123;
    let secret = 987654321;
    let amount = 1000;

    let note = Note::new(owner, amount, secret);
    let commitment = note.commit();

    // Build Merkle tree with our commitment
    let leaves: [Field; 4] = [commitment, 0, 0, 0];
    let tree: MerkleTree<4, 2> = MerkleTree::new(leaves);

    // Generate and pad proof
    let small_proof = tree.generate_proof(0);
    let (full_root, full_proof) = pad_proof_to_depth::<2, 32>(tree.root, small_proof);

    let private_data: WithdrawPrivate<32> =
        WithdrawPrivate { note, merkle_path: full_proof.path, path_indices: full_proof.indices };

    let public_data = WithdrawPublic {
        nullifier: note.generate_nullifer(),
        merkle_root: full_root,
        recipient: owner,
        withdraw_amount: 950,
        relayer_fee: 50,
    };

    main(private_data, public_data);
}

#[test]
pub fn test_withdraw_full_amount_no_fee() {
    let owner = 0xabc123;
    let note = Note::new(owner, 1000, 12345);
    let commitment = note.commit();

    let leaves: [Field; 4] = [commitment, 0, 0, 0];
    let tree: MerkleTree<4, 2> = MerkleTree::new(leaves);
    let small_proof = tree.generate_proof(0);
    let (full_root, full_proof) = pad_proof_to_depth::<2, 32>(tree.root, small_proof);

    let private_data: WithdrawPrivate<32> =
        WithdrawPrivate { note, merkle_path: full_proof.path, path_indices: full_proof.indices };

    let public_data = WithdrawPublic {
        nullifier: note.generate_nullifer(),
        merkle_root: full_root,
        recipient: owner,
        withdraw_amount: 1000,
        relayer_fee: 0,
    };

    main(private_data, public_data);
}

#[test(should_fail_with = "1001")]
pub fn test_withdraw_wrong_nullifier_fails() {
    let note = Note::new(1, 1000, 12345);
    let wrong_note = Note::new(1, 1000, 99999);
    let commitment = note.commit();

    let leaves: [Field; 4] = [commitment, 0, 0, 0];
    let tree: MerkleTree<4, 2> = MerkleTree::new(leaves);
    let small_proof = tree.generate_proof(0);
    let (full_root, full_proof) = pad_proof_to_depth::<2, 32>(tree.root, small_proof);

    let private_data: WithdrawPrivate<32> =
        WithdrawPrivate { note, merkle_path: full_proof.path, path_indices: full_proof.indices };

    let public_data = WithdrawPublic {
        nullifier: wrong_note.generate_nullifer(), // Wrong nullifier!
        merkle_root: full_root,
        recipient: 1,
        withdraw_amount: 1000,
        relayer_fee: 0,
    };

    main(private_data, public_data);
}

#[test(should_fail_with = "1003")]
pub fn test_withdraw_wrong_merkle_root_fails() {
    let note = Note::new(1, 1000, 12345);
    let commitment = note.commit();

    let leaves: [Field; 4] = [commitment, 0, 0, 0];
    let tree: MerkleTree<4, 2> = MerkleTree::new(leaves);
    let small_proof = tree.generate_proof(0);
    let (_, full_proof) = pad_proof_to_depth::<2, 32>(tree.root, small_proof);

    let private_data: WithdrawPrivate<32> =
        WithdrawPrivate { note, merkle_path: full_proof.path, path_indices: full_proof.indices };

    let public_data = WithdrawPublic {
        nullifier: note.generate_nullifer(),
        merkle_root: 0xdeadbeef, // Wrong root!
        recipient: 1,
        withdraw_amount: 1000,
        relayer_fee: 0,
    };

    main(private_data, public_data);
}

#[test(should_fail_with = "1007")]
pub fn test_withdraw_amount_mismatch_fails() {
    let note = Note::new(1, 1000, 12345);
    let commitment = note.commit();

    let leaves: [Field; 4] = [commitment, 0, 0, 0];
    let tree: MerkleTree<4, 2> = MerkleTree::new(leaves);
    let small_proof = tree.generate_proof(0);
    let (full_root, full_proof) = pad_proof_to_depth::<2, 32>(tree.root, small_proof);

    let private_data: WithdrawPrivate<32> =
        WithdrawPrivate { note, merkle_path: full_proof.path, path_indices: full_proof.indices };

    let public_data = WithdrawPublic {
        nullifier: note.generate_nullifer(),
        merkle_root: full_root,
        recipient: 1,
        withdraw_amount: 2000, // More than note value!
        relayer_fee: 0,
    };

    main(private_data, public_data);
}

#[test(should_fail_with = "1008")]
pub fn test_withdraw_wrong_recipient_fails() {
    let note = Note::new(0xabc, 1000, 12345);
    let commitment = note.commit();

    let leaves: [Field; 4] = [commitment, 0, 0, 0];
    let tree: MerkleTree<4, 2> = MerkleTree::new(leaves);
    let small_proof = tree.generate_proof(0);
    let (full_root, full_proof) = pad_proof_to_depth::<2, 32>(tree.root, small_proof);

    let private_data: WithdrawPrivate<32> =
        WithdrawPrivate { note, merkle_path: full_proof.path, path_indices: full_proof.indices };

    let public_data = WithdrawPublic {
        nullifier: note.generate_nullifer(),
        merkle_root: full_root,
        recipient: 0xdef, // Not the owner!
        withdraw_amount: 1000,
        relayer_fee: 0,
    };

    main(private_data, public_data);
}

#[test]
pub fn test_anonymous_withdraw_works() {
    let note = Note::new(0xabc, 1000, 12345);
    let commitment = note.commit();

    let leaves: [Field; 4] = [commitment, 0, 0, 0];
    let tree: MerkleTree<4, 2> = MerkleTree::new(leaves);
    let small_proof = tree.generate_proof(0);
    let (full_root, full_proof) = pad_proof_to_depth::<2, 32>(tree.root, small_proof);

    let private_data: WithdrawPrivate<32> =
        WithdrawPrivate { note, merkle_path: full_proof.path, path_indices: full_proof.indices };

    // Anonymous withdraw to different address
    let public_data = WithdrawPublic {
        nullifier: note.generate_nullifer(),
        merkle_root: full_root,
        recipient: 0xdef, // Different from owner - OK in anonymous mode
        withdraw_amount: 1000,
        relayer_fee: 0,
    };

    main_anonymous(private_data, public_data);
}
