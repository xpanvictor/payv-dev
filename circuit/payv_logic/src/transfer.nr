use super::errors;
use super::errors::ERR_MERKLE_INVALID;
use super::errors::ERR_VALUE_BALANCES;
use super::models::Note;
use super::utils::merkle::{MerkleTree, pad_proof_to_depth, verify_merkle};
use poseidon::poseidon2;

/// Transfer logic
/// Uses ...
/// Todo: decide merkle tree structure

pub struct TxnInputPublic<let N: u32, let M: u32> {
    pub input_nullifiers: [Field; N],
    pub output_commitments: [Field; M],
    pub merkle_root: Field,
}

pub struct TxnInputPrivate<let N: u32, let M: u32> {
    pub input_notes: [Note; N],
    pub output_notes: [Note; M],
    pub merkle_paths: [[Field; 32]; N],
    pub path_indices: [[bool; 32]; N],
}

// for now default 2,2 until I decide structure of actual data
/// Support private transfer of notes
///
/// Constraints recognized
/// - ensure nullifiers are correctly computed
/// - ensure commitments are in merkle tree
/// - ensure sum(in) = sum(out)
pub fn main<let N: u32, let M: u32>(
    private_data: TxnInputPrivate<N, M>,
    public_data: TxnInputPublic<N, M>,
) {
    let mut input_amount = 0;
    let mut output_amount = 0;

    for i in 0..N {
        let input_note = private_data.input_notes[i];
        let input_note_commitment = input_note.commit();
        let input = [input_note_commitment, input_note.secret];
        // assert nullifiers are correctly passed
        assert(
            poseidon2::Poseidon2::hash(input, input.len()) == public_data.input_nullifiers[i],
            errors::ERR_NULLIFIER_INVALID,
        );
        input_amount += input_note.value;
        // exists in tree
        assert(
            verify_merkle(
                input_note_commitment,
                public_data.merkle_root,
                private_data.merkle_paths[i],
                private_data.path_indices[i],
            ),
            ERR_MERKLE_INVALID,
        );
    }
    // verify public commitments
    for i in 0..M {
        let output_note = private_data.output_notes[i];
        output_amount += output_note.value;
        assert(output_note.commit() == public_data.output_commitments[i]);
    }
    // value conservation
    assert(input_amount == output_amount, ERR_VALUE_BALANCES);
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

    let private_data = TxnInputPrivate {
        input_notes: [input_note],
        output_notes: [output_note_1, output_note_2],
        merkle_paths: [full_proof.path],
        path_indices: [full_proof.indices],
    };
    let public_data = TxnInputPublic {
        input_nullifiers: [input_note.generate_nullifer()],
        output_commitments: [output_note_1.commit(), output_note_2.commit()],
        merkle_root: full_root,
    };
    main(private_data, public_data);
}

#[test(should_fail_with = "1001")]
pub fn test_invalid_nullifier_fails() {
    let input_note = Note::new(1, 100, 1234);
    let other_note = Note::new(1, 100, 4444);
    let private_data = TxnInputPrivate {
        input_notes: [input_note],
        output_notes: [],
        merkle_paths: [[0; 32]],
        path_indices: [[false; 32]],
    };
    let public_data = TxnInputPublic {
        // uses other note here
        input_nullifiers: [other_note.generate_nullifer()],
        output_commitments: [],
        merkle_root: 0,
    };
    main(private_data, public_data);
}

#[test(should_fail_with = "1002")]
pub fn test_value_imbalance() {
    let input_note = Note::new(1, 100, 1234);
    let output_note = Note::new(1, 120, 1234);

    // Build a merkle tree with the input note commitment
    let input_commitment = input_note.commit();
    let leaves: [Field; 4] = [input_commitment, 0, 0, 0];
    let tree: MerkleTree<4, 2> = MerkleTree::new(leaves);

    // Generate proof for leaf at index 0 and pad to depth 32
    let small_proof = tree.generate_proof(0);
    let (full_root, full_proof) = pad_proof_to_depth::<2, 32>(tree.root, small_proof);

    let private_data = TxnInputPrivate {
        input_notes: [input_note],
        output_notes: [output_note],
        merkle_paths: [full_proof.path],
        path_indices: [full_proof.indices],
    };
    let public_data = TxnInputPublic {
        // uses other note here
        input_nullifiers: [input_note.generate_nullifer()],
        output_commitments: [output_note.commit()],
        merkle_root: full_root,
    };
    main(private_data, public_data);
}
