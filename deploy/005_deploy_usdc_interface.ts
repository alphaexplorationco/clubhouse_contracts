import {HardhatRuntimeEnvironment} from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { deployContract, saveDeployArtifact, SUPPORTED_CHAINS } from '../src/hardhatDeployUtils';
import { ethers } from 'hardhat';

const USDC_CONTRACT_ADDRESSES = {
    "polygon": "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
    "goerli": "0x5FfbaC75EFc9547FBc822166feD19B05Cd5890bb",
    "mumbai": "0x2058A9D7613eEE744279e3856Ef0eAda5FCbaA7e",
}

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) { 
    if (SUPPORTED_CHAINS.includes(hre.network.name)) {
        const usdcAddress = USDC_CONTRACT_ADDRESSES[hre.network.name as keyof typeof USDC_CONTRACT_ADDRESSES]
        console.log(usdcAddress)
        const usdcContract = await ethers.getContractAt("IERC20", usdcAddress)
        console.log("Saving interface artifac for USDC contract ...")
        saveDeployArtifact(hre, "USDC", usdcContract)
    } else {
        deployContract(hre, "TestERC20")
    }
};
export default func;
func.tags = ['hardhat', 'usdc', ...SUPPORTED_CHAINS];