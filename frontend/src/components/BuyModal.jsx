import React, { useState } from "react";
import { motion } from "framer-motion";
import { X, ShieldCheck, AlertCircle, CheckCircle2, Loader2, ArrowRight, Sparkles } from "lucide-react";

export default function BuyModal({
  policy,
  connectedAccount,
  onClose,
  onConfirmBuy,
  onGoToMyPolicies
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  if (!policy) return null;

  const handlePurchase = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      await onConfirmBuy(policy.policy_id);
      setSuccess(true);
    } catch (err) {
      setError(err.message || "Failed to purchase policy");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <motion.div 
        initial={{ scale: 0.94, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0, y: 15 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="relative w-full max-w-md bg-white dark:bg-[#120724] border border-slate-200 dark:border-purple-700/60 rounded-3xl shadow-2xl dark:shadow-purple-950/80 overflow-hidden text-slate-800 dark:text-slate-100"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-purple-900/50 bg-slate-50 dark:bg-[#0d0517]">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950/90 border border-purple-200 dark:border-purple-600/60 text-purple-700 dark:text-purple-300">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Confirm Coverage Purchase</h3>
              <p className="text-[11px] text-slate-500 dark:text-purple-300/70">Policy #{policy.policy_id} • 1:1 Backed</p>
            </div>
          </div>

          {!isSubmitting && (
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-purple-950/60 rounded-xl transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {success ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-purple-100 dark:bg-purple-950/90 border border-purple-200 dark:border-purple-500/70 text-purple-700 dark:text-purple-300 flex items-center justify-center mx-auto shadow-sm animate-bounce">
                <CheckCircle2 className="w-9 h-9 text-emerald-500" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">Coverage Activated!</h4>
                <p className="text-xs text-slate-600 dark:text-purple-200/80 mt-1 max-w-xs mx-auto">
                  Your premium of <span className="font-mono text-purple-700 dark:text-purple-300 font-bold">{policy.premium} GEN</span> has been locked into the UMBRA contract.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-[#0d0517] rounded-2xl border border-slate-200 dark:border-purple-900/60 text-xs text-slate-600 dark:text-purple-300/80 text-left space-y-1.5">
                <div className="flex justify-between">
                  <span>Buyer:</span>
                  <span className="font-mono text-slate-800 dark:text-purple-200">{connectedAccount.slice(0, 10)}...</span>
                </div>
                <div className="flex justify-between">
                  <span>Potential Payout:</span>
                  <span className="font-mono text-slate-900 dark:text-white font-bold">{policy.payout} GEN</span>
                </div>
              </div>

              {/* White Button with Dark Purple Text */}
              <button
                onClick={() => {
                  onClose();
                  onGoToMyPolicies();
                }}
                className="btn-white w-full !py-3.5 !bg-white hover:!bg-slate-100 !text-[#19062d] font-bold shadow-btn-white"
              >
                <span>View in My Policies</span>
                <ArrowRight className="w-4 h-4 text-[#19062d]" />
              </button>
            </div>
          ) : (
            <>
              {/* Policy Trigger Reminder */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#0d0517] border border-slate-200 dark:border-purple-900/60 space-y-1">
                <span className="text-[10px] font-semibold uppercase text-purple-700 dark:text-purple-400 tracking-wider">Trigger Condition:</span>
                <p className="text-xs text-slate-700 dark:text-slate-200 font-medium leading-relaxed">
                  "{policy.trigger_description}"
                </p>
              </div>

              {/* Breakdown */}
              <div className="space-y-2.5 text-xs border-y border-slate-200 dark:border-purple-900/50 py-3.5">
                <div className="flex items-center justify-between text-slate-700 dark:text-purple-200/90">
                  <span>Premium to Pay:</span>
                  <span className="font-mono text-sm font-bold text-slate-900 dark:text-white">{policy.premium} GEN</span>
                </div>
                <div className="flex items-center justify-between text-slate-700 dark:text-purple-200/90">
                  <span>Guaranteed Payout if Triggered:</span>
                  <span className="font-mono text-sm font-bold text-purple-700 dark:text-purple-300">{policy.payout} GEN</span>
                </div>
                <div className="flex items-center justify-between text-slate-500 dark:text-purple-300/70 text-[11px]">
                  <span>Underwriter Collateral:</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">100% Pre-locked on-chain</span>
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/50 text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Action Button: White Button with Dark Purple Text */}
              <button
                onClick={handlePurchase}
                disabled={isSubmitting}
                className="btn-white w-full !py-3.5 !bg-white hover:!bg-slate-100 !text-[#19062d] font-bold shadow-btn-white disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#19062d]" />
                    <span>Confirming on GenLayer...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 text-[#19062d]" />
                    <span>Confirm & Pay {policy.premium} GEN</span>
                  </>
                )}
              </button>

              <p className="text-[11px] text-center text-slate-400 dark:text-purple-300/60 font-mono">
                Smart contract invocation: <code className="text-purple-700 dark:text-purple-300 font-semibold">buy_policy({policy.policy_id})</code>
              </p>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
