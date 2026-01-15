package api

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"node/internal/common"
)

// Storage interface for data operations
type Storage interface {
	GetMerkleProof(commitmentHash string) (*common.MerkleProof, error)
	CanViewNote(commitmentHash, userAddress string) bool
	GetEncryptedNotes(commitmentHash string) []*common.EncryptedNote
	GetTransaction(hash string) (*common.Transaction, bool)
	GetMerkleRoot() string
}

// API provides HTTP endpoints for the indexer
type API struct {
	storage Storage
}

// NewAPI creates a new API instance
func NewAPI(storage Storage) *API {
	return &API{storage: storage}
}

// SetupRoutes sets up the API routes
func (a *API) SetupRoutes(router *gin.Engine) {
	v1 := router.Group("/api/v1")
	{
		v1.GET("/proof/:commitment", a.getProof)
		v1.GET("/note/:commitment/can-view", a.canViewNote)
		v1.GET("/transaction/:hash", a.getTransaction)
		v1.GET("/merkle-root", a.getMerkleRoot)
	}
}

// getProof returns the Merkle proof for a commitment
func (a *API) getProof(c *gin.Context) {
	commitmentHash := c.Param("commitment")

	proof, err := a.storage.GetMerkleProof(commitmentHash)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, proof)
}

// canViewNote checks if a user can view an encrypted note
func (a *API) canViewNote(c *gin.Context) {
	commitmentHash := c.Param("commitment")
	userAddress := c.Query("address")

	if userAddress == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "address parameter required"})
		return
	}

	canView := a.storage.CanViewNote(commitmentHash, userAddress)
	notes := a.storage.GetEncryptedNotes(commitmentHash)

	response := gin.H{
		"can_view": canView,
	}

	if canView && len(notes) > 0 {
		response["notes"] = notes
	}

	c.JSON(http.StatusOK, response)
}

// getTransaction returns transaction details
func (a *API) getTransaction(c *gin.Context) {
	txHash := c.Param("hash")
	viewingKey := c.Query("viewing_key")

	tx, exists := a.storage.GetTransaction(txHash)
	if !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "transaction not found"})
		return
	}

	// TODO: Verify the viewing key before returning transaction details
	_ = viewingKey

	// In a real implementation, you'd verify the viewing key
	// For now, just return the transaction
	c.JSON(http.StatusOK, tx)
}

// getMerkleRoot returns the current Merkle root
func (a *API) getMerkleRoot(c *gin.Context) {
	root := a.storage.GetMerkleRoot()
	c.JSON(http.StatusOK, gin.H{"root": root})
}