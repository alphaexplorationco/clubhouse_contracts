import {HardhatRuntimeEnvironment} from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { deployContract, getSignerForNetwork, LOCAL_CHAINS, saveDeployArtifact, SUPPORTED_CHAINS } from '../src/hardhatDeployUtils';
import { ethers } from 'hardhat';
import { deployments } from "@daohaus/baal-contracts/src/addresses/deployed.js";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    // If local chain, deploy all Baal contracts
    if(LOCAL_CHAINS.includes(hre.network.name)) {
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
        const baalSummonerAddress = await deployContract(
            hre, 
            "BaalSummoner",
        )
        const baalSummoner = await ethers.getContractAt("BaalSummoner", baalSummonerAddress)
        await baalSummoner.initialize()
        await baalSummoner.setAddrs( 
            baalSingletonAddress, 
            gnosisSafeSingletonAddress, 
            compatibilityFallbackHandler, 
            multisendAddress,
            gnosisSafeProxyFactoryAddress,
            moduleProxyFactoryAddress,
            lootSingletonAddress,
            sharesSingletonAddress, 
        )
    } else { // For non-local chains, save artifacts with baal addresses
        console.log(`Creating Baal contract artifacts...`)
        if (hre.network.name === "mumbai") {
            var addresses = {
                lootSingleton: "0x96C615CdD8DF36fb634d629fA053D2BB567D418f",
                sharesSingleton: "0x2DC90B0647f5A7EbE00B8F3De5e6e0DE47d507B7",
                baalSingleton: "0x632B887d0A32d5Ace37af3ac14B94F3AF0352Cab",
                factory: "0x32e4346217ACec790C43EbCDf0AF5BA3E80044Dd",
            }
        } else {
            var addresses = deployments[0].addresses
        }

        const signer = await getSignerForNetwork(hre)
        const baalSummoner = (await ethers.getContractFactory("BaalSummoner")).attach(addresses.factory).connect(signer)
        await saveDeployArtifact(hre, "BaalSummoner", baalSummoner)

        const shares = await ethers.getContractAt("Shares", addresses.sharesSingleton)
        await saveDeployArtifact(hre, "Shares", shares)

        const loot = await ethers.getContractAt("Loot", addresses.lootSingleton)
        await saveDeployArtifact(hre, "Loot", loot)

        const mutlisend = await ethers.getContractAt("MultiSend", await baalSummoner.gnosisMultisendLibrary())
        await saveDeployArtifact(hre, "MultiSend", mutlisend)

        const baal = await ethers.getContractAt("Baal", addresses.baalSingleton)
        await saveDeployArtifact(hre, "Baal", baal)
    }
};
export default func;
func.tags = ['baal'];