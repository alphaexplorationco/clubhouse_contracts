import {HardhatRuntimeEnvironment} from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { updateDefenderAutotaskCodeForNetwork } from '../src/hardhatDeployUtils';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    // Skip autotask update when deploying to local network
    if(hre.network.name == "hardhat"){
        return
    }

    await updateDefenderAutotaskCodeForNetwork(hre)

};
export default func;
func.tags = ['goerli', 'mumbai', 'polygon', 'autotask'];