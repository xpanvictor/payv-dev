// SPDX-License-Identifier: MIT
pragma solidity ^0.8.33;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

abstract contract BaseNoirVerifier {
    function verify(
        bytes calldata _proof,
        uint256[] calldata _publicInputs
    ) external view virtual returns (bool);
}

contract Payv is Initializable, UUPSUpgradeable, OwnableUpgradeable {
    BaseNoirVerifier public depositVerifier;
    BaseNoirVerifier public transferVerifier;
    BaseNoirVerifier public withdrawVerifier;

    // --------- Constants --------
    int public constant MERKLE_ROOT_HISTORY_MAX = 10;

    // --------- State variables -------

    /// @notice Nullifers mapping
    mapping(bytes32 => bool) public nullifierSet;

    /// @notice Commitment merkle root for current root
    bytes32 public commitmentRoot;

    /// @notice Set of roots for proof validation
    bytes32[MERKLE_ROOT_HISTORY_MAX] merkleRootHistory;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _depositVerifierAddress,
        address _transferVerifierAddress,
        address _withdrawVerifierAddress
    ) public initializer {
        __Ownable_init(msg.sender);
        __UUPSUpgradeable_init();
        depositVerifier = BaseNoirVerifier(_depositVerifierAddress);
        transferVerifier = BaseNoirVerifier(_transferVerifierAddress);
        withdrawVerifier = BaseNoirVerifier(_withdrawVerifierAddress);
    }

    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyOwner {}

    // ... (makeDeposit, executeTransfer, processWithdrawal functions as in Option A)
}
