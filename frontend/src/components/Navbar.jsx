import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, RefreshCw, ChevronDown, Check, Shield, Umbrella, Sparkles, Sun, Moon } from "lucide-react";

export default function Navbar({
  activeTab,
  setActiveTab,
  connectedAccount,
  onSwitchAccount,
  onResetData,
  onReturnToLanding,
  theme = "dark",
  onToggleTheme
}) {
  const [walletMenuOpen, setWalletMenuOpen] = useState(false);

  const accounts = [
    { label: "Buyer Account (Alex)", address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", role: "Buyer" },
    { label: "Underwriter Account (Parametric Capital)", address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", role: "Underwriter" }
  ];

  const currentRole = accounts.find(a => a.address.toLowerCase() === connectedAccount.toLowerCase())?.role || "Connected";

  const truncate = (addr) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const navTabs = [
    { id: "marketplace", label: "Marketplace" },
    { id: "my-policies", label: "My Policies" },
    { id: "create-policy", label: "+ Create Policy" },
    { id: "underwriter-dashboard", label: "Underwriter Dashboard" }
  ];

  return (
    <nav className="sticky top-0 z-40 border-b border-slate-200 dark:border-purple-900/40 bg-white/90 dark:bg-[#090414]/90 backdrop-blur-xl shadow-sm dark:shadow-lg dark:shadow-purple-950/20 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3.5 cursor-pointer group" onClick={onReturnToLanding}>
            <motion.div 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.96 }}
              className="relative w-10 h-10 rounded-xl overflow-hidden shadow-md shadow-purple-900/50 border border-purple-500/50 bg-[#120724] ring-2 ring-purple-500/20"
            >
              <img src="/umbra-logo.jpg" alt="UMBRA Logo" className="w-full h-full object-cover" />
            </motion.div>
            <div>
              <span className="text-lg font-extrabold tracking-wider text-slate-900 dark:text-white font-sans">
                UMBRA
              </span>
            </div>
          </div>

          {/* Navigation Tabs with Framer Motion Animated Indicator */}
          <div className="hidden md:flex items-center space-x-1 relative">
            {navTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 z-10 ${
                    isActive
                      ? "text-purple-950 dark:text-white font-semibold"
                      : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-purple-950/40"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeNavPill"
                      className="absolute inset-0 bg-purple-100 dark:bg-[#21093b] border border-purple-300 dark:border-purple-600/70 rounded-xl shadow-sm dark:shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                      transition={{ type: "spring", stiffness: 450, damping: 35 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5">
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Wallet & Quick Controls */}
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
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-all ${
                    theme === "light"
                      ? "bg-white text-purple-900 shadow-sm font-semibold border border-slate-200/80"
                      : "text-slate-500 hover:text-slate-900 dark:text-purple-300/70 dark:hover:text-white font-medium"
                  }`}
                  title="Switch to Light Mode"
                  aria-checked={theme === "light"}
                >
                  <Sun className={`w-3.5 h-3.5 ${theme === "light" ? "text-amber-500 fill-amber-500/20" : ""}`} />
                  <span className="hidden sm:inline">Light</span>
                </button>
                <button
                  type="button"
                  onClick={() => onToggleTheme("dark")}
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-all ${
                    theme === "dark"
                      ? "bg-purple-900 text-white shadow-sm font-semibold border border-purple-700/80"
                      : "text-slate-500 hover:text-slate-900 dark:text-purple-300/70 dark:hover:text-white font-medium"
                  }`}
                  title="Switch to Dark Mode"
                  aria-checked={theme === "dark"}
                >
                  <Moon className={`w-3.5 h-3.5 ${theme === "dark" ? "text-purple-300 fill-purple-300/20" : ""}`} />
                  <span className="hidden sm:inline">Dark</span>
                </button>
              </div>
            )}

            {/* Reset Seed Demo Data */}
            <motion.button
              whileHover={{ rotate: 180, scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.3 }}
              onClick={onResetData}
              title="Reset sample policies & seed data for live demo"
              className="p-2 text-slate-600 dark:text-purple-300/80 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-purple-950/60 rounded-xl transition-colors border border-slate-200 dark:border-purple-900/60"
            >
              <RefreshCw className="w-4 h-4" />
            </motion.button>

            {/* Wallet Switcher Dropdown */}
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setWalletMenuOpen(!walletMenuOpen)}
                className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#17092c] hover:bg-slate-200 dark:hover:bg-[#210d3f] text-xs font-mono text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-purple-700/60 transition-all shadow-sm dark:shadow-md dark:shadow-purple-950/40"
              >
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                <span className="hidden sm:inline font-sans text-purple-800 dark:text-purple-200 font-semibold px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950/80 border border-purple-300 dark:border-purple-700/50 text-[11px]">
                  {currentRole}
                </span>
                <span className="text-slate-900 dark:text-white font-medium">{truncate(connectedAccount)}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 dark:text-purple-300" />
              </motion.button>

              <AnimatePresence>
                {walletMenuOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="absolute right-0 mt-2 w-72 rounded-2xl bg-white dark:bg-[#120724] border border-slate-200 dark:border-purple-700/70 shadow-2xl p-2.5 z-50 shadow-purple-950/20 dark:shadow-purple-950/90 backdrop-blur-xl"
                  >
                    <div className="px-3 py-2 border-b border-slate-100 dark:border-purple-900/50">
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">Connected Wallet</p>
                      <p className="text-[11px] font-mono text-purple-700 dark:text-purple-300 truncate">{connectedAccount}</p>
                      <span className="inline-block mt-1.5 text-[10px] text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800/50 px-2 py-0.5 rounded-full">
                        GenLayer Testnet Active
                      </span>
                    </div>

                    <div className="py-2 space-y-1">
                      <p className="px-3 text-[10px] font-semibold text-slate-400 dark:text-purple-300/80 uppercase tracking-wider">
                        Demo Persona Switcher
                      </p>
                      {accounts.map((acc) => {
                        const isSelected = acc.address.toLowerCase() === connectedAccount.toLowerCase();
                        return (
                          <button
                            key={acc.address}
                            onClick={() => {
                              onSwitchAccount(acc.address);
                              setWalletMenuOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs transition-all ${
                              isSelected 
                                ? "bg-purple-600 dark:bg-white text-white dark:text-[#19062d] font-semibold shadow-sm" 
                                : "hover:bg-slate-100 dark:hover:bg-purple-950/60 text-slate-700 dark:text-slate-300"
                            }`}
                          >
                            <div>
                              <div className="font-semibold flex items-center gap-1.5">
                                {acc.label}
                              </div>
                              <div className={`font-mono text-[10px] ${isSelected ? "text-purple-100 dark:text-[#3b126b]" : "text-slate-400"}`}>
                                {truncate(acc.address)}
                              </div>
                            </div>
                            {isSelected && <Check className="w-4 h-4 text-white dark:text-[#19062d]" />}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Mobile Nav Tabs */}
        <div className="flex md:hidden overflow-x-auto py-2 space-x-1 border-t border-slate-200 dark:border-purple-900/40">
          {navTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 transition-colors ${
                activeTab === tab.id
                  ? "bg-purple-100 dark:bg-[#21093b] text-purple-950 dark:text-white border border-purple-300 dark:border-purple-600/70"
                  : "text-slate-600 dark:text-purple-300/80 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}
