// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {Script,console} from "forge-std/Script.sol";
import {HonkVerifier as DepositHonkVerifier} from "../src/verifiers/depositVerifier.sol";
import {HonkVerifier as TransferHonkVerifier} from "../src/verifiers/transferVerifier.sol";
import {HonkVerifier as WithdrawHonkVerifier} from "../src/verifiers/withdrawVerifier.sol";
import {Payv, BaseNoirVerifier, Poseidon2} from "../src/Payv.sol";
import {IncrementalMerkleTree} from "../src/IMT.sol";

contract PayvScript is Script {
    BaseNoirVerifier public depositHonkVerifier;
    BaseNoirVerifier public transferHonkVerifier;
    BaseNoirVerifier public withdrawHonkVerifier;
    Payv public payv;
    Poseidon2 public poseidon;

  function run() public {
    vm.startBroadcast();

    // Deploy Poseiden hasher contract
    poseidon = new Poseidon2();
    console.log("Poseidon2 deployed at:", address(poseidon));

    // Deploy Groth16 verifier contracts
    depositHonkVerifier = BaseNoirVerifier(address(new DepositHonkVerifier()));
    console.log("Deposit verifier deployed at:", address(depositHonkVerifier));

    transferHonkVerifier = BaseNoirVerifier(address(new TransferHonkVerifier()));
    console.log("Transfer verifier deployed at:", address(transferHonkVerifier));

    withdrawHonkVerifier = BaseNoirVerifier(address(new WithdrawHonkVerifier()));
    console.log("Withdraw verifier deployed at:", address(withdrawHonkVerifier));

    // Deploy Payv contract
    payv = new Payv(
        address(depositHonkVerifier),
        address(transferHonkVerifier),
        address(withdrawHonkVerifier),
        poseidon,
        31
    );
    console.log("Payv contract deployed at:", address(payv));

    vm.stopBroadcast();
}
}
