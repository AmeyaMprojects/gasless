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

app.post("/relay", async (req, res) => {
  const { request, signature } = req.body;

  try {
    const tx = await forwarder.execute(
      request.from,
      request.to,
      request.value,
      request.gas,
      request.nonce,
      request.data,
      { gasLimit: 1000000 }
    );
    await tx.wait();

    res.send({ success: true, txHash: tx.hash });
  } catch (error) {
    res.status(500).send({ success: false, error: error.message });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Relayer running on http://localhost:${PORT}`);
});