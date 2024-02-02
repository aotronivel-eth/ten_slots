const hre = require("hardhat");

async function main() {
  const contractAddress = "0x2DD5E2A0c6d0c4fFBeDf02A9b684e39a43373b9D";
  const [player] = await hre.ethers.getSigners();
  const Slots = await hre.ethers.getContractFactory("Slots");
  const slots = Slots.attach(contractAddress);
  await slots.recoverDevLiquidity();
  console.log("Dev liquidity recovered");
  console.log(`New contract balance: ${hre.ethers.formatEther(await slots.balance())} ETH`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
