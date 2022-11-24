import {HardhatRuntimeEnvironment} from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { saveDeployArtifact, SUPPORTED_CHAINS } from '../src/hardhatDeployUtils';
import { ethers } from 'hardhat';
import { Contract } from 'ethers';

const USDC_CONTRACT_ADDRESSES = {
    "polygon": "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
    "goerli": "0x5FfbaC75EFc9547FBc822166feD19B05Cd5890bb",
    "mumbai": "0x2058A9D7613eEE744279e3856Ef0eAda5FCbaA7e",
}

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) { 
    let usdcContract: Contract;
    if (SUPPORTED_CHAINS.includes(hre.network.name)) {
        const usdcAddress = USDC_CONTRACT_ADDRESSES[hre.network.name as keyof typeof USDC_CONTRACT_ADDRESSES]
        usdcContract = await ethers.getContractAt("USDC", usdcAddress)
        console.log("Saving interface artifact for USDC contract ...")
    } else {
        const USDC = await ethers.getContractFactory("TestERC20")
        const deployedContract = await USDC.deploy().then(f => f.deployed())  
        usdcContract = await ethers.getContractAt("USDC", deployedContract.address)
    }
    await saveDeployArtifact(hre, "IERC20", usdcContract)
};
export default func;
func.tags = ['usdc'];