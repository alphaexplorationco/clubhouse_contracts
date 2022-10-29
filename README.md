# Clubhouse contracts

Clubhouse's Solidity smart contracts.

## Setup

### Setup Environment

`yarn install` - to install all of the components for the project

### Building

This project uses the [hardhat](https://hardhat.org/) ethereum tools for solidity compiling and running a virtual ethereum environment for testing.

`yarn deploy:test` - will compile the solidity code and generate your contract artifacts (in the /artifacts directory), and generate all of the necessary types. This will also deploy all contracts to the local hardhat network using scripts in `deploy/` and the `hardhat-deploy` plugin. Contract addresses and ABIs will be written to `deploy.json`

`yarn deploy:staging` - will do the same as the command above, but using the Goerli testnet instead of the local Hardhat network. This requires OpenZeppelin Defender credentials for a relayer and an autotask to be present in the local `.env` file

### Lint

`yarn lint` - will run prettier formatting on all source files

### Coverage
`yarn hardhat coverage` will produce a test coverage report for all smart contracts (using solcover)

## Running locally

### Testing

`yarn hardhat test` - run the unit tests

## Contracts

# MembershipERC721
An extension of the OpenZeppelin's upgradeable ERC721 contract that add's additional metadata for subscriptions

# MembershipERC721Factory
A proxy factory for MembershipERC721, using the Beacon Proxy pattern to create multiple upgradeable replicas of the underlying contract

# fixtures/forwarder.sol
This file allows us to include OpenZeppelin's meta-transaction forwarder contracts for use with OpenZeppelin Defender Relays
