import {HardhatRuntimeEnvironment} from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { deployContract } from '../src/hardhatDeployUtils';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const membershipContractName = "MembershipERC721"
  await deployContract(hre, membershipContractName)
};
export default func;