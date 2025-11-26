// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title DrawingNFT
 * @dev ERC721 NFT contract for minting user drawings as NFTs
 * @notice Only the owner (backend wallet) can mint to prevent abuse
 * 
 * Basescan Verification:
 * npx hardhat verify --network base <CONTRACT_ADDRESS>
 * 
 * For Base Sepolia:
 * npx hardhat verify --network baseSepolia <CONTRACT_ADDRESS>
 */
contract DrawingNFT is ERC721, ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;

    /// @notice Emitted when a new drawing NFT is minted
    event DrawingMinted(address indexed to, uint256 indexed tokenId, string tokenURI);

    constructor() ERC721("DrawingNFT", "DRAW") Ownable(msg.sender) {
        _nextTokenId = 1;
    }

    /**
     * @notice Mint a new drawing NFT
     * @dev Only callable by the contract owner (backend wallet)
     * @param to The address to mint the NFT to
     * @param uri The IPFS URI containing the NFT metadata
     * @return tokenId The ID of the newly minted token
     */
    function mint(address to, string memory uri) public onlyOwner returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        
        emit DrawingMinted(to, tokenId, uri);
        
        return tokenId;
    }

    /**
     * @notice Get the current token ID counter
     * @return The next token ID that will be minted
     */
    function getCurrentTokenId() public view returns (uint256) {
        return _nextTokenId;
    }

    /**
     * @notice Get the total number of tokens minted
     * @return The total supply of tokens
     */
    function totalSupply() public view returns (uint256) {
        return _nextTokenId - 1;
    }

    // Required overrides for ERC721URIStorage

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}

