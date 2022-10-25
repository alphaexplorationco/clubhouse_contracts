import { HardhatUserConfig, task } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@openzeppelin/hardhat-upgrades";
import "hardhat-deploy";
import "@nomiclabs/hardhat-ethers";
import "solidity-coverage"


const config: HardhatUserConfig = {
  solidity: "0.8.17",
  networks: {
      goerli: {
        url: "https://rpc.goerli.mudit.blog/",
        chainId: 5,
        tags: ["testnet"],
        live: true,
      },
      hardhat: {
        live: false,
        saveDeployments: true,
        tags: ["local"]
      },
  },
  paths: {
      deploy: "deploy",
      deployments: "deployments",
      imports: "node_modules/@daohaus/baal-contracts/artifacts"
  }
};

export default config;
