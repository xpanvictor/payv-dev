package indexer

import (
	"context"
	"log"
	"math/big"
	"strings"

	"github.com/ethereum/go-ethereum"
	"github.com/ethereum/go-ethereum/accounts/abi"
	ethcommon "github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/ethclient"

	"node/internal/common"
)

// Listener listens to blockchain events
type Listener struct {
	client     *ethclient.Client
	contractAddr ethcommon.Address
	storage     *Storage
	abi         abi.ABI
}

// NewListener creates a new blockchain listener
func NewListener(rpcURL string, contractAddr string, storage *Storage) (*Listener, error) {
	client, err := ethclient.Dial(rpcURL)
	if err != nil {
		return nil, err
	}

	// Contract ABI - matches the actual contract events
	contractABI := `[
		{
			"anonymous": false,
			"inputs": [
				{"indexed": true, "name": "commitment", "type": "bytes32"},
				{"indexed": false, "name": "amount", "type": "uint256"},
				{"indexed": false, "name": "leafIndex", "type": "uint32"},
				{"indexed": false, "name": "timestamp", "type": "uint256"},
				{"indexed": false, "name": "encryptedInputs", "type": "bytes"}
			],
			"name": "Deposit",
			"type": "event"
		},
		{
			"anonymous": false,
			"inputs": [
				{"indexed": true, "name": "inputNullifier", "type": "bytes32"},
				{"indexed": false, "name": "leafIndex1", "type": "uint256"},
				{"indexed": false, "name": "leafIndex2", "type": "uint32"},
				{"indexed": false, "name": "timestamp", "type": "uint256"},
				{"indexed": false, "name": "encryptedInputs", "type": "bytes"}
			],
			"name": "Transfer",
			"type": "event"
		},
		{
			"anonymous": false,
			"inputs": [
				{"indexed": false, "name": "to", "type": "address"},
				{"indexed": false, "name": "amount", "type": "uint256"},
				{"indexed": true, "name": "nullifierHash", "type": "bytes32"},
				{"indexed": false, "name": "timestamp", "type": "uint256"},
				{"indexed": false, "name": "encryptedInputs", "type": "bytes"}
			],
			"name": "Withdrawal",
			"type": "event"
		}
	]`

	parsedABI, err := abi.JSON(strings.NewReader(contractABI))
	if err != nil {
		return nil, err
	}

	return &Listener{
		client:       client,
		contractAddr: ethcommon.HexToAddress(contractAddr),
		storage:      storage,
		abi:          parsedABI,
	}, nil
}

// Start starts listening to events
func (l *Listener) Start(ctx context.Context) error {
	headers := make(chan *types.Header)

	sub, err := l.client.SubscribeNewHead(ctx, headers)
	if err != nil {
		return err
	}
	defer sub.Unsubscribe()

	for {
		select {
		case <-ctx.Done():
			return ctx.Err()
		case err := <-sub.Err():
			log.Printf("Subscription error: %v", err)
			return err
		case header := <-headers:
			l.processBlock(ctx, header.Number)
		}
	}
}

func (l *Listener) processBlock(ctx context.Context, blockNum *big.Int) {
	query := ethereum.FilterQuery{
		FromBlock: blockNum,
		ToBlock:   blockNum,
		Addresses: []ethcommon.Address{l.contractAddr},
	}

	logs, err := l.client.FilterLogs(ctx, query)
	if err != nil {
		log.Printf("Failed to filter logs: %v", err)
		return
	}

	for _, vLog := range logs {
		l.processLog(vLog)
	}
}

func (l *Listener) processLog(vLog types.Log) {
	event, err := l.abi.EventByID(vLog.Topics[0])
	if err != nil {
		log.Printf("Unknown event: %v", err)
		return
	}

	switch event.Name {
	case "Deposit":
		l.processDeposit(vLog)
	case "Transfer":
		l.processTransfer(vLog)
	case "Withdraw":
		l.processWithdraw(vLog)
	}
}

func (l *Listener) processDeposit(vLog types.Log) {
	// Parse event data: commitment (indexed), amount, leafIndex, timestamp, encryptedInputs
	commitment := vLog.Topics[1].Hex()

	// Unpack the non-indexed data
	var depositEvent struct {
		Amount          *big.Int
		LeafIndex       uint32
		Timestamp       *big.Int
		EncryptedInputs []byte
	}

	err := l.abi.UnpackIntoInterface(&depositEvent, "Deposit", vLog.Data)
	if err != nil {
		log.Printf("Failed to unpack deposit event: %v", err)
		return
	}

	// Create commitment
	comm := &common.Commitment{
		Hash:     commitment,
		Index:    uint64(depositEvent.LeafIndex),
		BlockNum: vLog.BlockNumber,
		TxHash:   vLog.TxHash.Hex(),
	}

	l.storage.AddCommitment(comm)

	// For deposits, the encrypted note is for the depositor
	note := &common.EncryptedNote{
		CommitmentHash: commitment,
		Recipient:      "", // Would be parsed from encrypted note in production
		Ciphertext:     string(depositEvent.EncryptedInputs),
		BlockNum:       vLog.BlockNumber,
		TxHash:         vLog.TxHash.Hex(),
	}

	l.storage.AddEncryptedNote(note)

	log.Printf("Processed deposit: commitment=%s, amount=%s, leafIndex=%d",
		commitment, depositEvent.Amount.String(), depositEvent.LeafIndex)
}

func (l *Listener) processTransfer(vLog types.Log) {
	// Parse event data: inputNullifier (indexed), leafIndex1, leafIndex2, timestamp, encryptedInputs
	nullifier := vLog.Topics[1].Hex()

	// Unpack the non-indexed data
	var transferEvent struct {
		LeafIndex1      *big.Int
		LeafIndex2      uint32
		Timestamp       *big.Int
		EncryptedInputs []byte
	}

	err := l.abi.UnpackIntoInterface(&transferEvent, "Transfer", vLog.Data)
	if err != nil {
		log.Printf("Failed to unpack transfer event: %v", err)
		return
	}

	// For transfers, we need to extract the output commitments from the transaction input data
	// This is a simplified version - in production, you'd parse the transaction input
	// For now, we'll create placeholder commitments based on the nullifier

	log.Printf("Processed transfer: nullifier=%s, leafIndex1=%s, leafIndex2=%d",
		nullifier, transferEvent.LeafIndex1.String(), transferEvent.LeafIndex2)

	// Note: In a full implementation, you'd need to parse the transaction input
	// to extract the actual output commitments and add them to storage
}

func (l *Listener) processWithdraw(vLog types.Log) {
	// Parse event data: to, amount, nullifierHash (indexed), timestamp, encryptedInputs
	nullifier := vLog.Topics[1].Hex()

	// Unpack the non-indexed data
	var withdrawEvent struct {
		To              ethcommon.Address
		Amount          *big.Int
		Timestamp       *big.Int
		EncryptedInputs []byte
	}

	err := l.abi.UnpackIntoInterface(&withdrawEvent, "Withdrawal", vLog.Data)
	if err != nil {
		log.Printf("Failed to unpack withdraw event: %v", err)
		return
	}

	log.Printf("Processed withdraw: nullifier=%s, to=%s, amount=%s",
		nullifier, withdrawEvent.To.Hex(), withdrawEvent.Amount.String())
}