const { ethers } = require("ethers");

async function checkBalance() {
  // Connect to the local Hardhat network
  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");

  // Replace with your relayer address
  const relayerAddress = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

  // Fetch the balance
  const balance = await provider.getBalance(relayerAddress);
  console.log("Relayer Balance:", ethers.formatEther(balance), "ETH");
}

checkBalance().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});