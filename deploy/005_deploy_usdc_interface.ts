import {HardhatRuntimeEnvironment} from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { deployContract, saveDeployArtifact, SUPPORTED_CHAINS } from '../src/hardhatDeployUtils';
import { ethers } from 'hardhat';
import { Contract } from 'ethers';

const USDC_CONTRACT_ADDRESSES = {
    "polygon": "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
    "goerli": "0x5FfbaC75EFc9547FBc822166feD19B05Cd5890bb",
    "mumbai": "0x2058A9D7613eEE744279e3856Ef0eAda5FCbaA7e",
}

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) { 
    console.log("Saving interface artifact for USDC contract ...")
    if (SUPPORTED_CHAINS.includes(hre.network.name)) {
        const usdcAddress = USDC_CONTRACT_ADDRESSES[hre.network.name as keyof typeof USDC_CONTRACT_ADDRESSES]
        const artifact = await hre.deployments.getArtifact("contracts/fixtures/USDC.sol:USDC")
        hre.deployments.save("USDC", {abi: artifact.abi, address: usdcAddress })
    } else {
        const USDC = await ethers.getContractFactory("contracts/test/USDC.sol:USDC")
        const usdc = await USDC.deploy().then(f => f.deployed())
        const artifact = await hre.deployments.getArtifact("contracts/test/USDC.sol:USDC")
        hre.deployments.save("USDC", {abi: artifact.abi, address: usdc.address })
    }
};
export default func;
func.tags = ['usdc'];