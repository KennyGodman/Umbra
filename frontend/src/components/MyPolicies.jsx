import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CloudRain, PlaneTakeoff, Clock, CheckCircle2, XCircle, AlertCircle, Loader2, Sparkles, Shield, ArrowRight, ExternalLink } from "lucide-react";

export default function MyPolicies({
  policies,
  connectedAccount,
  onResolvePolicy,
  onExploreMarketplace
}) {
  const [resolvingId, setResolvingId] = useState(null);
  const [resolutionStep, setResolutionStep] = useState(null);
  const [currentTime, setCurrentTime] = useState(Math.floor(Date.now() / 1000));

  // Update clock every second for countdowns
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Math.floor(Date.now() / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Filter policies purchased by this buyer
  const myPurchasedPolicies = policies.filter((p) => {
    return p.buyer && p.buyer.toLowerCase() === connectedAccount.toLowerCase();
  });

  const handleResolve = async (policyId) => {
    setResolvingId(policyId);
    setResolutionStep({ step: 1, title: "Connecting Validators...", desc: "Initializing GenLayer validator quorum" });
    try {
      await onResolvePolicy(policyId, (progress) => {
        setResolutionStep(progress);
      });
    } catch (err) {
      console.error("Resolution error:", err);
    } finally {
      setResolvingId(null);
      setResolutionStep(null);
    }
  };

  const getTimeRemaining = (endTime) => {
    const diff = Number(endTime) - currentTime;
    if (diff <= 0) return { expired: true, text: "Coverage window closed" };

    const hours = Math.floor(diff / 3600);
    const mins = Math.floor((diff % 3600) / 60);
    const secs = diff % 60;

    if (hours > 0) return { expired: false, text: `${hours}h ${mins}m ${secs}s left` };
    if (mins > 0) return { expired: false, text: `${mins}m ${secs}s left` };
    return { expired: false, text: `${secs}s left` };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-purple-900/40 pb-5"
      >
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <span>My Active Protection Policies</span>
            <span className="text-xs font-mono px-3 py-1 rounded-full bg-slate-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-200 border border-slate-200 dark:border-purple-700/60 shadow-sm">
              {myPurchasedPolicies.length} Active
            </span>
          </h2>
          <p className="text-sm text-slate-600 dark:text-purple-200/70 mt-1">
            Policies purchased by your connected wallet (<code className="text-purple-700 dark:text-purple-300 font-mono text-xs">{connectedAccount.slice(0, 8)}...</code>).
          </p>
        </div>

        {/* White Button with Dark Purple Text */}
        <button
          onClick={onExploreMarketplace}
          className="btn-white !text-xs !py-2 !px-4 shadow-btn-white"
        >
          <span>+ Purchase New Coverage</span>
          <ArrowRight className="w-3.5 h-3.5 text-[#19062d]" />
        </button>
      </motion.div>

      {/* Policies List */}
      {myPurchasedPolicies.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-3xl border border-dashed border-slate-300 dark:border-purple-900/60 p-12 text-center bg-white/60 dark:bg-[#120724]/40 backdrop-blur-md"
        >
          <Shield className="w-12 h-12 text-slate-400 dark:text-purple-500/40 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800 dark:text-purple-200">No Purchased Policies Yet</h3>
          <p className="text-xs text-slate-500 dark:text-purple-300/60 mt-1 max-w-sm mx-auto mb-5">
            You haven't purchased coverage from this wallet yet. Switch personas in the top-right or browse open pools.
          </p>
          <button
            onClick={onExploreMarketplace}
            className="btn-white !px-6 !py-3 !text-xs font-bold shadow-btn-white"
          >
            Explore Marketplace
          </button>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {myPurchasedPolicies.map((policy, index) => {
            const timeInfo = getTimeRemaining(policy.coverage_end);
            const isPurchased = policy.status === "purchased" || policy.status === "resolution_inconclusive";
            const canResolve = isPurchased && timeInfo.expired;
            const isCurrentlyResolving = resolvingId === policy.policy_id;

            return (
              <motion.div
                key={policy.policy_id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: index * 0.08 }}
                className={`relative rounded-2xl bg-white dark:bg-[#120822]/90 border transition-all duration-200 overflow-hidden shadow-sm hover:shadow-md dark:shadow-purple-card ${
                  isCurrentlyResolving 
                    ? "border-purple-500 dark:border-purple-400 shadow-xl ring-2 ring-purple-500/40" 
                    : "border-slate-200 dark:border-purple-900/50 hover:border-purple-300 dark:hover:border-purple-700/70"
                }`}
              >
                <div className="p-6">
                  {/* Top Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3.5">
                      <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/90 border border-purple-200 dark:border-purple-700/60 text-purple-700 dark:text-purple-300 shadow-inner">
                        {policy.peril_type === "weather" ? <CloudRain className="w-5 h-5" /> : <PlaneTakeoff className="w-5 h-5" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                            {policy.peril_type.replace("_", " ")}
                          </span>
                          <span className="text-xs font-mono text-purple-700 dark:text-purple-300/70">#00{policy.policy_id}</span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-purple-300/80">
                          Premium: <span className="font-mono text-slate-900 dark:text-white font-semibold">{policy.premium} GEN</span> • Potential Payout: <span className="font-mono text-purple-700 dark:text-purple-300 font-bold">{policy.payout} GEN</span>
                        </p>
                      </div>
                    </div>

                    {/* Status Pill */}
                    <div>
                      {policy.status === "purchased" && (
                        <span className={`px-3.5 py-1 rounded-full text-xs font-mono font-semibold flex items-center gap-1.5 ${
                          timeInfo.expired 
                            ? "bg-purple-900 text-white border border-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.5)] animate-pulse" 
                            : "bg-slate-100 dark:bg-purple-950/80 text-slate-700 dark:text-purple-300 border border-slate-200 dark:border-purple-800/60"
                        }`}>
                          <Clock className="w-3.5 h-3.5" />
                          {timeInfo.expired ? "Ready for Resolution" : timeInfo.text}
                        </span>
                      )}
                      {policy.status === "resolved_triggered" && (
                        <span className="px-3.5 py-1 rounded-full text-xs font-mono font-semibold bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700/60 flex items-center gap-1.5 shadow-sm">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Paid Out: +{policy.payout} GEN
                        </span>
                      )}
                      {policy.status === "resolved_not_triggered" && (
                        <span className="px-3.5 py-1 rounded-full text-xs font-mono font-semibold bg-slate-100 dark:bg-[#1a0c2e] text-slate-600 dark:text-purple-300/80 border border-slate-200 dark:border-purple-800/50 flex items-center gap-1.5">
                          <XCircle className="w-3.5 h-3.5" />
                          Not Triggered (Collateral Returned)
                        </span>
                      )}
                      {policy.status === "resolution_inconclusive" && (
                        <span className="px-3.5 py-1 rounded-full text-xs font-mono font-semibold bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-700/60 flex items-center gap-1.5 shadow-sm">
                          <AlertCircle className="w-3.5 h-3.5" />
                          Resolution Inconclusive (Retry Available)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Trigger Condition text */}
                  <div className="bg-slate-50 dark:bg-[#0d0517] p-4 rounded-xl border border-slate-200 dark:border-purple-900/60 space-y-1">
                    <p className="text-[10px] font-semibold uppercase text-purple-600 dark:text-purple-400 tracking-wider">
                      Stated Trigger Condition
                    </p>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200 leading-relaxed">
                      "{policy.trigger_description}"
                    </p>
                  </div>

                  {/* LIVE VALIDATOR CONSENSUS STEPPER (When resolving) */}
                  <AnimatePresence>
                    {isCurrentlyResolving && resolutionStep && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-5 p-5 rounded-2xl bg-gradient-to-br from-purple-50 via-slate-50 to-purple-100 dark:from-[#2a0c4e] dark:via-[#150728] dark:to-[#250942] border border-purple-400 dark:border-purple-500/60 shadow-lg overflow-hidden text-slate-900 dark:text-white"
                      >
                        <div className="flex items-center gap-2 mb-3.5">
                          <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-300 animate-spin" />
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                            GenLayer Validator Consensus Engine Active
                          </h4>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white dark:bg-purple-950 text-purple-800 dark:text-purple-200 ml-auto border border-purple-200 dark:border-purple-700/50 shadow-sm font-semibold">
                            gl.eq_principle.prompt_non_comparative
                          </span>
                        </div>

                        {/* Stepper Dots */}
                        <div className="grid grid-cols-4 gap-2 mb-4">
                          {[1, 2, 3, 4].map((stepNum) => (
                            <div
                              key={stepNum}
                              className={`h-2 rounded-full transition-all duration-300 ${
                                stepNum <= resolutionStep.step ? "bg-purple-600 dark:bg-white shadow-[0_0_10px_rgba(168,85,247,0.5)]" : "bg-slate-200 dark:bg-purple-950/80"
                              }`}
                            />
                          ))}
                        </div>

                        <div className="space-y-1">
                          <p className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin text-purple-600 dark:text-purple-300" />
                            <span>{resolutionStep.title}</span>
                          </p>
                          <p className="text-xs text-slate-600 dark:text-purple-200/90 font-mono">
                            {resolutionStep.desc}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Inline On-Chain Justification if resolved */}
                  {policy.resolution_justification && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`mt-4 p-4 rounded-xl border ${
                        policy.status === "resolved_triggered"
                          ? "bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-600/70 shadow-sm"
                          : "bg-slate-50 dark:bg-[#0d0517] border-slate-200 dark:border-purple-900/60"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">
                          On-Chain Validator Justification (Immutable Trust Record)
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed font-sans">
                        "{policy.resolution_justification}"
                      </p>
                    </motion.div>
                  )}

                  {/* Resolution Action Button */}
                  {isPurchased && (
                    <div className="mt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-purple-900/40">
                      <div className="text-xs text-slate-500 dark:text-purple-300/80">
                        {policy.status === "resolution_inconclusive" ? (
                          <span className="text-amber-700 dark:text-amber-300 font-semibold flex items-center gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5" />
                            Previous resolution was inconclusive due to evidence unavailability. You can retry resolution now.
                          </span>
                        ) : canResolve ? (
                          <span className="text-purple-700 dark:text-purple-200 font-semibold flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                            Coverage window has closed. Autonomous resolution is ready to execute.
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-slate-400 dark:text-purple-300/60">
                            <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-purple-400/60" />
                            <span>Resolution opens automatically when coverage window closes ({timeInfo.text}).</span>
                          </span>
                        )}
                      </div>

                      {/* White Button with Dark Purple Text */}
                      <button
                        onClick={() => handleResolve(policy.policy_id)}
                        disabled={!canResolve || isCurrentlyResolving}
                        className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                          canResolve && !isCurrentlyResolving
                            ? "btn-white !bg-white hover:!bg-slate-100 !text-[#19062d] font-bold shadow-btn-white"
                            : "bg-slate-100 dark:bg-[#17092c] text-slate-400 dark:text-purple-300/40 cursor-not-allowed border border-slate-200 dark:border-purple-900/50"
                        }`}
                      >
                        {isCurrentlyResolving ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-[#19062d]" />
                            <span>Resolving with Validators...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 text-[#19062d]" />
                            <span>
                              {policy.status === "resolution_inconclusive"
                                ? "Retry Resolution"
                                : "Resolve Now (Live Consensus)"}
                            </span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
