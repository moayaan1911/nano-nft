"use client";

import React from "react";
import { motion } from "motion/react";
import Image from "next/image";

interface NFT {
  id: number;
  name: string;
  description: string;
  image: string;
}

interface NFTGalleryProps {
  userNFTs: NFT[];
  isLoadingNFTs: boolean;
}

const NFTGallery: React.FC<NFTGalleryProps> = ({ userNFTs, isLoadingNFTs }) => {
  if (isLoadingNFTs) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="bg-gradient-to-br from-cyan-900/20 to-purple-900/20 backdrop-blur-sm rounded-lg p-3 border border-cyan-500/30 animate-pulse">
            <div className="bg-cyan-900/30 aspect-square mb-3 rounded-lg"></div>
            <div className="bg-cyan-900/30 h-4 rounded mb-2"></div>
            <div className="bg-cyan-900/30 h-3 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  if (userNFTs.length > 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {userNFTs.map((nft) => (
          <motion.div
            key={nft.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: nft.id * 0.1 }}
            className="bg-gradient-to-br from-cyan-900/20 to-purple-900/20 backdrop-blur-sm rounded-lg p-3 border border-cyan-500/30 hover:shadow-lg hover:border-cyan-400/50 transition-all duration-300">
            <div className="aspect-square mb-3 rounded-lg overflow-hidden bg-cyan-900/30 border border-cyan-500/20 relative">
              <Image
                src={nft.image}
                alt={nft.name}
                fill
                className="object-cover"
                onError={() => {
                  console.error("❌ Failed to load NFT image:", nft.image);
                }}
                onLoad={() => {
                  // console.log("✅ Successfully loaded NFT image:", nft.image);
                }}
              />
            </div>
            <h3 className="font-semibold text-cyan-100 mb-1 text-sm">
              {nft.name}
            </h3>
            <p className="text-xs text-cyan-300 mb-2">{nft.description}</p>
            <div className="flex items-center justify-between text-xs text-cyan-400 font-mono">
              <span>Token #{nft.id}</span>
              <span>Sepolia</span>
            </div>
          </motion.div>
        ))}
      </div>
    );
  }

  return (
    <div className="text-center py-6">
      <div className="w-16 h-16 bg-gradient-to-br from-cyan-900/30 to-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4 border border-cyan-500/30">
        <svg
          className="w-8 h-8 text-cyan-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
      <p className="text-cyan-300 font-mono text-sm">
        You don&apos;t have any mints.
      </p>
    </div>
  );
};

export default NFTGallery;
