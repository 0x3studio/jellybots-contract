// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

//@author 0x3 Studio
//@title JellyBots

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "erc721a/contracts/ERC721A.sol";

contract JellyBots is ERC721A, Ownable, ReentrancyGuard {
    enum Step {
        Prologue,
        Sale,
        Epilogue
    }

    Step private currentStep;
    bytes32 private merkleRoot;
    string private baseURI;
    bool private paused = false;

    uint256 private constant MAX_SUPPLY = 10000;
    uint256 private constant INCREMENT = 0.0001 ether;

    constructor() ERC721A("JellyBots", "JLB") {}

    // Modifiers

    modifier whenNotPaused() {
        require(!paused, "Contract is currently paused");
        _;
    }

    modifier whenPaused() {
        require(paused, "Contract is not currently paused");
        _;
    }

    // Mint

    function mint() external payable whenNotPaused nonReentrant {
        address addr = msg.sender;
        uint256 price = (totalSupply() + 1) * INCREMENT;
        require(currentStep == Step.Sale, "Public sale is not active");
        require(totalSupply() + 1 <= MAX_SUPPLY, "Maximum supply exceeded");
        require(msg.value >= price, "Not enough funds");
        _safeMint(addr, 1);
    }

    function mintMultiple(bytes32[] calldata merkleProof, uint256 _quantity)
        external
        payable
        whenPaused
        nonReentrant
    {
        address addr = msg.sender;
        uint256 price = (totalSupply() *
            _quantity +
            (_quantity * (_quantity + 1)) /
            2) * INCREMENT;
        require(merkleRoot != "", "Merkle root is not set");
        require(
            MerkleProof.verify(
                merkleProof,
                merkleRoot,
                keccak256(abi.encodePacked(addr))
            ),
            "Invalid Merkle proof"
        );
        require(currentStep == Step.Sale, "Public sale is not active");
        require(
            totalSupply() + _quantity <= MAX_SUPPLY,
            "Maximum supply exceeded"
        );
        require(msg.value >= price, "Not enough funds");
        _safeMint(addr, _quantity);
    }

    function airdrop(address _addr, uint256 _quantity)
        external
        onlyOwner
        whenPaused
        nonReentrant
    {
        require(
            totalSupply() + _quantity <= MAX_SUPPLY,
            "Maximum supply exceeded"
        );
        _safeMint(_addr, _quantity);
    }

    function bulkAirdrop(address[] memory _addrs, uint256 _quantity)
        external
        onlyOwner
        whenPaused
        nonReentrant
    {
        require(
            totalSupply() + _quantity * _addrs.length <= MAX_SUPPLY,
            "Maximum supply exceeded"
        );
        for (uint256 i = 0; i < _addrs.length; i++) {
            _safeMint(_addrs[i], _quantity);
        }
    }

    // Utils

    function tokenURI(uint256 _tokenId)
        public
        view
        virtual
        override
        returns (string memory)
    {
        require(_exists(_tokenId), "URI query for nonexistent token");
        return
            string(
                abi.encodePacked(baseURI, Strings.toString(_tokenId), ".json")
            );
    }

    // Getters and setters

    function setMerkleRoot(bytes32 _merkleRoot) external onlyOwner {
        merkleRoot = _merkleRoot;
    }

    function getMerkleRoot() external view returns (bytes32) {
        return merkleRoot;
    }

    function setBaseURI(string memory _baseURI) external onlyOwner {
        require(
            bytes(baseURI).length == 0,
            "You can only set the base URI once"
        );
        baseURI = _baseURI;
    }

    function getBaseURI() external view returns (string memory) {
        return baseURI;
    }

    function setCurrentStep(uint256 _currentStep) external onlyOwner {
        require(_currentStep > uint256(currentStep), "You can only go forward");
        currentStep = Step(_currentStep);
    }

    function getCurrentStep() external view returns (uint256) {
        return uint256(currentStep);
    }

    // Pause methods

    function pause() external onlyOwner {
        paused = true;
    }

    function unpause() external onlyOwner {
        paused = false;
    }

    function isPaused() external view returns (bool) {
        return paused;
    }

    // Withdraw

    function withdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    // Overrides

    function _startTokenId() internal view virtual override returns (uint256) {
        return 1;
    }
}
