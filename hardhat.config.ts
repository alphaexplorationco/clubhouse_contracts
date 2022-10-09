import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@openzeppelin/hardhat-upgrades";
import "hardhat-deploy";

const config: HardhatUserConfig = {
  solidity: "0.8.17",
};

export default config;
