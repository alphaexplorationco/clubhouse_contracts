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
    bool private transferable;

    /* Events */
    /// Expiry timestamp update for a particular token
    /// @param tokenId token id being updated
    /// @param expiryTimestamp new expiry timestamp for the token
    event ExpiryTimestampUpdated(uint256 tokenId, uint256 expiryTimestamp);
    /// Trusted forwarder addres updated for a contract instance
    /// @param trustedForwarderAddress new trusted forwarder address
    event TrustedForwarderUpdated(address trustedForwarderAddress);
    /// New token minted
    /// @param tokenId tokenId of new token
    /// @param to token recipient
    /// @param expiryTimestamp expiry timestamp of minted token
    event TokenMinted(uint256 tokenId, address to, uint256 expiryTimestamp);

    /* Errors */
    /// Empty token name or symbol when initializing contract
    /// @param name user-provided token name
    /// @param symbol user-provided symbol
    error EmptyTokenNameOrSymbol(string name, string symbol);
    /// Attempt to transfer non-transferable token
    /// @param from sender address
    /// @param to recipient address
    error NonTransferable(address from, address to);
    /// Attempt to mint token to address with balance > 0
    /// @param from minter address
    /// @param to recipient address with balance > 0
    error MintToAddressWithToken(address from, address to);
    /// Renounce ownership error
    /// @param owner owner address
    error RenounceOwnership(address owner);

    constructor() {
        _disableInitializers();
    }

    /// @notice Initializer for contract. Sets token name, symbol and trusted forwarder (ERC-2771)
    function setUp(
        string memory _name,
        string memory _symbol,
        address _trustedForwarder
    ) public initializer {
        if (bytes(_name).length == 0 || bytes(_symbol).length == 0) {
            revert EmptyTokenNameOrSymbol(_name, _symbol);
        }
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
        if (balanceOf(to) != 0) {
            revert MintToAddressWithToken(_msgSender(), to);
        }
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
        revert RenounceOwnership(owner());
    }

    /// @notice Pre-transfer hook that locks token transfers for this contract
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal virtual override(ERC721Upgradeable) {
        if (!transferable && from != address(0) && to != address(0)) {
            revert NonTransferable(from, to);
        }
        super._beforeTokenTransfer(from, to, tokenId);
    }

    /// @notice Make token transferable / non-transferable
    function setTransferability(bool transferability) public onlyOwner {
        transferable = transferability;
    }

    /// @notice Get transferability of token
    function isTransferable() public view returns (bool) {
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
