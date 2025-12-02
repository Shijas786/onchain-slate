// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SimpleDrawingNFT
 * @notice Import-free ERC721-style NFT contract for minting drawings.
 * @dev Public mint. Unique bytecode ensured via custom salt.
 */
contract SimpleDrawingNFT {
    // Unique salt to avoid bytecode collisions
    uint256 private constant _SALT = 883727199;

    string public name;
    string public symbol;

    address public owner;
    uint256 private _nextTokenId;

    mapping(uint256 => address) private _owners;
    mapping(address => uint256) private _balances;
    mapping(uint256 => string) private _tokenURIs;

    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event DrawingMinted(address indexed to, uint256 indexed tokenId, string tokenURI);
    event Salt(uint256 salt);

    modifier exists(uint256 tokenId) {
        require(_owners[tokenId] != address(0), "Token does not exist");
        _;
    }

    constructor() {
        name = "SimpleDrawingNFT";
        symbol = "SDRAW";
        owner = msg.sender;
        _nextTokenId = 1;

        // Guarantee unique bytecode for scan verification
        emit Salt(_SALT);
    }

    // --- Core ERC721 functionality ---

    function balanceOf(address user) public view returns (uint256) {
        require(user != address(0), "Zero address");
        return _balances[user];
    }

    function ownerOf(uint256 tokenId) public view exists(tokenId) returns (address) {
        return _owners[tokenId];
    }

    function tokenURI(uint256 tokenId) public view exists(tokenId) returns (string memory) {
        return _tokenURIs[tokenId];
    }

    // --- Minting (PUBLIC) ---

    function mint(address to, string memory uri) external returns (uint256) {
        require(to != address(0), "Invalid address");

        uint256 tokenId = _nextTokenId++;
        _owners[tokenId] = to;
        _balances[to] += 1;
        _tokenURIs[tokenId] = uri;

        emit Transfer(address(0), to, tokenId);
        emit DrawingMinted(to, tokenId, uri);

        return tokenId;
    }

    // --- Transfer (basic ERC721-style) ---

    function transferFrom(address from, address to, uint256 tokenId) external exists(tokenId) {
        require(msg.sender == from, "Only owner can transfer");
        require(_owners[tokenId] == from, "Not token owner");
        require(to != address(0), "Zero address");

        _balances[from] -= 1;
        _balances[to] += 1;
        _owners[tokenId] = to;

        emit Transfer(from, to, tokenId);
    }

    // --- Supply helpers ---

    function getCurrentTokenId() public view returns (uint256) {
        return _nextTokenId;
    }

    function totalSupply() public view returns (uint256) {
        return _nextTokenId - 1;
    }
}

