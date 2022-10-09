import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@openzeppelin/hardhat-upgrades";
import "hardhat-deploy";
import "@nomiclabs/hardhat-ethers";

const config: HardhatUserConfig = {
  solidity: "0.8.17",
  networks: {
    goerli: {
      url: "https://rpc.goerli.mudit.blog",
      chainId: 5
    }
  },
  hardhat: {
    live: false,
    saveDeployments: true,
    tags: ["local"]
  }
};

export default config;
