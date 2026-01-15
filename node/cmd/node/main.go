package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"sync"
	"syscall"

	"node/internal/config"
	"node/internal/indexer"
	"node/internal/relayer"
)

func main() {
	cfg := config.Load()

	// Create indexer
	idx, err := indexer.NewIndexer(&indexer.Config{
		RPCURL:       cfg.RPCURL,
		ContractAddr: cfg.ContractAddr,
		Port:         cfg.Port,
	})
	if err != nil {
		log.Fatalf("Failed to create indexer: %v", err)
	}

	// Create relayer
	relayerConfig := &relayer.RelayerConfig{
		RPCURL:            cfg.RPCURL,
		ContractAddr:      cfg.ContractAddr,
		PrivateKey:        os.Getenv("RELAYER_PRIVATE_KEY"),
		MaxQueueSize:      1000,
		MinGasPrice:       nil, // Will use network suggested
		MaxGasPrice:       nil, // Will use network suggested
		GasMultiplier:     1.1, // 10% above suggested
		ConfirmationBlocks: 1,  // Wait for 1 confirmation
	}

	rel, err := relayer.NewRelayer(relayerConfig)
	if err != nil {
		log.Fatalf("Failed to create relayer: %v", err)
	}

	log.Println("Starting PayV Node (Indexer + Relayer)...")

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	var wg sync.WaitGroup

	// Start indexer
	wg.Add(1)
	go func() {
		defer wg.Done()
		if err := idx.Start(ctx); err != nil {
			log.Printf("Indexer error: %v", err)
		}
	}()

	// Start relayer
	wg.Add(1)
	go func() {
		defer wg.Done()
		if err := rel.Start(ctx); err != nil {
			log.Printf("Relayer error: %v", err)
		}
	}()

	// Wait for shutdown signal
	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)
	<-sigCh

	log.Println("Shutting down services...")
	cancel()

	// Stop relayer explicitly
	rel.Stop()

	wg.Wait()
	log.Println("All services stopped")
}
