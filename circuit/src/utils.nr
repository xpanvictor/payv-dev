use poseidon::poseidon2;

pub fn verify_merkle<let DEPTH: u32>(
    leaf: Field,
    root: Field,
    path: [Field; DEPTH],
    index: [bool; DEPTH],
) -> bool {
    let mut hash = leaf;
    for i in 0..DEPTH {
        let input = if index[i] {
            [path[i], hash]
        } else {
            [hash, path[i]]
        };
        hash = poseidon2::Poseidon2::hash(input, input.len());
    }
    hash == root
}

// --- tests ---

pub struct TestDepth3Tree {
    root: Field,
    nodes: [Field; 2],
    leaves: [Field; 4],
}

pub fn generate_test_tree() -> TestDepth3Tree {
    // Build a simple depth-3 Merkle tree
    // Leaf we want to prove: leaf0
    let leaf0: Field = 100;
    let leaf1: Field = 200;
    let leaf2: Field = 300;
    let leaf3: Field = 400;

    // Level 1: hash pairs of leaves
    let node_01 = poseidon2::Poseidon2::hash([leaf0, leaf1], 2);
    let node_23 = poseidon2::Poseidon2::hash([leaf2, leaf3], 2);

    // Level 2 (root): hash the two level-1 nodes
    let root = poseidon2::Poseidon2::hash([node_01, node_23], 2);

    TestDepth3Tree { root, nodes: [node_01, node_23], leaves: [leaf0, leaf1, leaf2, leaf3] }
}

#[test]
fn test_merkle_proof_valid() {
    let TestDepth3Tree { leaves, root, nodes } = generate_test_tree();

    // Proof for leaf0: path = [leaf1, node_23], index = [false, false]
    // index[i] = false means our hash is on the left
    let path: [Field; 2] = [leaves[1], nodes[1]];
    let index: [bool; 2] = [false, false];

    assert(verify_merkle(leaves[0], root, path, index));
}

#[test]
fn test_merkle_proof_right_side() {
    let TestDepth3Tree { leaves, root, nodes } = generate_test_tree();

    // Proof for leaf3: path = [leaf2, node_01], index = [true, true]
    // index[i] = true means our hash is on the right
    let path: [Field; 2] = [leaves[2], nodes[0]];
    let index: [bool; 2] = [true, true];

    assert(verify_merkle(leaves[3], root, path, index));
}

#[test]
fn test_merkle_proof_invalid_leaf() {
    let TestDepth3Tree { leaves, root, nodes } = generate_test_tree();

    // Try to prove a wrong leaf with leaf0's proof
    let wrong_leaf: Field = 999;
    let path: [Field; 2] = [leaves[1], nodes[1]];
    let index: [bool; 2] = [false, false];

    assert(!verify_merkle(wrong_leaf, root, path, index));
}

#[test]
fn test_merkle_proof_invalid_path() {
    let TestDepth3Tree { leaves, root, nodes } = generate_test_tree();

    // Wrong sibling in path
    let wrong_path: [Field; 2] = [leaves[2], nodes[1]]; // leaf2 instead of leaf1
    let index: [bool; 2] = [false, false];

    assert(!verify_merkle(leaves[0], root, wrong_path, index));
}
