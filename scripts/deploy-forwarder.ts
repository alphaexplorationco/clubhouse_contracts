import { DefenderRelayProvider, DefenderRelaySigner } from 'defender-relay-client/lib/ethers';
import { ethers } from 'hardhat';

async function main() {
  require('dotenv').config();
  const credentials = {apiKey: process.env.GOERLI_DEFENDER_RELAY_API_KEY, apiSecret: process.env.GOERLI_DEFENDER_RELAY_API_SECRET};
  const provider = new DefenderRelayProvider(credentials);
  const relaySigner = new DefenderRelaySigner(credentials, provider, { speed: 'fast' });
  const chainId = await relaySigner.getChainId()
 
  const forwarderContractName = "MinimalForwarder"
  const Paymaster = await ethers.getContractFactory(forwarderContractName)
  const paymaster = await Paymaster.connect(relaySigner)
    .deploy()
    .then((f) => f.deployed())
  console.log(`${forwarderContractName} address: ${paymaster.address}`)

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
