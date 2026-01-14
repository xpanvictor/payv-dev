// SPDX-License-Identifier: MIT
pragma solidity >=0.8.21;

// Adapted from:
// https://github.com/Cyfrin/zk-mixer-cu/blob/main/contracts/src/IncrementalMerkleTree.sol

import {Field} from "@poseidon/src/Field.sol";
import {Poseidon2} from "@poseidon/src/Poseidon2.sol";

contract IncrementalMerkleTree {
    uint256 public constant FIELD_SIZE = 21888242871839275222246405745257275088548364400416034343698204186575808495617;

    // Default zero value for empty nodes:
    // keccak256("payv") % FIELD_SIZE
    bytes32 public constant ZERO_ELEMENT = bytes32(0x0ff9bd67013e25f349c8f53c878ed7e26cff023873fb2f4eedd4fe3866bf72fa);

    Poseidon2 public immutable i_hasher;
    uint32 public immutable i_depth;

    // Cached subtrees and root history
    mapping(uint256 => bytes32) public s_cachedSubtrees;
    mapping(uint256 => bytes32) public s_roots;

    uint32 public constant ROOT_HISTORY_SIZE = 30;
    uint32 public s_currentRootIndex = 0;
    uint32 public s_nextLeafIndex = 0;

    /*//////////////////////////////////////////////////////////////
                                ERRORS
    //////////////////////////////////////////////////////////////*/
    error IncrementalMerkleTree__LeftValueOutOfRange(bytes32 left);
    error IncrementalMerkleTree__RightValueOutOfRange(bytes32 right);
    error IncrementalMerkleTree__LevelsShouldBeGreaterThanZero(uint32 depth);
    error IncrementalMerkleTree__LevelsShouldBeLessThan32(uint32 depth);
    error IncrementalMerkleTree__MerkleTreeFull(uint32 nextIndex);
    error IncrementalMerkleTree__IndexOutOfBounds(uint256 index);

    constructor(uint32 _depth, Poseidon2 _hasher) {
        if (_depth == 0) {
            revert IncrementalMerkleTree__LevelsShouldBeGreaterThanZero(_depth);
        }
        if (_depth >= 32) {
            revert IncrementalMerkleTree__LevelsShouldBeLessThan32(_depth);
        }

        i_depth = _depth;
        i_hasher = _hasher;

        s_roots[0] = zeros(_depth);
    }

    /**
     * @dev Hash two nodes using Poseidon
     */
    function hashLeftRight(bytes32 _left, bytes32 _right) public view returns (bytes32) {
        if (uint256(_left) >= FIELD_SIZE) {
            revert IncrementalMerkleTree__LeftValueOutOfRange(_left);
        }
        if (uint256(_right) >= FIELD_SIZE) {
            revert IncrementalMerkleTree__RightValueOutOfRange(_right);
        }

        return Field.toBytes32(i_hasher.hash_2(Field.toField(_left), Field.toField(_right)));
    }

    function _insert(bytes32 _leaf) internal returns (uint32 index) {
        uint32 nextLeafIndex = s_nextLeafIndex;

        if (nextLeafIndex == uint32(2) ** i_depth) {
            revert IncrementalMerkleTree__MerkleTreeFull(nextLeafIndex);
        }

        uint32 currentIndex = nextLeafIndex;
        bytes32 currentHash = _leaf;
        bytes32 left;
        bytes32 right;

        for (uint32 i = 0; i < i_depth; i++) {
            if (currentIndex % 2 == 0) {
                left = currentHash;
                right = zeros(i);
                s_cachedSubtrees[i] = currentHash;
            } else {
                left = s_cachedSubtrees[i];
                right = currentHash;
            }

            currentHash = hashLeftRight(left, right);
            currentIndex /= 2;
        }

        uint32 newRootIndex = (s_currentRootIndex + 1) % ROOT_HISTORY_SIZE;

        s_currentRootIndex = newRootIndex;
        s_roots[newRootIndex] = currentHash;
        s_nextLeafIndex = nextLeafIndex + 1;

        return nextLeafIndex;
    }

    /**
     * @dev Check whether a root exists in the history
     */
    function isKnownRoot(bytes32 _root) public view returns (bool) {
        if (_root == bytes32(0)) {
            return false;
        }

        uint32 currentRootIndex = s_currentRootIndex;
        uint32 i = currentRootIndex;

        do {
            if (_root == s_roots[i]) {
                return true;
            }

            if (i == 0) {
                i = ROOT_HISTORY_SIZE;
            }
            i--;
        } while (i != currentRootIndex);

        return false;
    }

    /**
     * @dev Returns the latest Merkle root
     */
    function getLatestRoot() public view returns (bytes32) {
        return s_roots[s_currentRootIndex];
    }

    /// LibPoseidon2.hash_2(x, y) where  start keccak256("payv") % FIELD_SIZE
    /// @notice Returns the root of a subtree at the given depth
    /// @param i The depth of the subtree root to return
    /// @return The root of the given subtree
    function zeros(uint256 i) public pure returns (bytes32) {
        if (i == 0) return bytes32(0x0ff9bd67013e25f349c8f53c878ed7e26cff023873fb2f4eedd4fe3866bf72fa);
        else if (i == 1) return bytes32(0x164a8abda847053599a29d3288d73c2c2d49cc49929b8d4b710f27e64f47fdd4);
        else if (i == 2) return bytes32(0x285c77982a133840c84a27f472ec359833d40cda25ff42daa6d2a7410464a7bd);
        else if (i == 3) return bytes32(0x2962c4ea1766071b5dfc12075c63e2d8c35f09dfc65c7bedd5786d720803e14b);
        else if (i == 4) return bytes32(0x13b0b2d9edad014714120a79f5117f0d9804d6798a35f22455fe9f8bffadcdb0);
        else if (i == 5) return bytes32(0x1a1c0c81fb25ccac839003c8ac4672cc290fe8287254acbbf48de5cb4d0676b8);
        else if (i == 6) return bytes32(0x2540094286d77daba6723e89fff6a7352ed0057cd26cc3ffede7ef9f006bb5f6);
        else if (i == 7) return bytes32(0x1e424d8ff0ef924bef14d5fbdc3fd34c0b351fdfb1bfeed733abdee4dd98c977);
        else if (i == 8) return bytes32(0x087a90bf9db7a93d0a751ca4f9fb20ff5c7db9341ac3b2d869fc2b389506853e);
        else if (i == 9) return bytes32(0x059452d1601651a328a7e43cd2b5ae73e15995c2bfcdaccaa7386dc8ef065233);
        else if (i == 10) return bytes32(0x223b52c70a0ddb060bee8fa85b4fe00d1a8489d78d4e4d2f1915b1384607fd54);
        else if (i == 11) return bytes32(0x138455e1cc09cacf31f9a54563d352d8d324c4b1d4beed840d2aa687e5c4ab52);
        else if (i == 12) return bytes32(0x146d8e028b8305f721b2a880bfe966269a04f0569fb5a601307fb371a0861c29);
        else if (i == 13) return bytes32(0x2bd7b37849f6bfd34612ababe9c3bc3b79510165c971096b703aa89a06641b4b);
        else if (i == 14) return bytes32(0x2fa403002ff5d13591ad2d0967cce577392852f590976918fae2afdc96fa1491);
        else if (i == 15) return bytes32(0x2294bca3bac5848eb3b94bf873aec73472b012a8d102761dff742bd89854da86);
        else if (i == 16) return bytes32(0x2b6a8c598bbee3e1710f0fcca2394b98c7cfbf1db2bb4f05c667592f1324b278);
        else if (i == 17) return bytes32(0x27b4dfd7c8695f48bfa70190b8206a6424e8b1256d53fc38abf939d18e91414a);
        else if (i == 18) return bytes32(0x11f6b686672251fb59bdae6ccfdedf008ee3b666a9300094bf5252bc451c71ee);
        else if (i == 19) return bytes32(0x08551ee458a8a7d68599f9b7cb024cf1d956fa564da4800ac784d02347647e5b);
        else if (i == 20) return bytes32(0x1f8b382ff720aec8ea31160c0ee7d8c69c80db9d146f24cf0df2df9642a24284);
        else if (i == 21) return bytes32(0x2ba973cf0a49b994292f99509934bcddf67ecc44029d89042871255aae0bca68);
        else if (i == 22) return bytes32(0x20e8654827828d2b6258a0cbe95fd2723f46ce06da37cea2fde53c5a184c4871);
        else if (i == 23) return bytes32(0x01ebc658b92c79e419b080d59885d2b3be74d5d0e80558180ea7129d5b185d48);
        else if (i == 24) return bytes32(0x1771c151c9331412590a18480028fc3b55acf7aaaaf1e3ca7acb4eca86313c62);
        else if (i == 25) return bytes32(0x26ed57a9c083113b2026cc5e78c9caceeda9e6618f04477be49e011d2d1be6f9);
        else if (i == 26) return bytes32(0x214c967f7ef3ce3f1dcfb6ed827c674bda1554a07cae4c9139ba10220ee4a9a5);
        else if (i == 27) return bytes32(0x23ccc50d08686cb60d9c34c464da0c193e8a8f34d8b8017b41cae4212efe91b1);
        else if (i == 28) return bytes32(0x1ec3f3341fc6201652c4b279424a97f7ec4c0fd82759a772c912a840938a6881);
        else if (i == 29) return bytes32(0x06d11649799b9e9658d283e1cebe89380d40364dd4731eb6831b3799d83afd44);
        else if (i == 30) return bytes32(0x04ea8080804496be627a76a4fefee51ed2ebe702447291b0cc67a7e8d3598656);
        else if (i == 31) return bytes32(0x1d3a7b2dca707a4017add5399f957f3e362b197bb40d1037386f07a3aff39a29);
        else revert IncrementalMerkleTree__IndexOutOfBounds(i);
    }
}
