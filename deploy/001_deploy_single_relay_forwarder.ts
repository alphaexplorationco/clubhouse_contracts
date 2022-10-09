import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';
import { DefenderRelayProvider, DefenderRelaySigner } from 'defender-relay-client/lib/ethers';
import { ethers } from 'hardhat';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  require('dotenv').config();
  const credentials = {apiKey: process.env.GOERLI_DEFENDER_RELAY_API_KEY, apiSecret: process.env.GOERLI_DEFENDER_RELAY_API_SECRET};
  const provider = new DefenderRelayProvider(credentials);
  const relaySigner = new DefenderRelaySigner(credentials, provider, { speed: 'fast' });
  const chainId = await relaySigner.getChainId()
 
  const Forwarder = await ethers.getContractFactory("SingleRelayForwarder")
  const forwarder = await Forwarder.connect(relaySigner)
    .deploy()
    .then((f) => f.deployed())
  console.log(`${forwarder.name} address: ${forwarder.address}`)
};
export default func;