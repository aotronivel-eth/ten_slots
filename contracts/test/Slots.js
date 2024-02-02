const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");

describe("Slots", function () {

  async function deploySlots() {
    const [owner, player] = await ethers.getSigners();
    const Slots = await ethers.getContractFactory("Slots");
    const slots = await Slots.deploy();

    //Prefund the contract
    await slots.provideInitialLiquidity({ value: ethers.parseEther("1") });
    return { slots, owner, player };
  }

  describe("Deployment", function () {
    it("Should deploy with the correct owner", async function () {
      const { slots, owner } = await loadFixture(deploySlots);
      expect(await slots.owner()).to.equal(owner.address);
    });
  });

  describe("Gameplay", function () {
    const BET_AMOUNT = ethers.parseEther("0.001");

    it("Should allow a player to spin the reel with the correct bet amount", async function () {
      const { slots, player } = await loadFixture(deploySlots);
      await expect(slots.connect(player).spinReel({ value: BET_AMOUNT }))
        .to.emit(slots, "SpinResult");
    });

    it("Should not allow spinning the reel with incorrect bet amount", async function () {
      const { slots, player } = await loadFixture(deploySlots);
      await expect(
        slots.connect(player).spinReel({ value: ethers.parseEther("0.002") })
      ).to.be.revertedWith("Incorrect bet amount");
    });

    it("Should update the developer balance correctly after a winning spin", async function () {
      const { slots, player } = await loadFixture(deploySlots);
      let devBalance = 0n;
      while (true) {
        await slots.connect(player).spinReel({ value: BET_AMOUNT });
        devBalance = await slots.getDevBalance();
        if (devBalance > 0n) break;
      }
      expect(devBalance).to.be.gt(0n);
    });
  });

  it("Should allow the owner to provide and recover initial liquidity", async function () {
    const { slots, owner } = await loadFixture(deploySlots);
    await slots.connect(owner).recoverInitialLiquidity();
    expect(await slots.getContractBalance()).to.equal(0);
  });

  it("Should not allow non-owner to withdraw the developer balance", async function () {
    const { slots, other } = await loadFixture(deploySlots);
    let failed = false;
    try {
      await slots.connect(other).withdrawDevBalance();
    } catch (e) {
      failed = true;
    }
    expect(failed).to.be.eq(true);
  });

});
