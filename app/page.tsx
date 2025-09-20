"use client";

import React from "react";
import { useActiveAccount } from "thirdweb/react";
import { motion } from "motion/react";
import Image from "next/image";
import ConnectWallet from "@/components/ConnectWallet";
import NFTGenerator from "@/components/NFTGenerator";
import {
  FiImage,
  FiZap,
  FiStar,
  FiGithub,
  FiCoffee,
  FiGlobe,
} from "react-icons/fi";
import Footer from "@/components/Footer";
import QuantumParticles from "@/components/QuantumParticles";
import AiBot from "@/components/AiBot";

export default function Home() {
  const account = useActiveAccount();
  const isConnected = !!account;

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Quantum Particle Background */}
      <QuantumParticles />

      {/* Hero Section */}
      <div className="relative z-10 container mx-auto px-4 py-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-4xl mx-auto">
          {/* Logo/Brand */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="mb-4">
            <div className="inline-flex items-center justify-center mb-3">
              <Image
                src="/icon.png"
                alt="NanoNFT Logo"
                width={120}
                height={120}
                className="w-30 h-30 object-contain"
              />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent mb-2 tracking-wider">
              NanoNFT
            </h1>
            <p className="text-lg text-cyan-300 mb-1 font-mono">
              by{" "}
              <a
                href="https://moayaan.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-cyan-400 transition-colors underline decoration-cyan-400">
                ♦moayaan.eth♦
              </a>
            </p>
          </motion.div>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-lg text-cyan-100 mb-4 max-w-2xl mx-auto leading-relaxed font-light">
            <strong className="text-white font-semibold">
              AI NFT Generator and Gasless Minter
            </strong>
            <br />
            Create stunning digital art powered by Gemini Nano Banana AI -
            <span className="text-cyan-400 font-mono">
              {" "}
              completely FREE on Sepolia!
            </span>
          </motion.p>

          {/* Social Links */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="flex justify-center gap-6 my-3">
            <motion.a
              href="https://github.com/moayaan1911/nano-nft"
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-300 hover:text-cyan-100 transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}>
              <FiGithub className="w-5 h-5" />
            </motion.a>

            <motion.a
              href="https://buymeacoffee.com/moayaan.eth"
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-300 hover:text-cyan-100 transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}>
              <FiCoffee className="w-5 h-5" />
            </motion.a>

            <motion.a
              href="https://www.moayaan.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-300 hover:text-cyan-100 transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}>
              <FiGlobe className="w-5 h-5" />
            </motion.a>
          </motion.div>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="grid md:grid-cols-3 gap-3 mb-4">
            <div className="flex flex-col items-center p-3 bg-gradient-to-br from-cyan-900/20 to-purple-900/20 backdrop-blur-sm rounded-xl border border-cyan-500/30 shadow-lg">
              <FiImage className="w-6 h-6 text-cyan-400 mb-2" />
              <h3 className="font-semibold text-cyan-100 mb-1 text-sm">
                AI Generated
              </h3>
              <p className="text-cyan-300 text-center text-xs">
                Powered by Gemini Nano Banana AI
              </p>
            </div>
            <div className="flex flex-col items-center p-3 bg-gradient-to-br from-purple-900/20 to-pink-900/20 backdrop-blur-sm rounded-xl border border-purple-500/30 shadow-lg">
              <FiZap className="w-6 h-6 text-purple-400 mb-2" />
              <h3 className="font-semibold text-purple-100 mb-1 text-sm">
                Gasless Minting
              </h3>
              <p className="text-purple-300 text-center text-xs">
                Zero gas fees on Sepolia testnet
              </p>
            </div>
            <div className="flex flex-col items-center p-3 bg-gradient-to-br from-pink-900/20 to-cyan-900/20 backdrop-blur-sm rounded-xl border border-pink-500/30 shadow-lg">
              <FiStar className="w-6 h-6 text-pink-400 mb-2" />
              <h3 className="font-semibold text-pink-100 mb-1 text-sm">
                3 Free Mints
              </h3>
              <p className="text-pink-300 text-center text-xs">
                Create up to 3 NFTs per 24 hours
              </p>
            </div>
          </motion.div>

          {/* Connect Wallet */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="flex flex-col items-center gap-2 mb-2">
            <ConnectWallet />
            {!isConnected && (
              <p className="text-cyan-300 text-xs text-center max-w-md font-mono">
                Connect your wallet to start generating unique NFTs with Gemini
                Nano Banana AI
              </p>
            )}
          </motion.div>
        </motion.div>
      </div>

      {/* NFT Generation Component */}
      {isConnected && <NFTGenerator />}

      {/* Footer with Global Stats */}
      <Footer />

      <AiBot />
    </div>
  );
}
