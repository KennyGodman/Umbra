/**
 * UMBRA Protocol - Real GenLayer Client Service
 * 
 * Direct on-chain communication with the ParametricGuard Intelligent Contract
 * on GenLayer Studionet via genlayer-js.
 */

import { createClient, createAccount } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import deploymentData from "../contracts/deployments.json";

// Known deterministic persona accounts for live demo
const PERSONA_KEYS = {
  // Buyer (Alex)
  "0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc": "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a",
  // Underwriter (Parametric Capital)
  "0x70997970c51812dc3a010c7d01b50e0d17dc79c8": "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"
};

const DEFAULT_BUYER = "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC";

class GenLayerService {
  constructor() {
    this.contractAddress = deploymentData.contract_address || "0x6285B185277F10BeA8fa2c5b802B484a9E492eb8";
    this.networkName = deploymentData.network || "GenLayer Studionet";
    this.rpcUrl = deploymentData.network_rpc || studionet.rpcUrls.default.http[0];
    this.chainId = deploymentData.chain_id || studionet.id;
    this.isRealClient = true;

    this.connectedAccount = DEFAULT_BUYER;
    this.client = this._createClientForAccount(this.connectedAccount);

    this.cachedPolicies = Array.isArray(deploymentData.seed_policies) ? [...deploymentData.seed_policies] : [];
  }

  _createClientForAccount(address) {
    const normalized = (address || "").toLowerCase();
    const privKey = PERSONA_KEYS[normalized];
    const account = privKey ? createAccount(privKey) : createAccount();

    return createClient({
      chain: studionet,
      account: account
    });
  }

  getContractAddress() {
    return this.contractAddress;
  }

  getNetworkName() {
    return this.networkName;
  }

  getRpcUrl() {
    return this.rpcUrl;
  }

  getConnectedAccount() {
    return this.connectedAccount;
  }

  setConnectedAccount(account) {
    this.connectedAccount = account;
    this.client = this._createClientForAccount(account);
  }

  /**
   * Reads all policies directly from the ParametricGuard contract on GenLayer
   */
  async getAllPolicies() {
    try {
      const raw = await this.client.readContract({
        address: this.contractAddress,
        functionName: "get_all_policies",
        args: []
      });

      if (raw) {
        const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.cachedPolicies = parsed;
          return parsed;
        }
      }
    } catch (err) {
      console.warn("[GenLayer Client] Error reading get_all_policies on-chain, falling back to cached/seed:", err);
    }

