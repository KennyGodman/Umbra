import React, { useState } from "react";
import { motion } from "framer-motion";
import { X, Shield, Copy, Check, ExternalLink, CloudRain, PlaneTakeoff, Clock, CheckCircle2, XCircle, AlertTriangle, Sparkles } from "lucide-react";

export default function PolicyDetailModal({ policy, onClose, onBuy }) {
  const [copied, setCopied] = useState(false);

  if (!policy) return null;

  const handleCopyUnderwriter = () => {
    navigator.clipboard.writeText(policy.underwriter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (ts) => {
    if (!ts) return "N/A";
    return new Date(Number(ts) * 1000).toLocaleString();
  };

  const truncate = (addr) => `${addr.slice(0, 8)}...${addr.slice(-6)}`;

  const getStatusBadge = () => {
    switch (policy.status) {
      case "open":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-mono font-semibold bg-slate-100 dark:bg-purple-950 text-purple-900 dark:text-purple-200 border border-slate-200 dark:border-purple-700/70 shadow-sm">
            Open for Purchase
          </span>
        );
      case "purchased":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-mono font-semibold bg-purple-100 dark:bg-[#21093b] text-purple-950 dark:text-white border border-purple-300 dark:border-purple-500/70 shadow-[0_0_12px_rgba(168,85,247,0.3)]">
            Purchased • Active
          </span>
        );
      case "resolved_triggered":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-mono font-semibold bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700/60 shadow-sm">
            Resolved: Triggered (Paid Out)
          </span>
        );
      case "resolved_not_triggered":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-mono font-semibold bg-slate-100 dark:bg-[#1a0c2e] text-slate-600 dark:text-purple-300/80 border border-slate-200 dark:border-purple-800/50">
            Resolved: Not Triggered
          </span>
        );
      case "expired":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-mono font-semibold bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
            Expired (Unsold)
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <motion.div 
        initial={{ scale: 0.94, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0, y: 15 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="relative w-full max-w-2xl bg-white dark:bg-[#120724] border border-slate-200 dark:border-purple-700/60 rounded-3xl shadow-2xl dark:shadow-purple-950/90 overflow-hidden flex flex-col max-h-[90vh] text-slate-800 dark:text-slate-100"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-purple-900/50 bg-slate-50 dark:bg-[#0d0517]">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-700/60">
              {policy.peril_type === "weather" ? <CloudRain className="w-5 h-5" /> : <PlaneTakeoff className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Policy #{policy.policy_id}</span>
                <span className="text-xs font-normal text-slate-500 dark:text-purple-300/70 uppercase tracking-wider">
                  ({policy.peril_type.replace("_", " ")})
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-purple-300/70">UMBRA Protocol Intelligent Contract</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {getStatusBadge()}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-purple-950/60 rounded-xl transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Prominent On-Chain Justification if resolved */}
          {policy.resolution_justification && (
            <div className={`p-5 rounded-2xl border ${
              policy.status === "resolved_triggered"
                ? "bg-purple-50 dark:bg-purple-950/50 border-purple-200 dark:border-purple-500/70 shadow-sm dark:shadow-purple-glow"
                : "bg-slate-50 dark:bg-[#0d0517] border-slate-200 dark:border-purple-900/60"
            }`}>
              <div className="flex items-center gap-2 mb-2.5">
                {policy.status === "resolved_triggered" ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 text-slate-400 dark:text-purple-300/80 shrink-0" />
                )}
                <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-purple-200">
                  On-Chain Validator Finding & Settlement Record
                </span>
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed font-sans pl-7">
                "{policy.resolution_justification}"
              </p>
            </div>
          )}

          {/* Trigger Condition */}
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase text-purple-700 dark:text-purple-400 tracking-wider">
              Natural Language Policy Trigger
            </span>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#0d0517] border border-slate-200 dark:border-purple-900/60 text-slate-700 dark:text-slate-200 text-sm leading-relaxed">
              "{policy.trigger_description}"
            </div>
          </div>

          {/* Metrics Overview */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#0d0517] border border-slate-200 dark:border-purple-900/60">
              <span className="text-[10px] uppercase font-semibold text-slate-400 dark:text-purple-300/70 tracking-wider">Premium</span>
              <p className="text-lg font-bold text-slate-900 dark:text-white font-mono mt-1">{policy.premium} GEN</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#0d0517] border border-slate-200 dark:border-purple-900/60">
              <span className="text-[10px] uppercase font-semibold text-slate-400 dark:text-purple-300/70 tracking-wider">Payout</span>
              <p className="text-lg font-bold text-purple-700 dark:text-purple-300 font-mono mt-1">{policy.payout} GEN</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#0d0517] border border-slate-200 dark:border-purple-900/60">
              <span className="text-[10px] uppercase font-semibold text-slate-400 dark:text-purple-300/70 tracking-wider">Multiplier</span>
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-1">
                {(Number(policy.payout) / Number(policy.premium)).toFixed(1)}x
              </p>
            </div>
          </div>

          {/* Verification Hint / Data Source */}
          <div className="space-y-1.5">
            <span className="text-xs font-semibold uppercase text-purple-700 dark:text-purple-400 tracking-wider">
              External Real-World Data Source
            </span>
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#0d0517] border border-slate-200 dark:border-purple-900/60 text-xs font-mono text-slate-800 dark:text-purple-200 break-all flex items-center justify-between gap-3">
              <span>{policy.data_source_hint}</span>
              {policy.data_source_hint.startsWith("http") && (
                <a
                  href={policy.data_source_hint}
                  target="_blank"
                  rel="noreferrer"
                  className="text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-white shrink-0 p-1"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>

          {/* Timing details */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#0d0517] border border-slate-200 dark:border-purple-900/60 space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-600 dark:text-purple-300/80">
              <span>Coverage Window Start:</span>
              <span className="font-mono text-slate-900 dark:text-white font-semibold">{formatDate(policy.coverage_start)}</span>
            </div>
            <div className="flex items-center justify-between text-slate-600 dark:text-purple-300/80">
              <span>Coverage Window End:</span>
              <span className="font-mono text-slate-900 dark:text-white font-semibold">{formatDate(policy.coverage_end)}</span>
            </div>
          </div>

          {/* Underwriter & Buyer Addresses */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#0d0517] border border-slate-200 dark:border-purple-900/60 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-purple-300/80">Underwriter (Collateral Provider):</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-slate-800 dark:text-purple-200 font-medium">{truncate(policy.underwriter)}</span>
                <button
                  onClick={handleCopyUnderwriter}
                  className="p-1 hover:text-slate-900 dark:hover:text-white text-slate-400 dark:text-purple-400"
                  title="Copy underwriter address"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {policy.buyer && (
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-purple-300/80">Buyer Address:</span>
                <span className="font-mono text-slate-800 dark:text-purple-300 font-medium">{truncate(policy.buyer)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 dark:border-purple-900/50 bg-slate-50 dark:bg-[#0d0517] flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="btn-purple-ghost !text-xs !py-2.5 !px-4"
          >
            Close
          </button>

          {policy.status === "open" && (
            <button
              onClick={() => {
                onClose();
                onBuy(policy);
              }}
              className="btn-white !text-xs !py-2.5 !px-5 !bg-white hover:!bg-slate-100 !text-[#19062d] font-bold shadow-btn-white"
            >
              <Shield className="w-4 h-4 text-[#19062d]" />
              <span>Buy Coverage ({policy.premium} GEN)</span>
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
