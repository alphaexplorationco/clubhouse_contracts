// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/proxy/beacon/UpgradeableBeacon.sol";

/**
 * @dev This contract is used in conjunction with one or more instances of {BeaconProxy} to determine their
 * implementation contract, which is where they will delegate all function calls.
 *
 * An owner is able to change the implementation the beacon points to, thus upgrading the proxies that use this beacon.
 */
contract CustomUpgradeableBeacon is UpgradeableBeacon {
    /**
     * @dev Sets the address of the initial implementation, and the deployer account as the owner who can upgrade the
     * beacon.
     */
    constructor(address implementation_) UpgradeableBeacon(implementation_) {}
    
    /**
     * @dev Overrides renounceOwnership from Ownable.sol to always revert. This prevents an owner from relinquishing
     * ownership of the beacon.
     */
    function renounceOwnership() public view override(Ownable) onlyOwner {
        revert("Cannot renounce ownership");
    }
}
