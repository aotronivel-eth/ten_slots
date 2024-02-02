const hre = require("hardhat");

//TEN: 0x20f4b93Db9656Ed2DE6cfcE6b931eac459256f32
//SATOSHI: 0x748Ccdf1a607b9B2045392b74C0bE8Cbe35C5A09

async function main() {
  const contractAddress = "0x1887bBf8523785D7e0cB2E70149EFdfcCebdec60";
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
