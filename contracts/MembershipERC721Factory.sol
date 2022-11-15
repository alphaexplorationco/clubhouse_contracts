// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.17;

import "@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./UpgradeableBeacon.sol";

import "./MembershipERC721.sol";

contract MembershipERC721Factory is Ownable {
    
    /* Events */
    event MembershipERC721ProxyCreated(
        address proxyAddress,
        string name,
        string symbol
    );

    address private immutable beaconAddress;

    mapping(address => bool) private proxyRegistry;

    constructor(address _initBlueprint, address beaconOwner) {
        UpgradeableBeacon beacon = new UpgradeableBeacon(_initBlueprint);
        beacon.transferOwnership(beaconOwner);
        beaconAddress = address(beacon);
    }

    function buildMembershipERC721Proxy(
        string memory _name,
        string memory _symbol,
        address _trustedForwarder
    ) public onlyOwner {
        BeaconProxy membershipProxy = new BeaconProxy(
            beaconAddress,
            abi.encodeWithSelector(
                MembershipERC721(address(0)).setUp.selector,
                _name,
                _symbol,
                _trustedForwarder
            )
        );
        address proxyAddress = address(membershipProxy);
        MembershipERC721(proxyAddress).transferOwnership(_msgSender());
        proxyRegistry[proxyAddress] = true;

        emit MembershipERC721ProxyCreated(proxyAddress, _name, _symbol);
    }

    function getBeacon() public view returns (address) {
        return beaconAddress;
    }

    function getImplementation() public view returns (address) {
        return UpgradeableBeacon(beaconAddress).implementation();
    }

    function proxyWasCreatedByFactory(address proxyAddress)
        public
        view
        returns (bool)
    {
        return proxyRegistry[proxyAddress];
    }

    function renounceOwnership() public view override(Ownable) onlyOwner {
        revert("Cannot renounce ownership");
    }
}
