const hre = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners();

    console.log("Deploying contracts with the account:", deployer.address);

    const GaslessForwarder = await hre.ethers.getContractFactory("GaslessForwarder");
    const forwarder = await GaslessForwarder.deploy();

    await forwarder.deployed();

    console.log("GaslessForwarder deployed to:", forwarder.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });