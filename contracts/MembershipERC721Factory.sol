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

    UpgradeableBeacon private immutable beacon;

    // Mapping from proxy address to bool. Used to prove that a proxy was 
    // created by this factory.
    mapping(address => bool) private proxyRegistry;

<<<<<<< Updated upstream
    constructor(address _initBlueprint) {
        beacon = new UpgradeableBeacon(_initBlueprint);
        beacon.transferOwnership(tx.origin);
=======
    
    constructor(address _initBlueprint, address beaconOwner) {
        UpgradeableBeacon beacon = new UpgradeableBeacon(_initBlueprint);
        beacon.transferOwnership(beaconOwner);
        beaconAddress = address(beacon);
>>>>>>> Stashed changes
    }

    /// @notice Builds a new membership proxy contract. Can be called by contract owner only.
    function buildMembershipERC721Proxy(
        string memory _name,
        string memory _symbol,
        address _trustedForwarder
    ) external onlyOwner {
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
        proxyRegistry[proxyAddress] = true;

        emit MembershipERC721ProxyCreated(proxyAddress, _name, _symbol);
    }

    /// @notice Returns the address for the upgradeable beacon for this factory
    function getBeacon() public view returns (address) {
        return address(beacon);
    }

    /// @notice Returns the address for the underlying implementation contract for this factory
    function getImplementation() public view returns (address) {
        return beacon.implementation();
    }

    /// @notice Returns true if a proxy was created by this factory, false otherwise
    function proxyWasCreatedByFactory(address proxyAddress)
        public
        view
        returns (bool)
    {
        return proxyRegistry[proxyAddress];
    }

    /// @notice Overrides the renounceOwnership function from Ownable. Always reverts.
    function renounceOwnership() public view override(Ownable) onlyOwner {
        revert("Cannot renounce ownership");
    }
}
