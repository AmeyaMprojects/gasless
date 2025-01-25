// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
contract GaslessForwarder is EIP712 {
    using ECDSA for bytes32;

    // EIP-712 Domain Separator
    string private constant SIGNING_DOMAIN = "GaslessForwarder";
    string private constant SIGNATURE_VERSION = "1";

    // Struct for meta-transaction data
    struct ForwardRequest {
        address from;       // User's address
        address to;         // Target contract address
        uint256 value;      // Amount of ETH to send (optional)
        uint256 gas;        // Gas limit for the transaction
        uint256 nonce;      // User's nonce
        bytes data;         // Encoded function call (e.g., ERC-20 transfer)
    }

    // Mapping to track user nonces
    mapping(address => uint256) private _nonces;

    // Events
    event Forwarded(address indexed from, address indexed to, bytes data, uint256 nonce);

    constructor() EIP712(SIGNING_DOMAIN, SIGNATURE_VERSION) {}

    // Get the current nonce for a user
    function getNonce(address from) public view returns (uint256) {
        return _nonces[from];
    }

    // Verify and execute a meta-transaction
    function execute(ForwardRequest calldata req, bytes calldata signature) external payable {
        // Verify the signature
        require(_verify(req, signature), "Invalid signature");

        // Increment the nonce to prevent replay attacks
        _nonces[req.from]++;

        // Execute the transaction
        (bool success, ) = req.to.call{value: req.value, gas: req.gas}(abi.encodePacked(req.data, req.from));
        require(success, "Transaction failed");

        // Emit an event for tracking
        emit Forwarded(req.from, req.to, req.data, _nonces[req.from]);
    }

    // Verify the EIP-712 signature
    function _verify(ForwardRequest calldata req, bytes calldata signature) internal view returns (bool) {
        address signer = _hashTypedDataV4(
            keccak256(
                abi.encode(
                    keccak256("ForwardRequest(address from,address to,uint256 value,uint256 gas,uint256 nonce,bytes data)"),
                    req.from,
                    req.to,
                    req.value,
                    req.gas,
                    req.nonce,
                    keccak256(req.data)
                )
            )
        ).recover(signature);

        return signer == req.from;
    }
}