import React from "react";
import { motion } from "framer-motion";

export default function RollingLogoLoader({ statusText = "Launching UMBRA Protocol DApp..." }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#07030e]/95 backdrop-blur-2xl"
    >
      {/* Background purple glow */}
      <div className="absolute w-[500px] h-[500px] bg-purple-700/15 rounded-full blur-3xl pointer-events-none animate-pulse" />

      {/* Rolling Logo Animation Container */}
      <div className="relative w-64 h-28 flex items-center justify-center">
        {/* Rolling Track */}
        <div className="absolute bottom-2 w-56 h-[2px] bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
        
        {/* Rolling Icon Element */}
        <div className="animate-rolling-logo flex items-center justify-center">
          <div className="relative w-16 h-16 rounded-2xl overflow-hidden shadow-2xl shadow-purple-900/60 border border-purple-500/70 bg-[#120724] ring-2 ring-purple-500/30">
            <img src="/umbra-logo.jpg" alt="UMBRA Logo" className="w-full h-full object-cover" />
          </div>
        </div>
      </div>

      {/* Loading typography */}
      <div className="mt-8 text-center space-y-2 z-10">
        <h3 className="text-xl font-bold tracking-wide text-white">
          {statusText}
        </h3>
        <p className="text-xs text-purple-300/70 font-medium tracking-wider uppercase">
          Initializing GenLayer Validator Bridge • Autonomous Settlement
        </p>
      </div>

      {/* Subtle Purple Progress Bar */}
      <div className="w-52 h-1.5 bg-purple-950/80 rounded-full mt-6 overflow-hidden border border-purple-800/50 z-10">
        <div className="h-full bg-gradient-to-r from-purple-500 via-fuchsia-400 to-white w-full animate-[progress_1.5s_ease-in-out_infinite]" />
      </div>
    </motion.div>
  );
}
