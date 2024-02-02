const hre = require("hardhat");

async function main() {
  const contractAddress = "0x2DD5E2A0c6d0c4fFBeDf02A9b684e39a43373b9D";
  const BET_AMOUNT = hre.ethers.parseEther("0.00001");

  const [player] = await hre.ethers.getSigners();

  const Slots = await hre.ethers.getContractFactory("Slots");
  const slots = Slots.attach(contractAddress);
  const BASE = await slots.BASE();

  slots.on("SpinResult", async (playerAddress, spinners, payout, multiplier, treasury) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log(`   > Result: ${spinners}`);
    const multiplier = Number(multiplier) / Number(BASE);
    console.log(`   > Payout: ${hre.ethers.formatEther(payout)} ETH (x${multiplier.toFixed(2)})`);
    if (payout > 0n) {
      process.exit(0);
    }
    console.log(``);
  });

  while (true) {
    console.log(`TenSlots Test`);
    console.log(` - Current contract balance: ${hre.ethers.formatEther(await slots.balance())} ETH`);
    const houseEdge = Number(await slots.houseEdge()) / Number(BASE);
    console.log(` - Current house edge: ${houseEdge.toFixed(2)}%`);
    console.log(` - Current nonce: ${await slots.nonce()}`);
    console.log(` - Last winning nonce: ${await slots.lastWinnngNonce()}`);

    try {
      const transaction = await slots.connect(player).spinReel({ value: BET_AMOUNT });
      console.log(` - Playing the slots with ${hre.ethers.formatEther(BET_AMOUNT)} ETH and tx hash: ${transaction.hash} [nonce: ${transaction.nonce}]]`);
      await transaction.wait();
    } catch (error) {
      console.error(error);
      process.exit(1);
    }

    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
