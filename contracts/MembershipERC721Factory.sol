// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.17;

import "@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol";
import "@openzeppelin/contracts/proxy/beacon/UpgradeableBeacon.sol";

import "./MembershipERC721.sol";

contract MembershipERC721Factory {
    event MembershipERC721ProxyCreated(
        address proxyAddress,
        string name,
        string symbol
    );

    UpgradeableBeacon immutable beacon;

    constructor(address _initBlueprint) {
        beacon = new UpgradeableBeacon(_initBlueprint);
        beacon.transferOwnership(tx.origin);
    }

    function buildMembershipERC721Proxy(
        string memory _name,
        string memory _symbol,
        address _trustedForwarder
    ) public {
        BeaconProxy membershipProxy = new BeaconProxy(
            address(beacon),
            abi.encodeWithSelector(
                MembershipERC721(address(0)).setUp.selector,
                _name,
                _symbol,
                _trustedForwarder
            )
        );
        address proxyAddress = address(membershipProxy);
        MembershipERC721(proxyAddress).transferOwnership(tx.origin);

        emit MembershipERC721ProxyCreated(proxyAddress, _name, _symbol);
    }

    function getBeacon() public view returns (address) {
        return address(beacon);
    }

    function getImplementation() public view returns (address) {
        return beacon.implementation();
    }
}
