import React, { useState } from "react";
import { motion } from "framer-motion";
import { CloudRain, PlaneTakeoff, ShieldAlert, Sparkles, Clock, AlertCircle, ArrowRight, ShieldCheck } from "lucide-react";

export default function CreatePolicy({
  connectedAccount,
  onCreatePolicy,
  onGoToDashboard
}) {
  const [perilType, setPerilType] = useState("weather");
  const [triggerDescription, setTriggerDescription] = useState(
    "Total accumulated precipitation < 15mm in Madrid during observation window"
  );
  const [dataSourceHint, setDataSourceHint] = useState(
    "https://archive-api.open-meteo.com/v1/era5?latitude=40.4168&longitude=-3.7038&daily=precipitation_sum"
  );
  const [premium, setPremium] = useState(40);
  const [payout, setPayout] = useState(600);

  // Default dates: start in 1 minute, end in 4 minutes (ideal for testing)
  const defaultStart = new Date(Date.now() + 60 * 1000).toISOString().slice(0, 16);
  const defaultEnd = new Date(Date.now() + 240 * 1000).toISOString().slice(0, 16);

  const [coverageStartStr, setCoverageStartStr] = useState(defaultStart);
  const [coverageEndStr, setCoverageEndStr] = useState(defaultEnd);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const presets = {
    weather: [
      {
        desc: "Total accumulated precipitation < 10mm in Lagos, Nigeria during observation window",
        hint: "https://archive-api.open-meteo.com/v1/era5?latitude=6.5244&longitude=3.3792&daily=precipitation_sum",
        premium: 35,
        payout: 500
      },
      {
        desc: "Maximum recorded temperature > 40°C in Phoenix Sky Harbor (KPHX) station",
        hint: "https://api.weather.gov/stations/KPHX/observations",
        premium: 50,
        payout: 750
      }
    ],
    flight_delay: [
      {
        desc: "Delta flight DL123 arrival delay exceeds 120 minutes at ATL airport",
        hint: "https://flightaware.com/live/flight/DAL123",
        premium: 50,
        payout: 800
      },
      {
        desc: "United flight UA854 delay > 90 minutes from Houston (IAH) to Lima (LIM)",
        hint: "https://api.flightstats.com/flex/flightstatus/rest/v2/json/flight/status/UA/854",
        premium: 45,
        payout: 600
      }
    ]
  };

  const applyPreset = (item) => {
    setTriggerDescription(item.desc);
    setDataSourceHint(item.hint);
    setPremium(item.premium);
    setPayout(item.payout);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const startTs = Math.floor(new Date(coverageStartStr).getTime() / 1000);
    const endTs = Math.floor(new Date(coverageEndStr).getTime() / 1000);

    if (isNaN(startTs) || isNaN(endTs)) {
      setError("Please specify valid coverage start and end dates.");
      return;
    }

    if (endTs <= startTs) {
      setError("Coverage end time must be after coverage start time.");
      return;
    }

    if (Number(payout) <= Number(premium)) {
      setError("Payout collateral must be greater than premium.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onCreatePolicy({
        peril_type: perilType,
        trigger_description: triggerDescription,
        data_source_hint: dataSourceHint,
        premium: Number(premium),
        payout: Number(payout),
        coverage_start: startTs,
        coverage_end: endTs
      });
      onGoToDashboard();
    } catch (err) {
      setError(err.message || "Failed to create policy");
    } finally {
      setIsSubmitting(false);
    }
  };

  const multiplier = Number(premium) > 0 ? (Number(payout) / Number(premium)).toFixed(1) : "0";

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-b border-slate-200 dark:border-purple-900/40 pb-5"
      >
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          Create & Underwrite Parametric Policy
        </h2>
        <p className="text-sm text-slate-600 dark:text-purple-200/70 mt-1">
          Lock 1:1 collateral to sponsor a transparent insurance policy settled by GenLayer AI validators.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Form Column */}
        <motion.div 
          initial={{ opacity: 0, x: -15 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-7 space-y-6"
        >
          <form onSubmit={handleSubmit} className="p-7 rounded-3xl bg-white dark:bg-[#120822]/90 border border-slate-200 dark:border-purple-900/50 shadow-sm dark:shadow-purple-card space-y-6">
            {/* Peril Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-purple-300 uppercase tracking-wider mb-2.5">
                1. Select Peril Type
              </label>
              <div className="grid grid-cols-2 gap-3.5">
                <button
                  type="button"
                  onClick={() => {
                    setPerilType("weather");
                    applyPreset(presets.weather[0]);
                  }}
                  className={`p-4 rounded-2xl border flex items-center gap-3.5 transition-all ${
                    perilType === "weather"
                      ? "bg-purple-100 dark:bg-white text-purple-950 dark:text-[#19062d] border-purple-300 dark:border-white shadow-sm font-bold"
                      : "bg-slate-50 dark:bg-[#0d0517] border-slate-200 dark:border-purple-900/60 text-slate-600 dark:text-purple-300 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <CloudRain className="w-5 h-5 text-purple-600 dark:text-purple-300" />
                  <div className="text-left">
                    <p className="text-xs font-bold">Weather</p>
                    <p className={`text-[10px] ${perilType === "weather" ? "text-purple-900 dark:text-purple-950 font-medium" : "text-slate-400 dark:text-purple-400/70"}`}>
                      Rain, drought, freeze
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPerilType("flight_delay");
                    applyPreset(presets.flight_delay[0]);
                  }}
                  className={`p-4 rounded-2xl border flex items-center gap-3.5 transition-all ${
                    perilType === "flight_delay"
                      ? "bg-purple-100 dark:bg-white text-purple-950 dark:text-[#19062d] border-purple-300 dark:border-white shadow-sm font-bold"
                      : "bg-slate-50 dark:bg-[#0d0517] border-slate-200 dark:border-purple-900/60 text-slate-600 dark:text-purple-300 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <PlaneTakeoff className="w-5 h-5 text-indigo-600 dark:text-indigo-300" />
                  <div className="text-left">
                    <p className="text-xs font-bold">Flight Delay</p>
                    <p className={`text-[10px] ${perilType === "flight_delay" ? "text-purple-900 dark:text-purple-950 font-medium" : "text-slate-400 dark:text-purple-400/70"}`}>
                      Tarmac delay, cancel
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* Quick Presets */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[11px] font-semibold text-slate-500 dark:text-purple-300/80 uppercase tracking-wider">
                  Template Presets
                </label>
                <span className="text-[11px] text-purple-600 dark:text-purple-300 font-mono">Click to autofill</span>
              </div>
              <div className="space-y-1.5">
                {(presets[perilType] || []).map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => applyPreset(preset)}
                    className="w-full text-left p-3 rounded-xl bg-slate-50 dark:bg-[#0d0517] hover:bg-purple-50 dark:hover:bg-purple-950/60 border border-slate-200 dark:border-purple-900/60 text-xs text-slate-700 dark:text-slate-200 transition-colors flex items-center justify-between"
                  >
                    <span className="truncate pr-2">"{preset.desc}"</span>
                    <span className="shrink-0 text-[10px] font-mono text-purple-800 dark:text-purple-200 bg-purple-100 dark:bg-purple-900/70 border border-purple-200 dark:border-purple-700/50 px-2 py-0.5 rounded-lg font-semibold">
                      {preset.premium} / {preset.payout} GEN
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Trigger Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-purple-300 uppercase tracking-wider mb-2">
                2. Plain-English Trigger Condition
              </label>
              <textarea
                rows={3}
                required
                value={triggerDescription}
                onChange={(e) => setTriggerDescription(e.target.value)}
                className="w-full rounded-2xl bg-slate-50 dark:bg-[#0d0517] border border-slate-200 dark:border-purple-900/70 px-4 py-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 transition-colors"
                placeholder="Describe the condition in plain English that validators will evaluate..."
              />
            </div>

            {/* Data Source Hint */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-purple-300 uppercase tracking-wider mb-2">
                3. Validator Data Source URL / Hint
              </label>
              <input
                type="text"
                required
                value={dataSourceHint}
                onChange={(e) => setDataSourceHint(e.target.value)}
                className="w-full rounded-xl bg-slate-50 dark:bg-[#0d0517] border border-slate-200 dark:border-purple-900/70 px-4 py-2.5 text-xs text-purple-800 dark:text-purple-200 font-mono focus:outline-none focus:border-purple-500 transition-colors"
                placeholder="https://api... or flight tracking endpoint"
              />
            </div>

            {/* Financials: Premium & Payout */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-purple-300 uppercase tracking-wider mb-2">
                  4. Premium (GEN)
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={premium}
                  onChange={(e) => setPremium(e.target.value)}
                  className="w-full rounded-xl bg-slate-50 dark:bg-[#0d0517] border border-slate-200 dark:border-purple-900/70 px-4 py-2.5 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-purple-300 uppercase tracking-wider mb-2">
                  5. Payout Collateral (GEN)
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={payout}
                  onChange={(e) => setPayout(e.target.value)}
                  className="w-full rounded-xl bg-slate-50 dark:bg-[#0d0517] border border-slate-200 dark:border-purple-900/70 px-4 py-2.5 text-xs text-purple-700 dark:text-purple-300 font-bold font-mono focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            {/* Coverage Windows */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-purple-300 uppercase tracking-wider mb-2">
                  6. Coverage Start
                </label>
                <input
                  type="datetime-local"
                  required
                  value={coverageStartStr}
                  onChange={(e) => setCoverageStartStr(e.target.value)}
                  className="w-full rounded-xl bg-slate-50 dark:bg-[#0d0517] border border-slate-200 dark:border-purple-900/70 px-3 py-2 text-xs text-slate-800 dark:text-purple-200 font-mono focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-purple-300 uppercase tracking-wider mb-2">
                  7. Coverage End
                </label>
                <input
                  type="datetime-local"
                  required
                  value={coverageEndStr}
                  onChange={(e) => setCoverageEndStr(e.target.value)}
                  className="w-full rounded-xl bg-slate-50 dark:bg-[#0d0517] border border-slate-200 dark:border-purple-900/70 px-3 py-2 text-xs text-slate-800 dark:text-purple-200 font-mono focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            {error && (
              <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/50 text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit: White Button with Dark Purple Text */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-white w-full !py-4 !bg-white hover:!bg-slate-100 !text-[#19062d] font-bold shadow-btn-white text-sm"
            >
              {isSubmitting ? (
                <span>Locking Collateral & Creating On-Chain...</span>
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5 text-[#19062d]" />
                  <span>Lock {payout} GEN Collateral & Deploy Policy</span>
                </>
              )}
            </button>
          </form>
        </motion.div>

        {/* Live Preview Card Column */}
        <motion.div 
          initial={{ opacity: 0, x: 15 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-5 space-y-4"
        >
          <div className="flex items-center gap-2 text-xs font-semibold text-purple-700 dark:text-purple-300 uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-purple-500 dark:text-purple-400" />
            <span>Live Marketplace Preview</span>
          </div>

          <div className="rounded-3xl bg-white dark:bg-[#120822]/95 border border-slate-200 dark:border-purple-600/50 p-6 shadow-sm dark:shadow-purple-card space-y-4 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-700/60">
                  {perilType === "weather" ? <CloudRain className="w-5 h-5" /> : <PlaneTakeoff className="w-5 h-5" />}
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider block">
                    {perilType.replace("_", " ")}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 dark:text-purple-300/70">Preview Policy</span>
                </div>
              </div>

              <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-medium bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700/50">
                1:1 Collateralized
              </span>
            </div>

            <p className="text-sm font-medium text-slate-700 dark:text-slate-200 leading-snug min-h-[3.5rem]">
              "{triggerDescription || "Trigger condition will appear here..."}"
            </p>

            <div className="p-3.5 bg-slate-50 dark:bg-[#0d0517] border border-slate-200 dark:border-purple-900/60 rounded-2xl grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-[10px] uppercase font-semibold text-slate-500 dark:text-purple-300/70">Premium</p>
                <p className="text-base font-bold text-slate-900 dark:text-white font-mono">{premium || 0} GEN</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-semibold text-slate-500 dark:text-purple-300/70">Payout</p>
                <p className="text-base font-bold text-purple-700 dark:text-purple-300 font-mono">{payout || 0} GEN</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-semibold text-slate-500 dark:text-purple-300/70">Coverage</p>
                <p className="text-base font-bold text-emerald-600 dark:text-emerald-400 font-mono">{multiplier}x</p>
              </div>
            </div>

            <div className="text-xs font-mono text-purple-700 dark:text-purple-300/80 truncate bg-slate-50 dark:bg-[#0d0517] p-3 rounded-xl border border-slate-200 dark:border-purple-900/60">
              <span className="text-purple-600 dark:text-purple-400 font-bold">Hint:</span> {dataSourceHint || "Hint URL..."}
            </div>

            <div className="pt-2">
              <button
                disabled
                className="btn-dark-purple w-full !py-3 opacity-60 cursor-not-allowed justify-center"
              >
                <span>Buy Coverage ({premium} GEN)</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
