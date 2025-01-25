const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("GaslessForwarder", function () {
    let forwarder, owner, user;

    beforeEach(async function () {
        // Deploy the contract
        [owner, user] = await ethers.getSigners();

        const GaslessForwarder = await ethers.getContractFactory("GaslessForwarder");
        forwarder = await GaslessForwarder.deploy(); // Remove .deployed()
    });

    it("Should increment nonce after successful execution", async function () {
        // Get the initial nonce for the user
        const nonceBefore = await forwarder.getNonce(user.address);

        // Prepare a dummy meta-transaction
        const req = {
            from: user.address,
            to: owner.address, // Send to the owner for simplicity
            value: 0,
            gas: 100000,
            nonce: nonceBefore,
            data: "0x", // No data for this test
        };

        // Sign the meta-transaction
        const domain = {
            name: "GaslessForwarder",
            version: "1",
            chainId: (await ethers.provider.getNetwork()).chainId,
            verifyingContract: forwarder.address,
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
        const signature = await user._signTypedData(domain, types, req);

        // Execute the meta-transaction
        await forwarder.execute(req, signature);

        // Check if the nonce was incremented
        const nonceAfter = await forwarder.getNonce(user.address);
        expect(nonceAfter).to.equal(nonceBefore.add(1));
    });

    it("Should revert if the signature is invalid", async function () {
        // Get the initial nonce for the user
        const nonceBefore = await forwarder.getNonce(user.address);

        // Prepare a dummy meta-transaction
        const req = {
            from: user.address,
            to: owner.address,
            value: 0,
            gas: 100000,
            nonce: nonceBefore,
            data: "0x",
        };

        // Sign the meta-transaction with a different signer (invalid signature)
        const invalidSigner = owner; // Use owner instead of user
        const domain = {
            name: "GaslessForwarder",
            version: "1",
            chainId: (await ethers.provider.getNetwork()).chainId,
            verifyingContract: forwarder.address,
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
        const invalidSignature = await invalidSigner._signTypedData(domain, types, req);

        // Attempt to execute the meta-transaction with an invalid signature
        await expect(forwarder.execute(req, invalidSignature)).to.be.revertedWith(
            "Invalid signature"
        );
    });
});