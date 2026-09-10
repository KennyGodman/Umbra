import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Shield, 
  Umbrella, 
  CloudRain, 
  PlaneTakeoff, 
  ArrowRight, 
  Zap, 
  Eye, 
  Scale, 
  Database, 
  Sparkles, 
  CheckCircle2, 
  ChevronRight, 
  Activity, 
  Globe,
  Sun,
  Moon
} from "lucide-react";

export default function LandingPage({ onLaunchDapp, theme = "dark", onToggleTheme }) {
  // Rotating text & color variations supporting both light and dark themes
  const ROTATING_HIGHLIGHTS = [
    {
      action: "Autonomous Parametric Protection",
      rotatingWord: "Zero Claims Adjusters.",
      gradient: "from-purple-800 via-fuchsia-600 to-indigo-800 dark:from-white dark:via-purple-200 dark:to-fuchsia-400",
      pillBg: "bg-purple-100 dark:bg-purple-950/70 border-purple-300 dark:border-purple-600/60 text-purple-900 dark:text-purple-200",
      accentDot: "bg-purple-600 dark:bg-purple-400",
      tag: "Instant Resolution",
      desc: "Eliminate lengthy paperwork and subjective human claims examiners. GenLayer AI validators verify real-world conditions directly from the web."
    },
    {
      action: "Deterministic Real-World Payouts",
      rotatingWord: "Live Flight Delay Telemetry.",
      gradient: "from-sky-800 via-cyan-700 to-blue-900 dark:from-sky-200 dark:via-cyan-200 dark:to-white",
      pillBg: "bg-sky-100 dark:bg-sky-950/70 border-sky-300 dark:border-sky-600/60 text-sky-900 dark:text-sky-200",
      accentDot: "bg-sky-600 dark:bg-sky-400",
      tag: "Aviation Oracles",
      desc: "FlightAware and ADS-B radar observations trigger automated compensation the exact moment arrival delay thresholds are crossed."
    },
    {
      action: "Algorithmic Climate Resilience",
      rotatingWord: "Satellite Rainfall & Drought.",
      gradient: "from-emerald-800 via-teal-700 to-emerald-950 dark:from-emerald-200 dark:via-teal-200 dark:to-white",
      pillBg: "bg-emerald-100 dark:bg-emerald-950/70 border-emerald-300 dark:border-emerald-600/60 text-emerald-900 dark:text-emerald-200",
      accentDot: "bg-emerald-600 dark:bg-emerald-400",
      tag: "Climate Shield",
      desc: "Micro-hedges for agriculture, outdoor venues, and transport backed by satellite reanalysis and NOAA weather station observations."
    },
    {
      action: "Consensus via Equivalence Principle",
      rotatingWord: "Decentralized AI Validators.",
      gradient: "from-fuchsia-800 via-pink-700 to-purple-900 dark:from-fuchsia-300 dark:via-pink-200 dark:to-purple-200",
      pillBg: "bg-fuchsia-100 dark:bg-fuchsia-950/70 border-fuchsia-300 dark:border-fuchsia-600/60 text-fuchsia-900 dark:text-fuchsia-200",
      accentDot: "bg-fuchsia-600 dark:bg-fuchsia-400",
      tag: "GenLayer Quorum",
      desc: "Independent nodes execute prompt_non_comparative to agree on plain-English facts without brittle byte-for-byte string mismatches."
    },
    {
      action: "Trustless Solvency Guarantee",
      rotatingWord: "100% Pre-Locked Escrow.",
      gradient: "from-amber-700 via-orange-600 to-amber-900 dark:from-amber-200 dark:via-yellow-100 dark:to-white",
      pillBg: "bg-amber-100 dark:bg-amber-950/70 border-amber-300 dark:border-amber-600/60 text-amber-900 dark:text-amber-200",
      accentDot: "bg-amber-600 dark:bg-amber-400",
      tag: "Zero Insolvency",
      desc: "Underwriters deposit full 1:1 collateral into the smart contract before any policy is listed. Zero fractional risk for policyholders."
    }
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  // Interval to change text and colors every 3.2 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % ROTATING_HIGHLIGHTS.length);
    }, 3200);
    return () => clearInterval(timer);
  }, []);

  const active = ROTATING_HIGHLIGHTS[currentIndex];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#0a0812] text-slate-900 dark:text-slate-100 relative selection:bg-purple-600/30 selection:text-purple-900 dark:selection:text-purple-100 font-sans transition-colors duration-200">
      {/* Clean top border accent highlight */}
      <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-purple-500/60 to-transparent" />

      {/* Top Header - Structured, Crisp, and Theme-aware */}
      <header className="border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-[#0d0a17]/90 backdrop-blur-md sticky top-0 z-30 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            <div className="relative w-10 h-10 rounded-xl overflow-hidden shadow-md border border-purple-300 dark:border-purple-500/40 bg-purple-50 dark:bg-[#120a22]">
              <img src="/umbra-logo.jpg" alt="UMBRA Logo" className="w-full h-full object-cover" />
            </div>
            <div className="flex items-center gap-2.5">
              <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                UMBRA
              </span>
              <span className="hidden sm:inline-block text-[11px] font-medium tracking-wide uppercase px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/80 border border-purple-200 dark:border-purple-800/60 text-purple-800 dark:text-purple-300">
                Parametric Protocol
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Theme Selector (Segmented Light / Dark Mode) */}
            {onToggleTheme && (
              <div 
                className="flex items-center p-0.5 bg-slate-100 dark:bg-purple-950/70 rounded-xl border border-slate-200 dark:border-purple-800/60 shadow-inner"
                role="radiogroup"
                aria-label="Color scheme selector"
              >
                <button
                  type="button"
                  onClick={() => onToggleTheme("light")}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition-all ${
                    theme === "light"
                      ? "bg-white text-purple-900 shadow-sm font-semibold border border-slate-200/80"
                      : "text-slate-500 hover:text-slate-900 dark:text-purple-300/70 dark:hover:text-white font-medium"
                  }`}
                  title="Switch to Light Mode"
                  aria-checked={theme === "light"}
                >
                  <Sun className={`w-3.5 h-3.5 ${theme === "light" ? "text-amber-500 fill-amber-500/20" : ""}`} />
                  <span>Light</span>
                </button>
                <button
                  type="button"
                  onClick={() => onToggleTheme("dark")}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition-all ${
                    theme === "dark"
                      ? "bg-purple-900 text-white shadow-sm font-semibold border border-purple-700/80"
                      : "text-slate-500 hover:text-slate-900 dark:text-purple-300/70 dark:hover:text-white font-medium"
                  }`}
                  title="Switch to Dark Mode"
                  aria-checked={theme === "dark"}
                >
                  <Moon className={`w-3.5 h-3.5 ${theme === "dark" ? "text-purple-300 fill-purple-300/20" : ""}`} />
                  <span>Dark</span>
                </button>
              </div>
            )}

            {/* Launch DApp button */}
            <button
              onClick={onLaunchDapp}
              className="btn-white !text-xs !py-2 !px-4 shadow-btn-white"
            >
              <span>Launch DApp</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#19062d]" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 pt-16 pb-24 z-10">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          
          {/* Dynamic Changing Badge */}
          <div className="h-9 flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25 }}
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono font-medium border shadow-sm ${active.pillBg}`}
              >
                <span className={`w-2 h-2 rounded-full ${active.accentDot} animate-pulse`} />
                <span>{active.tag} • {active.action}</span>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Main Headline with Smooth Rotating Text and Colors */}
          <div className="space-y-2">
            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.12]">
              Parametric Insurance. <br />
              <div className="h-16 sm:h-20 flex items-center justify-center overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={currentIndex}
                    initial={{ opacity: 0, y: 22 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -22 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className={`inline-block bg-gradient-to-r ${active.gradient} bg-clip-text text-transparent font-extrabold`}
                  >
                    {active.rotatingWord}
                  </motion.span>
                </AnimatePresence>
              </div>
            </h1>
          </div>

          {/* Dynamic Context Description matching the active theme */}
          <div className="min-h-[4rem] flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.p
                key={currentIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="text-base sm:text-lg text-slate-600 dark:text-slate-300/90 max-w-2xl mx-auto leading-relaxed"
              >
                {active.desc}
              </motion.p>
            </AnimatePresence>
          </div>

          {/* Action Buttons: White & Dark Purple Buttons */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            {/* White Button with Dark Purple Text */}
            <button
              onClick={onLaunchDapp}
              className="btn-white w-full sm:w-auto !px-7 !py-3.5 !text-sm shadow-btn-white group"
            >
              <span>Explore Marketplace</span>
              <ArrowRight className="w-4 h-4 text-[#19062d] group-hover:translate-x-1 transition-transform" />
            </button>

            {/* Dark Purple Button with White Text */}
            <button
              onClick={onLaunchDapp}
              className="btn-dark-purple w-full sm:w-auto !px-7 !py-3.5 !text-sm"
            >
              <Sparkles className="w-4 h-4 text-purple-300" />
              <span>Underwrite Policy</span>
            </button>
          </div>

          {/* Clean UIkit-style Micro Specs Strip */}
          <div className="pt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center border-t border-slate-200 dark:border-slate-800/80 max-w-2xl mx-auto">
            <div className="p-3 bg-white dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-sm dark:shadow-none">
              <p className="text-[10px] uppercase font-mono text-slate-500 dark:text-slate-400">Consensus Engine</p>
              <p className="text-xs font-semibold text-slate-900 dark:text-white font-mono mt-0.5">prompt_non_comp</p>
            </div>
            <div className="p-3 bg-white dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-sm dark:shadow-none">
              <p className="text-[10px] uppercase font-mono text-slate-500 dark:text-slate-400">Escrow Ratio</p>
              <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">1:1 Pre-Locked</p>
            </div>
            <div className="p-3 bg-white dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-sm dark:shadow-none">
              <p className="text-[10px] uppercase font-mono text-slate-500 dark:text-slate-400">Settlement</p>
              <p className="text-xs font-semibold text-purple-700 dark:text-purple-300 font-mono mt-0.5">Zero Adjusters</p>
            </div>
            <div className="p-3 bg-white dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-sm dark:shadow-none">
              <p className="text-[10px] uppercase font-mono text-slate-500 dark:text-slate-400">Network</p>
              <p className="text-xs font-semibold text-sky-600 dark:text-sky-400 font-mono mt-0.5">GenLayer Testnet</p>
            </div>
          </div>
        </div>

        {/* Structured Peril Cards - Clean Layout */}
        <div className="mt-20">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Active Peril Architectures</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Real-world data sources evaluated directly on-chain</p>
            </div>
            <span className="text-xs font-mono text-purple-700 dark:text-purple-400 bg-purple-100 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800/50 px-3 py-1 rounded-full font-medium">
              Live Verified
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Weather Card */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#0f0c1b] border border-slate-200 dark:border-slate-800/90 shadow-sm dark:shadow-none hover:border-purple-400 dark:hover:border-purple-600/50 transition-all duration-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-purple-100 dark:bg-purple-950/80 border border-purple-200 dark:border-purple-800/50 text-purple-700 dark:text-purple-300">
                    <CloudRain className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">Precipitation & Drought Indices</h4>
                    <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">ERA5 Reanalysis • Open-Meteo • NOAA</span>
                  </div>
                </div>
                <span className="text-xs font-mono px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-900 text-purple-700 dark:text-purple-300 border border-slate-200 dark:border-slate-800 font-medium">
                  Peril #1
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                Parametric agriculture protection. Validators query satellite weather observations at the close of the observation window. If recorded rainfall is below the threshold, payout triggers automatically.
              </p>
              <div className="p-3 bg-slate-50 dark:bg-black/40 rounded-xl border border-slate-200 dark:border-slate-800/80 text-xs font-mono text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span className="text-purple-700 dark:text-purple-400 font-semibold">Sample Trigger:</span>
                <span className="text-slate-800 dark:text-slate-200">"Rainfall &lt; 10mm in Lagos, Nigeria"</span>
              </div>
            </div>

            {/* Flight Delay Card */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#0f0c1b] border border-slate-200 dark:border-slate-800/90 shadow-sm dark:shadow-none hover:border-sky-400 dark:hover:border-sky-600/50 transition-all duration-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-sky-100 dark:bg-sky-950/80 border border-sky-200 dark:border-sky-800/50 text-sky-700 dark:text-sky-300">
                    <PlaneTakeoff className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">Commercial Flight Delays</h4>
                    <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">FlightAware • FlightStats • ADS-B</span>
                  </div>
                </div>
                <span className="text-xs font-mono px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-900 text-sky-700 dark:text-sky-300 border border-slate-200 dark:border-slate-800 font-medium">
                  Peril #2
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                Automatic passenger disruption insurance. Node validators ingest live ADS-B telemetry and airport gate logs to verify arrival and tarmac delays exceeding the policy threshold.
              </p>
              <div className="p-3 bg-slate-50 dark:bg-black/40 rounded-xl border border-slate-200 dark:border-slate-800/80 text-xs font-mono text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span className="text-sky-700 dark:text-sky-400 font-semibold">Sample Trigger:</span>
                <span className="text-slate-800 dark:text-slate-200">"Delta DL123 delay &gt; 120 mins at ATL"</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3 Core Pillars - Clean Grid */}
        <div className="mt-16 pt-12 border-t border-slate-200 dark:border-slate-800/80">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 rounded-2xl bg-white dark:bg-[#0f0c1b] border border-slate-200 dark:border-slate-800/80 shadow-sm dark:shadow-none">
              <div className="w-9 h-9 rounded-lg bg-purple-50 dark:bg-slate-900 border border-purple-200 dark:border-slate-800 flex items-center justify-center text-purple-600 dark:text-purple-400 mb-3">
                <Scale className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Equivalence Principle</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                GenLayer's <code className="text-purple-700 dark:text-purple-300 font-mono font-semibold">prompt_non_comparative</code> principle guarantees validator agreement on truth without requiring identical string syntax.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-[#0f0c1b] border border-slate-200 dark:border-slate-800/80 shadow-sm dark:shadow-none">
              <div className="w-9 h-9 rounded-lg bg-sky-50 dark:bg-slate-900 border border-sky-200 dark:border-slate-800 flex items-center justify-center text-sky-600 dark:text-sky-400 mb-3">
                <Database className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">1:1 Pre-Locked Collateral</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Policies are backed dollar-for-dollar by underwriter collateral locked at pool creation. Eliminates fractional insolvency and non-payment risk.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-[#0f0c1b] border border-slate-200 dark:border-slate-800/80 shadow-sm dark:shadow-none">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-slate-900 border border-emerald-200 dark:border-slate-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-3">
                <Eye className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">On-Chain Justifications</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Validators write their exact observations, raw values, and rationale permanently onto the blockchain. Transparent, verifiable proof of loss.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer - Minimalist UIkit Style */}
      <footer className="border-t border-slate-200 dark:border-slate-800/80 py-6 bg-slate-100/60 dark:bg-[#0a0812] text-xs text-slate-500 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 UMBRA Protocol • Built for GenLayer Hackathon</p>
          <div className="flex items-center flex-wrap gap-4 text-slate-600 dark:text-slate-400">
            {onToggleTheme && (
              <div className="flex items-center gap-1.5 bg-white dark:bg-purple-950/50 p-1 rounded-lg border border-slate-200 dark:border-purple-900/50 text-[11px]">
                <span className="text-slate-400 dark:text-purple-400 px-1 font-medium">Theme:</span>
                <button
                  type="button"
                  onClick={() => onToggleTheme("light")}
                  className={`px-2 py-0.5 rounded transition-colors flex items-center gap-1 ${
                    theme === "light"
                      ? "bg-purple-100 text-purple-900 font-bold border border-purple-200"
                      : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                  }`}
                >
                  <Sun className="w-3 h-3 text-amber-500" />
                  Light
                </button>
                <button
                  type="button"
                  onClick={() => onToggleTheme("dark")}
                  className={`px-2 py-0.5 rounded transition-colors flex items-center gap-1 ${
                    theme === "dark"
                      ? "bg-purple-900 text-white font-bold border border-purple-700"
                      : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                  }`}
                >
                  <Moon className="w-3 h-3 text-purple-300" />
                  Dark
                </button>
              </div>
            )}
            <span className="font-mono text-[11px]">Contract: 0x9fE4...a6e0</span>
            <span>•</span>
            <button onClick={onLaunchDapp} className="text-purple-700 dark:text-purple-300 hover:text-purple-900 dark:hover:text-white font-medium transition-colors">
              Open App →
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
