import {HardhatRuntimeEnvironment} from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { LOCAL_CHAINS, SUPPORTED_CHAINS, updateDefenderAutotaskCodeForNetwork } from '../src/hardhatDeployUtils';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    // Skip autotask update when deploying to local network
    if(LOCAL_CHAINS.includes(hre.network.name)){
        return
    }

    await updateDefenderAutotaskCodeForNetwork(hre)

};
export default func;
func.tags = ['autotask'];