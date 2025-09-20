"use client";

import React from "react";
import { motion } from "motion/react";
import { useReadContract } from "thirdweb/react";
import { nanoNFTContract } from "@/lib/contracts";

export default function Footer() {
  // Fetch global statistics
  const {
    data: globalStats,
    isLoading: isLoadingGlobalStats,
    error: globalStatsError,
  } = useReadContract({
    contract: nanoNFTContract,
    method:
      "function getGlobalStats() external view returns (uint256 total, uint256 free, uint256 paid, uint256 maxSupply)",
    params: [],
  });

  // Log global stats for debugging
  React.useEffect(() => {
    if (globalStats) {
      // console.log("🔍 Global stats from contract:", globalStats);
      // console.log("🔍 Total NFTs:", globalStats[0]?.toString());
      // console.log("🔍 Free NFTs:", globalStats[1]?.toString());
      // console.log("🔍 Paid NFTs:", globalStats[2]?.toString());
      // console.log("🔍 Max Supply:", globalStats[3]?.toString());
    }
    if (globalStatsError) {
      console.error("❌ Error fetching global stats:", globalStatsError);
    }
  }, [globalStats, globalStatsError]);

  return (
    <footer className="relative z-20 bg-gradient-to-br from-cyan-900/30 to-purple-900/30 backdrop-blur-sm border-t border-cyan-500/20 text-white py-6 mt-6">
      <div className="container mx-auto px-4">
        {/* Global Statistics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-4">
          <h3 className="text-lg font-bold mb-3 text-cyan-100 font-mono tracking-wide">
            NanoNFT Ecosystem
          </h3>
          <div className="grid md:grid-cols-2 gap-3 max-w-2xl mx-auto">
            <div className="bg-gradient-to-br from-cyan-900/20 to-purple-900/20 backdrop-blur-sm rounded-lg p-3 border border-cyan-500/30">
              <div className="text-xl font-bold text-cyan-400 font-mono">
                {isLoadingGlobalStats ? (
                  <div className="w-6 h-4 bg-cyan-900/30 rounded animate-pulse mx-auto"></div>
                ) : (
                  globalStats?.[0]?.toString() || "0"
                )}
              </div>
              <div className="text-xs text-cyan-300 font-mono">Total NFTs</div>
            </div>
            <div className="bg-gradient-to-br from-orange-900/20 to-yellow-900/20 backdrop-blur-sm rounded-lg p-3 border border-orange-500/30">
              <div className="text-xl font-bold text-yellow-400 font-mono">
                {isLoadingGlobalStats ? (
                  <div className="w-6 h-4 bg-orange-900/30 rounded animate-pulse mx-auto"></div>
                ) : (
                  globalStats?.[3]?.toString() || "0"
                )}
              </div>
              <div className="text-xs text-orange-300 font-mono">
                Max Supply
              </div>
            </div>
          </div>
        </motion.div>

        {/* Copyright */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="border-t border-cyan-500/20 pt-4 text-center">
          <div className="flex items-center justify-center gap-2 text-cyan-300">
            <span className="font-mono text-sm">
              © {new Date().getFullYear()}
            </span>
            <a
              href="https://www.moayaan.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 hover:text-cyan-300 transition-colors font-mono text-sm">
              ♦moayaan.eth♦
            </a>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}
