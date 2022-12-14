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
        live: true,
      },
      hardhat: {
        live: false,
        saveDeployments: true,
      },
      mumbai: {
        url: "https://rpc-mumbai.maticvigil.com/",
        chainId: 80001,
        live: true,
      },
      polygon: {
        url: "https://polygon-rpc.com/",
        chainId: 137,
        live: true,
      }
  },
  paths: {
      deploy: "deploy",
      deployments: "deployments",
      imports: "node_modules/@daohaus/baal-contracts/artifacts"
  }
};

export default config;
