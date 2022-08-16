const { expect } = require("chai");
const { ethers } = require("hardhat");

const BASE_URI = "ipfs://xyz/";

let owner: any, addr1: any, addr2: any, jellyBots: any;

describe("JellyBots", function () {
  before(async () => {
    const [_owner, _addr1, _addr2] = await ethers.getSigners();
    owner = _owner;
    addr1 = _addr1;
    addr2 = _addr2;

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

  it("Should allow minting of ERC721 token", async () => {
    await jellyBots.connect(addr1).mint({
      value: ethers.utils.parseEther("0.0001"),
    });

    const balance = await jellyBots.balanceOf(addr1.address);

    expect(balance.toNumber()).to.equal(1);
  });

  it("Should allow setting the base URI and getting a token URI for an existent token", async () => {
    jellyBots.setBaseURI(BASE_URI);

    const tokenURI = await jellyBots.tokenURI(1);

    expect(tokenURI).to.equal(`${BASE_URI}1`);
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

  it("Should allow airdropping of ERC721 token", async () => {
    await jellyBots.airdrop(addr2.address);

    const balance = await jellyBots.balanceOf(addr2.address);

    expect(balance.toNumber()).to.equal(1);
  });
});