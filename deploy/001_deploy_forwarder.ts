import {HardhatRuntimeEnvironment} from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { deployContract, getSignerForNetwork, saveDeployArtifact, SUPPORTED_CHAINS } from '../src/hardhatDeployUtils';
import { ethers } from 'hardhat';
import { Contract } from 'ethers';

// Forwarder is already deployed to some networks by OpenGSN, so save those addresses here
const FORWARDER_CONTRACT_ADDRESSES = {
  polygon: "0xdA78a11FD57aF7be2eDD804840eA7f4c2A38801d" // Polygon mainnet
}

async function registerDomainSeparator(contract: Contract) {
  const txReceipt = await (await contract.functions.registerDomainSeparator("ClubhouseForwarder", "1.0.0")).wait()
  const event = (await txReceipt.events)[0]
  const domainHash = await event.args.domainValue
  const domainValue = await event.args.domainSeparator
  console.log(`✔ Registered domain separator for Forwarder with domainHash = ${domainHash}, domainValue= ${domainValue}`)
}

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const forwarderContractName = "Forwarder"
  const networkName = hre.network.name
  const ContractFactory = await ethers.getContractFactory(forwarderContractName)

  if (networkName in FORWARDER_CONTRACT_ADDRESSES) {
    const contractAddress = FORWARDER_CONTRACT_ADDRESSES[networkName as keyof typeof FORWARDER_CONTRACT_ADDRESSES]
    const signer = await getSignerForNetwork(hre)
    const contract = ContractFactory.attach(contractAddress).connect(signer)
    console.log(`Saving artifact for existing singleton contract ${forwarderContractName}.sol ...`);
    await saveDeployArtifact(hre, forwarderContractName, contract)
    await registerDomainSeparator(contract)
  } else {
    const contractAddress = await deployContract(hre, forwarderContractName)
    const contract = ContractFactory.attach(contractAddress)
    await registerDomainSeparator(contract)
  }
 
};
export default func;
func.tags = ['forwarder', ...SUPPORTED_CHAINS];