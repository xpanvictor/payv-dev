package relayer

import (
	"context"
	"crypto/ecdsa"
	"fmt"
	"log"
	"math/big"
	"strings"

	"github.com/ethereum/go-ethereum"
	"github.com/ethereum/go-ethereum/accounts/abi"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/ethereum/go-ethereum/ethclient"
)

// TxSubmitter handles blockchain transaction submission
type TxSubmitter struct {
	client       *ethclient.Client
	contractAddr common.Address
	privateKey   *ecdsa.PrivateKey
	publicKey    common.Address
	chainID      *big.Int
	contractABI  abi.ABI
	config       *RelayerConfig
}

// NewTxSubmitter creates a new transaction submitter
func NewTxSubmitter(config *RelayerConfig) (*TxSubmitter, error) {
	client, err := ethclient.Dial(config.RPCURL)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to ethereum client: %w", err)
	}

	chainID, err := client.ChainID(context.Background())
	if err != nil {
		return nil, fmt.Errorf("failed to get chain ID: %w", err)
	}

	privateKey, err := crypto.HexToECDSA(config.PrivateKey)
	if err != nil {
		return nil, fmt.Errorf("failed to parse private key: %w", err)
	}

	publicKey := crypto.PubkeyToAddress(privateKey.PublicKey)

	contractABI, err := abi.JSON(strings.NewReader(PayvABI))
	if err != nil {
		return nil, fmt.Errorf("failed to parse contract ABI: %w", err)
	}

	return &TxSubmitter{
		client:       client,
		contractAddr: common.HexToAddress(config.ContractAddr),
		privateKey:   privateKey,
		publicKey:    publicKey,
		chainID:      chainID,
		contractABI:  contractABI,
		config:       config,
	}, nil
}

// SubmitDeposit submits a deposit transaction
func (ts *TxSubmitter) SubmitDeposit(ctx context.Context, req *DepositRequest) (*types.Transaction, error) {
	// Convert public inputs from hex strings to bytes32
	publicInputs := make([][32]byte, len(req.PublicInputs))
	for i, input := range req.PublicInputs {
		publicInputs[i] = common.HexToHash(input)
	}

	// Prepare transaction data
	data, err := ts.contractABI.Pack(DepositFunction, req.Proof, publicInputs, req.EncryptedNote)
	if err != nil {
		return nil, fmt.Errorf("failed to pack deposit data: %w", err)
	}

	return ts.submitTransaction(ctx, data, req.Amount)
}

// SubmitTransfer submits a transfer transaction
func (ts *TxSubmitter) SubmitTransfer(ctx context.Context, req *TransferRequest) (*types.Transaction, error) {
	// Convert public inputs from hex strings to bytes32
	publicInputs := make([][32]byte, len(req.PublicInputs))
	for i, input := range req.PublicInputs {
		publicInputs[i] = common.HexToHash(input)
	}

	// Prepare transaction data
	data, err := ts.contractABI.Pack(TransferFunction, req.Proof, publicInputs, req.EncryptedNote)
	if err != nil {
		return nil, fmt.Errorf("failed to pack transfer data: %w", err)
	}

	return ts.submitTransaction(ctx, data, big.NewInt(0))
}

// SubmitWithdraw submits a withdraw transaction
func (ts *TxSubmitter) SubmitWithdraw(ctx context.Context, req *WithdrawRequest) (*types.Transaction, error) {
	// Convert public inputs from hex strings to bytes32
	publicInputs := make([][32]byte, len(req.PublicInputs))
	for i, input := range req.PublicInputs {
		publicInputs[i] = common.HexToHash(input)
	}

	// Prepare transaction data
	data, err := ts.contractABI.Pack(WithdrawFunction, req.Proof, publicInputs, req.EncryptedNote, ts.publicKey)
	if err != nil {
		return nil, fmt.Errorf("failed to pack withdraw data: %w", err)
	}

	return ts.submitTransaction(ctx, data, big.NewInt(0))
}

