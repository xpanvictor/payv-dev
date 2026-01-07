use payv_logic::deposit::{DepositPrivate, DepositPublic};
use payv_logic::deposit::main as deposit_main;
use payv_logic::Note;

/// Deposit circuit - converts public funds into a private note
///
/// Public inputs:
/// - commitment: The note commitment to be added to the Merkle tree
/// - deposit_amount: The public amount being deposited
///
/// Private inputs:
/// - note_owner: Owner's public key/address
/// - note_value: The value of the note
/// - note_secret: Secret known only to the owner
fn main(
    // Private inputs
    note_owner: Field,
    note_value: Field,
    note_secret: Field,
    // Public inputs
    commitment: pub Field,
    deposit_amount: pub Field,
) {
    let note = Note::new(note_owner, note_value, note_secret);
    let private_data = DepositPrivate { note };
    let public_data = DepositPublic { commitment, deposit_amount };
    deposit_main(private_data, public_data);
}

// ------- tests -------

#[test]
pub fn test_deposit_works() {
    let owner = 0xabc;
    let value = 1000;
    let secret = 12345;

    let note = Note::new(owner, value, secret);
    let commitment = note.commit();

    main(owner, value, secret, commitment, value);
}

#[test(should_fail_with = "1006")]
pub fn test_deposit_wrong_commitment_fails() {
    let note = Note::new(1, 1000, 12345);
    let wrong_commitment = Note::new(1, 1000, 99999).commit();

    main(1, 1000, 12345, wrong_commitment, 1000);
}

#[test(should_fail_with = "1005")]
pub fn test_deposit_amount_mismatch_fails() {
    let note = Note::new(1, 1000, 12345);
    let commitment = note.commit();

    // Claim different deposit amount than note value
    main(1, 1000, 12345, commitment, 2000);
}
