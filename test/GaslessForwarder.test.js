const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("GaslessForwarder", function () {
  let GaslessForwarder;
  let gaslessForwarder;
  let owner, user, relayer, invalidSigner;

  beforeEach(async function () {
    [owner, user, relayer, invalidSigner] = await ethers.getSigners();

    // Deploy the GaslessForwarder contract
    GaslessForwarder = await ethers.getContractFactory("GaslessForwarder");
    gaslessForwarder = await GaslessForwarder.deploy();
    await gaslessForwarder.deployed(); // Wait for deployment to complete
  });

  it("Should increment nonce after successful execution", async function () {
    // Create a ForwardRequest
    const request = {
      from: user.address,
      to: relayer.address,
      value: 0,
      gas: 1000000,
      nonce: await gaslessForwarder.getNonce(user.address),
      data: "0x", // Example data (can be ERC-20 or ERC-721 transfer data)
    };

    // Get the EIP-712 domain
    const domain = {
      name: "GaslessForwarder",
      version: "1",
      chainId: (await ethers.provider.getNetwork()).chainId,
      verifyingContract: gaslessForwarder.address,
    };

    // Define the ForwardRequest type
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

    // Sign the request using EIP-712
    const signature = await user._signTypedData(domain, types, request);

    // Execute the meta-transaction
    await expect(
      gaslessForwarder.connect(relayer).execute(request, signature)
    ).to.emit(gaslessForwarder, "Forwarded");

    // Check if the nonce was incremented
    const newNonce = await gaslessForwarder.getNonce(user.address);
    expect(newNonce).to.equal(request.nonce + 1);
  });

  it("Should revert if the signature is invalid", async function () {
    // Create a ForwardRequest
    const request = {
      from: user.address,
      to: relayer.address,
      value: 0,
      gas: 1000000,
      nonce: await gaslessForwarder.getNonce(user.address),
      data: "0x", // Example data (can be ERC-20 or ERC-721 transfer data)
    };

    // Get the EIP-712 domain
    const domain = {
      name: "GaslessForwarder",
      version: "1",
      chainId: (await ethers.provider.getNetwork()).chainId,
      verifyingContract: gaslessForwarder.address,
    };

    // Define the ForwardRequest type
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

    // Sign the request using EIP-712 with an invalid signer
    const signature = await invalidSigner._signTypedData(domain, types, request);

    // Attempt to execute the meta-transaction (should revert)
    await expect(
      gaslessForwarder.connect(relayer).execute(request, signature)
    ).to.be.revertedWith("Invalid signature");
  });
});