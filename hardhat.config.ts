import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@openzeppelin/hardhat-upgrades";
import "hardhat-deploy";
import "@nomiclabs/hardhat-ethers";
import { RelaySignerApiUrl } from "defender-relay-client/lib/api";
import { authenticate } from "defender-base-client"
import * as dotenv from "dotenv"
import { AuthenticationDetails, CognitoUserPool, CognitoUser, CognitoUserSession } from 'amazon-cognito-identity-js';
import AWS from 'aws-sdk';
AWS.CognitoIdentityServiceProvider.AuthenticationDetails = AuthenticationDetails;
AWS.CognitoIdentityServiceProvider.CognitoUserPool = CognitoUserPool;
AWS.CognitoIdentityServiceProvider.CognitoUser = CognitoUser;
AWS.config.region = "us-west-2"


dotenv.config()

export const GOERLI_DEFENDER_RELAY_API_KEY = process.env.GOERLI_DEFENDER_RELAY_API_KEY || ""
export const GOERLI_DEFENDER_RELAY_API_SECRET = process.env.GOERLI_DEFENDER_RELAY_API_SECRET || ""

function getNetworkConfigs() {
    const defenderAuthToken = getDefenderApiAuthToken2(GOERLI_DEFENDER_RELAY_API_KEY, GOERLI_DEFENDER_RELAY_API_SECRET)
    const networkConfigs = {
      goerli: {
        url: RelaySignerApiUrl(),
        chainId: 5,
        httpHeaders: {
          "Authorization": `Bearer ${defenderAuthToken}`,
          "X-Api-Key": GOERLI_DEFENDER_RELAY_API_KEY,
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        tags: ["testnet"],
        live: true,
      },
      hardhat: {
        live: false,
        saveDeployments: true,
        tags: ["local"]
      },
    }
    return networkConfigs
}

function getDefenderApiAuthToken(apiKey: string, apiSecret: String): string {
  const authenticationData = {
    Username: apiKey,
    Password: apiSecret,
  }
  const poolData = {
    UserPoolId: "us-west-2_iLmIggsiy",
    ClientId: "1bpd19lcr33qvg5cr3oi79rdap",
  }
  const authenticationDetails = new AWS.CognitoIdentityServiceProvider.AuthenticationDetails(authenticationData);
  const userPool = new AWS.CognitoIdentityServiceProvider.CognitoUserPool(poolData);
  const userData = { Username: authenticationData.Username, Pool: userPool };
  const cognitoUser = new AWS.CognitoIdentityServiceProvider.CognitoUser(userData);
  const callback = {
    onSuccess: function(session: CognitoUserSession){
      const jwt = session.getAccessToken().getJwtToken()
      console.log(`JWT = ${jwt}`)
      return jwt
    },
    onFailure: function(err: Error){
      throw err
    }
  }
  const token = cognitoUser.authenticateUser(authenticationDetails, callback)
  console.log(`AWS_COGNITO_JWT = ${token}`)
  }

async function getDefenderApiAuthToken2(apiKey: string, apiSecret: String): string {
  const authenticationData = {
    Username: apiKey,
    Password: apiSecret,
  }
  const poolData = {
    UserPoolId: "us-west-2_iLmIggsiy",
    ClientId: "1bpd19lcr33qvg5cr3oi79rdap",
  }
  return await authenticate(authenticationData, poolData)
}

const config: HardhatUserConfig = {
  solidity: "0.8.17",
  networks: await getNetworkConfigs(),
};

export default config;
