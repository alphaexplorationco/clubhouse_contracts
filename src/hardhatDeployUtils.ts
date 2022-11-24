import {
    DefenderRelayProvider,
    DefenderRelaySigner,
} from "defender-relay-client/lib/ethers";
import { Contract, Signer } from "ethers";
import { ethers, upgrades } from "hardhat";
import * as dotenv from "dotenv";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import ora from "ora";
import { AutotaskClient } from "defender-autotask-client";
import path from "path";
import fs from "fs";
import os from "os";
import { Provider } from "@ethersproject/providers";

dotenv.config();

// Supported chains
export const SUPPORTED_CHAINS = ["goerli", "polygon", "mumbai"]
export const LOCAL_CHAINS = ["hardhat", "localhost"]

// Chain config object
interface ChainConfig {
    name: string;
    // Chain-specific Relay API keys. These are chain specific and are used to manage
    // specific OpenzeppelinDefender relays
    // These can be found under each relay on the Defender UI
    defenderRelayApiSecret: string,
    defenderRelayApiKey: string;
    // Chain-specific Autotask ids. These are not easily visible in the UI, but can be copied
    // from the last segment of the URL when navigating to an autotask in the Defender UI.
    // This can also be obtained from the webhook URL for the autotask which is formatted as
    // https://api.defender.openzeppelin.com/autotasks/<AUTOTASK_ID>/...
    // These are used to programatically update the code for a particular autotask.
    defenderAutotaskId: string,
  }

// Team API Keys. These are chain agnostic and can be used to manage all
// instances of a particular OpenZeppelin Defender service.
// These can be found under the settings -> team api keys section on the Defender UI
const AUTOTASK_API_KEY = process.env.AUTOTASK_API_KEY || "";
const AUTOTASK_API_SECRET = process.env.AUTOTASK_API_SECRET || "";

// Spinner for stdout logging
const spinner = ora({
    discardStdin: true,
    spinner: "dots",
});

function getChainConfig(chainName: string): ChainConfig {
    const envVarPrefix = chainName.toUpperCase()
    return {
        name: chainName,
        defenderRelayApiKey: process.env[`${envVarPrefix}_DEFENDER_RELAY_API_KEY`] || "",
        defenderRelayApiSecret: process.env[`${envVarPrefix}_DEFENDER_RELAY_API_SECRET`] || "",
        defenderAutotaskId: process.env[`${envVarPrefix}_AUTOTASK_URL`]!.split("/")[4] || "",
    }
}

function getDefenderRelaySignerAndProvider(
    apiKey: string,
    apiSecret: string
): [Signer, DefenderRelayProvider] {
    if(getDefenderRelaySignerAndProvider._cache.relaySigner && getDefenderRelaySignerAndProvider._cache.provider){
        return [getDefenderRelaySignerAndProvider._cache.relaySigner, getDefenderRelaySignerAndProvider._cache.provider]
    } 
    const credentials = { apiKey: apiKey, apiSecret: apiSecret };
    const provider = new DefenderRelayProvider(credentials);
    const relaySigner = new DefenderRelaySigner(credentials, provider, {
        speed: "fast",
    });

    return [relaySigner, provider];
}
getDefenderRelaySignerAndProvider._cache = {relaySigner: undefined, provider: undefined}

export async function getSignerForNetwork(hre: HardhatRuntimeEnvironment): Promise<Signer> {
    const signerType = hre.network.name == "hardhat" ? "local" : "Defender Relay";
    spinner.start(`Creating ${signerType} signer`);
    let signer: Signer;
    let provider: Provider | DefenderRelayProvider;

    if(!SUPPORTED_CHAINS.includes(hre.network.name) && !LOCAL_CHAINS.includes(hre.network.name)){
        throw Error(
            `Cannot get signer for unrecognized network ${hre.network.name}. 
                Add network to hardhat.config.ts and API creds to this file and .env if using OpenZeppelin Defender`
        );
    }

    switch (hre.network.name) {
        case "localhost":
        case "hardhat":
            signer = (await ethers.getSigners())[0];
            if (signer.provider === undefined) {
                throw Error(`Cannot get provider for network ${hre.network.name}`);
            }
            provider = signer.provider;
            break;
        default:
            const config: ChainConfig = getChainConfig(hre.network.name);
            [signer, provider] = getDefenderRelaySignerAndProvider(
                config.defenderRelayApiKey,
                config.defenderRelayApiSecret,
            );
            break;
    }

    const signerChainId = await signer.getChainId();
    const runtimeChainId = Number(await hre.getChainId());
    // Swap out hardhat's default provider. This is so that the OpenZeppelin Hardhat Upgrades
    // plugin works when deploying to Goerli etc. via a relay. Without this, the plugin attempts
    // to fetch the default hre.network.provider.
    // @ts-ignore
    hre.network.provider = provider;
    if (signerChainId != runtimeChainId) {
        spinner.fail();
        throw Error(
            `Defender Relay signer chainId (${signerChainId}) does not match hardhat config chainId (${runtimeChainId})`
        );
    }
    spinner.succeed(
        `Created ${signerType} signer with address ${await signer.getAddress()}`
    );
    return signer;
}

