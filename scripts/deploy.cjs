#!/usr/bin/env node
/**
 * UMBRA Protocol - GenLayer Deployment & Seeding Script
 * 
 * Deploys ParametricGuard Intelligent Contract to GenLayer
 * and initializes on-chain seed policies for live demonstration.
 */

const fs = require('fs');
const path = require('path');
const { createClient, createAccount } = require('genlayer-js');
const { studionet } = require('genlayer-js/chains');

// Known test underwriter account (Parametric Capital)
const DEFAULT_UNDERWRITER_KEY = process.env.UNDERWRITER_PRIVATE_KEY || '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d';

async function deploy() {
  console.log('===============================================================');
  console.log('  UMBRA PROTOCOL - GENLAYER INTELLIGENT CONTRACT DEPLOYMENT    ');
  console.log('===============================================================');

  const underwriterAccount = createAccount(DEFAULT_UNDERWRITER_KEY);
  console.log(`[*] Underwriter Address: ${underwriterAccount.address}`);
  console.log(`[*] Target Network:      GenLayer Studionet (Chain ID ${studionet.id})`);
  console.log(`[*] RPC Endpoint:        ${studionet.rpcUrls.default.http[0]}`);

  const client = createClient({
    chain: studionet,
    account: underwriterAccount
  });

  const contractPath = path.resolve(__dirname, '../contracts/parametric_guard.py');
  if (!fs.existsSync(contractPath)) {
    throw new Error(`Contract file not found at: ${contractPath}`);
  }
  const contractCode = fs.readFileSync(contractPath, 'utf-8');

  console.log('\n[1/4] Verifying contract schema with GenLayer VM...');
  const schema = await client.getContractSchemaForCode(contractCode);
  const methodNames = Object.keys(schema.methods || {});
  console.log(`[+] Schema verified successfully. Methods found: [${methodNames.join(', ')}]`);

  console.log('\n[2/4] Deploying ParametricGuard to GenLayer...');
  const deployTx = await client.deployContract({
    code: contractCode,
    args: []
  });
  console.log(`[*] Deploy Tx Hash: ${deployTx}`);
  console.log('    Awaiting validator consensus and acceptance...');
  
  const deployReceipt = await client.waitForTransactionReceipt({
    hash: deployTx,
    status: 'ACCEPTED',
    retries: 50,
    interval: 2000
  });

  const contractAddress = deployReceipt.recipient || deployReceipt.contractAddress || deployReceipt.data?.contractAddress;
  console.log(`[+] DEPLOYED SUCCESSFULLY!`);
  console.log(`    Contract Address: ${contractAddress}`);
  console.log(`    Validator Votes:  ${deployReceipt.last_round?.validator_votes_name?.join(', ') || 'ACCEPTED'}`);

  const now = Math.floor(Date.now() / 1000);

  // -------------------------------------------------------------
  // Seed Policy 1: Weather Peril (Rainfall in Lagos, Nigeria)
  // Window: active for 15 minutes for live judge testing
  // -------------------------------------------------------------
  console.log('\n[3/4] Seeding Policy #1 [Weather Peril] on-chain...');
  const weatherStart = now + 10;
  const weatherEnd = now + 900; // 15 mins
  const weatherTx = await client.writeContract({
    address: contractAddress,
    functionName: 'create_policy',
    args: [
      'weather',
      'Accumulated rainfall < 10mm in Lagos, Nigeria during observation window',
      'https://archive-api.open-meteo.com/v1/era5?latitude=6.5244&longitude=3.3792&daily=precipitation_sum',
      35,
      500,
      weatherStart,
      weatherEnd
    ],
    value: 0n
  });
  console.log(`[*] Seed #1 Tx Hash: ${weatherTx}`);
  await client.waitForTransactionReceipt({ hash: weatherTx, status: 'ACCEPTED', retries: 40, interval: 2000 });
  console.log('[+] Seed Policy #1 created on-chain (ID: 1, Lagos rainfall < 10mm)');

  // -------------------------------------------------------------
  // Seed Policy 2: Flight Delay Peril (Delta DL123)
  // Window: active for 15 minutes for live judge testing
  // -------------------------------------------------------------
  console.log('\n[4/4] Seeding Policy #2 [Flight Delay Peril] on-chain...');
  const flightStart = now + 15;
  const flightEnd = now + 960; // 16 mins
  const flightTx = await client.writeContract({
    address: contractAddress,
    functionName: 'create_policy',
    args: [
      'flight_delay',
      'Delta flight DL123 arrival delay exceeds 120 minutes',
      'https://flightaware.com/live/flight/DAL123',
      50,
      800,
      flightStart,
      flightEnd
    ],
    value: 0n
  });
  console.log(`[*] Seed #2 Tx Hash: ${flightTx}`);
  await client.waitForTransactionReceipt({ hash: flightTx, status: 'ACCEPTED', retries: 40, interval: 2000 });
  console.log('[+] Seed Policy #2 created on-chain (ID: 2, Delta DL123 > 120m)');

  // Verify on-chain state
  console.log('\n[*] Verifying on-chain state via readContract(get_all_policies)...');
  const allPoliciesRaw = await client.readContract({
    address: contractAddress,
    functionName: 'get_all_policies',
    args: []
  });
  const parsedPolicies = JSON.parse(allPoliciesRaw || '[]');
  console.log(`[+] Confirmed ${parsedPolicies.length} active seed policies on-chain!`);

  // Record deployment metadata
  const deploymentData = {
    contract_address: contractAddress,
    network: 'GenLayer Studionet',
    chain_id: studionet.id,
    network_rpc: studionet.rpcUrls.default.http[0],
    deployed_at: now,
    underwriter: underwriterAccount.address,
    seed_policies: parsedPolicies
  };

  const contractsDir = path.resolve(__dirname, '../contracts');
  const frontendContractsDir = path.resolve(__dirname, '../frontend/src/contracts');

  if (!fs.existsSync(frontendContractsDir)) {
    fs.mkdirSync(frontendContractsDir, { recursive: true });
  }

  const contractsFile = path.join(contractsDir, 'deployments.json');
  const frontendFile = path.join(frontendContractsDir, 'deployments.json');

  fs.writeFileSync(contractsFile, JSON.stringify(deploymentData, null, 2), 'utf-8');
  fs.writeFileSync(frontendFile, JSON.stringify(deploymentData, null, 2), 'utf-8');

  console.log(`\n[+] Deployment metadata saved:`);
  console.log(`    - ${contractsFile}`);
  console.log(`    - ${frontendFile}`);
  console.log('===============================================================');
  console.log('  DEPLOYMENT COMPLETE - UMBRA PROTOCOL IS LIVE ON GENLAYER     ');
  console.log(`  Contract Address: ${contractAddress}`);
  console.log('===============================================================\n');

  return deploymentData;
}

if (require.main === module) {
  deploy().catch(err => {
    console.error('\n[!] Deployment failed:', err);
    process.exit(1);
  });
}

module.exports = { deploy };
