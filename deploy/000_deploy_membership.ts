import {HardhatRuntimeEnvironment} from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { deployContract, getSignerForNetwork, LOCAL_CHAINS, SUPPORTED_CHAINS } from '../src/hardhatDeployUtils';
import { ethers } from 'hardhat';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {

  // Deploy implementation
  const membershipImplementationName = "MembershipERC721"
  const membershipImplemenationAddress = await deployContract(hre, membershipImplementationName)

  // Deploy factory
  const membershipFactoryName = "MembershipERC721Factory"
  let signer = undefined
  if(hre.network.name in ["hardhat", "localhost"]){
    [signer] = await ethers.getSigners()
  } else {
    // TODO(akshaan): Replace with multisig so that upgrade beacon is not owned by relayer
    signer = await getSignerForNetwork(hre)
  }
  const [beaconOwner] = await ethers.getSigners() 
  await deployContract(hre, membershipFactoryName, [membershipImplemenationAddress, await signer.getAddress()])
};
export default func;
func.tags = ['membership'];
