// Core types
pub mod models;
pub mod errors;

// Circuit modules
pub mod deposit;
pub mod transfer;

// Re-export commonly used types at crate root
pub use models::Note;
