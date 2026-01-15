# Load .env file
include .env
export $(shell sed 's/=.*//' .env)

deploy-mantle-testnet:
	@forge script script/Payv.s.sol:PayvScript \
		--rpc-url $(MANTLE_RPC_URL) \
		--private-key $(private_key) \
		--etherscan-api-key $(ETHERSCAN_v2_API_KEY) \
		--verify \
		--broadcast