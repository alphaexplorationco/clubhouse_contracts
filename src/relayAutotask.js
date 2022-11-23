const ethers = require('ethers');
const { DefenderRelaySigner, DefenderRelayProvider } = require('defender-relay-client/lib/ethers');
const FORWARDER_DATA = require('./forwarder.json')

async function relay(forwarder, request, requestTypeHash, domainHash, signature) {
  // Validate request on the forwarder contract
  const requestParams = [request.from, request.to, request.value, request.gas, request.data, request.validUntil]
  const valid = await forwarder.verify(requestParams, domainHash, requestTypeHash, "0x", signature);
  if (!valid) throw new Error(`Forwarder contract failed to verify request signature`);

  // Send meta-tx through relayer to the forwarder contract
  const gasLimit = (parseInt(request.gas) + 50000).toString();
  return await forwarder.execute(requestParams, domainHash, requestTypeHash, "0x", signature, { gasLimit });
}

async function handler(event) {
  // Parse webhook payload
  if (!event.request || !event.request.body) throw new Error(`Autotask request has no payload`);
  const { request, signature, requestTypeHash, domainHash } = event.request.body;
  console.log(`Relaying`, request);

  // Initialize Relayer provider and signer, and forwarder contract
  const credentials = { ... event };
  const provider = new DefenderRelayProvider(credentials);
  const signer = new DefenderRelaySigner(credentials, provider, { speed: 'fast' });

  const forwarderAddress = FORWARDER_DATA.address
  const forwarder = new ethers.Contract(forwarderAddress, FORWARDER_DATA.abi, signer);

  // Relay transaction!
  const tx = await relay(forwarder, request, requestTypeHash, domainHash, signature);
  console.log(`Sent meta-tx: ${tx.hash}`);
  return { txHash: tx.hash };
}

module.exports = {
  handler,
  relay,
}