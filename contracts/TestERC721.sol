// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@opengsn/contracts/src/BaseRelayRecipient.sol";

contract TestERC721 is ERC721, Ownable, BaseRelayRecipient {
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIdCounter;

    /* Version recipient for OpenGSN */
    string public override versionRecipient = "2.2.5"; 

    constructor(address trustedForwarder) ERC721("MyToken", "MTK") {
        _setTrustedForwarder(trustedForwarder);
    }

    function safeMint(address to) public {
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(to, tokenId);
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
}