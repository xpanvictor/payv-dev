// Core types
pub mod models;
pub mod errors;
pub mod utils;

// Circuit modules
pub mod deposit;
pub mod transfer;

// Re-export commonly used types at crate root
pub use models::Note;
