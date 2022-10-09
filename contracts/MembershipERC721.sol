// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@opengsn/contracts/src/BaseRelayRecipient.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";

contract MembershipERC721 is ERC721Upgradeable, PausableUpgradeable, OwnableUpgradeable, BaseRelayRecipient {
    using CountersUpgradeable for CountersUpgradeable.Counter;

    CountersUpgradeable.Counter private _tokenIdCounter;
    /* Version recipient for OpenGSN */
    string public override versionRecipient = "2.2.5"; 

    // Mapping from tokenId to membership expiry timestamp 
    mapping(uint256 => uint256) private _tokenIdExpiryTimestamps;

    // Mapping from owner to tokenId
    mapping(address => uint256) private _ownerTokenIds;

    function setUp(string memory name, string memory symbol) public initializer {
        __ERC721_init(name, symbol);
        pause();
    }

    function _baseURI() internal pure override returns (string memory) {
        // TODO(akshaan): Replace with true URL once the image rendering service / endpoint is set up
        return "https://clubhouse.com/testing";
    }

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    function safeMint(address to, uint256 expiryTimestamp) public onlyOwner {
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        require(balanceOf(to) == 0, "balanceOf(to) > 0");
        _safeMint(to, tokenId);
        _tokenIdExpiryTimestamps[tokenId] = expiryTimestamp;
        _ownerTokenIds[to] = tokenId;
    }

    // The following functions are overrides required by Solidity.

    /// @notice Provides access to message sender of a meta transaction (EIP-2771)
    function _msgSender() internal view override(ContextUpgradeable, BaseRelayRecipient)
        returns (address sender) {
        sender = BaseRelayRecipient._msgSender();
    }

    /// @notice Provides access to message data of a meta transaction (EIP-2771)
    function _msgData() internal view override(ContextUpgradeable, BaseRelayRecipient)
        returns (bytes calldata) {
        return BaseRelayRecipient._msgData();
    }

    /// @notice Updates the expiry timestamp for a given address
    function updateExpiryTimestamp(address to, uint256 updatedTimestamp) public onlyOwner {
        uint256 tokenId = _ownerTokenIds[to];
        _tokenIdExpiryTimestamps[tokenId] = updatedTimestamp;
    }
}