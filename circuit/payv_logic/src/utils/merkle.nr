use poseidon::poseidon2;

/// Merkle proof containing path and indices for verification
pub struct MerkleProof<let DEPTH: u32> {
    pub path: [Field; DEPTH],
    pub indices: [bool; DEPTH],
}

/// Merkle tree with configurable depth
/// N = number of leaves (must be power of 2)
/// DEPTH = tree depth (log2(N))
pub struct MerkleTree<let N: u32, let DEPTH: u32> {
    pub leaves: [Field; N],
    pub root: Field,
    // Store all nodes level by level (excluding leaves and root)
    // Total intermediate nodes = N - 1 - (root) = N - 2... but we store N-1 to include all levels
    nodes: [Field; N],
}

impl<let N: u32, let DEPTH: u32> MerkleTree<N, DEPTH> {
    /// Create a new Merkle tree from leaves
    /// Builds the tree bottom-up using Poseidon2 hashing
    pub fn new(leaves: [Field; N]) -> Self {
        let mut nodes: [Field; N] = [0; N];
        let mut current_level: [Field; N] = leaves;
        let mut level_size = N;
        let mut node_offset: u32 = 0;

        // Build tree bottom-up, storing intermediate nodes
        for _level in 0..DEPTH {
            let pairs = level_size / 2;
            for i in 0..N / 2 {
                if i < pairs {
                    let left = current_level[2 * i];
                    let right = current_level[2 * i + 1];
                    let parent = poseidon2::Poseidon2::hash([left, right], 2);
                    nodes[node_offset + i] = parent;
                    current_level[i] = parent;
                }
            }
            node_offset += pairs;
            level_size = pairs;
        }

        let root = current_level[0];
        MerkleTree { leaves, root, nodes }
    }

    /// Generate a Merkle proof for a leaf at the given index
    /// Returns the sibling path and position indices
    pub fn generate_proof(self, leaf_index: u32) -> MerkleProof<DEPTH> {
        let mut path: [Field; DEPTH] = [0; DEPTH];
        let mut indices: [bool; DEPTH] = [false; DEPTH];
        let mut current_index = leaf_index;
        let mut level_size = N;
        let mut node_offset: u32 = 0;

        for level in 0..DEPTH {
            // Determine if we're on the left (even) or right (odd)
            let is_right = (current_index % 2) == 1;
            indices[level] = is_right;

            // Get sibling index
            let sibling_index = if is_right {
                current_index - 1
            } else {
                current_index + 1
            };

            // Get sibling value from appropriate level
            if level == 0 {
                // First level: siblings are in leaves
                path[level] = self.leaves[sibling_index];
            } else {
                // Higher levels: siblings are in nodes
                // Calculate offset into nodes array for this level
                let prev_offset = node_offset - (level_size);
                path[level] = self.nodes[prev_offset + sibling_index];
            }

            // Move to parent index for next level
            current_index = current_index / 2;
            if level > 0 {
                node_offset += level_size / 2;
            } else {
                node_offset = N / 2;
            }
            level_size = level_size / 2;
        }

        MerkleProof { path, indices }
    }

    /// Get the root of the tree
    pub fn get_root(self) -> Field {
        self.root
    }
}

/// Verify a Merkle proof
/// Returns true if the leaf is in the tree with the given root
pub fn verify_merkle<let DEPTH: u32>(
    leaf: Field,
    root: Field,
    path: [Field; DEPTH],
    indices: [bool; DEPTH],
) -> bool {
    let mut hash = leaf;
    for i in 0..DEPTH {
        let input = if indices[i] {
            [path[i], hash]
        } else {
            [hash, path[i]]
        };
        hash = poseidon2::Poseidon2::hash(input, input.len());
    }
    hash == root
}

/// Verify a Merkle proof using the MerkleProof struct
pub fn verify_proof<let DEPTH: u32>(leaf: Field, root: Field, proof: MerkleProof<DEPTH>) -> bool {
    verify_merkle(leaf, root, proof.path, proof.indices)
}

