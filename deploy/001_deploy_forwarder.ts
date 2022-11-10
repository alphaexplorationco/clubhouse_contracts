import {HardhatRuntimeEnvironment} from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { deployContract } from '../src/hardhatDeployUtils';
import { upgrades } from 'hardhat';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const forwarderContractName = "Forwarder" 
  await deployContract(hre, forwarderContractName)
};
export default func;
func.tags = ['hardhat', 'goerli', 'forwarder'];