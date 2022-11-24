import {
    DefenderRelayProvider,
    DefenderRelaySigner,
} from "defender-relay-client/lib/ethers";
import { Contract, ContractFactory, Signer } from "ethers";
import { ethers, upgrades } from "hardhat";
import * as dotenv from "dotenv";
import { Artifact, HardhatRuntimeEnvironment } from "hardhat/types";
import ora from "ora";
import { AutotaskClient } from "defender-autotask-client";
import path from "path";
import fs from "fs";
import os from "os";
import { Provider } from "@ethersproject/providers";
import { DeployOptions, Execute, Receipt } from "hardhat-deploy/types";
import { hrtime } from "process";
import { exec } from "child_process";

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

// Memoized so that provider etc. are not init-ed multiple times in the same deploy
const getDefenderRelaySignerAndProvider = (() => {
    let cache = {}
    return (hre: HardhatRuntimeEnvironment) => {
        if (hre.network.name in cache){
            const cachedValue = cache[hre.network.name as keyof typeof cache]
            return cachedValue
        } else {
            const config: ChainConfig = getChainConfig(hre.network.name);
            const apiKey = config.defenderRelayApiKey
            const apiSecret = config.defenderRelayApiSecret
            const credentials = { apiKey: apiKey, apiSecret: apiSecret };
            const provider = new DefenderRelayProvider(credentials);
            const relaySigner = new DefenderRelaySigner(credentials, provider, {
                speed: "safeLow",
            });
            cache[hre.network.name as keyof typeof cache] = [relaySigner, provider]
            return [relaySigner, provider]
        }
    }
})()

export async function getSignerForNetwork(hre: HardhatRuntimeEnvironment): Promise<Signer> {
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
            [signer, provider] = getDefenderRelaySignerAndProvider(
                hre,
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
        throw Error(
            `Defender Relay signer chainId (${signerChainId}) does not match hardhat config chainId (${runtimeChainId})`
        );
    }
    return signer;
}

async function getArtifactFromOptions(
    hre: HardhatRuntimeEnvironment,
    name: string,
    options: DeployOptions
  ): Promise<{
    artifact: Artifact;
    artifactName?: string;
  }> {
    let artifact: Artifact;
    let artifactName: string | undefined;
    if (options.contract) {
      if (typeof options.contract === 'string') {
        artifactName = options.contract;
        artifact = await hre.deployments.getArtifact(artifactName);
      } else {
        artifact = options.contract as Artifact; // TODO better handling
      }
    } else {
      artifactName = name;
      artifact = await hre.deployments.getArtifact(artifactName);
    }
    return {artifact, artifactName};
  }

async function fetchIfDifferent(
    hre: HardhatRuntimeEnvironment,
    signer: Signer,
    name: string,
    options: DeployOptions
  ): Promise<{differences: boolean; address?: string}> {
    options = {...options}; // ensure no change
    const argArray = options.args ? [...options.args] : [];

    const deployment = await hre.deployments.getOrNull(name);
    if (deployment) {
      if (options.skipIfAlreadyDeployed) {
        return {differences: false, address: undefined}; // TODO check receipt, see below
      }
      // TODO transactionReceipt + check for status
      let transactionDetailsAvailable = false;
      let transaction;
      if (deployment.receipt) {
        transactionDetailsAvailable = !!deployment.receipt.transactionHash;
        if (transactionDetailsAvailable) {
          transaction = await signer.provider!.getTransaction(
            deployment.receipt.transactionHash
          );
        }
      } else if (deployment.transactionHash) {
        transactionDetailsAvailable = true;
        transaction = await signer.provider!.getTransaction(deployment.transactionHash);
      }

      if (transaction) {
        const {artifact} = await getArtifactFromOptions(hre, name, options);
        const abi = artifact.abi;
        if(options.libraries) {
            throw Error("Library linking not supported when checking for deployment differences")
        }
        const factory = new ContractFactory(abi, artifact.bytecode, signer);
        const newTransaction = factory.getDeployTransaction(...argArray);
        const newData = newTransaction.data?.toString();
        if (transaction.data !== newData) {
            return {differences: true, address: deployment.address};
        }
        return {differences: false, address: deployment.address}; 
      } else {
        if (transactionDetailsAvailable) {
          throw new Error(
            `cannot get the transaction for ${name}'s previous deployment, please check your node synced status.`
          );
        } else {
          console.error(
            `no transaction details found for ${name}'s previous deployment, if the deployment is t be discarded, please delete the file`
          );
          return {differences: false, address: deployment.address};
        }
      }
    }
    return {differences: true, address: undefined};
  }

export async function saveDeployArtifact(
    hre: HardhatRuntimeEnvironment,
    name: string,
    contract: Contract,
    args: Array<any> = [],
    execute?: Execute,
): Promise<void> {
    spinner.start(`Saving artifact`);
    const artifact = await hre.deployments.getExtendedArtifact(name);
    const pastDeployments = await hre.deployments.getDeploymentsFromAddress(contract.address)
    const signer = getSignerForNetwork(hre)
    
    let txReceipt;
    if(contract.deployTransaction != null){
        txReceipt = await ((await signer).provider?.getTransactionReceipt(contract.deployTransaction.hash))
    } else {
        txReceipt = undefined
    }

    let executeArg
    if(execute == null){
        executeArg = undefined
    } else {
        executeArg = {
            methodName: execute.methodName,
            args: execute.args || []
        }
    }
    const deploymentSubmission = {
        address: contract.address,
        abi: artifact.abi,
        receipt: txReceipt,
        transactionHash: contract.deployTransaction?.hash,
        args: args,
        history: pastDeployments,
        linkedData: artifact.linkReferences,
        solcInput: artifact.solcInput,
        solcInputHash: artifact.solcInputHash,
        metadata: artifact.metadata,
        bytecode: artifact.bytecode,
        deployedBytecode: artifact.deployedBytecode,
        userdoc: artifact.userdoc,
        devdoc: artifact.devdoc,
        methodIdentifiers: artifact.methodIdentifiers,
        storageLayout: artifact.storageLayout,
        execute: executeArg
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
    contractConstructorArgs: Array<any> = [],
    execute?: Execute,
): Promise<string> {
    console.log(`Starting deploy for contract ${name}.sol ...`);

    // Get signer for network
    const signer = await getSignerForNetwork(hre);

    // Check contract for differences
    if(!LOCAL_CHAINS.includes(hre.network.name)){
        const differences = await fetchIfDifferent(
            hre, signer,
            name, 
            {
                from: await signer.getAddress(),
                args: contractConstructorArgs,
            }
        )
        if(!differences.differences){
            spinner.warn(`No changes since last deploy for ${name}.sol. Skipping.`)
            return differences.address!
        }
    }

    // Deploy contract
    spinner.start(
        `Deploying ${name} to ${hre.network.name} with args = ${contractConstructorArgs}`
    );
    const contractFactory = (await ethers.getContractFactory(name)).connect(signer);

    let contract: Contract;
    const deployTx = await contractFactory.getDeployTransaction(...contractConstructorArgs)
    contract = await contractFactory
        .deploy(...contractConstructorArgs)
        .then((f) => f.deployed());
    await contract.deployed();
    spinner.succeed(
        `Deployed ${name} to ${hre.network.name} at address ${contract.address} with args = [${contractConstructorArgs}]`
    );

    // Save artifacts
    await saveDeployArtifact(hre, name, contract, contractConstructorArgs, execute);

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
