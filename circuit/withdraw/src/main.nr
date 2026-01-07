use payv_logic::Note;
use payv_logic::utils::merkle::{MerkleTree, pad_proof_to_depth};
use payv_logic::withdraw::main as withdraw_main;
use payv_logic::withdraw::{WithdrawPrivate, WithdrawPublic};

/// Withdraw circuit - converts a private note back to public funds
///
/// Public inputs:
/// - nullifier: Unique identifier to prevent double-spending
/// - merkle_root: Current Merkle tree root
/// - recipient: Address receiving the funds
/// - withdraw_amount: Amount being withdrawn
/// - relayer_fee: Fee for relayer (can be 0)
///
/// Private inputs:
/// - note: The note being spent
/// - merkle_path: Merkle proof
/// - path_indices: Path indices
fn main(
    // Private inputs
    note_owner: Field,
    note_value: Field,
    note_secret: Field,
    merkle_path: [Field; 32],
    path_indices: [bool; 32],
    // Public inputs
    nullifier: pub Field,
    merkle_root: pub Field,
    recipient: pub Field,
    withdraw_amount: pub Field,
    relayer_fee: pub Field,
) {
    let note = Note::new(note_owner, note_value, note_secret);

    let private_data: WithdrawPrivate<32> = WithdrawPrivate { note, merkle_path, path_indices };

    let public_data =
        WithdrawPublic { nullifier, merkle_root, recipient, withdraw_amount, relayer_fee };

    withdraw_main(private_data, public_data);
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

    main(
        owner,
        amount,
        secret,
        full_proof.path,
        full_proof.indices,
        note.generate_nullifer(),
        full_root,
        owner,
        950,
        50,
    );
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

    main(
        owner,
        1000,
        12345,
        full_proof.path,
        full_proof.indices,
        note.generate_nullifer(),
        full_root,
        owner,
        1000,
        0,
    );
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

    main(
        1,
        1000,
        12345,
        full_proof.path,
        full_proof.indices,
        wrong_note.generate_nullifer(), // Wrong nullifier!
        full_root,
        1,
        1000,
        0,
    );
}

#[test(should_fail_with = "1003")]
pub fn test_withdraw_wrong_merkle_root_fails() {
    let note = Note::new(1, 1000, 12345);
    let commitment = note.commit();

    let leaves: [Field; 4] = [commitment, 0, 0, 0];
    let tree: MerkleTree<4, 2> = MerkleTree::new(leaves);
    let small_proof = tree.generate_proof(0);
    let (_, full_proof) = pad_proof_to_depth::<2, 32>(tree.root, small_proof);

    main(
        1,
        1000,
        12345,
        full_proof.path,
        full_proof.indices,
        note.generate_nullifer(),
        0xdeadbeef, // Wrong root!
        1,
        1000,
        0,
    );
}

#[test(should_fail_with = "1007")]
pub fn test_withdraw_amount_mismatch_fails() {
    let note = Note::new(1, 1000, 12345);
    let commitment = note.commit();

    let leaves: [Field; 4] = [commitment, 0, 0, 0];
    let tree: MerkleTree<4, 2> = MerkleTree::new(leaves);
    let small_proof = tree.generate_proof(0);
    let (full_root, full_proof) = pad_proof_to_depth::<2, 32>(tree.root, small_proof);

    // Withdraw amount > note.value
    main(
        1,
        1000,
        12345,
        full_proof.path,
        full_proof.indices,
        note.generate_nullifer(),
        full_root,
        1,
        2000, // More than note value!
        0,
    );
}

#[test(should_fail_with = "1008")]
pub fn test_withdraw_wrong_recipient_fails() {
    let note = Note::new(0xabc, 1000, 12345);
    let commitment = note.commit();

    let leaves: [Field; 4] = [commitment, 0, 0, 0];
    let tree: MerkleTree<4, 2> = MerkleTree::new(leaves);
    let small_proof = tree.generate_proof(0);
    let (full_root, full_proof) = pad_proof_to_depth::<2, 32>(tree.root, small_proof);

    main(
        0xabc,
        1000,
        12345,
        full_proof.path,
        full_proof.indices,
        note.generate_nullifer(),
        full_root,
        0xdef, // Not the owner!
        1000,
        0,
    );
}
