import React, { useState } from "react";
import { motion } from "framer-motion";
import { Shield, CloudRain, PlaneTakeoff, Clock, CheckCircle2, XCircle, AlertCircle, ArrowUpRight, DollarSign, Lock, RotateCcw, Plus, Sparkles } from "lucide-react";

export default function UnderwriterDashboard({
  policies,
  connectedAccount,
  onExpirePolicy,
  onOpenCreateModal
}) {
  const [reclaimingId, setReclaimingId] = useState(null);

  // Filter policies created by this underwriter
  const myPolicies = policies.filter((p) => {
    return p.underwriter && p.underwriter.toLowerCase() === connectedAccount.toLowerCase();
  });

  // Calculate underwriter metrics
  const totalLocked = myPolicies
    .filter((p) => p.status === "open" || p.status === "purchased")
    .reduce((sum, p) => sum + Number(p.payout), 0);

  const totalEarned = myPolicies
    .filter((p) => p.status === "resolved_not_triggered")
    .reduce((sum, p) => sum + Number(p.premium), 0);

  const handleReclaim = async (policyId) => {
    setReclaimingId(policyId);
    try {
      await onExpirePolicy(policyId);
    } catch (e) {
      console.error(e);
    } finally {
      setReclaimingId(null);
    }
  };

  const now = Math.floor(Date.now() / 1000);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-purple-900/40 pb-5"
      >
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>Underwriter Risk & Capital Dashboard</span>
          </h2>
          <p className="text-sm text-slate-600 dark:text-purple-200/70 mt-1">
            Track your 1:1 locked collateral, underwriting performance, and reclaim unsold capital.
          </p>
        </div>

        {/* White Button with Dark Purple Text */}
        <button
          onClick={onOpenCreateModal}
          className="btn-white !text-xs !py-2.5 !px-4 self-start sm:self-auto shadow-btn-white"
        >
          <Plus className="w-4 h-4 text-[#19062d]" />
          <span>+ Underwrite New Policy</span>
        </button>
      </motion.div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="p-5 rounded-2xl bg-white dark:bg-[#120822]/90 border border-slate-200 dark:border-purple-900/50 shadow-sm dark:shadow-purple-card space-y-1"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-purple-300/80 text-xs">
            <span className="font-semibold uppercase tracking-wider">Total Active Policies</span>
            <Shield className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white font-mono">{myPolicies.length}</p>
          <p className="text-[11px] text-slate-400 dark:text-purple-300/60">Policies sponsored by this address</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.08 }}
          className="p-5 rounded-2xl bg-white dark:bg-[#120822]/90 border border-slate-200 dark:border-purple-900/50 shadow-sm dark:shadow-purple-card space-y-1"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-purple-300/80 text-xs">
            <span className="font-semibold uppercase tracking-wider">Current Collateral Locked</span>
            <Lock className="w-4 h-4 text-purple-600 dark:text-purple-300" />
          </div>
          <p className="text-2xl font-bold text-purple-700 dark:text-purple-200 font-mono">{totalLocked} <span className="text-sm font-sans text-purple-600 dark:text-purple-400">GEN</span></p>
          <p className="text-[11px] text-slate-400 dark:text-purple-300/60">1:1 dedicated in escrow</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.16 }}
          className="p-5 rounded-2xl bg-white dark:bg-[#120822]/90 border border-slate-200 dark:border-purple-900/50 shadow-sm dark:shadow-purple-card space-y-1"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-purple-300/80 text-xs">
            <span className="font-semibold uppercase tracking-wider">Earned Premiums</span>
            <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-300 font-mono">+{totalEarned} <span className="text-sm font-sans text-emerald-600/80 dark:text-emerald-400/80">GEN</span></p>
          <p className="text-[11px] text-slate-400 dark:text-purple-300/60">From un-triggered resolutions</p>
        </motion.div>
      </div>

      {/* Policies List */}
      {myPolicies.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-3xl border border-dashed border-slate-300 dark:border-purple-900/60 p-12 text-center bg-white/60 dark:bg-[#120724]/40 backdrop-blur-md"
        >
          <Shield className="w-12 h-12 text-slate-400 dark:text-purple-500/40 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800 dark:text-purple-200">No Policies Created Yet</h3>
          <p className="text-xs text-slate-500 dark:text-purple-300/60 mt-1 max-w-sm mx-auto mb-5">
            Switch to the Underwriter persona in the top-right or create your first parametric insurance policy.
          </p>
          <button
            onClick={onOpenCreateModal}
            className="btn-white !text-xs !px-6 !py-3 font-bold"
          >
            Create First Policy
          </button>
        </motion.div>
      ) : (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Created Policies Portfolio
          </h3>
          <div className="space-y-3">
            {myPolicies.map((p, index) => {
              const isExpiredUnsold = p.status === "open" && now >= Number(p.coverage_start);
              const isExpired = p.status === "expired";
              const isResolvedNotTriggered = p.status === "resolved_not_triggered";

              return (
                <motion.div
                  key={p.policy_id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.06 }}
                  className="p-5 rounded-2xl bg-white dark:bg-[#120822]/90 border border-slate-200 dark:border-purple-900/50 hover:border-purple-300 dark:hover:border-purple-700/70 shadow-sm dark:shadow-purple-card flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-purple-950/90 border border-slate-200 dark:border-purple-700/60 text-purple-700 dark:text-purple-300 mt-0.5">
                      {p.peril_type === "weather" ? (
                        <CloudRain className="w-4 h-4" />
                      ) : (
                        <PlaneTakeoff className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                          {p.peril_type.replace("_", " ")}
                        </span>
                        <span className="text-xs font-mono text-slate-500 dark:text-purple-300/70">
                          #00{p.policy_id}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-purple-950 text-slate-700 dark:text-purple-200 border border-slate-200 dark:border-purple-800/60">
                          Status: {p.status}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-slate-700 dark:text-slate-200 mt-1 line-clamp-1">
                        "{p.trigger_description}"
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-purple-300/70 font-mono mt-0.5">
                        Locked Collateral: <span className="text-slate-900 dark:text-white font-semibold">{p.payout} GEN</span> • Premium: {p.premium} GEN
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end md:self-auto shrink-0">
                    {isResolvedNotTriggered && (
                      <div className="text-right">
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 block">
                          +{p.premium} GEN Profit
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-purple-300/70">
                          Collateral Unlocked
                        </span>
                      </div>
                    )}

                    {p.status === "open" && (
                      <>
                        {isExpiredUnsold ? (
                          <button
                            onClick={() => handleReclaim(p.policy_id)}
                            disabled={reclaimingId === p.policy_id}
                            className="btn-white !text-xs !py-2 !px-3.5"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>{reclaimingId === p.policy_id ? "Reclaiming..." : "Reclaim Collateral"}</span>
                          </button>
                        ) : (
                          <span className="text-xs font-mono text-slate-600 dark:text-purple-300/80 bg-slate-100 dark:bg-[#0d0517] px-3 py-1.5 rounded-xl border border-slate-200 dark:border-purple-900/60">
                            Awaiting Buyer (Open)
                          </span>
                        )}
                      </>
                    )}

                    {isExpired && (
                      <span className="text-xs font-mono text-slate-600 dark:text-purple-300/80 bg-slate-100 dark:bg-purple-950/40 border border-slate-200 dark:border-purple-900/50 px-3 py-1.5 rounded-xl">
                        Collateral Returned (Expired Unsold)
                      </span>
                    )}

                    {p.status === "resolved_triggered" && (
                      <span className="text-xs font-mono text-red-700 dark:text-red-300/80 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 px-3 py-1.5 rounded-xl">
                        Paid Out to Buyer ({p.payout} GEN)
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