// submitTransaction submits a transaction to the blockchain
func (ts *TxSubmitter) submitTransaction(ctx context.Context, data []byte, value *big.Int) (*types.Transaction, error) {
	// Get current gas price
	gasPrice, err := ts.getOptimalGasPrice(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get gas price: %w", err)
	}

	// Estimate gas
	gasLimit, err := ts.client.EstimateGas(ctx, ethereum.CallMsg{
		To:   &ts.contractAddr,
		Data: data,
		Value: value,
	})
	if err != nil {
		// Fallback gas limit
		gasLimit = 500000
		log.Printf("Failed to estimate gas, using fallback: %v", err)
	}

	// Get nonce
	nonce, err := ts.client.PendingNonceAt(ctx, ts.publicKey)
	if err != nil {
		return nil, fmt.Errorf("failed to get nonce: %w", err)
	}

	// Create transaction
	tx := types.NewTransaction(nonce, ts.contractAddr, value, gasLimit, gasPrice, data)

	// Sign transaction
	signedTx, err := types.SignTx(tx, types.NewEIP155Signer(ts.chainID), ts.privateKey)
	if err != nil {
		return nil, fmt.Errorf("failed to sign transaction: %w", err)
	}

	// Submit transaction
	err = ts.client.SendTransaction(ctx, signedTx)
	if err != nil {
		return nil, fmt.Errorf("failed to send transaction: %w", err)
	}

	log.Printf("Transaction submitted: %s", signedTx.Hash().Hex())
	return signedTx, nil
}

// getOptimalGasPrice gets the optimal gas price based on configuration
func (ts *TxSubmitter) getOptimalGasPrice(ctx context.Context) (*big.Int, error) {
	gasPrice, err := ts.client.SuggestGasPrice(ctx)
	if err != nil {
		return nil, err
	}

	// Apply multiplier
	if ts.config.GasMultiplier > 0 {
		multiplied := new(big.Float).Mul(big.NewFloat(ts.config.GasMultiplier), new(big.Float).SetInt(gasPrice))
		gasPrice, _ = multiplied.Int(nil)
	}

	// Ensure within bounds
	if ts.config.MinGasPrice != nil && gasPrice.Cmp(ts.config.MinGasPrice) < 0 {
		gasPrice = ts.config.MinGasPrice
	}
	if ts.config.MaxGasPrice != nil && gasPrice.Cmp(ts.config.MaxGasPrice) > 0 {
		gasPrice = ts.config.MaxGasPrice
	}

	return gasPrice, nil
}

// WaitForConfirmation waits for transaction confirmation
func (ts *TxSubmitter) WaitForConfirmation(ctx context.Context, txHash common.Hash, confirmations uint64) (*types.Receipt, error) {
	for {
		receipt, err := ts.client.TransactionReceipt(ctx, txHash)
		if err != nil {
			if err == ethereum.NotFound {
				// Transaction not yet mined, wait and retry
				select {
				case <-ctx.Done():
					return nil, ctx.Err()
				default:
					continue
				}
			}
			return nil, err
		}

		// Check if we have enough confirmations
		currentBlock, err := ts.client.BlockNumber(ctx)
		if err != nil {
			return nil, err
		}

		if currentBlock-receipt.BlockNumber.Uint64() >= confirmations {
			return receipt, nil
		}

		// Wait before checking again
		select {
		case <-ctx.Done():
			return nil, ctx.Err()
		default:
			// Wait 1 second before checking again
			// In production, you might want to use a more sophisticated approach
		}
	}
}

// PayvABI is the ABI for the Payv contract
const PayvABI = `[
	{
		"inputs": [
			{"internalType": "bytes", "name": "_proof", "type": "bytes"},
			{"internalType": "bytes32[]", "name": "_publicInputs", "type": "bytes32[]"},
			{"internalType": "bytes", "name": "_encryptedInputs", "type": "bytes"}
		],
		"name": "deposit",
		"outputs": [],
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"inputs": [
			{"internalType": "bytes", "name": "_proof", "type": "bytes"},
			{"internalType": "bytes32[]", "name": "_publicInputs", "type": "bytes32[]"},
			{"internalType": "bytes", "name": "_encryptedInputs", "type": "bytes"}
		],
		"name": "transfer",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{"internalType": "bytes", "name": "_proof", "type": "bytes"},
			{"internalType": "bytes32[]", "name": "_publicInputs", "type": "bytes32[]"},
			{"internalType": "bytes", "name": "_encryptedInputs", "type": "bytes"},
			{"internalType": "address", "name": "_relayer", "type": "address"}
		],
		"name": "withdraw",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	}
]`