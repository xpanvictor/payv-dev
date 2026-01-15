package relayer

import (
	"container/heap"
	"sync"
	"time"

	"github.com/google/uuid"
)

// PriorityQueue implements a priority queue for transactions
type PriorityQueue struct {
	items []*Transaction
	mu    sync.RWMutex
}

// NewPriorityQueue creates a new priority queue
func NewPriorityQueue() *PriorityQueue {
	pq := &PriorityQueue{
		items: make([]*Transaction, 0),
	}
	heap.Init(pq)
	return pq
}

// Len returns the length of the queue
func (pq *PriorityQueue) Len() int {
	pq.mu.RLock()
	defer pq.mu.RUnlock()
	return len(pq.items)
}

// Less compares two transactions for priority (earlier creation time has higher priority)
func (pq *PriorityQueue) Less(i, j int) bool {
	return pq.items[i].CreatedAt.Before(pq.items[j].CreatedAt)
}

// Swap swaps two transactions
func (pq *PriorityQueue) Swap(i, j int) {
	pq.items[i], pq.items[j] = pq.items[j], pq.items[i]
}

// Push adds a transaction to the queue
func (pq *PriorityQueue) Push(x interface{}) {
	pq.mu.Lock()
	defer pq.mu.Unlock()
	pq.items = append(pq.items, x.(*Transaction))
}

// Pop removes and returns the highest priority transaction
func (pq *PriorityQueue) Pop() interface{} {
	pq.mu.Lock()
	defer pq.mu.Unlock()
	old := pq.items
	n := len(old)
	item := old[n-1]
	pq.items = old[0 : n-1]
	return item
}

// Peek returns the highest priority transaction without removing it
func (pq *PriorityQueue) Peek() *Transaction {
	pq.mu.RLock()
	defer pq.mu.RUnlock()
	if len(pq.items) == 0 {
		return nil
	}
	return pq.items[0]
}

// TransactionQueue manages the transaction queue
type TransactionQueue struct {
	queue     *PriorityQueue
	maxSize   int
	processed map[string]*Transaction
	mu        sync.RWMutex
}

// NewTransactionQueue creates a new transaction queue
func NewTransactionQueue(maxSize int) *TransactionQueue {
	return &TransactionQueue{
		queue:     NewPriorityQueue(),
		maxSize:   maxSize,
		processed: make(map[string]*Transaction),
	}
}

// AddTransaction adds a transaction to the queue
func (tq *TransactionQueue) AddTransaction(txType TransactionType, request interface{}, userAddress string) (*Transaction, error) {
	tq.mu.Lock()
	defer tq.mu.Unlock()

	if tq.queue.Len() >= tq.maxSize {
		return nil, ErrQueueFull
	}

	tx := &Transaction{
		ID:          uuid.New().String(),
		Type:        txType,
		Status:      StatusPending,
		Request:     request,
		CreatedAt:   time.Now(),
		UserAddress: userAddress,
	}

	heap.Push(tq.queue, tx)
	return tx, nil
}

// GetNextTransaction gets the next transaction to process
func (tq *TransactionQueue) GetNextTransaction() *Transaction {
	tq.mu.Lock()
	defer tq.mu.Unlock()

	if tq.queue.Len() == 0 {
		return nil
	}

	tx := heap.Pop(tq.queue).(*Transaction)
	tq.processed[tx.ID] = tx
	return tx
}

// UpdateTransactionStatus updates the status of a transaction
func (tq *TransactionQueue) UpdateTransactionStatus(txID string, status TransactionStatus, txHash string, blockNumber uint64, gasUsed uint64, err error) {
	tq.mu.Lock()
	defer tq.mu.Unlock()

	tx, exists := tq.processed[txID]
	if !exists {
		return
	}

	tx.Status = status
	now := time.Now()

	switch status {
	case StatusSubmitted:
		tx.SubmittedAt = &now
		tx.TxHash = txHash
	case StatusConfirmed:
		tx.ConfirmedAt = &now
		tx.BlockNumber = blockNumber
		tx.GasUsed = gasUsed
	case StatusFailed:
		if err != nil {
			tx.Error = err.Error()
		}
	}
}

// GetTransaction gets a transaction by ID
func (tq *TransactionQueue) GetTransaction(txID string) (*Transaction, bool) {
	tq.mu.RLock()
	defer tq.mu.RUnlock()

	tx, exists := tq.processed[txID]
	return tx, exists
}

// GetPendingCount returns the number of pending transactions
func (tq *TransactionQueue) GetPendingCount() int {
	tq.mu.RLock()
	defer tq.mu.RUnlock()
	return tq.queue.Len()
}

// GetProcessedTransactions returns all processed transactions
func (tq *TransactionQueue) GetProcessedTransactions() []*Transaction {
	tq.mu.RLock()
	defer tq.mu.RUnlock()

	txs := make([]*Transaction, 0, len(tq.processed))
	for _, tx := range tq.processed {
		txs = append(txs, tx)
	}
	return txs
}