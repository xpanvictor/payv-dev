// Core types
pub mod models;

// Circuit modules
pub mod deposit;
pub mod transfer;

// Re-export commonly used types at crate root
pub use models::Note;
