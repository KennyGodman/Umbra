const fs = require('fs');
const path = require('path');
const { createClient } = require('genlayer-js');
const { studionet, testnetBradbury } = require('genlayer-js/chains');

async function test() {
  const client = createClient({ chain: studionet });
  const contractPath = path.resolve(__dirname, '../contracts/parametric_guard.py');
  const code = fs.readFileSync(contractPath, 'utf-8');
  try {
    const schema = await client.getContractSchemaForCode(code);
    console.log('Schema successfully generated:');
    console.log(JSON.stringify(schema, null, 2));
  } catch (err) {
    console.error('Schema error:', err);
  }
}

test();
