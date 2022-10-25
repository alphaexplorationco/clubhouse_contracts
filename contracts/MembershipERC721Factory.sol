// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.17;

import "@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol";
import "@openzeppelin/contracts/proxy/beacon/UpgradeableBeacon.sol";

import "./MembershipERC721.sol";

contract MembershipERC721Factory {
    mapping(uint256 => address) private membershipProxies;
    UpgradeableBeacon immutable beacon;

    constructor(address _initBlueprint) {
        beacon = new UpgradeableBeacon(_initBlueprint);
        beacon.transferOwnership(tx.origin);
    }

    function buildMembershipERC721Proxy(
        string memory _name, 
        string memory _symbol, 
        address _trustedForwarder, 
        uint32 _displayType,
        uint256 _socialClubId
    ) public {
        address proxyAddress = membershipProxies[_socialClubId];
        require(proxyAddress == address(0), "membership proxy exists for social club");
        BeaconProxy membershipProxy = new BeaconProxy(
            address(beacon),
            abi.encodeWithSelector(MembershipERC721(address(0)).setUp.selector, _name, _symbol, _trustedForwarder, _displayType)
        );
        proxyAddress = address(membershipProxy);
        MembershipERC721(proxyAddress).transferOwnership(tx.origin);
        membershipProxies[_socialClubId] = proxyAddress;
    }

    function getMembershipERC721ProxyAddress(uint256 socialClubId) external view returns (address) {
        return membershipProxies[socialClubId];
    }

    function getBeacon() public view returns (address) {
        return address(beacon);
    }

    function getImplementation() public view returns (address) {
        return beacon.implementation();
    }
}