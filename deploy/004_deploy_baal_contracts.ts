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
                lootSingleton: "0x1d0f5D1f5E1FB74a86c19309368D434E9f7BB608",
                sharesSingleton: "0x594AF060c08EeA9f559Bc668484E50596BcB2CFB",
                baalSingleton: "0x51498dDdd2A8cdeC82932E08A37eBaF346C38EFd",
                factory: "0x3840453a3907916113dB88bFAc2349533a736c64",
                valutFactory: "0xbB907b1a769bD338c9d09Fb20C2997ECE5E715a3",
                tributeMinion: "0x898fc00771c148257a7edbdAD33c1469F4420740",
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