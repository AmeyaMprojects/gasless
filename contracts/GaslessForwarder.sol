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
    event ERC20Transferred(address indexed token, address indexed from, address indexed to, uint256 amount);
    event ERC721Transferred(address indexed token, address indexed from, address indexed to, uint256 tokenId);

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

        // Emit specific events for ERC-20 and ERC-721 transactions
        if (isERC20Transfer(req.data)) {
            (address recipient, uint256 amount) = decodeERC20Transfer(req.data);
            emit ERC20Transferred(req.to, req.from, recipient, amount);
        } else if (isERC721Transfer(req.data)) {
            (address recipient, uint256 tokenId) = decodeERC721Transfer(req.data);
            emit ERC721Transferred(req.to, req.from, recipient, tokenId);
        }
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

    // Helper function to check if the data is an ERC-20 transfer
    function isERC20Transfer(bytes memory data) internal pure returns (bool) {
        bytes4 selector = bytes4(data);
        return selector == bytes4(keccak256("transfer(address,uint256)"));
    }

    // Helper function to decode ERC-20 transfer data
    function decodeERC20Transfer(bytes memory data) internal pure returns (address, uint256) {
        // Skip the first 4 bytes (function selector) and decode the rest
        require(data.length >= 4 + 32 + 32, "Invalid data length for ERC-20 transfer");
        address recipient;
        uint256 amount;
        assembly {
            recipient := mload(add(data, 36)) // Skip 4 bytes (selector) + 32 bytes (offset)
            amount := mload(add(data, 68))    // Skip 4 bytes (selector) + 64 bytes (offset)
        }
        return (recipient, amount);
    }

    // Helper function to check if the data is an ERC-721 transfer
    function isERC721Transfer(bytes memory data) internal pure returns (bool) {
        bytes4 selector = bytes4(data);
        return selector == bytes4(keccak256("safeTransferFrom(address,address,uint256)"));
    }

    // Helper function to decode ERC-721 transfer data
    function decodeERC721Transfer(bytes memory data) internal pure returns (address, uint256) {
        // Skip the first 4 bytes (function selector) and decode the rest
        require(data.length >= 4 + 32 + 32 + 32, "Invalid data length for ERC-721 transfer");
        address from;
        address recipient;
        uint256 tokenId;
        assembly {
            from := mload(add(data, 36))      // Skip 4 bytes (selector) + 32 bytes (offset)
            recipient := mload(add(data, 68)) // Skip 4 bytes (selector) + 64 bytes (offset)
            tokenId := mload(add(data, 100))  // Skip 4 bytes (selector) + 96 bytes (offset)
        }
        return (recipient, tokenId);
    }
}