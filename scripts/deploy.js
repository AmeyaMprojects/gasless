const hre = require("hardhat");
const path = require("path");
const fs = require("fs");

async function main() {
    // Get the deployer's account (first account from Hardhat's local node)
    const [deployer] = await hre.ethers.getSigners();

    console.log("Deploying contracts with the account:", deployer.address);

    // Get the deployer's balance
    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log("Account balance:", hre.ethers.formatEther(balance), "ETH");

    // Get the contract factory for GaslessForwarder
    const GaslessForwarder = await hre.ethers.getContractFactory("GaslessForwarder");

    // Deploy the contract
    console.log("Deploying GaslessForwarder...");
    const forwarder = await GaslessForwarder.deploy();

    // Wait for the contract to be deployed
    console.log("Waiting for deployment...");
    await forwarder.waitForDeployment();

    const forwarderAddress = await forwarder.getAddress();
    console.log("GaslessForwarder deployed to:", forwarderAddress);

    // Save the contract address to a file for easy reference
    const contractsDir = path.join(__dirname, "..", "contracts"); // Path to the contracts folder

    if (!fs.existsSync(contractsDir)) {
        fs.mkdirSync(contractsDir);
    }

    fs.writeFileSync(
        path.join(contractsDir, "GaslessForwarder-address.json"),
        JSON.stringify({ GaslessForwarder: forwarderAddress }, undefined, 2)
    );

    console.log("Contract address saved to:", path.join(contractsDir, "GaslessForwarder-address.json"));
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });