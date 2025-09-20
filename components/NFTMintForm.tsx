"use client";

import React from "react";
import { motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";

interface NFTMintFormProps {
  prompt: string;
  setPrompt: (prompt: string) => void;
  isGenerating: boolean;
  handleGenerate: () => void;
  generatedImage: string | null;
  isMinting: boolean;
  handleMint: () => void;
  mintSuccess: boolean;
  txHash: string | null;
  error: string | null;
  quotaExceeded: boolean;
}

const NFTMintForm: React.FC<NFTMintFormProps> = ({
  prompt,
  setPrompt,
  isGenerating,
  handleGenerate,
  generatedImage,
  isMinting,
  handleMint,
  mintSuccess,
  txHash,
  error,
  quotaExceeded,
}) => {
  return (
    <>
      <div className="space-y-3">
        <div>
          <label
            htmlFor="prompt"
            className="block text-sm font-medium text-cyan-100 mb-1">
            What would you like to create?
          </label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="A majestic lion standing on a mountain peak at sunset, digital art style..."
            className="w-full px-3 py-2 bg-gradient-to-br from-cyan-900/20 to-purple-900/20 border border-cyan-500/30 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 resize-none text-white placeholder-cyan-400/60 font-mono"
            rows={3}
            maxLength={500}
            disabled={isGenerating}
          />
          <div className="flex justify-between text-xs text-cyan-300 mt-1">
            <span>{prompt.length}/500 characters</span>
            <span>Tip: Be descriptive for better results</span>
          </div>
        </div>

        {/* Generate Button */}
        {!generatedImage && (
          <button
            onClick={handleGenerate}
            disabled={!prompt.trim() || isGenerating}
            className="w-full px-4 py-2 bg-gradient-to-r from-cyan-600 to-purple-600 text-white rounded-lg hover:from-cyan-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all font-medium font-mono text-sm border border-cyan-500/30">
            {isGenerating ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Generating NFT...
              </div>
            ) : (
              "Generate NFT"
            )}
          </button>
        )}
      </div>

      {/* Generated Image Display */}
      {generatedImage && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-cyan-900/20 to-purple-900/20 backdrop-blur-sm rounded-lg p-4 border border-cyan-500/20">
          <h3 className="text-lg font-semibold text-cyan-100 mb-3">
            Your Generated NFT
          </h3>
          <div className="flex justify-center">
            <div className="relative w-full max-w-md aspect-square rounded-lg border border-cyan-500/20 overflow-hidden bg-gradient-to-br from-cyan-900/10 to-purple-900/10">
              <Image
                src={generatedImage}
                alt="Generated NFT"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>
          <div className="mt-4 space-y-3">
            {mintSuccess && txHash ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gradient-to-br from-cyan-900/20 to-purple-900/20 border border-cyan-500/30 rounded-lg p-4 text-center">
                <div className="flex items-center justify-center gap-2 text-cyan-300 mb-3">
                  <div className="w-5 h-5 bg-cyan-500 rounded-full flex items-center justify-center text-white text-xs">
                    ✓
                  </div>
                  <span className="font-medium">NFT Minted Successfully!</span>
                </div>
                <div className="space-y-2">
                  <p className="text-xs text-cyan-300">Transaction Hash:</p>
                  <Link
                    href={`https://sepolia.etherscan.io/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block bg-cyan-900/30 border border-cyan-500/30 rounded-lg p-2 text-xs text-cyan-300 hover:bg-cyan-800/30 transition-colors break-all">
                    {txHash}
                  </Link>
                  <button
                    onClick={() => {
                      setPrompt(
                        "A panda eating bamboo in a futuristic chinese city"
                      );
                      // Reset other states will be handled by parent
                    }}
                    className="mt-3 px-4 py-2 bg-gradient-to-r from-cyan-600 to-purple-600 text-white rounded-lg hover:from-cyan-500 hover:to-purple-500 transition-colors text-sm cursor-pointer">
                    Create Another NFT
                  </button>
                </div>
              </motion.div>
            ) : (
              <button
                onClick={handleMint}
                disabled={isMinting}
                className="w-full px-4 py-3 bg-gradient-to-r from-cyan-600 to-purple-600 text-white rounded-lg hover:from-cyan-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all font-medium">
                {isMinting ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Minting NFT...
                  </div>
                ) : (
                  "Mint NFT"
                )}
              </button>
            )}
          </div>
        </motion.div>
      )}

      {/* Error Display */}
      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`border rounded-lg p-4 ${
            quotaExceeded
              ? "bg-orange-50 border-orange-200"
              : "bg-red-50 border-red-200"
          }`}>
          <div className="flex items-start gap-3">
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                quotaExceeded
                  ? "bg-orange-500 text-white"
                  : "bg-red-500 text-white"
              }`}>
              {quotaExceeded ? "⏱️" : "❌"}
            </div>
            <div>
              <p
                className={`text-sm font-medium ${
                  quotaExceeded ? "text-orange-800" : "text-red-700"
                }`}>
                {error}
              </p>
              {quotaExceeded && (
                <div className="mt-2 text-xs">
                  <p className="text-orange-700 mb-2">
                    Your API key needs billing setup for image generation.
                  </p>
                  <div className="bg-orange-100 p-2 rounded text-orange-800 mb-2">
                    <p className="font-medium mb-1">Quick Setup:</p>
                    <p className="mb-1">
                      1. Enable billing in Google Cloud Console
                    </p>
                    <p className="mb-1">
                      2. Request quota increase for Generative Language API
                    </p>
                    <p>3. Wait for approval (usually 24-48 hours)</p>
                  </div>
                  <Link
                    href="https://console.cloud.google.com/billing"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block bg-orange-600 text-white px-3 py-1 rounded text-xs hover:bg-orange-700 transition-colors">
                    Setup Billing →
                  </Link>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </>
  );
};

export default NFTMintForm;
