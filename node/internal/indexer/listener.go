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

	// Contract ABI - simplified for this example
	contractABI := `[
		{
			"anonymous": false,
			"inputs": [
				{"indexed": true, "name": "commitment", "type": "bytes32"},
				{"indexed": false, "name": "encryptedNote", "type": "bytes"}
			],
			"name": "Deposit",
			"type": "event"
		},
		{
			"anonymous": false,
			"inputs": [
				{"indexed": true, "name": "nullifier", "type": "bytes32"},
				{"indexed": true, "name": "commitment", "type": "bytes32"},
				{"indexed": false, "name": "encryptedNote", "type": "bytes"}
			],
			"name": "Transfer",
			"type": "event"
		},
		{
			"anonymous": false,
			"inputs": [
				{"indexed": true, "name": "nullifier", "type": "bytes32"}
			],
			"name": "Withdraw",
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
	// Parse event data
	commitment := vLog.Topics[1].Hex()
	encryptedNote := string(vLog.Data)

	// Create commitment
	comm := &common.Commitment{
		Hash:     commitment,
		Index:    uint64(len(l.storage.commitments)), // This is simplified
		BlockNum: vLog.BlockNumber,
		TxHash:   vLog.TxHash.Hex(),
	}

	l.storage.AddCommitment(comm)

	// For deposits, the encrypted note is for the depositor
	// In a real implementation, you'd parse the recipient from the note
	note := &common.EncryptedNote{
		CommitmentHash: commitment,
		Recipient:      "", // Would be parsed from encrypted note
		Ciphertext:     encryptedNote,
		BlockNum:       vLog.BlockNumber,
		TxHash:         vLog.TxHash.Hex(),
	}

	l.storage.AddEncryptedNote(note)

	log.Printf("Processed deposit: commitment=%s", commitment)
}

func (l *Listener) processTransfer(vLog types.Log) {
	nullifier := vLog.Topics[1].Hex()
	commitment := vLog.Topics[2].Hex()
	encryptedNote := string(vLog.Data)

	// Add new commitment
	comm := &common.Commitment{
		Hash:     commitment,
		Index:    uint64(len(l.storage.commitments)),
		BlockNum: vLog.BlockNumber,
		TxHash:   vLog.TxHash.Hex(),
	}

	l.storage.AddCommitment(comm)

	// Add encrypted note for recipient
	note := &common.EncryptedNote{
		CommitmentHash: commitment,
		Recipient:      "", // Would be parsed from encrypted note
		Ciphertext:     encryptedNote,
		BlockNum:       vLog.BlockNumber,
		TxHash:         vLog.TxHash.Hex(),
	}

	l.storage.AddEncryptedNote(note)

	log.Printf("Processed transfer: nullifier=%s, commitment=%s", nullifier, commitment)
}

func (l *Listener) processWithdraw(vLog types.Log) {
	nullifier := vLog.Topics[1].Hex()

	log.Printf("Processed withdraw: nullifier=%s", nullifier)
}