import {HardhatRuntimeEnvironment} from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { deployContract } from '../src/hardhatDeployUtils';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const forwarderContractName = "SingleRelayForwarder" 
  await deployContract(hre, forwarderContractName)
};
export default func;