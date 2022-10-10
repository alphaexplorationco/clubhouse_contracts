import {HardhatRuntimeEnvironment} from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { deployContract } from '../src/hardhatDeployUtils';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const testNFTContractName = "TestERC721"
  await deployContract(hre, testNFTContractName)
};
func.tags = ['test'];
func.skip =async (hre: HardhatRuntimeEnvironment) => {
  return !["hardhat", "localhost", "goerli"].includes(hre.network.name)
}
export default func;