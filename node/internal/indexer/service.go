package indexer

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"

	"node/internal/indexer/api"
)

// Config holds indexer configuration
type Config struct {
	RPCURL       string
	ContractAddr string
	Port         string
}

// Indexer is the main indexer service
type Indexer struct {
	config   *Config
	storage  *Storage
	listener *Listener
	api      *api.API
	server   *http.Server
}

// NewIndexer creates a new indexer instance
func NewIndexer(config *Config) (*Indexer, error) {
	storage := NewStorage()

	listener, err := NewListener(config.RPCURL, config.ContractAddr, storage)
	if err != nil {
		return nil, err
	}

	api := api.NewAPI(storage)

	return &Indexer{
		config:   config,
		storage:  storage,
		listener: listener,
		api:      api,
	}, nil
}

// Start starts the indexer service
func (i *Indexer) Start(ctx context.Context) error {
	// Start listener in background
	go func() {
		log.Println("Starting blockchain listener...")
		if err := i.listener.Start(ctx); err != nil {
			log.Printf("Listener error: %v", err)
		}
	}()

	// Setup HTTP server
	router := gin.Default()
	i.api.SetupRoutes(router)

	i.server = &http.Server{
		Addr:    ":" + i.config.Port,
		Handler: router,
	}

	// Start HTTP server in background
	go func() {
		log.Printf("Starting HTTP server on port %s", i.config.Port)
		if err := i.server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Printf("Server error: %v", err)
		}
	}()

	// Wait for interrupt signal to gracefully shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("Shutting down indexer...")

	// Give outstanding requests 5 seconds to complete
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := i.server.Shutdown(shutdownCtx); err != nil {
		log.Printf("Server forced to shutdown: %v", err)
	}

	return nil
}