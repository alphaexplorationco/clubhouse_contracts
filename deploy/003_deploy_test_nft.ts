import {HardhatRuntimeEnvironment} from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { deployContract } from '../src/hardhatDeployUtils';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const testNFTContractName = "TestERC721"
  const trustedForwarderAddress = (await hre.deployments.get("Forwarder")).address
  await deployContract(hre, testNFTContractName, trustedForwarderAddress)
};
export default func;
func.tags = ['hardhat', 'test_nft'];