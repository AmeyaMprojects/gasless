import { useState } from "react";
import { ethers } from "ethers";
import "./App.css";
import GaslessForwarderAddress from "../../contracts/GaslessForwarder-address.json";
import GaslessForwarderABI from "../../artifacts/contracts/GaslessForwarder.sol/GaslessForwarder.json"; 
const forwarderAddress = GaslessForwarderAddress.GaslessForwarder;
console.log("Forwarder Address:", forwarderAddress);

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
  const [isWalletConnected, setIsWalletConnected] = useState(false);

  // Connect wallet and initialize contract
  const connectWallet = async (accountIndex) => {
    try {
      const provider = new ethers.JsonRpcProvider("http://localhost:8545");
      const account = HARDHAT_ACCOUNTS[accountIndex];
  
      // Create a signer using the private key
      const signer = new ethers.Wallet(account.privateKey, provider);
  
      // Initialize the forwarder contract
      const forwarder = new ethers.Contract(forwarderAddress, GaslessForwarderABI.abi, signer);
  
      setProvider(provider);
      setSigner(signer);
      setForwarder(forwarder);
      setUserAddress(account.address);
      setMessage(`Wallet connected: ${account.address}`);
      setIsWalletConnected(true);
    } catch (error) {
      setMessage("Error connecting wallet: " + error.message);
    }
  };

  // Send gasless transaction
  const sendGaslessTransaction = async () => {
    if (!forwarder || !signer) {
      setMessage("Wallet not connected.");
      return;
    }
  
    try {
      // Trim and validate the recipient address
      const trimmedRecipient = recipient.trim();
      if (!ethers.isAddress(trimmedRecipient)) {
        setMessage("Invalid recipient address.");
        return;
      }
  
      const nonce = await forwarder.getNonce(userAddress);
      let data;
  
      if (transactionType === "ERC20") {
        const erc20Interface = new ethers.Interface([
          "function transfer(address to, uint256 amount)",
        ]);
        data = erc20Interface.encodeFunctionData("transfer", [trimmedRecipient, ethers.parseEther(amount)]);
      } else if (transactionType === "ERC721") {
        const erc721Interface = new ethers.Interface([
          "function safeTransferFrom(address from, address to, uint256 tokenId)",
        ]);
        data = erc721Interface.encodeFunctionData("safeTransferFrom", [userAddress, trimmedRecipient, tokenId]);
      } else {
        setMessage("Invalid transaction type.");
        return;
      }
  
      const req = {
        from: userAddress,
        to: trimmedRecipient,
        value: 0,
        gas: 100000,
        nonce: nonce,
        data: data,
      };
  
      // Convert BigInt values to strings
      const serializableReq = {
        ...req,
        value: req.value.toString(), // Convert BigInt to string
        gas: req.gas.toString(),     // Convert BigInt to string
        nonce: req.nonce.toString(), // Convert BigInt to string
      };
  
      console.log("Serialized Request:", serializableReq); // Debugging
  
      const domain = {
        name: "GaslessForwarder",
        version: "1",
        chainId: (await provider.getNetwork()).chainId,
        verifyingContract: forwarderAddress,
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
  
      // Use signer.signTypedData instead of signer._signTypedData
      const signature = await signer.signTypedData(domain, types, req);
      console.log("Signature:", signature); // Debugging
  
      const response = await fetch("http://localhost:3000/relay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ request: serializableReq, signature }), // Use serializableReq
      });
  
      const result = await response.json();
      if (result.success) {
        setMessage(`Transaction successful! Tx Hash: ${result.txHash}`);
      } else {
        setMessage("Error: " + result.error);
      }
    } catch (error) {
      setMessage("Error sending transaction: " + error.message);
      console.error("Error Details:", error); // Debugging
    }
  };

  return (
    <div className="App">
      <h1>Gasless Transaction Forwarder</h1>
      {!isWalletConnected && (
        <div className="button-container">
          {HARDHAT_ACCOUNTS.map((account, index) => (
            <button key={index} onClick={() => connectWallet(index)}>
              Connect Account {index + 1} ({account.address})
            </button>
          ))}
        </div>
      )}

      {isWalletConnected && userAddress && (
        <div>
          <div className="radio-container">
            <label className="radio-item">
              <input
                type="radio"
                value="ERC20"
                checked={transactionType === "ERC20"}
                onChange={() => setTransactionType("ERC20")}
              />
              <span>ERC-20</span>
            </label>
            <label className="radio-item">
              <input
                type="radio"
                value="ERC721"
                checked={transactionType === "ERC721"}
                onChange={() => setTransactionType("ERC721")}
              />
              <span>ERC-721</span>
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