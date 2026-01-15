# PayV Node

A complete node implementation for the PayV private payment system, consisting of an **Indexer** and **Relayer**.

## Architecture

### Indexer
- **Purpose**: Indexes blockchain events and maintains off-chain state
- **Port**: 8080
- **Features**:
  - Listens to contract events (Deposit, Transfer, Withdraw)
  - Maintains Merkle tree of commitments
  - Stores encrypted notes and transaction data
  - Provides API endpoints for proofs and note access

### Relayer
- **Purpose**: Handles transaction submission and fee management
- **Port**: 8081
- **Features**:
  - Accepts ZK proof transactions from users
  - Manages transaction queue with priority
  - Submits transactions to blockchain
  - Handles gas optimization and fee collection
  - Provides transaction status tracking

## Configuration

Set the following environment variables:

```bash
# Blockchain connection
RPC_URL=https://rpc.mantle.xyz
CONTRACT_ADDR=0x...  # PayV contract address

# Relayer configuration
RELAYER_PRIVATE_KEY=your_private_key_without_0x_prefix

# Optional
PORT=8080  # Indexer port
```

## API Endpoints

### Indexer (Port 8080)

#### Get Merkle Proof
```
GET /api/v1/proof/:commitment
```
Returns the Merkle proof for a commitment hash.

#### Check Note Access
```
GET /api/v1/note/:commitment/can-view?address=user_address
```
Checks if a user can view an encrypted note and returns the note if accessible.

#### Get Transaction Details
```
GET /api/v1/transaction/:hash?viewing_key=key
```
Returns transaction details (requires viewing key).

#### Get Merkle Root
```
GET /api/v1/merkle-root
```
Returns the current Merkle root.

### Relayer (Port 8081)

#### Submit Deposit
```
POST /api/v1/relayer/deposit
Content-Type: application/json

{
  "proof": "0x...",
  "publicInputs": ["commitment_hash", "amount"],
  "encryptedNote": "0x...",
  "amount": "1000000000000000000",
  "userAddress": "0x..."
}
```

#### Submit Transfer
```
POST /api/v1/relayer/transfer
Content-Type: application/json

{
  "proof": "0x...",
  "publicInputs": ["nullifier", "commitment1", "commitment2", "merkle_root"],
  "encryptedNote": "0x...",
  "userAddress": "0x..."
}
```

#### Submit Withdraw
```
POST /api/v1/relayer/withdraw
Content-Type: application/json

{
  "proof": "0x...",
  "publicInputs": ["nullifier", "merkle_root", "recipient", "amount", "fee"],
  "encryptedNote": "0x...",
  "recipient": "0x...",
  "relayerFee": "1000000000000000",
  "userAddress": "0x..."
}
```

#### Get Transaction Status
```
GET /api/v1/relayer/transaction/:id
```
Returns the status of a submitted transaction.

#### Get Queue Status
```
GET /api/v1/relayer/queue/status
```
Returns current queue statistics.

## Transaction Flow

1. **Client** generates ZK proof using Noir circuits
2. **Client** submits proof + public inputs to Relayer API
3. **Relayer** validates request and queues transaction
4. **Relayer** submits transaction to blockchain with optimized gas
5. **Indexer** detects new transaction via event listening
6. **Indexer** updates Merkle tree and stores encrypted notes
7. **Client** can query Indexer for proofs and note access

## Building and Running

```bash
# Build
go build ./cmd/node

# Run
./node
```

The node will start both indexer and relayer services.

## Security Considerations

- **Private Key**: Store relayer private key securely (environment variable, KMS, etc.)
- **Rate Limiting**: Implement rate limiting on API endpoints
- **Validation**: All proofs and inputs are validated before submission
- **Gas Limits**: Configurable gas price bounds prevent excessive fees
- **Queue Limits**: Maximum queue size prevents memory exhaustion

## Development

The codebase is structured as follows:

```
node/
├── cmd/node/          # Main application entry point
├── internal/
│   ├── common/        # Shared types and utilities
│   ├── config/        # Configuration management
│   ├── indexer/       # Indexer service
│   │   ├── api/       # Indexer HTTP API
│   │   └── storage.go # Data persistence
│   └── relayer/       # Relayer service
│       ├── queue.go   # Transaction queue
│       └── tx_submitter.go # Blockchain submission
└── go.mod
```