export async function saveDeployArtifact(
    hre: HardhatRuntimeEnvironment,
    name: string,
    contract: Contract
): Promise<void> {
    spinner.start(`Saving artifact`);
    const artifact = await hre.deployments.getExtendedArtifact(name);
    const deploymentSubmission = {
        address: contract.address,
        ...artifact,
    };
    await hre.deployments.save(name, deploymentSubmission);

    spinner.succeed(`Saved artifacts to /deployments/${hre.network.name}/${name}.json`);
}

export async function updateDefenderAutotaskCodeForNetwork(
    hre: HardhatRuntimeEnvironment
): Promise<void> {
    console.log(`Updating Defender Autotask code...`);

    spinner.start(`Creating Autotask client`);

    if(!SUPPORTED_CHAINS.includes(hre.network.name)){
        spinner.fail(`Creating Autotask client`);
        throw Error(
            `Cannot update Defender Autotask for unrecognized network ${hre.network.name}`
        );
    }

    const credentials = { apiKey: AUTOTASK_API_KEY, apiSecret: AUTOTASK_API_SECRET };
    const autotaskClient = new AutotaskClient(credentials);
    var autotaskId = getChainConfig(hre.network.name).defenderAutotaskId;
    spinner.succeed(`Created autotask client`);

    spinner.start(`Fetching Forwarder contract ABI and address`);
    // Create forwarder.json in tempdir with forwarder contract address and ABI
    const forwarderDeployment = hre.deployments.get("Forwarder");
    const abi = (await forwarderDeployment).abi;
    const address = (await forwarderDeployment).address;
    spinner.succeed(`Fetched Forwarder contract ABI and address = ${address}`);

    // Create temp dir
    spinner.start(`Writing forwarder contract data and code template to temporary dir`);
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "autotaskUpdate"));

    // Write forwarder data to tempdir
    const forwarderData = JSON.stringify({
        abi: abi,
        address: address,
    });
    const outputPath = path.join(tmpDir, "forwarder.json");
    fs.writeFileSync(outputPath, forwarderData);

    // Copy code template to temp dir
    const templateCodeSrcPath = path.join(
        path.dirname(__dirname),
        "src",
        "relayAutotask.js"
    );
    const templateCodeDestPath = path.join(tmpDir, "index.js");
    fs.copyFileSync(templateCodeSrcPath, templateCodeDestPath);
    spinner.succeed();

    // Update autotask code
    spinner.start(`Updating Autotask code for autotaskId ${autotaskId}`);
    await autotaskClient.updateCodeFromFolder(autotaskId, tmpDir);
    spinner.succeed();

    // Clean up
    spinner.start(`Cleaning up temporary directory ${tmpDir}`);
    fs.rmSync(tmpDir, { recursive: true });
    spinner.succeed();
}

export async function deployContract(
    hre: HardhatRuntimeEnvironment,
    name: string,
    ...contractConstructorArgs: Array<any>
): Promise<string> {
    console.log(`Starting deploy for contract ${name}.sol ...`);

    // Get signer for network
    const signer = await getSignerForNetwork(hre);

    // Deploy contract
    spinner.start(
        `Deploying ${name} to ${hre.network.name} with args = ${contractConstructorArgs}`
    );
    const contractFactory = (await ethers.getContractFactory(name)).connect(signer);

    let contract: Contract;
    contract = await contractFactory
        .deploy(...contractConstructorArgs)
        .then((f) => f.deployed());
    await contract.deployed();

    spinner.succeed(
        `Deployed ${name} to ${hre.network.name} at address ${contract.address} with args = [${contractConstructorArgs}]`
    );

    // Save artifacts
    await saveDeployArtifact(hre, name, contract);

    return contract.address;
}

export async function deployTransparentUpgradeableContract(
    hre: HardhatRuntimeEnvironment,
    name: string,
    initializerName: string | false,
    ...contractConstructorArgs: Array<any>
): Promise<string> {
    console.log(`Starting deploy for contract ${name}.sol ...`);

    // Get signer for network
    const signer = await getSignerForNetwork(hre);

    // Deploy contract
    spinner.start(
        `Deploying ${name} to ${hre.network.name} with args = ${contractConstructorArgs}`
    );
    const contractFactory = (await ethers.getContractFactory(name)).connect(signer);

    let contract: Contract;
    contract = await upgrades.deployProxy(contractFactory, contractConstructorArgs, {
        timeout: 0,
        initializer: initializerName,
    });
    await contract.deployed();
    spinner.succeed(
        `Deployed ${name} to ${hre.network.name} at address ${contract.address} with args = [${contractConstructorArgs}]`
    );

    // Save artifacts
    await saveDeployArtifact(hre, name, contract);

    return contract.address;
}
