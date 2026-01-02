// Core types
pub mod models;
pub mod errors;
pub mod utils;

// Circuit modules
pub mod deposit;
pub mod transfer;

// Re-export commonly used types at crate root
pub use models::Note;
pub use utils::merkle::{MerkleProof, MerkleTree, pad_proof_to_depth, verify_merkle, verify_proof};