/// Pad a smaller tree's proof to a larger depth
/// Useful when you have a small tree but need a fixed-depth proof
pub fn pad_proof_to_depth<let SMALL_DEPTH: u32, let FULL_DEPTH: u32>(
    small_root: Field,
    small_proof: MerkleProof<SMALL_DEPTH>,
) -> (Field, MerkleProof<FULL_DEPTH>) {
    let mut full_path: [Field; FULL_DEPTH] = [0; FULL_DEPTH];
    let mut full_indices: [bool; FULL_DEPTH] = [false; FULL_DEPTH];

    // Copy small proof
    for i in 0..SMALL_DEPTH {
        full_path[i] = small_proof.path[i];
        full_indices[i] = small_proof.indices[i];
    }

    // Extend root by hashing with zeros
    let mut extended_root = small_root;
    for _i in SMALL_DEPTH..FULL_DEPTH {
        extended_root = poseidon2::Poseidon2::hash([extended_root, 0], 2);
    }

    (extended_root, MerkleProof { path: full_path, indices: full_indices })
}

// ============ Tests ============

#[test]
fn test_merkle_tree_build() {
    let leaves: [Field; 4] = [100, 200, 300, 400];
    let tree: MerkleTree<4, 2> = MerkleTree::new(leaves);

    // Manually compute expected root
    let node_01 = poseidon2::Poseidon2::hash([100, 200], 2);
    let node_23 = poseidon2::Poseidon2::hash([300, 400], 2);
    let expected_root = poseidon2::Poseidon2::hash([node_01, node_23], 2);

    assert(tree.root == expected_root);
}

#[test]
fn test_merkle_proof_leaf0() {
    let leaves: [Field; 4] = [100, 200, 300, 400];
    let tree: MerkleTree<4, 2> = MerkleTree::new(leaves);
    let proof = tree.generate_proof(0);

    assert(verify_proof(leaves[0], tree.root, proof));
}

#[test]
fn test_merkle_proof_leaf3() {
    let leaves: [Field; 4] = [100, 200, 300, 400];
    let tree: MerkleTree<4, 2> = MerkleTree::new(leaves);
    let proof = tree.generate_proof(3);

    assert(verify_proof(leaves[3], tree.root, proof));
}

#[test]
fn test_merkle_proof_all_leaves() {
    let leaves: [Field; 4] = [100, 200, 300, 400];
    let tree: MerkleTree<4, 2> = MerkleTree::new(leaves);

    for i in 0..4 {
        let proof = tree.generate_proof(i);
        assert(verify_proof(leaves[i], tree.root, proof));
    }
}

#[test]
fn test_invalid_leaf_fails() {
    let leaves: [Field; 4] = [100, 200, 300, 400];
    let tree: MerkleTree<4, 2> = MerkleTree::new(leaves);
    let proof = tree.generate_proof(0);

    // Wrong leaf should fail
    assert(!verify_proof(999, tree.root, proof));
}

#[test]
fn test_pad_proof() {
    let leaves: [Field; 4] = [100, 200, 300, 400];
    let tree: MerkleTree<4, 2> = MerkleTree::new(leaves);
    let small_proof = tree.generate_proof(0);

    // Pad to depth 4
    let (padded_root, padded_proof): (Field, MerkleProof<4>) =
        pad_proof_to_depth(tree.root, small_proof);

    // Verify the padded proof works
    assert(verify_proof(leaves[0], padded_root, padded_proof));
}

#[test]
fn test_larger_tree() {
    let leaves: [Field; 8] = [10, 20, 30, 40, 50, 60, 70, 80];
    let tree: MerkleTree<8, 3> = MerkleTree::new(leaves);

    // Verify all leaves
    for i in 0..8 {
        let proof = tree.generate_proof(i);
        assert(verify_proof(leaves[i], tree.root, proof));
    }
}
