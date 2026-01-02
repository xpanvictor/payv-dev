use super::errors;
use super::errors::ERR_VALUE_BALANCES;
use super::models::Note;
use poseidon::poseidon2;

/// Transfer logic
/// Uses ...
/// Todo: decide merkle tree structure

pub struct TxnInputPublic<let N: u32, let M: u32> {
    input_nullifiers: [Field; N],
    output_commitments: [Field; M],
    merkle_root: Field,
}

pub struct TxnInputPrivate<let N: u32, let M: u32> {
    input_notes: [Note; N],
    output_notes: [Note; M],
    merkle_paths: [[Field; 32]; N],
    path_indices: [[bool; 32]; N],
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

    // assert nullifiers are correctly passed
    for i in 0..N {
        let input_note = private_data.input_notes[i];
        let input = [input_note.commit(), input_note.secret];
        assert(
            poseidon2::Poseidon2::hash(input, input.len()) == public_data.input_nullifiers[i],
            errors::ERR_NULLIFIER_INVALID,
        );
        input_amount += input_note.value;
    }
    // check commitments exist
    for i in 0..M {
        output_amount += private_data.output_notes[i].value;
    }
    assert(input_amount == output_amount, ERR_VALUE_BALANCES);
}

// ------- tests -------
#[test]
pub fn test_transfer_works() {
    let input_note = Note::new(1, 100, 1234);
    let output_note_1 = Note::new(1, 60, 1000);
    let output_note_2 = Note::new(2, 40, 1001);
    let private_data = TxnInputPrivate {
        input_notes: [input_note],
        output_notes: [output_note_1, output_note_2],
        merkle_paths: [[0; 32]],
        path_indices: [[false; 32]],
    };
    let public_data = TxnInputPublic {
        input_nullifiers: [input_note.generate_nullifer()],
        output_commitments: [output_note_1.commit(), output_note_2.commit()],
        merkle_root: 0,
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
    let private_data = TxnInputPrivate {
        input_notes: [input_note],
        output_notes: [output_note],
        merkle_paths: [[0; 32]],
        path_indices: [[false; 32]],
    };
    let public_data = TxnInputPublic {
        // uses other note here
        input_nullifiers: [input_note.generate_nullifer()],
        output_commitments: [output_note.commit()],
        merkle_root: 0,
    };
    main(private_data, public_data);
}
