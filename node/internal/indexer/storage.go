package indexer

import (
	"sync"

	"node/internal/common"
)

// Storage handles data persistence for the indexer
type Storage struct {
	mu             sync.RWMutex
	commitments    map[string]*common.Commitment
	encryptedNotes map[string][]*common.EncryptedNote // keyed by commitment hash
	transactions   map[string]*common.Transaction
	merkleTree     *common.MerkleTree
}

// NewStorage creates a new storage instance
func NewStorage() *Storage {
	return &Storage{
		commitments:    make(map[string]*common.Commitment),
		encryptedNotes: make(map[string][]*common.EncryptedNote),
		transactions:   make(map[string]*common.Transaction),
		merkleTree:     common.NewMerkleTree(),
	}
}

// AddCommitment adds a commitment to storage and Merkle tree
func (s *Storage) AddCommitment(commitment *common.Commitment) {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.commitments[commitment.Hash] = commitment
	s.merkleTree.AddLeaf(commitment.Hash)
}

// GetCommitment retrieves a commitment by hash
func (s *Storage) GetCommitment(hash string) (*common.Commitment, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	commitment, exists := s.commitments[hash]
	return commitment, exists
}

// GetMerkleProof generates a Merkle proof for a commitment
func (s *Storage) GetMerkleProof(commitmentHash string) (*common.MerkleProof, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	commitment, exists := s.commitments[commitmentHash]
	if !exists {
		return nil, ErrCommitmentNotFound
	}

	proof, err := s.merkleTree.GetProof(int(commitment.Index))
	if err != nil {
		return nil, err
	}

	return &common.MerkleProof{
		Root:  s.merkleTree.GetRoot(),
		Proof: proof,
		Index: commitment.Index,
	}, nil
}

// AddEncryptedNote adds an encrypted note
func (s *Storage) AddEncryptedNote(note *common.EncryptedNote) {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.encryptedNotes[note.CommitmentHash] = append(s.encryptedNotes[note.CommitmentHash], note)
}

// GetEncryptedNotes retrieves encrypted notes for a commitment
func (s *Storage) GetEncryptedNotes(commitmentHash string) []*common.EncryptedNote {
	s.mu.RLock()
	defer s.mu.RUnlock()

	return s.encryptedNotes[commitmentHash]
}

// CanViewNote checks if a user can view an encrypted note
func (s *Storage) CanViewNote(commitmentHash, userAddress string) bool {
	s.mu.RLock()
	defer s.mu.RUnlock()

	notes := s.encryptedNotes[commitmentHash]
	for _, note := range notes {
		if note.Recipient == userAddress {
			return true
		}
	}
	return false
}

// AddTransaction adds a transaction
func (s *Storage) AddTransaction(tx *common.Transaction) {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.transactions[tx.Hash] = tx
}

// GetTransaction retrieves a transaction by hash
func (s *Storage) GetTransaction(hash string) (*common.Transaction, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	tx, exists := s.transactions[hash]
	return tx, exists
}

// GetMerkleRoot returns the current Merkle root
func (s *Storage) GetMerkleRoot() string {
	s.mu.RLock()
	defer s.mu.RUnlock()

	return s.merkleTree.GetRoot()
}