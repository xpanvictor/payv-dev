# PAYV  
PAYV is a decentralized private transaction layer deployed on Mantle, built using zkSNARKs. It enables users to move value between public and private states while keeping transaction amounts, senders, and recipients hidden from the public blockchain.

On-chain, PAYV intentionally stores only two pieces of state:

* **Commitment Root** – the Merkle tree root representing all valid private commitments.
* **Nullifier Set** – a set of spent commitments used to prevent double-spending.

This minimal state allows the chain to verify that a commitment exists in the tree and has not been spent, without learning anything about the underlying transaction details.



## Core Concepts

### Incremental Merkle Tree (IMT)

PAYV uses an Incremental Merkle Tree (IMT) to manage private commitments efficiently. The IMT allows new commitments to be appended sequentially without rebuilding the entire tree, enabling scalable inserts and predictable root updates.

Each insertion updates the tree root deterministically, and historical roots may remain valid for proof verification depending on configuration. This structure is critical for supporting frequent private transactions while keeping on-chain operations minimal.

The IMT contract is responsible only for maintaining tree structure and roots; it does not interpret commitment contents.

### Commitments

A commitment represents a private note controlled by a user. It cryptographically binds value and ownership information without revealing them on-chain. Commitments are inserted into a Merkle tree and can later be proven to exist using zero-knowledge proofs.

### Nullifiers

A nullifier is generated when a commitment is spent. Once a nullifier is published on-chain, it permanently marks the corresponding commitment as spent, ensuring that no commitment can be reused.

### Merkle Tree

All commitments are stored in a Merkle tree. Users prove that they own a valid commitment by providing a zero-knowledge membership proof against the stored Merkle root, without revealing which leaf they control.



## Contract Functionality

### Deposit (Shielding)

Deposits convert public funds into a private commitment. A new commitment is created off-chain, verified via a zkSNARK proof, and then inserted into the Merkle tree by updating the commitment root.

### Transfer (Private Transfer)

Transfers change ownership of a commitment without revealing transaction details. The contract verifies the zero-knowledge proof and updates the Merkle tree, while amounts and recipients remain hidden.

### Withdraw (Unshielding)

Withdrawals convert private commitments back into public balances. The spent commitment is invalidated by publishing its nullifier, and the corresponding value is released publicly.



## Supporting Operations

### Join

Join operations consume two existing commitments and produce a single new commitment. This is useful for consolidating multiple private notes into one.

### Split

Split operations consume one commitment and create two new commitments. This enables partial withdrawals and more flexible private balance management.



## Verification Model

The PAYV contract deliberately avoids heavy computation. Its role is limited to:

* Verifying zkSNARK proofs for correctness.
* Ensuring nullifiers have not been previously used.
* Updating the Merkle tree root.

All transaction validity and state transition rules are enforced cryptographically through zero-knowledge proofs before any on-chain state is modified.



## Design Principles

* **Minimal On-Chain State**: Only commitment roots and nullifiers are stored.
* **Privacy-First**: Transaction values and participants are never revealed.
* **Composability**: Join and split operations enable flexible private workflows.
* **Trust Minimization**: All state changes are proof-driven and independently verifiable.



## Summary

PAYV provides a lightweight private transaction layer that complements public balances. Users can shield funds into private commitments, transfer value privately, and unshield funds back to the public state, while the blockchain stores only the minimum information required for secure verification.
