package relayer

import (
	"context"
	"errors"
	"fmt"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/ethereum/go-ethereum/core/types"
	"github.com/gin-gonic/gin"
)

var (
	ErrQueueFull = errors.New("transaction queue is full")
)

// Relayer is the main relayer service
type Relayer struct {
	config      *RelayerConfig
	queue       *TransactionQueue
	submitter   *TxSubmitter
	server      *gin.Engine
	httpServer  *http.Server
	workers     int
	stopCh      chan struct{}
	wg          sync.WaitGroup
}

// NewRelayer creates a new relayer instance
func NewRelayer(config *RelayerConfig) (*Relayer, error) {
	submitter, err := NewTxSubmitter(config)
	if err != nil {
		return nil, fmt.Errorf("failed to create transaction submitter: %w", err)
	}

	queue := NewTransactionQueue(config.MaxQueueSize)

	return &Relayer{
		config:    config,
		queue:     queue,
		submitter: submitter,
		server:    gin.Default(),
		stopCh:    make(chan struct{}),
		workers:   5, // Configurable number of worker goroutines
	}, nil
}

// Start starts the relayer service
func (r *Relayer) Start(ctx context.Context) error {
	// Setup API routes
	r.setupRoutes()

	// Start HTTP server
	go r.startHTTPServer()

	// Start worker goroutines
	for i := 0; i < r.workers; i++ {
		r.wg.Add(1)
		go r.worker(ctx, i)
	}

	log.Printf("Relayer started with %d workers", r.workers)

	// Wait for shutdown signal
	<-r.stopCh
	log.Println("Relayer stopping...")

	// Stop workers
	r.wg.Wait()
	log.Println("Relayer stopped")

	return nil
}

// Stop stops the relayer service
func (r *Relayer) Stop() {
	close(r.stopCh)
}

// setupRoutes sets up the API routes
func (r *Relayer) setupRoutes() {
	api := r.server.Group("/api/v1/relayer")
	{
		api.POST("/deposit", r.handleDeposit)
		api.POST("/transfer", r.handleTransfer)
		api.POST("/withdraw", r.handleWithdraw)
		api.GET("/transaction/:id", r.getTransactionStatus)
		api.GET("/queue/status", r.getQueueStatus)
	}
}

// handleDeposit handles deposit transaction requests
func (r *Relayer) handleDeposit(c *gin.Context) {
	var req DepositRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	// Validate request
	if len(req.PublicInputs) != 2 {
		c.JSON(400, gin.H{"error": "deposit requires 2 public inputs"})
		return
	}

	tx, err := r.queue.AddTransaction(TransactionTypeDeposit, &req, req.UserAddress)
	if err != nil {
		c.JSON(429, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, gin.H{
		"transactionId": tx.ID,
		"status":        tx.Status,
		"message":       "deposit transaction queued",
	})
}

// handleTransfer handles transfer transaction requests
func (r *Relayer) handleTransfer(c *gin.Context) {
	var req TransferRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	// Validate request
	if len(req.PublicInputs) != 4 {
		c.JSON(400, gin.H{"error": "transfer requires 4 public inputs"})
		return
	}

	tx, err := r.queue.AddTransaction(TransactionTypeTransfer, &req, req.UserAddress)
	if err != nil {
		c.JSON(429, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, gin.H{
		"transactionId": tx.ID,
		"status":        tx.Status,
		"message":       "transfer transaction queued",
	})
}

// handleWithdraw handles withdraw transaction requests
func (r *Relayer) handleWithdraw(c *gin.Context) {
	var req WithdrawRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	// Validate request
	if len(req.PublicInputs) != 5 {
		c.JSON(400, gin.H{"error": "withdraw requires 5 public inputs"})
		return
	}

	tx, err := r.queue.AddTransaction(TransactionTypeWithdraw, &req, req.UserAddress)
	if err != nil {
		c.JSON(429, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, gin.H{
		"transactionId": tx.ID,
		"status":        tx.Status,
		"message":       "withdraw transaction queued",
	})
}

// getTransactionStatus gets the status of a transaction
func (r *Relayer) getTransactionStatus(c *gin.Context) {
	txID := c.Param("id")

	tx, exists := r.queue.GetTransaction(txID)
	if !exists {
		c.JSON(404, gin.H{"error": "transaction not found"})
		return
	}

	c.JSON(200, tx)
}

// getQueueStatus gets the current queue status
func (r *Relayer) getQueueStatus(c *gin.Context) {
	status := gin.H{
		"pending":    r.queue.GetPendingCount(),
		"processed":  len(r.queue.GetProcessedTransactions()),
		"maxSize":    r.config.MaxQueueSize,
	}

	c.JSON(200, status)
}

// worker processes transactions from the queue
func (r *Relayer) worker(ctx context.Context, workerID int) {
	defer r.wg.Done()

	log.Printf("Worker %d started", workerID)

	for {
		select {
		case <-ctx.Done():
			return
		case <-r.stopCh:
			return
		default:
			tx := r.queue.GetNextTransaction()
			if tx == nil {
				// No transactions to process, wait a bit
				time.Sleep(100 * time.Millisecond)
				continue
			}

			r.processTransaction(ctx, tx)
		}
	}
}

// processTransaction processes a single transaction
func (r *Relayer) processTransaction(ctx context.Context, tx *Transaction) {
	log.Printf("Processing transaction %s of type %s", tx.ID, tx.Type)

	var signedTx *types.Transaction
	var err error

	// Submit transaction based on type
	switch tx.Type {
	case TransactionTypeDeposit:
		req := tx.Request.(*DepositRequest)
		signedTx, err = r.submitter.SubmitDeposit(ctx, req)
	case TransactionTypeTransfer:
		req := tx.Request.(*TransferRequest)
		signedTx, err = r.submitter.SubmitTransfer(ctx, req)
	case TransactionTypeWithdraw:
		req := tx.Request.(*WithdrawRequest)
		signedTx, err = r.submitter.SubmitWithdraw(ctx, req)
	default:
		err = fmt.Errorf("unknown transaction type: %s", tx.Type)
	}

	if err != nil {
		log.Printf("Failed to submit transaction %s: %v", tx.ID, err)
		r.queue.UpdateTransactionStatus(tx.ID, StatusFailed, "", 0, 0, err)
		return
	}

	// Update status to submitted
	r.queue.UpdateTransactionStatus(tx.ID, StatusSubmitted, signedTx.Hash().Hex(), 0, 0, nil)

	// Wait for confirmation
	receipt, err := r.submitter.WaitForConfirmation(ctx, signedTx.Hash(), r.config.ConfirmationBlocks)
	if err != nil {
		log.Printf("Failed to confirm transaction %s: %v", tx.ID, err)
		r.queue.UpdateTransactionStatus(tx.ID, StatusFailed, signedTx.Hash().Hex(), 0, 0, err)
		return
	}

	// Update status to confirmed
	r.queue.UpdateTransactionStatus(tx.ID, StatusConfirmed, signedTx.Hash().Hex(), receipt.BlockNumber.Uint64(), receipt.GasUsed, nil)

	log.Printf("Transaction %s confirmed in block %d", tx.ID, receipt.BlockNumber.Uint64())
}

// startHTTPServer starts the HTTP server
func (r *Relayer) startHTTPServer() {
	r.httpServer = &http.Server{
		Addr:    ":8081", // Different port from indexer
		Handler: r.server,
	}

	log.Println("Starting relayer HTTP server on :8081")
	if err := r.httpServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Printf("HTTP server error: %v", err)
	}
}