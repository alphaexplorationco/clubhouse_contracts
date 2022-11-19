import {HardhatRuntimeEnvironment} from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { deployContract } from '../src/hardhatDeployUtils';
import { ethers } from 'hardhat';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const forwarderContractName = "Forwarder" 
  const contractAddress = await deployContract(hre, forwarderContractName)
  
  // Register domain separator
  const ContractFactory = await ethers.getContractFactory("Forwarder")
  const contract = ContractFactory.attach(contractAddress)
  const txReceipt = await (await contract.functions.registerDomainSeparator("ClubhouseForwarder", "1.0.0")).wait()
  const domainHash = await txReceipt.events.slice(-1)[0].args.domainSeparator
  const domainValue = await txReceipt.events.slice(-1)[0].args.domainValue
  console.log(`✔ Registered domain separator for Forwarder with domainHash = ${domainHash}, domainValue= ${domainValue}`)
};
export default func;
func.tags = ['hardhat', 'goerli', 'forwarder'];