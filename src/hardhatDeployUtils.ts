import {
    DefenderRelayProvider,
    DefenderRelaySigner,
} from "defender-relay-client/lib/ethers";
import { Signer } from "ethers";
import { ethers } from "hardhat";
import * as dotenv from "dotenv";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import ora from "ora";

dotenv.config();

const GOERLI_DEFENDER_RELAY_API_KEY = process.env.GOERLI_DEFENDER_RELAY_API_KEY || "";
const GOERLI_DEFENDER_RELAY_API_SECRET =
    process.env.GOERLI_DEFENDER_RELAY_API_SECRET || "";

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
                `Cannot get signer for unrecognized network ${network}. Add network to hardhat.config.ts`
            );
    }
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

    // Async import here since ora cannot be 'require'd in commonjs
    console.log(`Deploying contract ${name}...`);

    spinner.text = `Creating contract factory for ${name}`;
    spinner.start();
    const contractFactory = await ethers.getContractFactory(name);
    spinner.succeed();

    const signerType = hre.network.name == "hardhat" ? "local" : "Defender Relay";
    spinner.start(`Creating ${signerType} signer`);
    const signer = await getSignerForNetwork(hre.network.name);
    spinner.succeed(
        `Created ${signerType} signer with address ${await signer.getAddress()}`
    );

    spinner.start(
        `Deploying ${name} to ${hre.network.name} with args = ${contractConstructorArgs}`
    );
    const contract = await contractFactory
        .connect(signer)
        .deploy(...contractConstructorArgs)
        .then((f) => f.deployed());
    spinner.succeed(
        `Deployed network to ${hre.network.name} at address ${contract.address} with args = ${contractConstructorArgs || "[]"}`
    );

    spinner.start(`Saving artifacts`);
    const artifact = await hre.deployments.getExtendedArtifact(name);
    const deploymentSubmission = {
        address: contract.address,
        ...artifact,
    };
    await hre.deployments.save(name, deploymentSubmission);
    spinner.succeed(`Saved artifacts to /deployments/${hre.network.name}`);
}
