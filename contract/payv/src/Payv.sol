// SPDX-License-Identifier: MIT
pragma solidity >=0.8.21;

import {IncrementalMerkleTree, Poseidon2} from "./IMT.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";


//#TODO
// Future works : 
// 1. denomintor assert to have fixed amount
// 2. prevent frontrunning in withdraw
// 3. remove typecasting in functions so the function sig meant change
// 4. mechanims to drip donate only
interface BaseNoirVerifier {
    function verify(bytes calldata _proof, bytes32[] calldata _publicInputs) external view virtual returns (bool);
}

contract Payv is IncrementalMerkleTree, ReentrancyGuard {
    BaseNoirVerifier public immutable i_depositVerifier;
    BaseNoirVerifier public immutable i_transferVerifier;
    BaseNoirVerifier public immutable i_withdrawVerifier;

    // // --------- Constants --------
    // int256 public constant MERKLE_ROOT_HISTORY_MAX = 10;

    // --------- State variables -------

    /// @notice Nullifers mapping
    mapping(bytes32 => bool) public s_nullifierHashes;
    mapping(bytes32 => bool) public s_commitments;

    /// @notice Commitment merkle root for current root
    bytes32 public commitmentRoot;

    // /// @notice Set of roots for proof validation
    // bytes32[MERKLE_ROOT_HISTORY_MAX] s_merkleRootHistory;

    event Deposit(
        bytes32 indexed commitment, uint256 amount, uint32 leafIndex, uint256 timestamp, bytes encryptedInputs
    );
    event Transfer(
        bytes32 indexed inputNullifier, uint256 leafIndex1, uint32 leafIndex2, uint256 timestamp, bytes encryptedInputs
    );
    event Withdrawal(address to, uint256 amount, bytes32 nullifierHash, uint256 timestamp, bytes encryptedInputs);

    error Payv__DepositValueMismatch(uint256 expected, uint256 actual);
    error Payv__PaymentFailed(address recipient, uint256 amount);
    error Payv__NoteAlreadySpent(bytes32 nullifierHash);
    error Payv__UnknownRoot(bytes32 root);
    error Payv__InvalidWithdrawProof();
    error Payv__FeeExceedsDepositValue(uint256 expected, uint256 actual);
    error Payv__CommitmentAlreadyAdded(bytes32 commitment);
    error Payv__NonZeroMsgValue();
    error Payv__NonZeroWithdrawAmount();
    error Payv__RecipientTransferFailed();
    error Payv__RelayerTransferFailed();
    error Payv__InvalidDepositProof();

    constructor(
        address _depositVerifierAddress,
        address _transferVerifierAddress,
        address _withdrawVerifierAddress,
        Poseidon2 _hasher,
        uint32 _merkleTreeDepth // 31
    ) IncrementalMerkleTree(_merkleTreeDepth, _hasher) {
        //@note deploy haser,i_depositVerifier,i_withdrawVerifier,i_transferVerifier
        i_depositVerifier = BaseNoirVerifier(_depositVerifierAddress);
        i_transferVerifier = BaseNoirVerifier(_transferVerifierAddress);
        i_withdrawVerifier = BaseNoirVerifier(_withdrawVerifierAddress);
    }

    function deposit(bytes calldata _proof, bytes32[] calldata _publicInputs, bytes calldata _encryptedInputs)
        external
        payable
        nonReentrant
    {
        // check if the commitment is already added
        if (s_commitments[_publicInputs[0]]) {
            revert Payv__CommitmentAlreadyAdded(_publicInputs[0]);
        }

        if (!i_depositVerifier.verify(_proof, _publicInputs)) {
            revert Payv__InvalidDepositProof();
        }

        // check if the value sent is equal to the denomination
        _processDeposit(uint256(_publicInputs[1]));

        // add the commitment to the added commitments mapping
        s_commitments[_publicInputs[0]] = true;

        // insert the commitment into the Merkle tree
        uint32 insertedIndex = _insert(_publicInputs[0]);

        emit Deposit(_publicInputs[0], msg.value, insertedIndex, block.timestamp, _encryptedInputs);
    }

    function transfer(bytes calldata _proof, bytes32[] calldata _publicInputs, bytes calldata _encryptedInputs)
        external
        nonReentrant
    {
        //  bytes32[] memory publicInputs = new bytes32[](4);
        // publicInputs[0] = _nullifierHash; // the nullifier hash
        // publicInputs[1] = output_commitment_1;
        // publicInputs[2] =output_commitment_2
        //publicInputs[3]= merkle_root // the root of the Merkle tree

        // check if the nullifier is already used
        if (s_nullifierHashes[_publicInputs[0]]) {
            revert Payv__NoteAlreadySpent({nullifierHash: _publicInputs[0]});
        }
        // check if the commitment is already added
        if (s_commitments[_publicInputs[1]]) {
            revert Payv__CommitmentAlreadyAdded(_publicInputs[1]);
        }
        // check if the commitment is already added
        if (s_commitments[_publicInputs[2]]) {
            revert Payv__CommitmentAlreadyAdded(_publicInputs[2]);
        }
        // check if the root is a valid root
        if (!isKnownRoot(_publicInputs[3])) {
            revert Payv__UnknownRoot({root: _publicInputs[3]});
        }

        // add the commitment to the added commitments mapping
        s_commitments[_publicInputs[1]] = true;
        s_commitments[_publicInputs[2]] = true;
        s_nullifierHashes[_publicInputs[0]] = true; // mark the nullifier as used

        // insert the commitment into the Merkle tree
        uint32 insertedIndex_1 = _insert(_publicInputs[1]);
        uint32 insertedIndex_2 = _insert(_publicInputs[2]);

        if (!i_transferVerifier.verify(_proof, _publicInputs)) {
            revert Payv__InvalidDepositProof();
        }


        emit Transfer(_publicInputs[0], insertedIndex_1, insertedIndex_2, block.timestamp, _encryptedInputs);
    }

    function withdraw(
        bytes calldata _proof,
        bytes32[] calldata _publicInputs,
        bytes calldata _encryptedInputs,
        address _relayer
    ) external nonReentrant {
        //  bytes32[] memory publicInputs = new bytes32[](5);
        // publicInputs[0] = _nullifierHash; // the nullifier hash
        // publicInputs[1] = _root; // the root of the Merkle tree
        // publicInputs[2] = bytes32(uint256(uint160(address(_recipient)))); // the recipient address
        //publicInputs[3]= uint256(withdraw_amount);
        //publicInputs[4]= uint256(relayer_fee);

        // check if the nullifier is already used
        if (s_nullifierHashes[_publicInputs[0]]) {
            revert Payv__NoteAlreadySpent({nullifierHash: _publicInputs[0]});
        }
        // check if the root is a valid root
        if (!isKnownRoot(_publicInputs[1])) {
            revert Payv__UnknownRoot({root: _publicInputs[1]});
        }

        // verify the proof - check the Merkle proof against the root, the ZK proof to check the commitments match, they know a valid nullifier hash and secret, a valid root and the recipient hasn't been modified
        if (!i_withdrawVerifier.verify(_proof, _publicInputs)) {
            revert Payv__InvalidWithdrawProof();
        }

        s_nullifierHashes[_publicInputs[0]] = true; // mark the nullifier as used before sending the funds
        address recipient = address(uint160(uint256(_publicInputs[2])));
        uint256 relayer_fee = uint256(_publicInputs[4]);
        uint256 withdrawAmount = uint256(_publicInputs[3]);
        _processWithdraw(recipient, _relayer, relayer_fee, withdrawAmount);
        emit Withdrawal(recipient, withdrawAmount, _publicInputs[0], block.timestamp, _encryptedInputs);
    }

    function _processWithdraw(address _recipient, address _relayer, uint256 _fee, uint256 _withdrawAmount) internal {
        if (msg.value != 0) {
            revert Payv__NonZeroMsgValue();
        }
        if (_withdrawAmount == 0) {
            revert Payv__NonZeroWithdrawAmount();
        }
        if (_recipient == address(0)) revert Payv__RecipientTransferFailed();
        if (_fee > _withdrawAmount) {
            revert Payv__FeeExceedsDepositValue(_withdrawAmount, _fee);
        }
        (bool success,) = _recipient.call{value: _withdrawAmount - _fee}("");
        if (!success) {
            revert Payv__PaymentFailed({recipient: _recipient, amount: _withdrawAmount - _fee});
        }

        if (_fee > 0) {
            (success,) = _relayer.call{value: _fee}("");
            if (!success) {
                revert Payv__RelayerTransferFailed();
            }
        }
    }

    function _processDeposit(uint256 _depositAmount) internal {
        // check if the value sent is equal to the deposit
        if (msg.value != _depositAmount) {
            revert Payv__DepositValueMismatch({expected: _depositAmount, actual: msg.value});
        }
    }
}


//