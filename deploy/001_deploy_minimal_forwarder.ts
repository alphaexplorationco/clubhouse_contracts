import {HardhatRuntimeEnvironment} from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { deployTransparentUpgradeableContract } from '../src/hardhatDeployUtils';
import { upgrades } from 'hardhat';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const forwarderContractName = "Forwarder" 
  await deployTransparentUpgradeableContract(hre, forwarderContractName, "initialize")
};
export default func;
func.tags = ['test', 'staging', 'forwarder'];