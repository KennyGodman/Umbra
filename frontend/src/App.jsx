import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "./components/Navbar";
import LandingPage from "./components/LandingPage";
import RollingLogoLoader from "./components/RollingLogoLoader";
import Marketplace from "./components/Marketplace";
import PolicyDetailModal from "./components/PolicyDetailModal";
import BuyModal from "./components/BuyModal";
import MyPolicies from "./components/MyPolicies";
import CreatePolicy from "./components/CreatePolicy";
import UnderwriterDashboard from "./components/UnderwriterDashboard";
import { genlayerService } from "./services/genlayerService";

export default function App() {
  const [inDapp, setInDapp] = useState(false);
  const [isRollingLoading, setIsRollingLoading] = useState(false);
  const [loadingStatusText, setLoadingStatusText] = useState("Launching UMBRA Protocol DApp...");

  // Theme state: default to dark mode (previous build default) with toggle support
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("umbra_theme") || "dark";
  });

  const [activeTab, setActiveTab] = useState("marketplace");
  const [policies, setPolicies] = useState([]);
  const [connectedAccount, setConnectedAccount] = useState(genlayerService.getConnectedAccount());

  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [buyingPolicy, setBuyingPolicy] = useState(null);

  // Sync theme with document element and localStorage
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("umbra_theme", theme);
  }, [theme]);

  const toggleTheme = (targetTheme) => {
    if (typeof targetTheme === "string" && (targetTheme === "light" || targetTheme === "dark")) {
      setTheme(targetTheme);
    } else {
      setTheme((prev) => (prev === "dark" ? "light" : "dark"));
    }
  };

  // Load policies from service on mount
  useEffect(() => {
    refreshPolicies();
  }, []);

  const refreshPolicies = async () => {
    const list = await genlayerService.getAllPolicies();
    setPolicies([...list]);
  };

  // Launch DApp handler with the rolling logo animation transition
  const handleLaunchDapp = () => {
    setIsRollingLoading(true);
    setLoadingStatusText("Connecting to GenLayer Testnet...");

    setTimeout(() => {
      setLoadingStatusText("Loading UMBRA Intelligent Contract & Oracles...");
    }, 800);

    setTimeout(() => {
      setIsRollingLoading(false);
      setInDapp(true);
      setActiveTab("marketplace");
    }, 1700);
  };

  const handleSwitchAccount = (account) => {
    genlayerService.setConnectedAccount(account);
    setConnectedAccount(account);
  };

  const handleResetData = () => {
    const resetList = genlayerService.resetDemoData();
    setPolicies([...resetList]);
  };

  const handleConfirmBuy = async (policyId) => {
    await genlayerService.buyPolicy(policyId);
    await refreshPolicies();
  };

  const handleResolvePolicy = async (policyId, onProgress) => {
    const result = await genlayerService.resolvePolicy(policyId, onProgress);
    await refreshPolicies();
    return result;
  };

  const handleExpirePolicy = async (policyId) => {
    await genlayerService.expireUnsoldPolicy(policyId);
    await refreshPolicies();
  };

  const handleCreatePolicy = async (newPolicyData) => {
    await genlayerService.createPolicy(newPolicyData);
    await refreshPolicies();
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#08040f] text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-purple-600/40 selection:text-purple-200 transition-colors duration-200">
      {/* Rolling Logo Loading Transition Screen */}
      <AnimatePresence>
        {isRollingLoading && (
          <RollingLogoLoader statusText={loadingStatusText} />
        )}
      </AnimatePresence>

      {/* Landing Page or DApp View */}
      {!inDapp ? (
        <LandingPage
          onLaunchDapp={handleLaunchDapp}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      ) : (
        <>
          {/* Main Navigation */}
          <Navbar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            connectedAccount={connectedAccount}
            onSwitchAccount={handleSwitchAccount}
            onResetData={handleResetData}
            onReturnToLanding={() => setInDapp(false)}
            theme={theme}
            onToggleTheme={toggleTheme}
          />

          {/* Main App Screens Container with Framer Motion transitions */}
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
              >
                {activeTab === "marketplace" && (
                  <Marketplace
                    policies={policies}
                    onSelectPolicy={(p) => setSelectedPolicy(p)}
                    onOpenBuyModal={(p) => setBuyingPolicy(p)}
                  />
                )}

                {activeTab === "my-policies" && (
                  <MyPolicies
                    policies={policies}
                    connectedAccount={connectedAccount}
                    onResolvePolicy={handleResolvePolicy}
                    onExploreMarketplace={() => setActiveTab("marketplace")}
                  />
                )}

                {activeTab === "create-policy" && (
                  <CreatePolicy
                    connectedAccount={connectedAccount}
                    onCreatePolicy={handleCreatePolicy}
                    onGoToDashboard={() => setActiveTab("underwriter-dashboard")}
                  />
                )}

                {activeTab === "underwriter-dashboard" && (
                  <UnderwriterDashboard
                    policies={policies}
                    connectedAccount={connectedAccount}
                    onExpirePolicy={handleExpirePolicy}
                    onOpenCreateModal={() => setActiveTab("create-policy")}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </main>

          {/* Modals with AnimatePresence */}
          <AnimatePresence>
            {selectedPolicy && (
              <PolicyDetailModal
                policy={selectedPolicy}
                onClose={() => setSelectedPolicy(null)}
                onBuy={(p) => {
                  setSelectedPolicy(null);
                  setBuyingPolicy(p);
                }}
              />
            )}
          </AnimatePresence>

          <AnimatePresence>
            {buyingPolicy && (
              <BuyModal
                policy={buyingPolicy}
                connectedAccount={connectedAccount}
                onClose={() => setBuyingPolicy(null)}
                onConfirmBuy={handleConfirmBuy}
                onGoToMyPolicies={() => {
                  setBuyingPolicy(null);
                  setActiveTab("my-policies");
                }}
              />
            )}
          </AnimatePresence>

          {/* Footer in DApp */}
          <footer className="border-t border-slate-200 dark:border-purple-900/40 py-6 text-center text-xs text-slate-500 dark:text-purple-300/60 bg-white/60 dark:bg-[#090414]/60 backdrop-blur-md transition-colors duration-200">
            <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse shadow-[0_0_8px_rgba(192,132,252,0.8)]" />
                <span>UMBRA Protocol Intelligent Contract: <code className="font-mono text-purple-700 dark:text-purple-300">0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0</code></span>
              </div>
              <div className="flex items-center gap-4 text-slate-600 dark:text-purple-300/80">
                <button onClick={() => setInDapp(false)} className="hover:text-slate-900 dark:hover:text-white transition-colors">
                  Landing Page
                </button>
                <span>•</span>
                <span className="font-mono">GenLayer Testnet</span>
              </div>
            </div>
          </footer>
        </>
      )}
    </div>
  );
}
