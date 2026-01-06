use payv_logic::Note;
use payv_logic::transfer::main as transfer_main;
use payv_logic::transfer::{TxnInputPrivate, TxnInputPublic};

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
    // Input note 1 (private)
    in1_owner: Field,
    in1_value: Field,
    in1_secret: Field,
    in1_merkle_path: [Field; 32],
    in1_path_indices: [bool; 32],
    // Input note 2 (private)
    in2_owner: Field,
    in2_value: Field,
    in2_secret: Field,
    in2_merkle_path: [Field; 32],
    in2_path_indices: [bool; 32],
    // Output note 1 (private)
    out1_owner: Field,
    out1_value: Field,
    out1_secret: Field,
    // Output note 2 (private)
    out2_owner: Field,
    out2_value: Field,
    out2_secret: Field,
    // Public inputs
    input_nullifier_1: pub Field,
    input_nullifier_2: pub Field,
    output_commitment_1: pub Field,
    output_commitment_2: pub Field,
    merkle_root: pub Field,
) {
    let input_note_1 = Note::new(in1_owner, in1_value, in1_secret);
    let input_note_2 = Note::new(in2_owner, in2_value, in2_secret);
    let output_note_1 = Note::new(out1_owner, out1_value, out1_secret);
    let output_note_2 = Note::new(out2_owner, out2_value, out2_secret);

    let private_data: TxnInputPrivate<2, 2> = TxnInputPrivate {
        input_notes: [input_note_1, input_note_2],
        output_notes: [output_note_1, output_note_2],
        merkle_paths: [in1_merkle_path, in2_merkle_path],
        path_indices: [in1_path_indices, in2_path_indices],
    };

    let public_data: TxnInputPublic<2, 2> = TxnInputPublic {
        input_nullifiers: [input_nullifier_1, input_nullifier_2],
        output_commitments: [output_commitment_1, output_commitment_2],
        merkle_root,
    };

    transfer_main(private_data, public_data);
}
