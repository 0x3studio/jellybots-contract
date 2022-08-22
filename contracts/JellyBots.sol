// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

//@author 0x3 Studio
//@title Jelly Bots

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "erc721a/contracts/ERC721A.sol";

contract JellyBots is ERC721A, Ownable {
    enum Step {
        Prologue,
        Sale,
        Epilogue
    }

    Step public currentStep;

    string public baseURI;

    uint256 private constant MAX_SUPPLY = 10000;
    uint256 public constant BASE_PRICE = 0.0001 ether;

    uint256 public totalMinted = 0;

    constructor() ERC721A("Jelly Bots", "JLB") {}

    // Mint

    function mint() external payable {
        address addr = msg.sender;
        uint256 price = BASE_PRICE + BASE_PRICE * totalMinted;
        require(currentStep == Step.Sale, "Public sale is not active");
        require(totalMinted + 1 <= MAX_SUPPLY, "Maximum supply exceeded");
        require(msg.value >= price, "Not enough funds");
        totalMinted += 1;
        _safeMint(addr, 1);
    }

    function airdrop(address _addr, uint256 _quantity) external onlyOwner {
        require(
            totalMinted + _quantity <= MAX_SUPPLY,
            "Maximum supply exceeded"
        );
        totalMinted += _quantity;
        _safeMint(_addr, _quantity);
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

    function setBaseURI(string memory _baseURI) external onlyOwner {
        require(
            bytes(baseURI).length == 0,
            "You can only set the base URI once"
        );
        baseURI = _baseURI;
    }

    function getBaseURI() public view returns (string memory) {
        return baseURI;
    }

    function setCurrentStep(uint256 _currentStep) external onlyOwner {
        require(_currentStep > uint256(currentStep), "You can only go forward");
        currentStep = Step(_currentStep);
    }

    function getCurrentStep() public view returns (uint256) {
        return uint256(currentStep);
    }

    function getTotalMinted() public view returns (uint256) {
        return totalMinted;
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
