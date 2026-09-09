import React, { useState } from "react";
import { motion } from "framer-motion";
import { CloudRain, PlaneTakeoff, ShieldAlert, ArrowUpDown, Filter, Clock, ExternalLink, ShieldCheck, ChevronRight, Sparkles } from "lucide-react";

export default function Marketplace({
  policies,
  onSelectPolicy,
  onOpenBuyModal
}) {
  const [filterPeril, setFilterPeril] = useState("all");
  const [sortBy, setSortBy] = useState("ending_soonest");

  // Filter only open policies for the marketplace
  const openPolicies = policies.filter((p) => p.status === "open");

  const filtered = openPolicies.filter((policy) => {
    if (filterPeril === "all") return true;
    return policy.peril_type.toLowerCase() === filterPeril.toLowerCase();
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "premium_asc") return Number(a.premium) - Number(b.premium);
    if (sortBy === "payout_desc") return Number(b.payout) - Number(a.payout);
    if (sortBy === "ending_soonest") return Number(a.coverage_end) - Number(b.coverage_end);
    return 0;
  });

  const formatDate = (ts) => {
    if (!ts) return "N/A";
    return new Date(Number(ts) * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', month: 'short', day: 'numeric' });
  };

  const getPerilIcon = (type) => {
    if (type === "weather") return <CloudRain className="w-5 h-5 text-purple-600 dark:text-purple-300" />;
    if (type === "flight_delay") return <PlaneTakeoff className="w-5 h-5 text-indigo-600 dark:text-indigo-300" />;
    return <ShieldCheck className="w-5 h-5 text-fuchsia-600 dark:text-fuchsia-300" />;
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-purple-900/40 pb-5"
      >
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <span>Open Protection Marketplace</span>
            <span className="text-xs font-mono px-3 py-1 rounded-full bg-slate-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-200 border border-slate-200 dark:border-purple-700/60 shadow-sm">
              {openPolicies.length} Active Pools
            </span>
          </h2>
          <p className="text-sm text-slate-600 dark:text-purple-200/70 mt-1">
            Browse policies backed by 1:1 locked underwriter collateral and settled autonomously by GenLayer AI validators.
          </p>
        </div>

        {/* Filters and Sort */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Peril Filter Tabs */}
          <div className="flex items-center bg-slate-100 dark:bg-[#130726] border border-slate-200 dark:border-purple-900/60 rounded-2xl p-1 text-xs shadow-inner">
            <button
              onClick={() => setFilterPeril("all")}
              className={`px-3.5 py-1.5 rounded-xl transition-all font-medium ${
                filterPeril === "all" 
                  ? "bg-white text-[#19062d] font-bold shadow-sm" 
                  : "text-slate-600 dark:text-purple-300/80 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              All Perils
            </button>
            <button
              onClick={() => setFilterPeril("weather")}
              className={`px-3.5 py-1.5 rounded-xl transition-all font-medium flex items-center gap-1.5 ${
                filterPeril === "weather" 
                  ? "bg-white text-[#19062d] font-bold shadow-sm" 
                  : "text-slate-600 dark:text-purple-300/80 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <CloudRain className="w-3.5 h-3.5" />
              Weather
            </button>
            <button
              onClick={() => setFilterPeril("flight_delay")}
              className={`px-3.5 py-1.5 rounded-xl transition-all font-medium flex items-center gap-1.5 ${
                filterPeril === "flight_delay" 
                  ? "bg-white text-[#19062d] font-bold shadow-sm" 
                  : "text-slate-600 dark:text-purple-300/80 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <PlaneTakeoff className="w-3.5 h-3.5" />
              Flight Delay
            </button>
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-[#130726] border border-slate-200 dark:border-purple-900/60 rounded-2xl px-3.5 py-2 text-xs text-slate-700 dark:text-purple-200 shadow-inner">
            <ArrowUpDown className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            <span className="text-purple-700 dark:text-purple-400/80 font-medium">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              aria-label="Sort policies by"
              className="bg-transparent border-none text-xs text-slate-900 dark:text-white font-medium focus:outline-none cursor-pointer"
            >
              <option value="ending_soonest" className="bg-white dark:bg-[#120724] text-slate-900 dark:text-purple-100">Ending Soonest</option>
              <option value="premium_asc" className="bg-white dark:bg-[#120724] text-slate-900 dark:text-purple-100">Premium (Low to High)</option>
              <option value="payout_desc" className="bg-white dark:bg-[#120724] text-slate-900 dark:text-purple-100">Payout (High to Low)</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Policies Grid */}
      {sorted.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-3xl border border-dashed border-slate-300 dark:border-purple-900/60 p-12 text-center bg-white/70 dark:bg-[#120724]/40 backdrop-blur-md"
        >
          <ShieldAlert className="w-12 h-12 text-purple-500/40 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800 dark:text-purple-200">No Open Policies Found</h3>
          <p className="text-xs text-slate-500 dark:text-purple-300/60 mt-1 max-w-sm mx-auto">
            {filterPeril !== "all"
              ? `There are currently no open policies for the '${filterPeril}' peril filter.`
              : "All policies are currently purchased, expired, or resolved."}
          </p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sorted.map((policy, index) => {
            const multiplier = (Number(policy.payout) / Number(policy.premium)).toFixed(1);
            return (
              <motion.div
                key={policy.policy_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.08 }}
                whileHover={{ y: -6, transition: { duration: 0.2 } }}
                className="group relative rounded-2xl bg-white dark:bg-[#120822]/90 border border-slate-200 dark:border-purple-900/40 hover:border-purple-400 dark:hover:border-purple-500/70 transition-all duration-200 shadow-sm hover:shadow-md dark:shadow-purple-card dark:hover:shadow-[0_12px_35px_rgba(46,16,101,0.45)] flex flex-col justify-between overflow-hidden"
              >
                {/* Top Peril & ID banner */}
                <div className="p-5 pb-3">
                  <div className="flex items-center justify-between mb-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/80 border border-purple-200 dark:border-purple-700/60 shadow-inner">
                        {getPerilIcon(policy.peril_type)}
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider block">
                          {policy.peril_type.replace("_", " ")}
                        </span>
                        <span className="text-[10px] font-mono text-purple-700 dark:text-purple-300/70">
                          Policy #{policy.policy_id}
                        </span>
                      </div>
                    </div>

                    <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-medium bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700/50">
                      1:1 Collateralized
                    </span>
                  </div>

                  {/* Trigger description */}
                  <div
                    onClick={() => onSelectPolicy(policy)}
                    className="cursor-pointer group/desc hover:text-purple-700 dark:hover:text-purple-200 transition-colors"
                  >
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 leading-snug line-clamp-3 min-h-[4rem]">
                      "{policy.trigger_description}"
                    </p>
                  </div>
                </div>

                {/* Metrics / Premium & Payout */}
                <div className="px-5 py-3.5 bg-slate-50 dark:bg-[#0d0517]/80 border-t border-b border-slate-100 dark:border-purple-900/40 grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-[10px] uppercase font-semibold text-slate-500 dark:text-purple-300/70 tracking-wider">Premium</p>
                    <p className="text-base font-bold text-slate-900 dark:text-white font-mono">{policy.premium} <span className="text-xs text-purple-600 dark:text-purple-400 font-sans">GEN</span></p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-semibold text-slate-500 dark:text-purple-300/70 tracking-wider">Payout</p>
                    <p className="text-base font-bold text-purple-700 dark:text-purple-300 font-mono">{policy.payout} <span className="text-xs text-purple-600 dark:text-purple-400 font-sans">GEN</span></p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-semibold text-slate-500 dark:text-purple-300/70 tracking-wider">Multiplier</p>
                    <p className="text-base font-bold text-emerald-600 dark:text-emerald-400 font-mono">{multiplier}x</p>
                  </div>
                </div>

                {/* Timing & Buttons */}
                <div className="p-5 pt-3.5 space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-purple-300/70">
                    <span className="flex items-center gap-1.5 text-[11px]">
                      <Clock className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                      Window Ends:
                    </span>
                    <span className="font-mono text-[11px] text-slate-700 dark:text-purple-200 font-medium">
                      {formatDate(policy.coverage_end)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5 pt-1">
                    {/* Dark Purple Button with White Text */}
                    <button
                      onClick={() => onSelectPolicy(policy)}
                      className="btn-dark-purple flex-1 !py-2.5 !px-3 !text-xs"
                    >
                      <span>Inspect</span>
                      <ChevronRight className="w-3.5 h-3.5 text-purple-300" />
                    </button>

                    {/* White Button with Dark Purple Text */}
                    <button
                      onClick={() => onOpenBuyModal(policy)}
                      className="btn-white flex-1 !py-2.5 !px-3 !text-xs !bg-white hover:!bg-slate-100 !text-[#19062d] font-bold shadow-btn-white"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-[#19062d]" />
                      <span>Buy Coverage</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
