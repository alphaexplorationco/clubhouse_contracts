# Clubhouse contracts

Clubhouse's Solidity smart contracts.

## Setup

### Setup Environment

`yarn install` - to install all of the components for the project

### Building

This project uses the [hardhat](https://hardhat.org/) ethereum tools for solidity compiling and running a virtual ethereum environment for testing.

`yarn deploy:hardhat` - will compile the solidity code and generate your contract artifacts (in the /artifacts directory), and generate all of the necessary types. This will also deploy all contracts to the local hardhat network using scripts in `deploy/` and the `hardhat-deploy` plugin (See the Deploying section for more details). Contract addresses and ABIs will be written to `deploy.json`

`yarn deploy:goerli` - will do the same as the command above, but using the Goerli testnet instead of the local Hardhat network. This requires OpenZeppelin Defender credentials for a relayer and an autotask to be present in the local `.env` file

### Lint

`yarn lint` - will run prettier formatting on all source files

### Coverage
`yarn hardhat coverage` will produce a test coverage report for all smart contracts (using solcover)

### Testing

`yarn hardhat test` - run the unit tests

### Deploying

Contracts in this repo can be deployed with the convenience commands defined in `package.json`.

`yarn hardhat deploy:hardhat` - Run scripts in `/deploy` for the local hardhat network using [hardhat-deploy](https://www.npmjs.com/package/hardhat-deploy). This will overwrite older deployments and write new artifacts to `deploy.json`.

`yarn hardhat deploy:goerli` - Same as above but for Goerli.

#### Caveats
N.b while deploys use the `hardhat-deploy` plugin to execute scripts and save artifacts etc., a [custom function](https://github.com/alphaexplorationco/clubhouse_contracts/blob/2024199de569ffc4548cbf983acae2b9e399d01d/src/hardhatDeployUtils.ts#L129) is called under the hood to do the actual deployments. This is because `hardhat-deploy` does not support custom signers out of the box, and these are required to deploy contracts via [OpenZeppelin Defender Relays](https://docs.openzeppelin.com/defender/relay). Specifically, the deploy process does not support checking for differences between the current and previous deploy, and will always create new artifacts.

#### Tags
Some deploy scripts are environment-specific (i.e. local hardhat network, testnet etc.). The tags feature from `hardhat-deploy` is used to make this distinction. These are found at the end of each deploy script as `func.tags = ['tag1', 'tag2', ...];`. The `yarn deploy:hardhat` and `yarn deploy:goerli` commands run scripts with tags `hardhat` and `goerli` respectively.

#### Deploy scripts
`deploy/000_deploy.ts` - Deploys an instance of the `MembershipERC721` implementation and a beacon proxy factory (`MembershipERC721ProxyFactory`) pointing to that implementation.

`deploy/001_deploy_minimal_forwarder.ts` - Deploys an instance of the `Forwarder` implementation and a transparent proxy + admin pointing to that implementation. This is managed by helpers from [@openzeppelin/hardhat-upgrades](https://docs.openzeppelin.com/upgrades-plugins/1.x/hardhat-upgrades). N.b while this deploy uses helpers from `@openzeppelin/hardhat-upgrades` to check upgrade safety, a [custom function](https://github.com/alphaexplorationco/clubhouse_contracts/blob/2024199de569ffc4548cbf983acae2b9e399d01d/src/hardhatDeployUtils.ts#L87) is called under the hood to do the actual deployments. This is because the `deployProxy` function from the plugin does not support custom signers out of the box, and these are required to deploy contracts via [OpenZeppelin Defender Relays](https://docs.openzeppelin.com/defender/relay).

`deploy/002_update_autotask_code.ts` - Updated the [OpenZeppelin Defender Autotask]() with code from `src/relayAutotask.js` along with the latest `deploy.json`. This Autotask is reponsible for receiving meta-transactions and sending them to the forwarder with gas from the associated relay. This is only applicable to `staging` (i.e. testnet) deploys.

`deploy/003_deploy_test_nft.ts` - Deploys a test ERC721 contract which accepts ERC-721 meta transactions. For testing only. This script runs only for local (hardhat network) deploys.

`deploy/004_deploy_baal.ts` - Deploys contracts present in the [hausdao/Baal](https://github.com/HausDAO/Baal) dependency for local testing. This script only runs for local (hardhat network) deploys.

## Contracts

### MembershipERC721
An extension of the OpenZeppelin's upgradeable ERC721 contract that add's additional metadata for subscriptions

### MembershipERC721Factory
A proxy factory for MembershipERC721, using the Beacon Proxy pattern to create multiple upgradeable replicas of the underlying contract

### Forwarder.sol
An extension of OpenZeppelin's MinimalForwarderUpgradeable.sol contract that allows us to forward meta-transactions (EIP-2771) to contracts that support it. This is used in conjunction with [OpenZeppelin Defender Relays](https://docs.openzeppelin.com/defender/relay). This contract is deployed with the [@openzeppelin/hardhat-upgrades](https://docs.openzeppelin.com/upgrades-plugins/1.x/hardhat-upgrades) plugin which ensures upgrades are valid and saves its state in `.openzeppelin`.
