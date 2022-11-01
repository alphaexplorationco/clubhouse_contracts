import {HardhatRuntimeEnvironment} from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { deployContract } from '../src/hardhatDeployUtils';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {

  // Deploy implementation
  const membershipImplementationName = "MembershipERC721" 
  const membershipImplemenationAddress = await deployContract(hre, membershipImplementationName)

  // Deploy factory
  const membershipFactoryName = "MembershipERC721Factory"
  await deployContract(hre, membershipFactoryName, membershipImplemenationAddress)
};
export default func;
func.tags = ['hardhat', 'goerli', 'membership'];