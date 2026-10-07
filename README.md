# UMBRA — Autonomous Parametric Insurance Protocol

> **GenLayer Hackathon Submission**  
> **Track:** Prediction Markets & Real-World Settlement  
> **Network:** GenLayer Studionet / Testnet  
> **Core Innovation:** Autonomous, multi-peril parametric insurance with real-world web telemetry ingestion and AI validator consensus using `gl.eq_principle.prompt_non_comparative`.

---

## 🌟 Submission Update: Real GenLayer Integration & Deployment Flow

This repository provides **100% real, direct on-chain communication** between the frontend, deployment scripts, and the deployed Intelligent Contract:

1. **Real Intelligent Contract (`contracts/parametric_guard.py`)**:
   - Deployed directly to GenLayer VM using runner `# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }`.
   - Uses GenLayer's native `gl.Contract`, state `TreeMap[str, str]`, and `gl.eq_principle.prompt_non_comparative`.
   - Executes real-world HTTP telemetry fetches via `gl.nondet.web.get` and LLM prompt evaluations via `gl.nondet.exec_prompt` / `gl.nondet.llm.prompt`.
   - Passes both GenLayer VM schema extraction and local unit tests with 100% success.

2. **Real GenLayer Client (`frontend/src/services/genlayerService.js`)**:
   - Replaced all local simulation and localStorage mocks with `genlayer-js` SDK client.
   - All state reads (`get_all_policies`, `list_open_policies`, `get_policy`, `list_policies_by_buyer`, `list_policies_by_underwriter`) execute direct `client.readContract` calls against the contract on GenLayer.
   - All actions (`create_policy`, `buy_policy`, `resolve_policy`, `expire_unsold_policy`) execute real `client.writeContract` signed transactions, awaiting validator consensus receipts (`ACCEPTED`).

3. **Reproducible Deployment & Seeding Flow (`scripts/deploy.cjs` & `scripts/deploy.py`)**:
   - Automated script that compiles, verifies schema, deploys `ParametricGuard` to GenLayer Studionet, and seeds initial policies directly on-chain via transactions.
   - Saves deployment addresses and network parameters to `contracts/deployments.json` and `frontend/src/contracts/deployments.json`.

---

## 🚀 Quickstart & Reproducible Setup

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **Python**: 3.10+ (for optional pytest test suite)

### 1. Installation
Clone repository and install dependencies:

```bash
# Install frontend dependencies
cd frontend
npm install
cd ..
```

### 2. Deploy Intelligent Contract & Seed On-Chain Policies

Deploy `contracts/parametric_guard.py` to GenLayer and seed demonstration policies on-chain with a single command:

```bash
# Using Node / npm
npm run deploy

# Or using Python
python scripts/deploy.py
```

The script will:
- Verify the contract schema against the GenLayer VM
- Deploy `ParametricGuard` to GenLayer Studionet
- Seed Policy #1 (Weather Peril: Lagos rainfall < 10mm via Open-Meteo ERA5)
- Seed Policy #2 (Flight Delay Peril: Delta DL123 delay > 120m via FlightAware)
- Verify on-chain storage via `client.readContract`
- Update `contracts/deployments.json` and `frontend/src/contracts/deployments.json`

### 3. Launch Frontend DApp

```bash
# From root
npm run dev

# Or from frontend/
cd frontend
npm run dev
```

Visit `http://localhost:5173` to launch the UMBRA interface.

---

## 🧪 Testing & Validation

### 1. Validate Contract Schema on GenLayer VM
Verifies that the GenVM compiles the contract and extracts public methods:
```bash
node scripts/test_schema.cjs
```

### 2. Full End-to-End On-Chain Lifecycle Test
Executes a complete on-chain lifecycle test (Deploy -> Create Policy -> Buy Policy -> Wait for window -> Resolve via AI Validator Consensus):
```bash
node scripts/test_deploy.cjs
```

### 3. Python Unit Test Suite
Runs the contract test suite covering policy creation, collateral locking, purchases, time windows, and equivalence principle mechanics:
```bash
python -m pytest
```

---

## 📑 Contract Methods

| Method | Type | Description |
|---|---|---|
| `create_policy` | Write | Underwriter locks collateral and defines peril, trigger description, data hint, premium, payout, and window |
| `buy_policy` | Write | Buyer purchases open coverage by sending premium before `coverage_start` |
| `resolve_policy` | Write | Anyone triggers resolution after `coverage_end`; validators query external web APIs and reach consensus via `prompt_non_comparative` |
| `expire_unsold_policy` | Write | Underwriter reclaims locked collateral if an unpurchased policy passes `coverage_start` |
| `get_policy` | View | Returns JSON representation of a specific policy |
| `list_open_policies` | View | Returns all policies currently open for purchase |
| `get_all_policies` | View | Returns all policies on-chain |
| `list_policies_by_buyer` | View | Returns policies purchased by a specific buyer address |
| `list_policies_by_underwriter` | View | Returns policies created by a specific underwriter address |

---

## 🛡️ Live Demonstration Personas

The DApp includes one-click persona switching in the top navbar:
- **Buyer (Alex)**: `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC` (signs transactions with demo private key)
- **Underwriter (Parametric Capital)**: `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` (signs transactions with demo private key)

---

## 📜 License
MIT License
