import { useState } from "react";
import { ethers } from "ethers";
import "./App.css";
import GaslessForwarderAddress from "../../contracts/GaslessForwarder-address.json";
const forwarderAddress = GaslessForwarderAddress.GaslessForwarder;
console.log("Forwarder Address:", forwarderAddress);
const FORWARDER_ADDRESS = "0xYourForwarderAddress";
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

const HARDHAT_ACCOUNTS = [
  {
    address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    privateKey: "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
  },
  {
    address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    privateKey: "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
  },
];

function App() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [forwarder, setForwarder] = useState(null);
  const [userAddress, setUserAddress] = useState("");
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [tokenId, setTokenId] = useState("");
  const [transactionType, setTransactionType] = useState("ERC20");
  const [message, setMessage] = useState("");

  const connectWallet = async (accountIndex) => {
    try {
      const provider = new ethers.JsonRpcProvider("http://localhost:8545");
      const account = HARDHAT_ACCOUNTS[accountIndex];
      const signer = new ethers.Wallet(account.privateKey, provider);
      const forwarder = new ethers.Contract(FORWARDER_ADDRESS, FORWARDER_ABI, signer);
      setProvider(provider);
      setSigner(signer);
      setForwarder(forwarder);
      setUserAddress(account.address);
      setMessage(`Wallet connected: ${account.address}`);
    } catch (error) {
      setMessage("Error connecting wallet: " + error.message);
    }
  };

  const sendGaslessTransaction = async () => {
    if (!forwarder || !signer) {
      setMessage("Wallet not connected.");
      return;
    }

    try {
      const nonce = await forwarder.getNonce(userAddress);
      let data;

      if (transactionType === "ERC20") {
        const erc20Interface = new ethers.Interface([
          "function transfer(address to, uint256 amount)",
        ]);
        data = erc20Interface.encodeFunctionData("transfer", [recipient, ethers.parseEther(amount)]);
      } else if (transactionType === "ERC721") {
        const erc721Interface = new ethers.Interface([
          "function safeTransferFrom(address from, address to, uint256 tokenId)",
        ]);
        data = erc721Interface.encodeFunctionData("safeTransferFrom", [userAddress, recipient, tokenId]);
      } else {
        setMessage("Invalid transaction type.");
        return;
      }

      const req = {
        from: userAddress,
        to: recipient,
        value: 0,
        gas: 100000,
        nonce: nonce,
        data: data,
      };

      const domain = {
        name: "GaslessForwarder",
        version: "1",
        chainId: (await provider.getNetwork()).chainId,
        verifyingContract: FORWARDER_ADDRESS,
      };
      const types = {
        ForwardRequest: [
          { name: "from", type: "address" },
          { name: "to", type: "address" },
          { name: "value", type: "uint256" },
          { name: "gas", type: "uint256" },
          { name: "nonce", type: "uint256" },
          { name: "data", type: "bytes" },
        ],
      };
      const signature = await signer._signTypedData(domain, types, req);

      const response = await fetch("http://localhost:3000/relay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ request: req, signature }),
      });

      const result = await response.json();
      if (result.success) {
        setMessage(`Transaction successful! Tx Hash: ${result.txHash}`);
      } else {
        setMessage("Error: " + result.error);
      }
    } catch (error) {
      setMessage("Error sending transaction: " + error.message);
    }
  };

  return (
    <div className="App">
      <h1>Gasless Transaction Forwarder</h1>
      <div>
        <p>Select a Hardhat account to connect:</p>
        {HARDHAT_ACCOUNTS.map((account, index) => (
          <button key={index} onClick={() => connectWallet(index)}>
            Connect Account {index + 1} ({account.address})
          </button>
        ))}
      </div>

      {userAddress && (
        <div>
          <p>Connected Wallet: {userAddress}</p>
          <div>
            <label>
              <input
                type="radio"
                value="ERC20"
                checked={transactionType === "ERC20"}
                onChange={() => setTransactionType("ERC20")}
              />
              ERC-20
            </label>
            <label>
              <input
                type="radio"
                value="ERC721"
                checked={transactionType === "ERC721"}
                onChange={() => setTransactionType("ERC721")}
              />
              ERC-721
            </label>
          </div>
          <input
            type="text"
            placeholder="Recipient Address"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
          />
          {transactionType === "ERC20" && (
            <input
              type="text"
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          )}
          {transactionType === "ERC721" && (
            <input
              type="text"
              placeholder="Token ID"
              value={tokenId}
              onChange={(e) => setTokenId(e.target.value)}
            />
          )}
          <button onClick={sendGaslessTransaction}>Send Gasless Transaction</button>
        </div>
      )}

      {message && <p>{message}</p>}
    </div>
  );
}

export default App;