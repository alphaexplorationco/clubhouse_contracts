// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.17;

import "@opengsn/contracts/src/BaseRelayRecipient.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721BurnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/Base64Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/StringsUpgradeable.sol";

contract MembershipERC721 is
    Initializable,
    ERC721Upgradeable,
    ERC721BurnableUpgradeable,
    OwnableUpgradeable,
    BaseRelayRecipient
{
    using CountersUpgradeable for CountersUpgradeable.Counter;

    CountersUpgradeable.Counter private _tokenIdCounter;

    /* Version recipient for OpenGSN */
    string public constant override versionRecipient = "2.2.5";

    // Mapping from tokenId to membership expiry timestamp
    mapping(uint256 => uint256) private tokenIdExpiryTimestamps;

    // Switch for token transferability
    bool transferable;

    /* Events */
    event ExpiryTimestampUpdated(uint256 tokenId, uint256 expiryTimestamp);
    event TrustedForwarderUpdated(address trustedForwarderAddress);
    event TokenMinted(uint256 tokenId, address to, uint256 expiryTimestamp);

    constructor() {
        _disableInitializers();
    }

    /// @notice Initializer for contract. Sets token name, symbol and trusted forwarder (ERC-2771)
    function setUp(
        string memory _name,
        string memory _symbol,
        address _trustedForwarder
    ) public initializer {
        require(
            bytes(_name).length != 0 && bytes(_symbol).length != 0,
            "_name or _symbol empty"
        );
        __ERC721_init(_name, _symbol);
        __ERC721Burnable_init();
        __Ownable_init();
        _setTrustedForwarder(_trustedForwarder);
        transferable = false;
    }

    function _baseURI() internal pure override returns (string memory) {
        return "https://clubhouse.com/nft/";
    }

    /// @notice Mints an ERC-721 token to the address `to` with a subscription
    /// expiry timestsamp of `expiryTimestamp`. This function can only be called
    /// by the contract owner.
    function safeMint(address to, uint256 expiryTimestamp) public onlyOwner {
        require(balanceOf(to) == 0, "balanceOf(to) > 0");
        uint256 tokenId = _tokenIdCounter.current();
        _safeMint(to, tokenId);
        tokenIdExpiryTimestamps[tokenId] = expiryTimestamp;
        _tokenIdCounter.increment();
        emit TokenMinted(tokenId, to, expiryTimestamp);
    }

    /// @notice Updates the expiry timestamp for a given address. This function
    /// can only be called by the contract owner.
    function updateExpiryTimestamp(uint256 tokenId, uint256 updatedTimestamp)
        external
        onlyOwner
    {
        tokenIdExpiryTimestamps[tokenId] = updatedTimestamp;
        emit ExpiryTimestampUpdated(tokenId, updatedTimestamp);
    }

    /// @notice Gets the expiry timestamp for a given address
    function getExpiryTimestamp(uint256 tokenId) public view returns (uint256) {
        return tokenIdExpiryTimestamps[tokenId];
    }

    /// @notice Sets the trusted forwarder for meta-transactions (EIP-2771)
    /// This function can only be called by the contract owner.
    function setTrustedForwarder(address _newTrustedFowarder) public onlyOwner {
        _setTrustedForwarder(_newTrustedFowarder);
        emit TrustedForwarderUpdated(_newTrustedFowarder);
    }

    /// @notice Generates the token URI for a particular token ID
    function tokenURI(uint256 _tokenId)
        public
        view
        override
        returns (string memory)
    {
        _requireMinted(_tokenId);

        string memory _nftName = string(abi.encodePacked(name()));

        bytes memory _image = abi.encodePacked(
            _baseURI(),
            StringsUpgradeable.toHexString(uint256(uint160(address(this))), 20),
            "_",
            StringsUpgradeable.toString(_tokenId),
            ".png"
        );
        return
            string(
                abi.encodePacked(
                    "data:application/json;base64,",
                    Base64Upgradeable.encode(
                        bytes(
                            abi.encodePacked(
                                '{"name":"',
                                _nftName,
                                '","image":"',
                                _image,
                                '"}'
                            )
                        )
                    )
                )
            );
    }

    /// @notice Renounce ownership of contract instance. Always reverts.
    function renounceOwnership()
        public
        view
        override(OwnableUpgradeable)
        onlyOwner
    {
        revert("Cannot renounce ownership");
    }

    /// @notice Pre-transfer hook that locks token transfers for this contract
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal virtual override(ERC721Upgradeable) {
        require(from == address(0) || to == address(0) || transferable, "non transferable");
        super._beforeTokenTransfer(from, to, tokenId);
    }

    /// @notice Make token transferable / non-transferable
    function setTransferability(bool transferability) public onlyOwner {
        transferable = transferability;
    }

    /// @notice Get transferability of token
    function isTransferable() public view returns(bool) {
        return transferable;
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
