const express = require("express");
const { ethers } = require("ethers");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// Initialize provider and wallet
const provider = new ethers.InfuraProvider("sepolia", process.env.INFURA_PROJECT_ID);
const wallet = new ethers.Wallet(process.env.RELAYER_PRIVATE_KEY, provider);

// Initialize the forwarder contract
const FORWARDER_ABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [],
    "name": "ECDSAInvalidSignature",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "length",
        "type": "uint256"
      }
    ],
    "name": "ECDSAInvalidSignatureLength",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "from",
        "type": "address"
      }
    ],
    "name": "getNonce",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "from",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "value",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "gas",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "nonce",
        "type": "uint256"
      },
      {
        "internalType": "bytes",
        "name": "data",
        "type": "bytes"
      }
    ],
    "name": "execute",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];
const forwarder = new ethers.Contract(process.env.FORWARDER_ADDRESS, FORWARDER_ABI, wallet);

// Endpoint to relay transactions
app.post("/relay", async (req, res) => {
  const { request, signature } = req.body;

  try {
    // Verify the request and signature (optional: add more validation)
    const tx = await forwarder.execute(request, signature, { gasLimit: 1000000 });
    await tx.wait();

    res.send({ success: true, txHash: tx.hash });
  } catch (error) {
    console.error("Relay error:", error);
    res.status(500).send({ success: false, error: error.message });
  }
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Relayer running on http://localhost:${PORT}`);
});