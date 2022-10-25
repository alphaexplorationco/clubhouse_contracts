import {HardhatRuntimeEnvironment} from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { deployContract } from '../src/hardhatDeployUtils';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const testNFTContractName = "TestERC721"
  const trustedForwarderAddress = (await hre.deployments.get("MinimalForwarder")).address
  await deployContract(hre, testNFTContractName, trustedForwarderAddress)
};
func.tags = ['test'];
export default func;