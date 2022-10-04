import { DefenderRelayProvider, DefenderRelaySigner } from 'defender-relay-client/lib/ethers';
import { ethers } from 'hardhat';

async function main() {
  require('dotenv').config();
  const credentials = {apiKey: process.env.GOERLI_DEFENDER_RELAY_API_KEY, apiSecret: process.env.GOERLI_DEFENDER_RELAY_API_SECRET};
  const provider = new DefenderRelayProvider(credentials);
  const relaySigner = new DefenderRelaySigner(credentials, provider, { speed: 'fast' });

  const name = "TestMembershipERC721"
  const symbol = "TM"
  const MembershipERC721 = await ethers.getContractFactory("MembershipERC721");
  const membership = await MembershipERC721.connect(relaySigner).deploy(name, symbol).then(f => f.deployed());

  await membership.deployed();

  console.log(`MembershipERC721 deployed to ${membership.address} with name = ${name} and symbol = ${symbol}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
