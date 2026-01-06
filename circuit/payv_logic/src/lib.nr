// Core types
pub mod models;
pub mod errors;
pub mod utils;

// Circuit modules
pub mod transfer;
pub mod deposit;
pub mod withdraw;
pub mod ownership;

// Re-export commonly used types at crate root
pub use models::Note;
pub use utils::merkle::{MerkleProof, MerkleTree, pad_proof_to_depth, verify_merkle, verify_proof};

// Re-export circuit structs for external use
pub use deposit::{DepositPublic, DepositPrivate};
pub use transfer::{TxnInputPublic, TxnInputPrivate};
pub use withdraw::{WithdrawPublic, WithdrawPrivate};
pub use ownership::{OwnershipPublic, OwnershipPrivate};
