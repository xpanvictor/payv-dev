package common

import (
	"crypto/sha256"
	"fmt"
)

// MerkleTree represents a Merkle tree
type MerkleTree struct {
	Leaves []string
	Levels [][]string
}

// NewMerkleTree creates a new Merkle tree
func NewMerkleTree() *MerkleTree {
	return &MerkleTree{
		Leaves: []string{},
		Levels: [][]string{},
	}
}

// AddLeaf adds a leaf to the tree and rebuilds the tree
func (mt *MerkleTree) AddLeaf(leaf string) {
	mt.Leaves = append(mt.Leaves, leaf)
	mt.buildTree()
}

// GetRoot returns the root of the tree
func (mt *MerkleTree) GetRoot() string {
	if len(mt.Levels) == 0 {
		return ""
	}
	return mt.Levels[len(mt.Levels)-1][0]
}

// GetProof generates a proof for the leaf at the given index
func (mt *MerkleTree) GetProof(index int) ([]string, error) {
	if index < 0 || index >= len(mt.Leaves) {
		return nil, fmt.Errorf("index out of range")
	}

	proof := []string{}
	currentIndex := index

	for level := 0; level < len(mt.Levels)-1; level++ {
		levelNodes := mt.Levels[level]
		isLeft := currentIndex%2 == 0
		siblingIndex := currentIndex - 1
		if isLeft {
			siblingIndex = currentIndex + 1
		}

		if siblingIndex < len(levelNodes) {
			proof = append(proof, levelNodes[siblingIndex])
		}

		currentIndex /= 2
	}

	return proof, nil
}

// VerifyProof verifies a proof for a leaf
func (mt *MerkleTree) VerifyProof(leaf string, proof []string, index int, root string) bool {
	hash := leaf
	currentIndex := index

	for _, sibling := range proof {
		if currentIndex%2 == 0 {
			hash = hashPair(hash, sibling)
		} else {
			hash = hashPair(sibling, hash)
		}
		currentIndex /= 2
	}

	return hash == root
}

func (mt *MerkleTree) buildTree() {
	if len(mt.Leaves) == 0 {
		mt.Levels = [][]string{}
		return
	}

	mt.Levels = [][]string{mt.Leaves}

	for len(mt.Levels[len(mt.Levels)-1]) > 1 {
		currentLevel := mt.Levels[len(mt.Levels)-1]
		nextLevel := []string{}

		for i := 0; i < len(currentLevel); i += 2 {
			if i+1 < len(currentLevel) {
				nextLevel = append(nextLevel, hashPair(currentLevel[i], currentLevel[i+1]))
			} else {
				nextLevel = append(nextLevel, currentLevel[i])
			}
		}

		mt.Levels = append(mt.Levels, nextLevel)
	}
}

func hashPair(left, right string) string {
	h := sha256.New()
	h.Write([]byte(left + right))
	return fmt.Sprintf("%x", h.Sum(nil))
}