import {HardhatRuntimeEnvironment} from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { deployContract } from '../src/hardhatDeployUtils';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const testNFTContractName = "TestERC721"
  await deployContract(testNFTContractName, hre)
};
func.tags = ['test'];
func.skip =async (hre: HardhatRuntimeEnvironment) => {
    return true
}
export default func;