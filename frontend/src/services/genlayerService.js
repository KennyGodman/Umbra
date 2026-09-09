import { INITIAL_POLICIES } from "../data/initialPolicies";

const STORAGE_KEY = "parametric_guard_policies_v1";

class GenLayerService {
  constructor() {
    this.policies = this._loadPolicies();
    this.connectedAccount = "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"; // default buyer account
    this.networkName = "GenLayer Testnet (Simulated Direct Mode)";
    this.rpcUrl = "https://testnet.genlayer.com";
    this.contractAddress = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";
  }

  _loadPolicies() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn("Could not load from localStorage:", e);
    }
    return [...INITIAL_POLICIES];
  }

  _savePolicies() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.policies));
    } catch (e) {
      console.warn("Could not save to localStorage:", e);
    }
  }

  resetDemoData() {
    this.policies = [...INITIAL_POLICIES];
    this._savePolicies();
    return this.policies;
  }

  getConnectedAccount() {
    return this.connectedAccount;
  }

  setConnectedAccount(account) {
    this.connectedAccount = account;
  }

  async listOpenPolicies() {
    // Contract view: list_open_policies
    return this.policies.filter((p) => p.status === "open");
  }

  async getAllPolicies() {
    return [...this.policies];
  }

  async getPolicy(policyId) {
    const p = this.policies.find((item) => Number(item.policy_id) === Number(policyId));
    if (!p) throw new Error(`Policy #${policyId} not found`);
    return p;
  }

  async listPoliciesByBuyer(buyerAddress) {
    const addr = (buyerAddress || this.connectedAccount || "").toLowerCase();
    return this.policies.filter((p) => (p.buyer || "").toLowerCase() === addr);
  }

  async listPoliciesByUnderwriter(underwriterAddress) {
    const addr = (underwriterAddress || this.connectedAccount || "").toLowerCase();
    return this.policies.filter((p) => (p.underwriter || "").toLowerCase() === addr);
  }

  async createPolicy({
    peril_type,
    trigger_description,
    data_source_hint,
    premium,
    payout,
    coverage_start,
    coverage_end,
  }) {
    // Simulates create_policy transaction on GenLayer
    await new Promise((r) => setTimeout(r, 600));

    const nextId = this.policies.length > 0 
      ? Math.max(...this.policies.map((p) => Number(p.policy_id))) + 1 
      : 1;

    const newPolicy = {
      policy_id: nextId,
      underwriter: this.connectedAccount,
      buyer: null,
      peril_type,
      trigger_description,
      data_source_hint,
      premium: Number(premium),
      payout: Number(payout),
      coverage_start: Number(coverage_start),
      coverage_end: Number(coverage_end),
      status: "open",
      resolution_justification: null,
    };

    this.policies.unshift(newPolicy);
    this._savePolicies();
    return newPolicy;
  }

  async buyPolicy(policyId) {
    // Simulates buy_policy transaction on GenLayer
    await new Promise((r) => setTimeout(r, 700));

    const policy = this.policies.find((p) => Number(p.policy_id) === Number(policyId));
    if (!policy) throw new Error("Policy not found");
    if (policy.status !== "open") throw new Error(`Policy status is '${policy.status}', not open`);

    policy.buyer = this.connectedAccount;
    policy.status = "purchased";
    this._savePolicies();
    return policy;
  }

  async resolvePolicy(policyId, onProgress = () => {}) {
    // Simulates the full validator consensus lifecycle with progress callbacks
    const policy = this.policies.find((p) => Number(p.policy_id) === Number(policyId));
    if (!policy) throw new Error("Policy not found");
    if (policy.status !== "purchased") throw new Error("Policy is not in purchased state");

    onProgress({
      step: 1,
      title: "Decentralized Validator Allocation",
      desc: "Assigning 5 independent GenLayer validator nodes for non-deterministic execution..."
    });
    await new Promise((r) => setTimeout(r, 900));

    onProgress({
      step: 2,
      title: "Real-World Data Ingestion",
      desc: `Fetching external data from: ${policy.data_source_hint.slice(0, 60)}...`
    });
    await new Promise((r) => setTimeout(r, 1100));

    onProgress({
      step: 3,
      title: "Equivalence Principle (prompt_non_comparative)",
      desc: "Validators evaluating condition against observations and reaching semantic consensus..."
    });
    await new Promise((r) => setTimeout(r, 1200));

    // Determine realistic outcome based on trigger description & peril
    let triggered = true;
    let justification = "";

    const descLower = policy.trigger_description.toLowerCase();

    if (policy.peril_type === "flight_delay") {
      // If contains DL123 delay > 120m, let's trigger or not trigger depending on scenario
      if (descLower.includes("exceeds 120 minutes") || descLower.includes("> 120")) {
        triggered = false; // prove "not triggered" outcome
        justification = `Validators queried FlightAware telemetry for flight ${descLower.includes("dl123") ? "DL123" : "flight"}. Logs confirmed flight arrived with a 15-minute delay. The > 120 min threshold was not satisfied. Full collateral (${policy.payout} GEN) + premium (${policy.premium} GEN) transferred back to underwriter.`;
      } else {
        triggered = true;
        justification = `Validators cross-referenced air traffic logs confirming a 138-minute tarmac and ground delay exceeding the threshold. Triggered: Payout of ${policy.payout} GEN released automatically to buyer.`;
      }
    } else {
      // Weather peril
      triggered = true;
      justification = `Validators reached consensus via gl.eq_principle.prompt_non_comparative. Satellite ERA5 weather telemetry confirmed rainfall of 6.4mm, which satisfies the '< 10mm' drought trigger threshold. Payout of ${policy.payout} GEN executed directly to buyer.`;
    }

    onProgress({
      step: 4,
      title: "Consensus Finalized & On-Chain Settlement",
      desc: `Consensus outcome: ${triggered ? "TRIGGERED (Payout)" : "NOT TRIGGERED (Collateral Returned)"}. Writing justification on-chain...`
    });
    await new Promise((r) => setTimeout(r, 700));

    policy.status = triggered ? "resolved_triggered" : "resolved_not_triggered";
    policy.resolution_justification = justification;
    this._savePolicies();

    return {
      triggered,
      justification,
      policy
    };
  }

  async expireUnsoldPolicy(policyId) {
    await new Promise((r) => setTimeout(r, 500));
    const policy = this.policies.find((p) => Number(p.policy_id) === Number(policyId));
    if (!policy) throw new Error("Policy not found");
    if (policy.status !== "open") throw new Error("Only open policies can be expired");

    policy.status = "expired";
    this._savePolicies();
    return policy;
  }
}

export const genlayerService = new GenLayerService();
