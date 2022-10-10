import { DefenderRelayProvider, DefenderRelaySigner } from "defender-relay-client/lib/ethers"
import { Signer } from "ethers"
import { ethers } from "hardhat"
import { GOERLI_DEFENDER_RELAY_API_KEY, GOERLI_DEFENDER_RELAY_API_SECRET } from "../hardhat.config"

function getDefenderRelaySignerAndProvider(apiKey: string, apiSecret: string): Signer {
  require('dotenv').config()
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
    switch(network){
      case "hardhat":
        const signers = await ethers.getSigners()
        return signers[0]
      case "goerli":
        return getDefenderRelaySignerAndProvider(GOERLI_DEFENDER_RELAY_API_KEY, GOERLI_DEFENDER_RELAY_API_SECRET)
      default:
        throw Error(`Cannot get signer for unrecognized network ${network}. Add network to hardhat.config.ts`)
    }
}
