# Relayer structure

The relayer serves the following purpose:
1. On start, build (continue from cache) the commitment merkle tree.
2. Actively listen to the emitted events from chain for latest commitments and update leaves & tree.
3. Provide api for merkle leaf membership proof. 
4. 