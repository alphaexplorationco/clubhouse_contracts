import {HardhatRuntimeEnvironment} from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { deployContract, LOCAL_CHAINS } from '../src/hardhatDeployUtils';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  if(LOCAL_CHAINS.includes(hre.network.name)){
    const testNFTContractName = "TestERC721"
    const trustedForwarderAddress = (await hre.deployments.get("Forwarder")).address
    await deployContract(hre, testNFTContractName, [trustedForwarderAddress])
  }
};
export default func;
func.tags = ['test_nft'];