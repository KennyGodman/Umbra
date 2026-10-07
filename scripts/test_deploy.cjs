const fs = require('fs');
const path = require('path');
const { createClient, createAccount } = require('genlayer-js');
const { studionet } = require('genlayer-js/chains');

async function testFullLifecycle() {
  const account = createAccount();
  console.log('[*] Using account:', account.address);

  const client = createClient({
    chain: studionet,
    account: account
  });

  const contractPath = path.resolve(__dirname, '../contracts/parametric_guard.py');
  const code = fs.readFileSync(contractPath, 'utf-8');

  console.log('[*] Deploying contract to GenLayer...');
  const deployTx = await client.deployContract({ code, args: [] });
  console.log('[*] Deploy tx:', deployTx);
  const deployReceipt = await client.waitForTransactionReceipt({ hash: deployTx, status: 'ACCEPTED', retries: 50 });
  const contractAddress = deployReceipt.recipient || deployReceipt.contractAddress || deployReceipt.data?.contractAddress;
  console.log('[+] Deployed contract address:', contractAddress);

  const now = Math.floor(Date.now() / 1000);
  // Window: starts in 5s, ends in 15s
  const start = now + 5;
  const end = now + 15;

  console.log('[*] Creating Weather Policy...');
  const createTx = await client.writeContract({
    address: contractAddress,
    functionName: 'create_policy',
    args: [
      'weather',
      'Accumulated rainfall < 10mm in Lagos, Nigeria during observation window',
      'https://archive-api.open-meteo.com/v1/era5?latitude=6.5244&longitude=3.3792&daily=precipitation_sum',
      35,
      500,
      start,
      end
    ],
    value: 0n
  });
  await client.waitForTransactionReceipt({ hash: createTx, status: 'ACCEPTED', retries: 50 });
  console.log('[+] Policy 1 created!');

  console.log('[*] Buying Policy 1...');
  const buyTx = await client.writeContract({
    address: contractAddress,
    functionName: 'buy_policy',
    args: [1],
    value: 0n
  });
  await client.waitForTransactionReceipt({ hash: buyTx, status: 'ACCEPTED', retries: 50 });
  console.log('[+] Policy 1 purchased!');

  console.log('[*] Waiting for coverage window to close (15 seconds)...');
  await new Promise(r => setTimeout(r, 16000));

  console.log('[*] Resolving Policy 1 via GenLayer AI validator consensus...');
  const resolveTx = await client.writeContract({
    address: contractAddress,
    functionName: 'resolve_policy',
    args: [1],
    value: 0n
  });
  console.log('[*] Resolve tx hash:', resolveTx);
  const resolveReceipt = await client.waitForTransactionReceipt({ hash: resolveTx, status: 'ACCEPTED', retries: 60 });
  console.log('[+] Resolve status:', resolveReceipt.status_name, 'Exec result:', resolveReceipt.consensus_data?.leader_receipt?.[0]?.execution_result);

  const finalPolicy = await client.readContract({
    address: contractAddress,
    functionName: 'get_policy',
    args: [1]
  });
  console.log('[+] FINAL RESOLVED ON-CHAIN POLICY:', finalPolicy);
}

testFullLifecycle().catch(console.error);
