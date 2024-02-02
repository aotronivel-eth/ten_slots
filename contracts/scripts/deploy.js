const hre = require("hardhat");

async function main() {
  const [player] = await hre.ethers.getSigners();

  const Slots = await hre.ethers.getContractFactory("Slots");
  const slots = await Slots.deploy();
  await slots.waitForDeployment();
  //const slots = Slots.attach("0x1887bBf8523785D7e0cB2E70149EFdfcCebdec60");
  console.log("Slots deployed to:", slots.target, "by account:", player.address);

  await slots.provideDevLiquidity({ value: ethers.parseEther("0.01") });
  console.log("Provided dev liquidity. Contract balance:", await slots.balance());

  const BASE = await slots.BASE();

  let houseEdge = Number(await slots.houseEdge()) / Number(BASE);
  console.log("Initial House Edge:", houseEdge.toFixed(2), "%");

  //Set some multipliers
  console.log("Setting multipliers...");
  await slots.setMultipliers(
    [
      [0, 0, 0], [1, 1, 1], [2,2,2], [3, 3, 3], [4, 4, 4], [5, 5, 5], [6, 6, 6], [7, 7, 7], [8, 8, 8], [9, 9, 9]
    ],
    [
      200n * BASE, 100n * BASE, 100n * BASE, 100n * BASE, 100n * BASE, 100n * BASE, 100n * BASE, 100n * BASE, 50n * BASE, 50n * BASE
    ]
  );

  //new dev fee
  //await slots.lowerDevFee(10n);

  houseEdge = Number(await slots.houseEdge()) / Number(BASE);
  console.log("New House Edge:", houseEdge.toFixed(2), "%");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });