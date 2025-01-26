// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

contract GaslessForwarder is EIP712 {
    using ECDSA for bytes32;

    string private constant SIGNING_DOMAIN = "GaslessForwarder";
    string private constant SIGNATURE_VERSION = "1";

    struct ForwardRequest {
        address from;
        address to;
        uint256 value;
        uint256 gas;
        uint256 nonce;
        bytes data;
    }

    mapping(address => uint256) private _nonces;

    event Forwarded(address indexed from, address indexed to, bytes data, uint256 nonce);
    event ERC20Transferred(address indexed token, address indexed from, address indexed to, uint256 amount);
    event ERC721Transferred(address indexed token, address indexed from, address indexed to, uint256 tokenId);

    constructor() EIP712(SIGNING_DOMAIN, SIGNATURE_VERSION) {}

    function getNonce(address from) public view returns (uint256) {
        return _nonces[from];
    }

    function execute(ForwardRequest calldata req, bytes calldata signature) external payable {
        require(_verify(req, signature), "Invalid signature");

        _nonces[req.from]++;

        (bool success, ) = req.to.call{value: req.value, gas: req.gas}(abi.encodePacked(req.data, req.from));
        require(success, "Transaction failed");

        emit Forwarded(req.from, req.to, req.data, _nonces[req.from]);

        if (isERC20Transfer(req.data)) {
            (address recipient, uint256 amount) = decodeERC20Transfer(req.data);
            emit ERC20Transferred(req.to, req.from, recipient, amount);
        } else if (isERC721Transfer(req.data)) {
            (address recipient, uint256 tokenId) = decodeERC721Transfer(req.data);
            emit ERC721Transferred(req.to, req.from, recipient, tokenId);
        }
    }

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

    function isERC20Transfer(bytes memory data) internal pure returns (bool) {
        bytes4 selector = bytes4(data);
        return selector == bytes4(keccak256("transfer(address,uint256)"));
    }

    function decodeERC20Transfer(bytes memory data) internal pure returns (address, uint256) {
        require(data.length >= 4 + 32 + 32, "Invalid data length for ERC-20 transfer");
        address recipient;
        uint256 amount;
        assembly {
            recipient := mload(add(data, 36))
            amount := mload(add(data, 68))
        }
        return (recipient, amount);
    }

    function isERC721Transfer(bytes memory data) internal pure returns (bool) {
        bytes4 selector = bytes4(data);
        return selector == bytes4(keccak256("safeTransferFrom(address,address,uint256)"));
    }

    function decodeERC721Transfer(bytes memory data) internal pure returns (address, uint256) {
        require(data.length >= 4 + 32 + 32 + 32, "Invalid data length for ERC-721 transfer");
        address from;
        address recipient;
        uint256 tokenId;
        assembly {
            from := mload(add(data, 36))
            recipient := mload(add(data, 68))
            tokenId := mload(add(data, 100))
        }
        return (recipient, tokenId);
    }
}