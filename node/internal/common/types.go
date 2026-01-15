package common

import (
	"math/big"
)

// Commitment represents a note commitment
type Commitment struct {
	Hash     string `json:"hash"`
	Index    uint64 `json:"index"`
	BlockNum uint64 `json:"block_num"`
	TxHash   string `json:"tx_hash"`
}

// EncryptedNote represents an encrypted note for a recipient
type EncryptedNote struct {
	CommitmentHash string `json:"commitment_hash"`
	Recipient      string `json:"recipient"` // address
	Ciphertext     string `json:"ciphertext"`
	BlockNum       uint64 `json:"block_num"`
	TxHash         string `json:"tx_hash"`
}

// Transaction represents a transaction with viewing key
type Transaction struct {
	Hash         string            `json:"hash"`
	Type         string            `json:"type"` // deposit, transfer, withdraw
	BlockNum     uint64            `json:"block_num"`
	Inputs       []string          `json:"inputs"`  // commitment hashes
	Outputs      []string          `json:"outputs"` // commitment hashes
	EncryptedNotes []EncryptedNote `json:"encrypted_notes"`
	ViewingKey   string            `json:"viewing_key,omitempty"`
}

// MerkleProof represents a proof for a commitment
type MerkleProof struct {
	Root  string   `json:"root"`
	Proof []string `json:"proof"`
	Index uint64   `json:"index"`
}

// BigInt is a wrapper for math/big.Int for JSON marshaling
type BigInt struct {
	*big.Int
}

func (b BigInt) MarshalJSON() ([]byte, error) {
	return []byte(`"` + b.String() + `"`), nil
}

func (b *BigInt) UnmarshalJSON(data []byte) error {
	if string(data) == "null" {
		return nil
	}
	s := string(data)
	if len(s) >= 2 && s[0] == '"' && s[len(s)-1] == '"' {
		s = s[1 : len(s)-1]
	}
	b.Int = new(big.Int)
	b.Int.SetString(s, 10)
	return nil
}