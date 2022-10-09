import { Provider } from "@ethersproject/providers";
import { Contract, Signer } from "ethers";
import { DefenderRelayProvider, DefenderRelaySigner} from 'defender-relay-client/lib/ethers';
import { ethers } from 'hardhat';
import path from "path";
import fs from "fs";
import { DeploymentSubmission, ABI } from 'hardhat-deploy/types';

function getDefenderRelaySignerAndProvider(apiKeyVarName: string, apiSecretVarName: string): Signer {
  require('dotenv').config()
  const apiKey = process.env[apiKeyVarName]
  const apiSecret = process.env[apiSecretVarName]
  if(apiKey === undefined){
    throw TypeError("Relayer API key is undefined")
  }
  if(apiSecret === undefined){
    throw TypeError("Relayer API secret is undefined")
  }
  const credentials = {apiKey: apiKey, apiSecret: apiSecret}
  const provider = new DefenderRelayProvider(credentials)
  const relaySigner = new DefenderRelaySigner(credentials, provider, { speed: 'fast' })

  return relaySigner
}


export async function getSignerForNetwork(network: string): Promise<Signer> {
    switch(network) {
        case "goerli":
            return getDefenderRelaySignerAndProvider("GOERLI_DEFENDER_RELAY_API_KEY", "GOERLI_DEFENDER_RELAY_API_SECRET")
        case "hardhat":
            const signers = await ethers.getSigners()
            return signers[0]
        default:
            throw Error(`Cannot create signer for unrecognized network name ${network}`)
    }
}

function getContractAbi(contract: Contract): ABI {
  const dir = path.resolve(
    __dirname,
    `./artifacts/contracts/HelloWorld.sol/${contract.name}.json`
  )
  const file = fs.readFileSync(dir, "utf8")
  const json = JSON.parse(file)
  const abi = json.abi
  console.log(`abi`, abi)
  return abi
}

export function saveDeployment(contract: Contract) {
  const deploymentToSave: DeploymentSubmission = {
    abi: getContractAbi(contract),
    address: forwarder.address,
    receipt: forwarder.rece
    transactionHash?: string;
    history?: Deployment[];
    implementation?: string;
    args?: any[];
    linkedData?: any;
    solcInput?: string;
    solcInputHash?: string;
    metadata?: string;
    bytecode?: string;
    deployedBytecode?: string;
    userdoc?: any;
    devdoc?: any;
    methodIdentifiers?: any;
    facets?: Facet[];
    execute?: {
      methodName: string;
      args: any[];
    };
    storageLayout?: any;
    libraries?: Libraries;
    gasEstimates?: any;
  }
}