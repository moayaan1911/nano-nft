// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import {Script} from "forge-std/Script.sol";
import {NanoNFT} from "src/NanoNFT.sol";

/**
 * @title Deploy NanoNFT
 * @dev Deployment script for NanoNFT token
 */
contract DeployNanoNFT is Script {
    function run() public returns (NanoNFT) {
        return deployContract();
    }

    function deployContract() public returns (NanoNFT) {
        vm.startBroadcast();
        NanoNFT nanoNFT = new NanoNFT();
        vm.stopBroadcast();
        return nanoNFT;
    }
}
