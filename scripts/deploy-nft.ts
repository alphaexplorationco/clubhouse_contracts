import { DefenderRelayProvider, DefenderRelaySigner } from 'defender-relay-client/lib/ethers';
import { ethers } from 'hardhat';
import {saveContractAddress} from './utils';

async function main() {
  require('dotenv').config();
  const credentials = {apiKey: process.env.GOERLI_DEFENDER_RELAY_API_KEY, apiSecret: process.env.GOERLI_DEFENDER_RELAY_API_SECRET};
  const provider = new DefenderRelayProvider(credentials);
  const relaySigner = new DefenderRelaySigner(credentials, provider, { speed: 'fast' });
  const chainId = await relaySigner.getChainId()

  const contractName = "MembershipERC721" 
  const name = "TestMembershipERC721"
  const symbol = "TM"
  const MembershipERC721 = await ethers.getContractFactory(contractName);
  const membership = await MembershipERC721.connect(relaySigner).deploy(name, symbol).then(f => f.deployed());

  await membership.deployed();

  console.log(`MembershipERC721 deployed to ${membership.address} with name = ${name} and symbol = ${symbol}`);
  saveContractAddress(contractName, chainId, membership.address)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