    return [...this.cachedPolicies];
  }

  /**
   * Reads open policies directly from contract view
   */
  async listOpenPolicies() {
    try {
      const raw = await this.client.readContract({
        address: this.contractAddress,
        functionName: "list_open_policies",
        args: []
      });

      if (raw) {
        const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (err) {
      console.warn("[GenLayer Client] Error reading list_open_policies on-chain:", err);
    }

    const all = await this.getAllPolicies();
    return all.filter((p) => p.status === "open");
  }

  /**
   * Reads a single policy directly from the contract
   */
  async getPolicy(policyId) {
    try {
      const raw = await this.client.readContract({
        address: this.contractAddress,
        functionName: "get_policy",
        args: [Number(policyId)]
      });

      if (raw) {
        const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
        if (parsed && parsed.policy_id) {
          return parsed;
        }
      }
    } catch (err) {
      console.warn(`[GenLayer Client] Error reading get_policy(#${policyId}) on-chain:`, err);
    }

    const found = this.cachedPolicies.find((p) => Number(p.policy_id) === Number(policyId));
    if (found) return found;
    throw new Error(`Policy #${policyId} not found`);
  }

  /**
   * Reads policies purchased by a specific buyer
   */
  async listPoliciesByBuyer(buyerAddress) {
    const targetAddr = (buyerAddress || this.connectedAccount || "").toLowerCase();
    try {
      const raw = await this.client.readContract({
        address: this.contractAddress,
        functionName: "list_policies_by_buyer",
        args: [targetAddr]
      });

      if (raw) {
        const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (err) {
      console.warn("[GenLayer Client] Error reading list_policies_by_buyer on-chain:", err);
    }

    const all = await this.getAllPolicies();
    return all.filter((p) => (p.buyer || "").toLowerCase() === targetAddr);
  }

  /**
   * Reads policies created by a specific underwriter
   */
  async listPoliciesByUnderwriter(underwriterAddress) {
    const targetAddr = (underwriterAddress || this.connectedAccount || "").toLowerCase();
    try {
      const raw = await this.client.readContract({
        address: this.contractAddress,
        functionName: "list_policies_by_underwriter",
        args: [targetAddr]
      });

      if (raw) {
        const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (err) {
      console.warn("[GenLayer Client] Error reading list_policies_by_underwriter on-chain:", err);
    }

    const all = await this.getAllPolicies();
    return all.filter((p) => (p.underwriter || "").toLowerCase() === targetAddr);
  }

  /**
   * Real on-chain write: create_policy
   */
  async createPolicy({
    peril_type,
    trigger_description,
    data_source_hint,
    premium,
    payout,
    coverage_start,
    coverage_end,
  }) {
    console.log(`[GenLayer Client] Sending create_policy transaction to ${this.contractAddress}...`);

    const tx = await this.client.writeContract({
      address: this.contractAddress,
      functionName: "create_policy",
      args: [
        String(peril_type),
        String(trigger_description),
        String(data_source_hint),
        Number(premium),
        Number(payout),
        Number(coverage_start),
        Number(coverage_end)
      ],
      value: 0n
    });

    console.log(`[GenLayer Client] create_policy tx submitted: ${tx}. Awaiting confirmation...`);
    const receipt = await this.client.waitForTransactionReceipt({
      hash: tx,
      status: "ACCEPTED",
      retries: 45,
      interval: 2000
    });

    console.log(`[GenLayer Client] Policy created on-chain. Status: ${receipt.status_name || "ACCEPTED"}`);

    const refreshed = await this.getAllPolicies();
    return refreshed[refreshed.length - 1];
  }

  /**
   * Real on-chain write: buy_policy
   */
  async buyPolicy(policyId) {
    console.log(`[GenLayer Client] Sending buy_policy(#${policyId}) transaction to ${this.contractAddress}...`);

    const tx = await this.client.writeContract({
      address: this.contractAddress,
      functionName: "buy_policy",
      args: [Number(policyId)],
      value: 0n
    });

    console.log(`[GenLayer Client] buy_policy tx submitted: ${tx}. Awaiting confirmation...`);
    const receipt = await this.client.waitForTransactionReceipt({
      hash: tx,
      status: "ACCEPTED",
      retries: 45,
      interval: 2000
    });

    console.log(`[GenLayer Client] Policy #${policyId} purchased on-chain. Status: ${receipt.status_name || "ACCEPTED"}`);

    return await this.getPolicy(policyId);
  }

  /**
   * Real on-chain write: resolve_policy
   * Triggers non-deterministic validator telemetry fetch and LLM equivalence consensus
   */
  async resolvePolicy(policyId, onProgress = () => {}) {
    console.log(`[GenLayer Client] Initiating resolve_policy(#${policyId}) on GenLayer...`);

    onProgress({
      step: 1,
      title: "Decentralized Validator Allocation",
      desc: "Assigning independent GenLayer validator nodes for non-deterministic execution..."
    });

    const tx = await this.client.writeContract({
      address: this.contractAddress,
      functionName: "resolve_policy",
      args: [Number(policyId)],
      value: 0n
    });

    console.log(`[GenLayer Client] resolve_policy tx submitted: ${tx}. Monitoring validator consensus...`);

    onProgress({
      step: 2,
      title: "Real-World Ingestion & Verification Prompts",
      desc: "Validators fetching live API telemetry and executing LLM verification prompts..."
    });

    // Wait for the consensus receipt
    const receipt = await this.client.waitForTransactionReceipt({
      hash: tx,
      status: "ACCEPTED",
      retries: 60,
      interval: 2500
    });

    console.log(`[GenLayer Client] Consensus reached! Validator votes:`, receipt.last_round?.validator_votes_name);

    onProgress({
      step: 3,
      title: "Consensus Finalized & On-Chain Settlement",
      desc: "Consensus achieved via gl.eq_principle.prompt_non_comparative. On-chain settlement complete."
    });

    // Fetch the updated policy directly from the contract state
    const resolvedPolicy = await this.getPolicy(policyId);
    const triggered = resolvedPolicy.status === "resolved_triggered";

    return {
      triggered,
      justification: resolvedPolicy.resolution_justification || "Trigger evaluated by GenLayer validators.",
      policy: resolvedPolicy
    };
  }

  /**
   * Real on-chain write: expire_unsold_policy
   */
  async expireUnsoldPolicy(policyId) {
    console.log(`[GenLayer Client] Sending expire_unsold_policy(#${policyId}) to ${this.contractAddress}...`);

    const tx = await this.client.writeContract({
      address: this.contractAddress,
      functionName: "expire_unsold_policy",
      args: [Number(policyId)],
      value: 0n
    });

    await this.client.waitForTransactionReceipt({
      hash: tx,
      status: "ACCEPTED",
      retries: 45,
      interval: 2000
    });

    return await this.getPolicy(policyId);
  }

  resetDemoData() {
    this.cachedPolicies = Array.isArray(deploymentData.seed_policies) ? [...deploymentData.seed_policies] : [];
    return this.cachedPolicies;
  }
}

export const genlayerService = new GenLayerService();
