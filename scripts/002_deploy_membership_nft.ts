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
 
  const MembershipERC721 = await ethers.getContractFactory("MembershipERC721")
  const membershipERC721 = await MembershipERC721.connect(relaySigner)
    .deploy()
    .then((f) => f.deployed())
  console.log(`${membershipERC721.name} address: ${membershipERC721.address}`)
};
export default func;