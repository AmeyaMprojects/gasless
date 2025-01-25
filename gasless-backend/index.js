const express = require("express");
const { ethers } = require("ethers"); // Import ethers
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// Initialize provider and wallet
const provider = new ethers.InfuraProvider("sepolia", process.env.INFURA_PROJECT_ID);

// Initialize the forwarder contract
const FORWARDER_ABI = [ /* Paste your contract ABI here */ ];
const forwarder = new ethers.Contract(process.env.FORWARDER_ADDRESS, FORWARDER_ABI, wallet);

// Endpoint to relay transactions
app.post("/relay", async (req, res) => {
  const { request, signature } = req.body;

  try {
    // Verify the request and signature (optional: add more validation)
    const tx = await forwarder.execute(request, signature);
    await tx.wait();

    res.send({ success: true, txHash: tx.hash });
  } catch (error) {
    res.status(500).send({ success: false, error: error.message });
  }
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Relayer running on http://localhost:${PORT}`);
});