package config

import (
	"os"
)

// Config holds application configuration
type Config struct {
	RPCURL       string
	ContractAddr string
	Port         string
}

// Load loads configuration from environment variables
func Load() *Config {
	return &Config{
		RPCURL:       getEnv("RPC_URL", "https://rpc.mantle.xyz"),
		ContractAddr: getEnv("CONTRACT_ADDR", ""),
		Port:         getEnv("PORT", "8080"),
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}