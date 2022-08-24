import { expect } from "chai";
import { ethers } from "hardhat";
import { MerkleTree } from "merkletreejs";
import keccak256 from "keccak256";

const BASE_URI = "ar://xyz/";

let owner: any,
  addr1: any,
  addr2: any,
  addr3: any,
  jellyBots: any,
  leafNodes: any,
  merkleTree: any;

describe("JellyBots", function () {
  before(async () => {
    const [_owner, _addr1, _addr2, _addr3] = await ethers.getSigners();

    owner = _owner;
    addr1 = _addr1;
    addr2 = _addr2;
    addr3 = _addr3;

    const whitelistAddresses = [addr1.address, addr2.address];

    leafNodes = whitelistAddresses.map((addr) => keccak256(addr));
    merkleTree = new MerkleTree(leafNodes, keccak256, {
      sortPairs: true,
    });

    const JellyBots = await ethers.getContractFactory("JellyBots");
    jellyBots = await JellyBots.deploy();
    await jellyBots.deployed();
  });

  it("Should allow setting and getting the current step of the pass contract", async () => {
    jellyBots.setCurrentStep(1);

    const currentStep = await jellyBots.getCurrentStep();

    expect(currentStep).to.equal(1);
  });

  it("Should not allow setting the current step to a previous step", async () => {
    await expect(jellyBots.setCurrentStep(0)).eventually.to.rejectedWith(
      "You can only go forward"
    );
  });

  it("Should not allow minting of ERC721 token if not enough funds sent", async () => {
    const mint = async () => {
      await jellyBots.connect(addr1).mint({
        value: ethers.utils.parseEther("0"),
      });
    };

    await expect(mint()).eventually.to.rejectedWith("Not enough funds");
  });

  it("Should allow minting of an ERC721 token when not paused", async () => {
    await jellyBots.connect(addr1).mint({
      value: ethers.utils.parseEther("0.0001"), // initial price is 0.0001
    });

    const balance = await jellyBots.balanceOf(addr1.address);

    expect(balance.toNumber()).to.equal(1);
  });

  it("Should not allow minting of multiple ERC721 tokens when not paused and whitelisted", async () => {
    const claimingAddress = keccak256(addr2.address);
    const hexProof = merkleTree.getHexProof(claimingAddress);

    await expect(
      jellyBots.connect(addr2).mintMultiple(hexProof, 3, {
        value: ethers.utils.parseEther("0.0009"),
      })
    ).eventually.to.rejectedWith("Contract is not currently paused");
  });

  it("Should not allow airdropping of multiple ERC721 tokens when not paused", async () => {
    await expect(
      jellyBots.airdrop(addr3.address, 5)
    ).eventually.to.rejectedWith("Contract is not currently paused");
  });

  it("Should allow pausing the contract", async () => {
    await jellyBots.pause();

    const isPaused = await jellyBots.isPaused();

    expect(isPaused).to.equal(true);
  });

  it("Should not allow minting of an ERC721 token when paused", async () => {
    await expect(
      jellyBots.connect(addr1).mint({
        value: ethers.utils.parseEther("0.0001"), // initial price is 0.0001
      })
    ).eventually.to.rejectedWith("Contract is currently paused");
  });

  it("Should allow setting the Merklet root", async () => {
    const rootHash = merkleTree.getRoot();

    await jellyBots.setMerkleRoot(rootHash);

    const merkleRoot = await jellyBots.getMerkleRoot();

    expect(merkleRoot).to.equal(`0x${rootHash.toString("hex")}`);
  });

  it("Should not allow minting of multiple ERC721 tokens when paused and not whitelisted", async () => {
    const claimingAddress = keccak256(addr3.address);
    const hexProof = merkleTree.getHexProof(claimingAddress);

    await expect(
      jellyBots.connect(addr2).mintMultiple(hexProof, 3, {
        value: ethers.utils.parseEther("0.0009"), // 0.0002 + 0.0003 + 0.0004
      })
    ).eventually.to.rejectedWith("Invalid Merkle proof");
  });

  it("Should allow minting of multiple ERC721 tokens when paused and whitelisted", async () => {
    const claimingAddress = keccak256(addr2.address);
    const hexProof = merkleTree.getHexProof(claimingAddress);

    await jellyBots.connect(addr2).mintMultiple(hexProof, 3, {
      value: ethers.utils.parseEther("0.0009"), // 0.0002 + 0.0003 + 0.0004
    });

    const balance = await jellyBots.balanceOf(addr2.address);

    expect(balance.toNumber()).to.equal(3);
  });

  it("Should allow airdropping of multiple ERC721 tokens when paused", async () => {
    await jellyBots.airdrop(addr3.address, 5);

    const balance = await jellyBots.balanceOf(addr3.address);

    expect(balance.toNumber()).to.equal(5);
  });

  it("Should allow unpausing the contract", async () => {
    await jellyBots.unpause();

    const isPaused = await jellyBots.isPaused();

    expect(isPaused).to.equal(false);
  });

  it("Should allow setting the base URI and getting a token URI for an existent token", async () => {
    jellyBots.setBaseURI(BASE_URI);

    const tokenURI = await jellyBots.tokenURI(1);

    expect(tokenURI).to.equal(`${BASE_URI}1.json`);
  });

  it("Should not allow setting the base URI if it is already set", async () => {
    await expect(jellyBots.setBaseURI(BASE_URI)).eventually.to.rejectedWith(
      "You can only set the base URI once"
    );
  });

  it("Should not allow getting a token URI for a nonexistent token", async () => {
    await expect(jellyBots.tokenURI(666)).eventually.to.rejectedWith(
      "URI query for nonexistent token"
    );
  });

  it("Should give me the right number of token minted", async () => {
    const totalSupply = await jellyBots.totalSupply();

    expect(totalSupply.toNumber()).to.equal(9);
  });
});
