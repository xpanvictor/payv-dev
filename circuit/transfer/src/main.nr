use payv_logic::Note;
use payv_logic::transfer::main as transfer_main;
use payv_logic::transfer::{TxnInputPrivate, TxnInputPublic};
use payv_logic::utils::merkle::{MerkleTree, pad_proof_to_depth};

/// Transfer circuit - private transfer between notes (2-in, 2-out)
///
/// Public inputs:
/// - input_nullifiers: Nullifiers for spent notes
/// - output_commitments: New note commitments
/// - merkle_root: Current Merkle tree root
///
/// Private inputs:
/// - input notes with their Merkle proofs
/// - output notes
fn main(
    // Input note (private)
    in_owner: Field,
    in_value: Field,
    in_secret: Field,
    in_merkle_path: [Field; 32],
    in_path_indices: [bool; 32],
    // Output note 1 (private)
    out1_owner: Field,
    out1_value: Field,
    out1_secret: Field,
    // Output note 2 (private)
    out2_owner: Field,
    out2_value: Field,
    out2_secret: Field,
    // Public inputs
    input_nullifier: pub Field,
    output_commitment_1: pub Field,
    output_commitment_2: pub Field,
    merkle_root: pub Field,
) {
    let input_note = Note::new(in_owner, in_value, in_secret);
    let output_note_1 = Note::new(out1_owner, out1_value, out1_secret);
    let output_note_2 = Note::new(out2_owner, out2_value, out2_secret);

    let private_data: TxnInputPrivate<1, 2> = TxnInputPrivate {
        input_notes: [input_note],
        output_notes: [output_note_1, output_note_2],
        merkle_paths: [in_merkle_path],
        path_indices: [in_path_indices],
    };

    let public_data: TxnInputPublic<1, 2> = TxnInputPublic {
        input_nullifiers: [input_nullifier],
        output_commitments: [output_commitment_1, output_commitment_2],
        merkle_root,
    };

    transfer_main(private_data, public_data);
}

// ------- tests -------

#[test]
pub fn test_transfer_works() {
    let input_note = Note::new(1, 100, 1234);
    let output_note_1 = Note::new(1, 60, 1000);
    let output_note_2 = Note::new(2, 40, 1001);

    // Build a merkle tree with the input note commitment
    let input_commitment = input_note.commit();
    let leaves: [Field; 4] = [input_commitment, 0, 0, 0];
    let tree: MerkleTree<4, 2> = MerkleTree::new(leaves);

    // Generate proof for leaf at index 0 and pad to depth 32
    let small_proof = tree.generate_proof(0);
    let (full_root, full_proof) = pad_proof_to_depth::<2, 32>(tree.root, small_proof);

    main(
        // input
        1,
        100,
        1234,
        full_proof.path,
        full_proof.indices,
        // outputs
        1,
        60,
        1000,
        2,
        40,
        1001,
        // public
        input_note.generate_nullifer(),
        output_note_1.commit(),
        output_note_2.commit(),
        full_root,
    );
}

#[test(should_fail_with = "1001")]
pub fn test_invalid_nullifier_fails() {
    let input_note = Note::new(1, 100, 1234);
    let other_note = Note::new(1, 100, 4444);

    let input_commitment = input_note.commit();
    let leaves: [Field; 4] = [input_commitment, 0, 0, 0];
    let tree: MerkleTree<4, 2> = MerkleTree::new(leaves);
    let small_proof = tree.generate_proof(0);
    let (full_root, full_proof) = pad_proof_to_depth::<2, 32>(tree.root, small_proof);

    let out1 = Note::new(1, 100, 1000);
    let out2 = Note::new(2, 0, 1001);

    main(
        1,
        100,
        1234,
        full_proof.path,
        full_proof.indices,
        1,
        100,
        1000,
        2,
        0,
        1001,
        other_note.generate_nullifer(), // wrong nullifier
        out1.commit(),
        out2.commit(),
        full_root,
    );
}

#[test(should_fail_with = "1002")]
pub fn test_value_imbalance_fails() {
    let input_note = Note::new(1, 100, 1234);
    let output_note = Note::new(1, 120, 1234);
    let output_note_2 = Note::new(0, 0, 0);

    let input_commitment = input_note.commit();
    let leaves: [Field; 4] = [input_commitment, 0, 0, 0];
    let tree: MerkleTree<4, 2> = MerkleTree::new(leaves);
    let small_proof = tree.generate_proof(0);
    let (full_root, full_proof) = pad_proof_to_depth::<2, 32>(tree.root, small_proof);

    main(
        1,
        100,
        1234,
        full_proof.path,
        full_proof.indices,
        1,
        120,
        1234,
        0,
        0,
        0,
        input_note.generate_nullifer(),
        output_note.commit(),
        output_note_2.commit(),
        full_root,
    );
}
