import {
    DefenderRelayProvider,
    DefenderRelaySigner,
} from "defender-relay-client/lib/ethers";
import { Signer } from "ethers";
import { ethers } from "hardhat";
import * as dotenv from "dotenv";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import ora from "ora";
import { AutotaskClient } from "defender-autotask-client";
import path from "path";
import fs from "fs";
import os from "os";

dotenv.config();

// Team API Keys. These are chain agnostic and can be used to manage all
// instances of a particular OpenZeppelin Defender service.
// These can be found under the settings -> team api keys section on the Defender UI
const AUTOTASK_API_KEY = process.env.AUTOTASK_API_KEY || "";
const AUTOTASK_API_SECRET = process.env.AUTOTASK_API_SECRET || "";

// Chain-specific Relay API keys. These are chain specific and are used to manage
// specific OpenzeppelinDefender relays
// These can be found under each relay on the Defender UI
const GOERLI_DEFENDER_RELAY_API_KEY = process.env.GOERLI_DEFENDER_RELAY_API_KEY || "";
const GOERLI_DEFENDER_RELAY_API_SECRET =
    process.env.GOERLI_DEFENDER_RELAY_API_SECRET || "";

// Chain-specific Autotask ids. These are not easily visible in the UI, but can be copied
// from the last segment of the URL when navigating to an autotask in the Defender UI.
// These are used to programatically update the code for a particular autotask.
const GOERLI_AUTOTASK_ID = process.env.GOERLI_AUTOTASK_ID || "";

function getDefenderRelaySigner(apiKey: string, apiSecret: string): Signer {
    const credentials = { apiKey: apiKey, apiSecret: apiSecret };
    const provider = new DefenderRelayProvider(credentials);
    const relaySigner = new DefenderRelaySigner(credentials, provider, {
        speed: "fast",
    });

    return relaySigner;
}

async function getSignerForNetwork(network: string): Promise<Signer> {
    switch (network) {
        case "hardhat":
            const signers = await ethers.getSigners();
            return signers[0];
        case "goerli":
            return getDefenderRelaySigner(
                GOERLI_DEFENDER_RELAY_API_KEY,
                GOERLI_DEFENDER_RELAY_API_SECRET
            );
        default:
            throw Error(
                `Cannot get Defender Relay signer for unrecognized network ${network}. Add network to hardhat.config.ts and API creds to this file and .env`
            );
    }
}

export async function updateDefenderAutotaskCodeForNetwork(
    hre: HardhatRuntimeEnvironment
): Promise<void> {
    const spinner = ora({
        discardStdin: false,
        spinner: "dots",
    });

    console.log(`Updating Defender Autotask code...`);

    spinner.start(`Creating Autotask client`);
    const credentials = { apiKey: AUTOTASK_API_KEY, apiSecret: AUTOTASK_API_SECRET };
    const autotaskClient = new AutotaskClient(credentials);
    var autotaskId = "";
    switch (hre.network.name) {
        case "goerli":
            autotaskId = GOERLI_AUTOTASK_ID;
            break;
        default:
            spinner.fail(`Creating Autotask client`);
            throw Error(
                `Cannot update Defender Autotask for unrecognized network ${hre.network.name}`
            );
    }
    spinner.succeed(`Created autotask client`);

    spinner.start(`Fetching SingleRelayForwarder contract ABI and address`);
    // Create forwarder.json in tempdir with forwarder contract address and ABI
    const forwarderDeployment = hre.deployments.get("SingleRelayForwarder");
    const abi = (await forwarderDeployment).abi;
    const address = (await forwarderDeployment).address;
    spinner.succeed(
        `Fetched SingleRelayForwarder contract ABI and address = ${address}`
    );

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
): Promise<void> {
    const spinner = ora({
        discardStdin: false,
        spinner: "dots",
    });

    console.log(`Starting deploy for contract ${name}.sol ...`);

    // Get signer for network
    const signerType = hre.network.name == "hardhat" ? "local" : "Defender Relay";
    spinner.start(`Creating ${signerType} signer`);
    const signer = await getSignerForNetwork(hre.network.name);
    const signerChainId = await signer.getChainId();
    if (signerChainId != hre.network.config.chainId) {
        spinner.fail();
        throw Error(
            `Defender Relay signer chainId (${signerChainId}) does not match hardhat config chainId (${hre.network.config.chainId})`
        );
    }
    spinner.succeed(
        `Created ${signerType} signer with address ${await signer.getAddress()}`
    );


    // Check if deployed contract is different from compiled contract
    spinner.start(`Checking if contract has changed since last deploy`)
    const {differences, address} = await hre.deployments.fetchIfDifferent(name, {
      contract: name,
      from: await signer.getAddress(),
      args: contractConstructorArgs,
      skipIfAlreadyDeployed: true
    })
    if(!differences){
      spinner.stopAndPersist({
        symbol: "⚠️",
        text: `Contract has not changed since last deploy. Stopping.`
      })
      return
    }


    // Create contract factory
    spinner.start(`Creating contract factory for ${name}`);
    const contractFactory = await ethers.getContractFactory(name);
    spinner.succeed();

    // Deploy contract
    spinner.start(
        `Deploying ${name} to ${hre.network.name} with args = ${contractConstructorArgs}`
    );
    const contract = await contractFactory
        .connect(signer)
        .deploy(...contractConstructorArgs)
        .then((f) => f.deployed());
    spinner.succeed(
        `Deployed network to ${hre.network.name} at address ${
            contract.address
        } with args = ${contractConstructorArgs || "[]"}`
    );

    // Save artifacts
    spinner.start(`Saving artifacts`);
    const artifact = await hre.deployments.getExtendedArtifact(name);
    const deploymentSubmission = {
        address: contract.address,
        ...artifact,
    };
    await hre.deployments.save(name, deploymentSubmission);
    spinner.succeed(`Saved artifacts to /deployments/${hre.network.name}`);
}
