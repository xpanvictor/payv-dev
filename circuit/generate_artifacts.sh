#!/usr/bin/env bash
set -euo pipefail

# Define the path to your nargo and bb executables
# Ensure these are in your PATH or provide their full paths
NARGO_PATH=${NARGO_PATH:-nargo}
BB_PATH=${BB_PATH:-bb}

# Define your circuit directories
CIRCUITS=("deposit" "transfer" "withdraw")

# Define your library crate directory (payv_logic)
LIB_CRATE_DIR="payv_logic"

# Define the output directory for all artifacts
ARTIFACTS_DIR="artifacts"

# Create the main artifacts directory if it doesn't exist
mkdir -p "$ARTIFACTS_DIR/compiled_circuits"
mkdir -p "$ARTIFACTS_DIR/verification_keys"
mkdir -p "$ARTIFACTS_DIR/solidity_verifiers"

echo "--- Compiling and generating artifacts for each circuit ---"

for CIRCUIT_NAME in "${CIRCUITS[@]}"; do
    echo "Processing circuit: $CIRCUIT_NAME"
    CIRCUIT_DIR="./$CIRCUIT_NAME"
    TARGET_DIR="$CIRCUIT_DIR/target"
    KEYS_DIR="$ARTIFACTS_DIR/temp_keys" # Temporary directory for VK generation

    # Ensure the circuit's target directory exists
    mkdir -p "$TARGET_DIR"

    # 1. Compile the Noir circuit
    echo "  -> Compiling $CIRCUIT_NAME..."
    # The --program-dir needs to point to the circuit directory relative to where the script is run.
    # We also specify --pedantic-solving as a good practice.
    $NARGO_PATH --program-dir "$CIRCUIT_DIR" compile --pedantic-solving

    # Check if compilation was successful and the JSON artifact exists
    COMPILED_CIRCUIT_PATH="$TARGET_DIR/$CIRCUIT_NAME.json"
    if [ ! -f "$COMPILED_CIRCUIT_PATH" ]; then
        echo "Error: Compiled circuit not found at $COMPILED_CIRCUIT_PATH. Aborting."
        exit 1
    fi
    echo "  -> Compiled circuit saved to $COMPILED_CIRCUIT_PATH"

    # Copy the compiled circuit to the artifacts folder
    cp "$COMPILED_CIRCUIT_PATH" "$ARTIFACTS_DIR/compiled_circuits/"
    echo "  -> Copied compiled circuit to $ARTIFACTS_DIR/compiled_circuits/"

    # 2. Generate Verification Key (VK)
    echo "  -> Generating verification key for $CIRCUIT_NAME..."
    mkdir -p "$KEYS_DIR" # Create temporary directory for VK
    # Use the compiled circuit JSON to generate the VK
    $BB_PATH write_vk -b "$COMPILED_CIRCUIT_PATH" -o "$KEYS_DIR" --oracle_hash keccak
    echo "  -> Verification key generated."

    # Copy the VK to the artifacts folder
    cp "$KEYS_DIR/vk" "$ARTIFACTS_DIR/verification_keys/${CIRCUIT_NAME}_vk"
    echo "  -> Copied VK to $ARTIFACTS_DIR/verification_keys/"

    # 3. Generate Solidity Verifier Contract
    echo "  -> Generating Solidity verifier for $CIRCUIT_NAME..."
    SOL_VERIFIER_OUTPUT="$ARTIFACTS_DIR/solidity_verifiers/${CIRCUIT_NAME}Verifier.sol"
    # Use the generated VK to write the Solidity verifier
    $BB_PATH write_solidity_verifier -k "$KEYS_DIR/vk" -o "$SOL_VERIFIER_OUTPUT"
    echo "  -> Solidity verifier saved to $SOL_VERIFIER_OUTPUT"

    # Clean up temporary keys directory
    rm -rf "$KEYS_DIR"

    echo "--- Finished processing $CIRCUIT_NAME ---"
    echo ""
done

echo "All circuits processed successfully. Artifacts are in the '$ARTIFACTS_DIR' directory."
echo "  - Compiled circuits: $ARTIFACTS_DIR/compiled_circuits/"
echo "  - Verification Keys: $ARTIFACTS_DIR/verification_keys/"
echo "  - Solidity Verifiers: $ARTIFACTS_DIR/solidity_verifiers/"

