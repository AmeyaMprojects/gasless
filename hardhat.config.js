require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.28",
  networks: {
    sepolia: {
      url: `https://sepolia.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
      accounts: [process.env.RELAYER_PRIVATE_KEY],
    },
    localhost: {
      url: "http://127.0.0.1:8545", 
      accounts: [process.env.RELAYER_PRIVATE_KEY],
    },
  },
};