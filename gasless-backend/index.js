const express = require("express");
const { ethers } = require("ethers");
const cors = require("cors");
require("dotenv").config();
const GaslessForwarderABI = require("../artifacts/contracts/GaslessForwarder.sol/GaslessForwarder.json");

const app = express();
app.use(cors());
app.use(express.json());

// Initialize provider and wallet
const provider = new ethers.InfuraProvider("sepolia", process.env.INFURA_PROJECT_ID);
const wallet = new ethers.Wallet(process.env.RELAYER_PRIVATE_KEY, provider);

// Initialize the forwarder contract
const forwarder = new ethers.Contract(process.env.FORWARDER_ADDRESS, GaslessForwarderABI.abi, wallet);

app.get("/", (req, res) => {
  res.send("Gasless Transaction Relayer is running.");
});

app.post("/relay", async (req, res) => {
  const { request, signature } = req.body;

  console.log("Received relay request:", request);
  console.log("Received signature:", signature);

  try {
    console.log("Executing transaction...");
    const tx = await forwarder.execute(request, signature, { gasLimit: 1000000 });
    await tx.wait();

    console.log("Transaction successful! Tx Hash:", tx.hash);
    res.send({ success: true, txHash: tx.hash });
  } catch (error) {
    console.error("Error executing transaction:", error.message);
    res.status(500).send({ success: false, error: error.message });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Relayer running on http://localhost:${PORT}`);
});