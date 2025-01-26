# Gasless transactions

 this project is a forwarder contract that lets users send ERC-20, and ERC-721 transactions without paying gas fees.

## Getting Started

### Prerequisites

Make sure you have the following installed:

- [Node.js](https://nodejs.org/)
- [Express.js](https://expressjs.com/)
- [npm](https://www.npmjs.com/)
- [Hardhat](https://hardhat.org/)
- [vite](https://vitejs.dev/)
- [ether](https://docs.ethers.org/v6/)

### Installation

Clone the repository and install the dependencies:

```shell
git clone https://github.com/AmeyaMprojects/gasless
```



### Running Tests

To run the tests, use the following command:

```shell
npx hardhat test
```

### Deploying the Contract

To deploy the contract, use the Hardhat Ignition module:

```shell
npx hardhat run scripts/deploy.js --network localhost
```

## Project Structure

- `contracts/`: Contains the Solidity contracts.
- `test/`: Contains the test scripts.
- `scripts/`: Contains the deployment scripts.
- `ignition/modules/`: Contains the Hardhat Ignition modules.
- `artifacts/contracts/GaslessForwarder.sol/GaslessForwarder.json`: Contains the ABI format.
- `gasless-backend/`: Contains the backend files and `index.js`.
- `gasless-frontend/`: Contains the frontend files.


## Procedure ( after all the dependencies are installed )
#### to note that the terminal we used is bash
- In the root directory run the following command:
```shell
npx hardhat node
```
- Now in a new terminal in same root directtory run this command and copy the deployment address.
```shell
npx hardhat run scripts/deploy.js --network localhost
```
- In the directory `gasless-backend/` update the `FORWARDER_ADDRESS` in the `.env` as deployment address and run the following command: 

<!-- upate both env files  -->


<!--  now  -->
<!-- cd gassless-backend -->
```shell
node index.js
```

<!-- new terminal -->
- In the directory `gasless-frontend/` run the following command:
```shell
npm run dev
```
- The frontend should now open in the default browser and can now proceed to do the transactions.
- Choose any wallet and on the new page enter the recipient address and the ammount to be transacted.

<!-- recipient address form the hardhat local server that we inits -->
- You can get the Recipient address from the command that you ran peviously `npx hardhat run scripts/deploy.js --network localhost`, choose any one of the many adresses.
<!-- somewhere write to change relayer private key too -->

### future updates

dynamically update the recipient address and other details in the .env file
