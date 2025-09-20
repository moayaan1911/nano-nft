"use client";

import React from "react";
import { motion } from "motion/react";
import Link from "next/link";

interface NFTMintSuccessProps {
  txHash: string;
  onCreateAnother: () => void;
}

const NFTMintSuccess: React.FC<NFTMintSuccessProps> = ({
  txHash,
  onCreateAnother,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-gradient-to-br from-cyan-900/20 to-purple-900/20 backdrop-blur-sm border border-cyan-500/30 rounded-lg p-4 text-center">
      <div className="flex items-center justify-center gap-2 text-cyan-300 mb-3">
        <div className="w-5 h-5 bg-cyan-500 rounded-full flex items-center justify-center text-white text-xs">
          ✓
        </div>
        <span className="font-medium">
          NFT Minted Successfully!
        </span>
      </div>
      <div className="space-y-2">
        <p className="text-xs text-cyan-300">
          Transaction Hash:
        </p>
        <Link
          href={`https://sepolia.etherscan.io/tx/${txHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block bg-cyan-900/30 border border-cyan-500/30 rounded-lg p-2 text-xs text-cyan-300 hover:bg-cyan-800/30 transition-colors break-all">
          {txHash}
        </Link>
        <button
          onClick={onCreateAnother}
          className="mt-3 px-4 py-2 bg-gradient-to-r from-cyan-600 to-purple-600 text-white rounded-lg hover:from-cyan-500 hover:to-purple-500 transition-colors text-sm cursor-pointer">
          Create Another NFT
        </button>
      </div>
    </motion.div>
  );
};

export default NFTMintSuccess;
