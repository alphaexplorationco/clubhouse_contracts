import {HardhatRuntimeEnvironment} from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { deployContract } from '../src/hardhatDeployUtils';
import { ethers } from 'hardhat';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {

  // Deploy implementation
  const membershipImplementationName = "MembershipERC721"
  const membershipImplemenationAddress = await deployContract(hre, membershipImplementationName)

  // Deploy factory
  const membershipFactoryName = "MembershipERC721Factory"
  const [beaconOwner] = await ethers.getSigners() 
  await deployContract(hre, membershipFactoryName, membershipImplemenationAddress, beaconOwner.address)
};
export default func;
func.tags = ['hardhat', 'goerli', 'mumbai', 'polygon', 'membership'];
