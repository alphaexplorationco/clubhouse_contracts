// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@opengsn/contracts/src/BaseRelayRecipient.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract MembershipERC721 is ERC721, ERC721Enumerable, Pausable, Ownable, ERC721Burnable, BaseRelayRecipient {
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIdCounter;
    /* Version recipient for OpenGSN */
    string public override versionRecipient = "2.2.5"; 
    // Mapping from owner to membership expiry timestamp 
    mapping(address => uint256) private _membershipExpiryTimestamps;

    constructor(string memory name, string memory symbol) ERC721(name, symbol) {
        pause();
    }

    function _baseURI() internal pure override returns (string memory) {
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
        _membershipExpiryTimestamps[to] = expiryTimestamp;
    }

    function _beforeTokenTransfer(address from, address to, uint256 tokenId)
        internal
        whenNotPaused
        override(ERC721, ERC721Enumerable)
    {
        super._beforeTokenTransfer(from, to, tokenId);
    }

    // The following functions are overrides required by Solidity.

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    /// @notice Provides access to message sender of a meta transaction (EIP-2771)
    function _msgSender() internal view override(Context, BaseRelayRecipient)
        returns (address sender) {
        sender = BaseRelayRecipient._msgSender();
    }

    /// @notice Provides access to message data of a meta transaction (EIP-2771)
    function _msgData() internal view override(Context, BaseRelayRecipient)
        returns (bytes calldata) {
        return BaseRelayRecipient._msgData();
    }

    /// @notice Updates the expiry timestamp for a given address
    function updateExpiryTimestamp(address to, uint256 updatedTimestamp) public onlyOwner {
        _membershipExpiryTimestamps[to] = updatedTimestamp;
    }
}