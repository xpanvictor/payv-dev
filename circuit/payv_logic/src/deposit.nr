use super::errors::{ERR_COMMITMENT_INVALID, ERR_DEPOSIT_AMOUNT_MISMATCH};
use super::models::Note;

/// Deposit circuit - converts public funds into a private note
///
/// This circuit proves that:
/// 1. The depositor knows the secret for the note
/// 2. The commitment is correctly computed from (owner, value, secret)
/// 3. The deposited amount matches the note value
///
/// Public inputs:
/// - commitment: The note commitment to be added to the Merkle tree
/// - deposit_amount: The public amount being deposited
///
/// Private inputs:
/// - note: The full note containing owner, value, and secret

pub struct DepositPublic {
    /// The commitment that will be added to the Merkle tree
    pub commitment: Field,
    /// The public deposit amount (for contract verification)
    pub deposit_amount: Field,
}

pub struct DepositPrivate {
    /// The private note with owner, value, and secret
    pub note: Note,
}

/// Main deposit circuit
/// Proves knowledge of note preimage and value conservation
pub fn main(private_data: DepositPrivate, public_data: DepositPublic) {
    let note = private_data.note;

    // Verify the commitment is correctly computed
    let computed_commitment = note.commit();
    assert(computed_commitment == public_data.commitment, ERR_COMMITMENT_INVALID);

    // Verify the deposit amount matches the note value
    // This ensures no value creation from thin air
    assert(note.value == public_data.deposit_amount, ERR_DEPOSIT_AMOUNT_MISMATCH);
}

// ------- tests -------

#[test]
pub fn test_deposit_works() {
    let secret = 123456789;
    let owner = 0xabcdef;
    let amount = 1000;

    let note = Note::new(owner, amount, secret);
    let commitment = note.commit();

    let private_data = DepositPrivate { note };
    let public_data = DepositPublic { commitment, deposit_amount: amount };

    main(private_data, public_data);
}

#[test(should_fail_with = "1006")]
pub fn test_deposit_wrong_commitment_fails() {
    let note = Note::new(1, 1000, 12345);
    let wrong_commitment = Note::new(1, 1000, 99999).commit();

    let private_data = DepositPrivate { note };
    let public_data = DepositPublic { commitment: wrong_commitment, deposit_amount: 1000 };

    main(private_data, public_data);
}

#[test(should_fail_with = "1005")]
pub fn test_deposit_amount_mismatch_fails() {
    let note = Note::new(1, 1000, 12345);
    let commitment = note.commit();

    let private_data = DepositPrivate { note };
    // Trying to claim we deposited more than the note value
    let public_data = DepositPublic { commitment, deposit_amount: 2000 };

    main(private_data, public_data);
}

#[test]
pub fn test_deposit_zero_amount() {
    // Edge case: zero value deposit (might be useful for some protocols)
    let note = Note::new(1, 0, 12345);
    let commitment = note.commit();

    let private_data = DepositPrivate { note };
    let public_data = DepositPublic { commitment, deposit_amount: 0 };

    main(private_data, public_data);
}
