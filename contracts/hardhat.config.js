require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const DEPLOYER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY;

module.exports = {
  solidity: "0.8.19",
  networks: {
    TenTestnet: {
      url: "https://testnet.ten.xyz/v1/?token=39d3faaf751f52fc4fe334f298ba9b39a81c8990",
      accounts: [`0x${DEPLOYER_PRIVATE_KEY}`]
    },
    SatoshiVMTestnet: {
      url: "https://test-rpc-node-http.svmscan.io/",
      accounts: [`0x${DEPLOYER_PRIVATE_KEY}`]
    }
  }
};
