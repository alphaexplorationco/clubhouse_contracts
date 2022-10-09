import {HardhatRuntimeEnvironment} from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { ethers } from 'hardhat';
import { getSignerForNetwork } from '../src/hardhatDeployUtils'
import { string } from 'hardhat/internal/core/params/argumentTypes';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const forwarderContractName = "SingleRelayForwarder" 
  console.log(`Deploying contract ${forwarderContractName}`)

  const signer = await getSignerForNetwork(hre.network.name)   
  const Forwarder = await ethers.getContractFactory(forwarderContractName)
  console.log(`\tCreated contract factory for ${forwarderContractName}`)

  const forwarder = await Forwarder.connect(signer)
    .deploy()
    .then((f) => f.deployed())
  console.log(`\tDeployed ${forwarderContractName} to ${hre.network.name} (chainID = ${await hre.getChainId()}) at address ${forwarder.address}`)
};
export default func;