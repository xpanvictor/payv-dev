use circuit::Note;
use circuit::ownership::{OwnershipPublic, OwnershipPrivate};
use circuit::ownership::{main as ownership_main, compute_ownership_hash};

/// Ownership circuit - prove you own a note without revealing details
///
/// Public inputs:
/// - merkle_root: Current Merkle tree root
/// - ownership_hash: Context-bound proof of ownership
/// - min_value: Minimum value required (0 to skip check)
///
/// Private inputs:
/// - note: The note being proven
/// - merkle_path: Merkle proof
/// - path_indices: Path indices
/// - context: Context data for the ownership hash
fn main(
    // Private inputs
    note_owner: Field,
    note_value: Field,
    note_secret: Field,
    merkle_path: [Field; 32],
    path_indices: [bool; 32],
    context: Field,
    // Public inputs
    merkle_root: pub Field,
    ownership_hash: pub Field,
    min_value: pub Field,
) {
    let note = Note::new(note_owner, note_value, note_secret);

    let private_data: OwnershipPrivate<32> = OwnershipPrivate {
        note,
        merkle_path,
        path_indices,
        context,
    };

    let public_data = OwnershipPublic {
        merkle_root,
        ownership_hash,
        min_value,
    };

    ownership_main(private_data, public_data);
}
