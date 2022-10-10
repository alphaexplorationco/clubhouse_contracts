import { DefenderRelayProvider, DefenderRelaySigner } from "defender-relay-client/lib/ethers"
import { Contract, ContractFactory, Signer } from "ethers"
import { ethers } from "hardhat"
import * as dotenv from "dotenv"
import { DeploymentsExtension, DeploymentSubmission } from "hardhat-deploy/types" 
import { HardhatRuntimeEnvironment } from "hardhat/types"

dotenv.config()

const GOERLI_DEFENDER_RELAY_API_KEY = process.env.GOERLI_DEFENDER_RELAY_API_KEY || ""
const GOERLI_DEFENDER_RELAY_API_SECRET = process.env.GOERLI_DEFENDER_RELAY_API_SECRET || ""

function getDefenderRelaySigner(apiKey: string, apiSecret: string): Signer {
  const credentials = {apiKey: apiKey, apiSecret: apiSecret}
  const provider = new DefenderRelayProvider(credentials)
  const relaySigner = new DefenderRelaySigner(credentials, provider, { speed: 'fast' })

  return relaySigner
}

async function getSignerForNetwork(network: string): Promise<Signer> {
    switch(network){
      case "hardhat":
        const signers = await ethers.getSigners()
        return signers[0]
      case "goerli":
        return getDefenderRelaySigner(GOERLI_DEFENDER_RELAY_API_KEY, GOERLI_DEFENDER_RELAY_API_SECRET)
      default:
        throw Error(`Cannot get signer for unrecognized network ${network}. Add network to hardhat.config.ts`)
    }
}

export async function deployContract(name: string, hre: HardhatRuntimeEnvironment): Promise<void> {
  console.log(`Deploying contract ${name}`)

  const contractFactory = await ethers.getContractFactory(name)
  console.log(`\tCreated contract factory for ${name}`)

  const signer = await getSignerForNetwork(hre.network.name)
  console.log(`\tCreated signer for network ${hre.network.name}`)

  const contract = await contractFactory.connect(signer)
    .deploy()
    .then((f) => f.deployed())
  console.log(`\tDeployed ${name} to ${hre.network.name} (chainID = ${hre.network.config.chainId}) at address ${contract.address}`)
  
  const artifact = await hre.deployments.getExtendedArtifact(name)
  const deploymentSubmission = {
    address: contract.address,
    ...artifact,
  }
  await hre.deployments.save(name, deploymentSubmission)
  console.log(`Saved deployment`)
}