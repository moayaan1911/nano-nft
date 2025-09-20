"use client";

import React from "react";

interface NFTStatsProps {
  userStats: (bigint | number)[] | undefined;
  mintEligibility: (bigint | number)[] | undefined;
  isLoadingEligibility: boolean;
}

const NFTStats: React.FC<NFTStatsProps> = ({
  userStats,
  mintEligibility,
  isLoadingEligibility,
}) => {
  return (
    <div className="bg-gradient-to-br from-cyan-900/20 to-purple-900/20 backdrop-blur-sm rounded-xl p-4 border border-cyan-500/30">
      <h3 className="text-base font-bold text-cyan-100 mb-3 flex items-center gap-2">
        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
        Your Stats
      </h3>

      {/* Free Mints Status */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-cyan-100 font-medium text-sm">
            Free Mints Remaining:
          </span>
          {isLoadingEligibility ? (
            <div className="w-10 h-4 bg-cyan-900/30 rounded animate-pulse"></div>
          ) : mintEligibility ? (
            <span
              className={`font-bold text-lg font-mono ${
                Boolean(mintEligibility?.[0])
                  ? "text-cyan-400"
                  : "text-orange-400"
              }`}>
              {Math.max(0, 3 - (Number(mintEligibility?.[1]) || 0))}/3
            </span>
          ) : (
            <span className="font-bold text-lg font-mono text-cyan-300">
              3/3
            </span>
          )}
        </div>

        {/* Cooldown Timer */}
        {mintEligibility &&
          !Boolean(mintEligibility?.[0]) &&
          Number(mintEligibility?.[2]) > 0 && (
            <div className="bg-gradient-to-r from-orange-900/20 to-red-900/20 border border-orange-500/30 rounded-lg p-2">
              <div className="flex items-center gap-2 text-orange-300">
                <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium font-mono">
                  Cooldown Active
                </span>
              </div>
              <p className="text-xs text-orange-200 mt-1 font-mono">
                Next free mint: {Math.ceil(Number(mintEligibility?.[2]) / 3600)}{" "}
                hours
              </p>
            </div>
          )}

        {/* User Statistics */}
        {userStats && Array.isArray(userStats) && (
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-cyan-500/20">
            <div className="text-center">
              <div className="text-xl font-bold text-cyan-400 font-mono">
                {userStats?.[0]?.toString() || "0"}
              </div>
              <div className="text-xs text-cyan-300">Total NFTs</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-purple-400 font-mono">
                {userStats?.[1]?.toString() || "0"}
              </div>
              <div className="text-xs text-purple-300">Free Today</div>
            </div>
          </div>
        )}

        {/* Last Creation Time */}
        {userStats &&
          Array.isArray(userStats) &&
          userStats?.[2] &&
          Number(userStats[2]) > 0 && (
            <div className="text-xs text-cyan-400 text-center pt-2 font-mono">
              Last creation:{" "}
              {new Date(Number(userStats[2]) * 1000).toLocaleDateString()}
            </div>
          )}
      </div>
    </div>
  );
};

export default NFTStats;
