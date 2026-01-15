# PayV: Decentralized Private Payment System

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.21-blue.svg)](https://soliditylang.org/)
[![Noir](https://img.shields.io/badge/Noir-ZK-orange.svg)](https://noir-lang.org/)
[![Go](https://img.shields.io/badge/Go-1.21+-blue.svg)](https://golang.org/)
[![React Native](https://img.shields.io/badge/React%20Native-0.81.5-blue.svg)](https://reactnative.dev/)

PayV is a production-ready decentralized private payment system deployed on Mantle, implementing zero-knowledge proofs for confidential transactions. The system enables users to shield public funds into private commitments, transfer value anonymously, and unshield back to public balances while maintaining complete transaction privacy.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
  - [Smart Contracts](#smart-contracts)
  - [Zero-Knowledge Circuits](#zero-knowledge-circuits)
  - [Node Infrastructure](#node-infrastructure)
  - [Mobile Client](#mobile-client)
- [Core Concepts](#core-concepts)
- [Technical Specifications](#technical-specifications)
- [Installation & Setup](#installation--setup)
- [API Reference](#api-reference)
- [Security Considerations](#security-considerations)
- [Research & Design](#research--design)
- [Contributing](#contributing)
- [License](#license)

## Overview

PayV represents a significant advancement in blockchain privacy technology, implementing a complete zero-knowledge private payment system that maintains the security guarantees of public blockchains while providing cryptographic privacy for transaction amounts, sender identities, and recipient addresses.

### Key Features

- **Complete Transaction Privacy**: Amounts, senders, and recipients remain hidden from the blockchain
- **zkSNARK-based Proofs**: Utilizes Noir's efficient zero-knowledge proving system
- **Incremental Merkle Trees**: Scalable commitment management with predictable gas costs
- **Non-custodial Architecture**: Users maintain full control of their private keys
- **Cross-platform Support**: Native mobile applications for iOS and Android
- **Production Infrastructure**: Full node implementation with indexer and relayer services

### System Components

The PayV ecosystem consists of four primary layers:

1. **Smart Contracts** (`/contract/`): Solidity implementation on Mantle network
2. **ZK Circuits** (`/circuit/`): Noir zero-knowledge proof circuits
3. **Node Infrastructure** (`/node/`): Go-based indexer and relayer services
4. **Mobile Client** (`/mobile/`): React Native wallet application

## Architecture

### Smart Contracts

The core PayV protocol is implemented as a minimal, gas-efficient Solidity contract that maintains only essential on-chain state:

```solidity
contract Payv is IncrementalMerkleTree, ReentrancyGuard {
    // Minimal state: only commitment roots and nullifiers
    mapping(bytes32 => bool) public s_nullifierHashes;
    mapping(bytes32 => bool) public s_commitments;
    bytes32 public commitmentRoot;
}
```

**Key Functions:**
- `deposit()`: Shields public funds into private commitments
- `transfer()`: Enables private peer-to-peer transfers
- `withdraw()`: Unshields private commitments to public balances

The contract leverages an optimized Incremental Merkle Tree implementation for efficient commitment management and verification.

### Zero-Knowledge Circuits

PayV implements three core zero-knowledge circuits using Noir:

#### Deposit Circuit (`/circuit/deposit/`)
- **Purpose**: Converts public funds to private commitments
- **Public Inputs**: `commitment`, `deposit_amount`
- **Private Inputs**: `note_owner`, `note_value`, `note_secret`
- **Security**: Ensures deposited amount matches commitment value

#### Transfer Circuit (`/circuit/transfer/`)
- **Purpose**: Private peer-to-peer value transfers
- **Public Inputs**: `input_nullifier`, `output_commitment_1`, `output_commitment_2`, `merkle_root`
- **Private Inputs**: Input/output notes with Merkle proofs
- **Security**: Verifies note ownership and prevents double-spending

#### Withdraw Circuit (`/circuit/withdraw/`)
- **Purpose**: Converts private commitments back to public funds
- **Public Inputs**: `nullifier`, `merkle_root`, `recipient`, `withdraw_amount`, `relayer_fee`
- **Private Inputs**: Note data with Merkle proof
- **Security**: Validates withdrawal amounts and prevents double-spending

### Node Infrastructure

The PayV node provides essential infrastructure services:

#### Indexer Service (Port 8080)
- **Event Listening**: Monitors contract events in real-time
- **Merkle Tree Management**: Maintains off-chain commitment tree state
- **Encrypted Note Storage**: Stores encrypted transaction data
- **Proof Generation**: Provides Merkle proofs for client verification

#### Relayer Service (Port 8081)
- **Transaction Queuing**: Priority-based transaction processing
- **Gas Optimization**: Dynamic gas price management
- **Fee Collection**: Automated relayer fee processing
- **Status Tracking**: Transaction confirmation monitoring

### Mobile Client

The React Native mobile application provides a user-friendly interface for private transactions:

- **Wallet Management**: Secure key generation and storage
- **Transaction Creation**: Intuitive deposit/transfer/withdraw flows
- **Proof Generation**: Local ZK proof computation
- **Balance Tracking**: Private balance management
- **Network Integration**: Direct connection to PayV nodes

## Core Concepts

### Commitments

A commitment represents a private note controlled by a user, cryptographically binding value and ownership without revealing either:

```
commitment = hash(owner || value || secret)
```

### Nullifiers

Nullifiers prevent double-spending by marking commitments as spent:

```
nullifier = hash(commitment || secret)
```

### Incremental Merkle Tree

PayV uses an optimized Incremental Merkle Tree (IMT) for scalable commitment management:

- **Depth**: 32 levels for 4+ billion possible commitments
- **Updates**: O(log n) insertion complexity
- **Proofs**: Constant-time verification regardless of tree size
- **Gas Efficiency**: Predictable gas costs for all operations

### Zero-Knowledge Proofs

All transaction validity is proven cryptographically without revealing sensitive data:

- **Deposit Proofs**: Verify amount matches commitment
- **Transfer Proofs**: Prove ownership and prevent double-spending
- **Withdraw Proofs**: Validate amounts and recipient addresses

## Technical Specifications

### Cryptographic Parameters

| Parameter         | Value       | Description                   |
|-------------------|-------------|-------------------------------|
| Merkle Tree Depth | 32          | Maximum tree height           |
| Hash Function     | Poseidon2   | Optimized for ZK circuits     |
| Curve             | BN254       | Standard Ethereum ZK curve    |
| Proof System      | Groth16     | Efficient SNARK implementation |

### Transaction Limits

| Operation | Gas Estimate | Public Inputs | Private Inputs |
|-----------|-------------|----------------|----------------|
| Deposit   | ~150k       | 2              | 3              |
| Transfer  | ~200k       | 4              | 67             |
| Withdraw  | ~180k       | 5              | 35             |

### Network Requirements

- **Blockchain**: Mantle mainnet
- **ZK Verifiers**: Pre-deployed Groth16 verifiers
- **Node Requirements**: 2GB RAM, 100GB storage
- **Client Requirements**: iOS 12+/Android 8+

## Installation & Setup

### Prerequisites

```bash
# System dependencies
brew install go node yarn rust

# Noir toolchain
curl -L https://noirup.org/install | bash
noirup

# Foundry for contract development
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

### Repository Setup

```bash
git clone https://github.com/xpanvictor/payv-dev.git
cd payv-dev

# Initialize submodules
git submodule update --init --recursive

# Install dependencies
yarn install
go mod download
```

### Smart Contract Deployment

```bash
cd contract/payv

# Deploy to Mantle testnet
forge create --rpc-url https://rpc.testnet.mantle.xyz \
             --private-key $PRIVATE_KEY \
             src/Payv.sol:Payv
```

### Node Setup

```bash
cd node

# Configure environment
export RPC_URL=https://rpc.mantle.xyz
export CONTRACT_ADDR=0x...
export RELAYER_PRIVATE_KEY=your_key

# Build and run
go build ./cmd/node
./node
```

### Circuit Compilation

```bash
cd circuit

# Generate proving/verification keys
./generate_artifacts.sh

# Compile circuits
nargo compile
```

### Mobile App Setup

```bash
cd mobile

# Install dependencies
yarn install

# Start development server
yarn start
```

## API Reference

### Indexer Endpoints

#### Get Merkle Proof
```http
GET /api/v1/proof/:commitment
```

#### Check Note Access
```http
GET /api/v1/note/:commitment/can-view?address=user_address
```

#### Get Merkle Root
```http
GET /api/v1/merkle-root
```

### Relayer Endpoints

#### Submit Deposit
```http
POST /api/v1/relayer/deposit
Content-Type: application/json

{
  "proof": "0x...",
  "publicInputs": ["commitment", "amount"],
  "encryptedNote": "0x...",
  "amount": "1000000000000000000",
  "userAddress": "0x..."
}
```

#### Submit Transfer
```http
POST /api/v1/relayer/transfer
Content-Type: application/json

{
  "proof": "0x...",
  "publicInputs": ["nullifier", "commitment1", "commitment2", "root"],
  "encryptedNote": "0x...",
  "userAddress": "0x..."
}
```

#### Submit Withdraw
```http
POST /api/v1/relayer/withdraw
Content-Type: application/json

{
  "proof": "0x...",
  "publicInputs": ["nullifier", "root", "recipient", "amount", "fee"],
  "encryptedNote": "0x...",
  "recipient": "0x...",
  "relayerFee": "1000000000000000",
  "userAddress": "0x..."
}
```

## Security Considerations

### Cryptographic Security

- **Zero-Knowledge Proofs**: All transaction validity proven without revealing sensitive data
- **Double-Spend Prevention**: Nullifier system prevents commitment reuse
- **Merkle Tree Integrity**: Cryptographic commitment to all historical states
- **Secure Randomness**: Proper entropy for note secrets and nullifiers

### Operational Security

- **Private Key Management**: Secure storage and handling of relayer keys
- **Rate Limiting**: API endpoints protected against abuse
- **Input Validation**: Comprehensive validation of all proof inputs
- **Gas Bounds**: Configurable limits prevent excessive transaction costs

### Privacy Guarantees

- **Transaction Unlinkability**: Individual transactions cannot be correlated
- **Amount Hiding**: Transaction values remain completely private
- **Identity Protection**: Sender and recipient addresses hidden from blockchain
- **Metadata Minimization**: Only essential data stored on-chain

## Research & Design

### Academic Foundations

PayV builds upon established cryptographic research in zero-knowledge systems:

- **zkSNARKs**: Based on the Groth16 proving system for efficient verification
- **Merkle Trees**: Leverages incremental construction for scalability
- **Commitment Schemes**: Uses Pedersen commitments for value binding
- **Nullifier Systems**: Implements the nullifier pattern for double-spend prevention

### Design Principles

1. **Minimal On-Chain State**: Only store what must be publicly verifiable
2. **Composability**: Support for complex transaction patterns (join/split operations)
3. **Scalability**: Constant-time operations regardless of system size
4. **Interoperability**: Standard interfaces for integration with other systems

### Performance Optimizations

- **Batch Processing**: Multiple operations can be processed efficiently
- **Gas Optimization**: Minimal on-chain computation through off-chain proofs
- **Proof Caching**: Reuse proofs for common transaction patterns
- **Parallel Verification**: Independent proof verification enables concurrency

## Contributing

We welcome contributions to the PayV protocol. Please see our [contributing guidelines](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch
3. Implement changes with comprehensive tests
4. Submit a pull request with detailed description
5. Participate in code review process

### Testing

```bash
# Run circuit tests
cd circuit && nargo test

# Run contract tests
cd contract && forge test

# Run node tests
cd node && go test ./...

# Run mobile tests
cd mobile && yarn test
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**PayV**: Enabling private, scalable, and secure decentralized payments through advanced zero-knowledge cryptography.
