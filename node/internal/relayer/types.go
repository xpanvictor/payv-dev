package relayer

import (
	"math/big"
	"time"

	"github.com/ethereum/go-ethereum/common"
)

// TransactionType represents the type of transaction
type TransactionType string

const (
	TransactionTypeDeposit  TransactionType = "deposit"
	TransactionTypeTransfer TransactionType = "transfer"
	TransactionTypeWithdraw TransactionType = "withdraw"
)

// TransactionStatus represents the status of a transaction
type TransactionStatus string

const (
	StatusPending   TransactionStatus = "pending"
	StatusSubmitted TransactionStatus = "submitted"
	StatusConfirmed TransactionStatus = "confirmed"
	StatusFailed    TransactionStatus = "failed"
)

// DepositRequest represents a deposit transaction request
type DepositRequest struct {
	Proof          []byte   `json:"proof"`
	PublicInputs   []string `json:"publicInputs"` // [commitment, amount]
	EncryptedNote  []byte   `json:"encryptedNote"`
	Amount         *big.Int `json:"amount"`
	UserAddress    string   `json:"userAddress"`
}

// TransferRequest represents a transfer transaction request
type TransferRequest struct {
	Proof          []byte   `json:"proof"`
	PublicInputs   []string `json:"publicInputs"` // [nullifier, commitment1, commitment2, root]
	EncryptedNote  []byte   `json:"encryptedNote"`
	UserAddress    string   `json:"userAddress"`
}

// WithdrawRequest represents a withdraw transaction request
type WithdrawRequest struct {
	Proof          []byte   `json:"proof"`
	PublicInputs   []string `json:"publicInputs"` // [nullifier, root, recipient, amount, fee]
	EncryptedNote  []byte   `json:"encryptedNote"`
	Recipient      string   `json:"recipient"`
	RelayerFee     *big.Int `json:"relayerFee"`
	UserAddress    string   `json:"userAddress"`
}

// Transaction represents a queued transaction
type Transaction struct {
	ID             string            `json:"id"`
	Type           TransactionType   `json:"type"`
	Status         TransactionStatus `json:"status"`
	Request        interface{}       `json:"request"`
	TxHash         string            `json:"txHash,omitempty"`
	BlockNumber    uint64            `json:"blockNumber,omitempty"`
	Error          string            `json:"error,omitempty"`
	CreatedAt      time.Time         `json:"createdAt"`
	SubmittedAt    *time.Time        `json:"submittedAt,omitempty"`
	ConfirmedAt    *time.Time        `json:"confirmedAt,omitempty"`
	GasPrice       *big.Int          `json:"gasPrice,omitempty"`
	GasUsed        uint64            `json:"gasUsed,omitempty"`
	UserAddress    string            `json:"userAddress"`
}

// RelayerConfig holds relayer configuration
type RelayerConfig struct {
	RPCURL           string
	ContractAddr     string
	PrivateKey       string
	MaxQueueSize     int
	MinGasPrice      *big.Int
	MaxGasPrice      *big.Int
	GasMultiplier    float64
	ConfirmationBlocks uint64
}

// ContractABI constants for the Payv contract
const (
	DepositFunction  = "deposit"
	TransferFunction = "transfer"
	WithdrawFunction = "withdraw"
)

// Contract event signatures
var (
	DepositEventSig  = common.HexToHash("0x...") // TODO: calculate actual signature
	TransferEventSig = common.HexToHash("0x...") // TODO: calculate actual signature
	WithdrawEventSig = common.HexToHash("0x...") // TODO: calculate actual signature
)