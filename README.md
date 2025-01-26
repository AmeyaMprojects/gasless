# Gasless transactions

 this project is a forwarder contract that lets users send ERC-20, and ERC-721 transactions without paying gas fees.

## Getting Started

### Prerequisites

Make sure you have the following installed:

- [Node.js](https://nodejs.org/)
- [npm](https://www.npmjs.com/)
- [Hardhat](https://hardhat.org/)
- [vite](https://vitejs.dev/)

### Installation

Clone the repository and install the dependencies:

```shell
git clone https://github.com/AmeyaMprojects/gasless
```

## Usage

Try running some of the following tasks:

```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat ignition deploy ./ignition/modules/Lock.js
```

### Running Tests

To run the tests, use the following command:

```shell
npx hardhat test
```

### Deploying the Contract

To deploy the contract, use the Hardhat Ignition module:

```shell
npx hardhat ignition deploy ./ignition/modules/Lock.js
```

## Project Structure

- `contracts/`: Contains the Solidity contracts.
- `test/`: Contains the test scripts.
- `scripts/`: Contains the deployment scripts.
- `ignition/modules/`: Contains the Hardhat Ignition modules.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

This project is licensed under the MIT License.
