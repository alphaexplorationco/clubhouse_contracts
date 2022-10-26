// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.17;

import "@opengsn/contracts/src/BaseRelayRecipient.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract MembershipERC721 is
    Initializable,
    ERC721Upgradeable,
    OwnableUpgradeable,
    BaseRelayRecipient
{
    using CountersUpgradeable for CountersUpgradeable.Counter;

    CountersUpgradeable.Counter private _tokenIdCounter;
    /* Version recipient for OpenGSN */
    string public override versionRecipient = "2.2.5";

    // Mapping from tokenId to membership expiry timestamp
    mapping(uint256 => uint256) private _tokenIdExpiryTimestamps;

    // Mapping from owner to tokenId
    mapping(address => uint256) private _ownerTokenIds;

    // NFT display type. This will determine which of the preset NFT displays will be rendered in wallets / NFT viewers
    uint32 private displayType;

    constructor() {
        _disableInitializers();
    }

    function setUp(
        string memory _name,
        string memory _symbol,
        address _trustedForwarder,
        uint32 _displayType
    ) public initializer {
        __ERC721_init(_name, _symbol);
        __Ownable_init();
        _setTrustedForwarder(_trustedForwarder);
        displayType = _displayType;
    }

    function _baseURI() internal pure override returns (string memory) {
        // TODO(akshaan): Replace with true URL once the image rendering service / endpoint is set up
        return "https://clubhouse.com/nft";
    }

    /// @notice Mints an ERC-721 token to the address `to` with a subscription
    /// expiry timestsamp of `expiryTimestamp`
    function safeMint(address to, uint256 expiryTimestamp) public onlyOwner {
        require(balanceOf(to) == 0, "balanceOf(to) > 0");
        uint256 tokenId = _tokenIdCounter.current();
        _safeMint(to, tokenId);
        _tokenIdExpiryTimestamps[tokenId] = expiryTimestamp;
        _ownerTokenIds[to] = tokenId;
        _tokenIdCounter.increment();
    }

    /// @notice Updates the expiry timestamp for a given address
    function updateExpiryTimestamp(address to, uint256 updatedTimestamp)
        public
        onlyOwner
    {
        uint256 tokenId = _ownerTokenIds[to];
        _tokenIdExpiryTimestamps[tokenId] = updatedTimestamp;
    }

    /// @notice Gets the expiry timestamp for a given address
    function getExpiryTimestamp(address to) public view returns (uint256) {
        uint256 tokenId = _ownerTokenIds[to];
        return _tokenIdExpiryTimestamps[tokenId];
    }

    /// @notice Updates the NFT display type for a given address
    function setDisplayType(uint32 _displayType) public onlyOwner {
        displayType = _displayType;
    }

    /// @notice Gets the expiry timestamp for a given address
    function getDisplayType() public view returns (uint32) {
        return displayType;
    }

    /// @notice Sets the trusted forwarder for meta-transactions (EIP-2771)
    function setTrustedForwarder(address _newTrustedFowarder) public onlyOwner {
        _setTrustedForwarder(_newTrustedFowarder);
    }

    /// @notice Gets the tokenId for a given address. Since a single address can only hold
    /// a single token, each address corresponds to at most one tokenId
    function getTokenId(address tokenHolder) public view returns (uint256) {
        return _ownerTokenIds[tokenHolder];
    }

    /// @notice Pre-transfer hook that locks token transfers for this contract
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal virtual override(ERC721Upgradeable) {
        require(from == address(0), "non transferable");
        super._beforeTokenTransfer(from, to, tokenId);
    }

    /// @notice Provides access to message sender of a meta transaction (EIP-2771)
    function _msgSender()
        internal
        view
        override(ContextUpgradeable, BaseRelayRecipient)
        returns (address sender)
    {
        sender = BaseRelayRecipient._msgSender();
    }

    /// @notice Provides access to message data of a meta transaction (EIP-2771)
    function _msgData()
        internal
        view
        override(ContextUpgradeable, BaseRelayRecipient)
        returns (bytes calldata)
    {
        return BaseRelayRecipient._msgData();
    }
}
