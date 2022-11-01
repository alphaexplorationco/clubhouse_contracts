import {HardhatRuntimeEnvironment} from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { deployContract } from '../src/hardhatDeployUtils';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    // Deploy Baal singleton
    const baalSingletonAddress = await deployContract(hre, "Baal");

    // Deploy Gnosis Safe contract
    const gnosisSafeSingletonAddress = await deployContract(hre, "GnosisSafe")

    // Deploy Gnosis Safe factory
    const gnosisSafeProxyFactoryAddress = await deployContract(hre, "GnosisSafeProxyFactory")

    // Deply module proxy factory
    const moduleProxyFactoryAddress = await deployContract(hre, "ModuleProxyFactory")

    // Deply compatibilit fallback handler
    const compatibilityFallbackHandler = await deployContract(hre, "CompatibilityFallbackHandler")

    // Deploy multisend contract
    const multisendAddress = await deployContract(hre, "MultiSend")

    // Deploy weth for loot and shares
    const lootSingletonAddress = await deployContract(hre, "Loot")
    const sharesSingletonAddress = await deployContract(hre, "Shares")

    // Deploy Baal summoner
    await deployContract(
        hre, 
        "BaalSummoner",
        baalSingletonAddress, 
        gnosisSafeSingletonAddress, 
        compatibilityFallbackHandler, 
        multisendAddress,
        gnosisSafeProxyFactoryAddress,
        moduleProxyFactoryAddress,
        lootSingletonAddress,
        sharesSingletonAddress, 
    )   
};
export default func;
func.tags = ['hardhat', 'baal'];