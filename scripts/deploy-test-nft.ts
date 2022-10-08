import { DefenderRelayProvider, DefenderRelaySigner } from 'defender-relay-client/lib/ethers';
import { ethers } from 'hardhat';

async function main() {
  require('dotenv').config();
  const credentials = {apiKey: process.env.GOERLI_DEFENDER_RELAY_API_KEY, apiSecret: process.env.GOERLI_DEFENDER_RELAY_API_SECRET};
  const provider = new DefenderRelayProvider(credentials);
  const relaySigner = new DefenderRelaySigner(credentials, provider, { speed: 'fast' });

  const contractName = "TestERC721" 
  const TestERC721 = await ethers.getContractFactory(contractName);
  const test = await TestERC721.connect(relaySigner).deploy("0xB320a8E421f56Bac645B01b92711F65d46CCB03E").then(f => f.deployed());

  await test.deployed();

  console.log(`TestERC721 deployed to ${test.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
