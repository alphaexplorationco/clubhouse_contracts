import {HardhatRuntimeEnvironment} from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { getSignerForNetwork } from '../src/hardhatDeployUtils';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const forwarderContractName = "SingleRelayForwarder" 
  console.log(`Deploying contract ${forwarderContractName}`)

  /*
  const Forwarder = await ethers.getContractFactory(forwarderContractName)
  console.log(`\tCreated contract factory for ${forwarderContractName}`)

  const forwarder = await Forwarder.connect(signer)
    .deploy()
    .then((f) => f.deployed())
  console.log(`\tDeployed ${forwarderContractName} to ${hre.network.name} (chainID = ${await hre.getChainId()}) at address ${forwarder.address}`)
  */

	const {deployments, getNamedAccounts} = hre;
	const {deploy} = deployments;
  const signer = await getSignerForNetwork(hre.network.name)   

  await deploy(forwarderContractName, {
		from: await signer.getAddress(),
		args: [],
		log: true,
		autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
	});
};
export default func;