"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import Image from "next/image";
import {
  useReadContract,
  useActiveAccount,
  useSendTransaction,
} from "thirdweb/react";
import { nanoNFTContract } from "@/lib/contracts";
import { prepareContractCall, readContract } from "thirdweb";
import { upload } from "thirdweb/storage";
import { client } from "@/lib/client";
import NFTMintForm from "./NFTMintForm";
import NFTGallery from "./NFTGallery";

interface NFTGeneratorProps {
  onGenerate?: (imageUrl: string, prompt: string) => void;
}

export default function NFTGenerator({ onGenerate }: NFTGeneratorProps) {
  const account = useActiveAccount()!; // Account is guaranteed to be defined since this component only renders when wallet is connected
  const [prompt, setPrompt] = useState(
    "A panda eating bamboo in a futuristic chinese city"
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const [isMinting, setIsMinting] = useState(false);
  const [mintSuccess, setMintSuccess] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [userNFTs, setUserNFTs] = useState<
    {
      id: number;
      name: string;
      description: string;
      image: string;
    }[]
  >([]);
  const [isLoadingNFTs, setIsLoadingNFTs] = useState(false);
  const generatedImageRef = useRef<HTMLDivElement>(null);

  const { mutateAsync: sendTransaction } = useSendTransaction();

  // Fetch user stats from smart contract
  const { data: userStats, error: userStatsError } = useReadContract({
    contract: nanoNFTContract,
    method:
      "function getUserCreationStats(address user) external view returns (uint256 _totalCreations, uint256 _freeCreationsToday, uint256 _lastCreation, uint256 _nextFreeCreation)",
    params: [account.address as `0x${string}`],
  });
  // console.log("ACCOUNT IS", account);
  // Log errors for debugging
  React.useEffect(() => {
    if (userStatsError) {
      console.error("❌ Error fetching user stats:", userStatsError);
    }
  }, [userStatsError]);

  // Fetch free mint eligibility
  const {
    data: mintEligibility,
    isLoading: _isLoadingEligibility,
    error: mintEligibilityError,
  } = useReadContract({
    contract: nanoNFTContract,
    method:
      "function canCreateFreeNFT(address user) external view returns (bool canCreate, uint256 creationsToday, uint256 timeLeft)",
    params: [account.address as `0x${string}`],
  });

  // Log errors for debugging
  React.useEffect(() => {
    if (mintEligibilityError) {
      console.error(
        "❌ Error fetching mint eligibility:",
        mintEligibilityError
      );
    }
  }, [mintEligibilityError]);

  // Auto-scroll to generated image when it's ready
  useEffect(() => {
    if (generatedImage && generatedImageRef.current) {
      setTimeout(() => {
        generatedImageRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 500); // Small delay to ensure the animation completes
    }
  }, [generatedImage]);

  // Load user's NFTs when account changes
  useEffect(() => {
    const loadUserNFTs = async () => {
      setIsLoadingNFTs(true);
      try {
        // Get user's actual NFT balance using standard ERC721 balanceOf
        let actualBalance = 0;
        try {
          const balance = await readContract({
            contract: nanoNFTContract,
            method:
              "function balanceOf(address owner) external view returns (uint256)",
            params: [account.address as `0x${string}`],
          });
          actualBalance = Number(balance);
          // console.log("✅ Successfully fetched balance:", actualBalance);
        } catch (error) {
          console.error("❌ Error fetching balance:", error);
          // Fallback: try to use the creation count from userStats
          const creationCount = userStats?.[0] ? Number(userStats[0]) : 0;
          // console.log("🔄 Using creation count as fallback:", creationCount);
          actualBalance = creationCount;
        }

        // console.log("🔍 User stats from contract:", userStats);
        // console.log("🔍 Final balance for user:", actualBalance);

        if (actualBalance === 0) {
          // console.log("❌ User has 0 NFTs according to balanceOf");
          setUserNFTs([]);
          return;
        }

        // Fetch real NFT data by checking token ownership
        const userNFTList = [];
        const maxTokenId = await readContract({
          contract: nanoNFTContract,
          method: "function getNextTokenId() external view returns (uint256)",
        });

        // console.log("🔍 Max token ID from contract:", maxTokenId);

        // Check each token ID to see if user owns it (check more tokens and include the latest)
        const startId = Math.max(1, Number(maxTokenId) - 100);
        const endId = Number(maxTokenId) - 1; // getNextTokenId returns the NEXT id, so actual max is -1

        // console.log(`🔍 Checking token IDs from ${startId} to ${endId}`);

        for (
          let tokenId = startId;
          tokenId <= endId && userNFTList.length < 10;
          tokenId++
        ) {
          try {
            // Check if token exists and get owner
            const owner = await readContract({
              contract: nanoNFTContract,
              method:
                "function ownerOf(uint256 tokenId) external view returns (address)",
              params: [BigInt(tokenId)],
            });

            if (
              (owner as string).toLowerCase() === account.address.toLowerCase()
            ) {
              // console.log(
              //   `✅ Found owned token: ${tokenId} by ${account.address}`
              // );

              // Get tokenURI
              const tokenURI = await readContract({
                contract: nanoNFTContract,
                method:
                  "function tokenURI(uint256 tokenId) external view returns (string)",
                params: [BigInt(tokenId)],
              });

              // console.log(`🔍 Token URI for ${tokenId}:`, tokenURI);

              if (tokenURI) {
                // Fetch metadata from IPFS
                const metadata = await fetchNFTMetadata(tokenURI as string);

                if (metadata) {
                  // console.log(`🎨 Processing NFT ${tokenId}:`, {
                  //   name: metadata.name,
                  //   image: metadata.image,
                  //   description: metadata.description,
                  // });

                  userNFTList.push({
                    id: tokenId,
                    name: metadata.name || `NanoNFT #${tokenId}`,
                    description: metadata.description || "AI-generated NFT",
                    image: metadata.image || "/icon.png",
                  });
                } else {
                  console.error(
                    `❌ Failed to fetch metadata for token ${tokenId}`
                  );
                }
              } else {
                console.error(`❌ No tokenURI found for token ${tokenId}`);
              }
            }
          } catch (error) {
            // Token doesn't exist or user doesn't own it, continue
            console.error("Error checking token ownership:", error);
            continue;
          }
        }

        setUserNFTs(userNFTList.reverse()); // Show newest first
      } catch (error) {
        console.error("Error loading user NFTs:", error);
        setUserNFTs([]);
      } finally {
        setIsLoadingNFTs(false);
      }
    };

    loadUserNFTs();
  }, [account.address, userStats]);

  // Helper function to fetch NFT metadata from IPFS
  const fetchNFTMetadata = async (tokenURI: string) => {
    try {
      // Convert ipfs:// to https://ipfs.io/ipfs/ gateway ONLY
      let metadataUrl = tokenURI;
      if (tokenURI.startsWith("ipfs://")) {
        const hash = tokenURI.replace("ipfs://", "");
        metadataUrl = `https://ipfs.io/ipfs/${hash}`;
      }

      // console.log("🔍 Fetching metadata from:", metadataUrl);

      const response = await fetch(metadataUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const metadata = await response.json();
      // console.log("✅ Fetched metadata:", metadata);

      // Convert image IPFS URL to ipfs.io gateway ONLY
      if (metadata.image && metadata.image.startsWith("ipfs://")) {
        const imageHash = metadata.image.replace("ipfs://", "");
        metadata.image = `https://ipfs.io/ipfs/${imageHash}`;
        // console.log("🖼️ Converted image URL:", metadata.image);
      }

      return metadata;
    } catch (error) {
      console.error("❌ Error fetching metadata:", error);
      return null;
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setError(null);
    setGeneratedImage(null);
    setQuotaExceeded(false);

    try {
      const response = await fetch("/api/generate-nft", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle specific error cases
        if (response.status === 429) {
          setQuotaExceeded(true);
          setError(data.error || "API quota exceeded");
          return;
        }
        throw new Error(data.error || "Failed to generate NFT");
      }

      if (data.imageUrl) {
        setGeneratedImage(data.imageUrl);
        setQuotaExceeded(false);
        onGenerate?.(data.imageUrl, prompt);
      } else {
        throw new Error("No image generated");
      }
    } catch (err) {
      console.error("Generation error:", err);
      setError(err instanceof Error ? err.message : "Failed to generate NFT");
      setQuotaExceeded(false);
    } finally {
      setIsGenerating(false);
    }
  };

  // Upload image to IPFS
  const uploadImageToIPFS = async (file: File): Promise<string> => {
    try {
      // console.log(
      //   "📤 Uploading image file:",
      //   file.name,
      //   "Size:",
      //   file.size,
      //   "Type:",
      //   file.type
      // );

      // Use Thirdweb V5 upload API correctly
      const uris = await upload({
        client,
        files: [file],
      });

      // console.log("🔍 Upload response:", uris);
      // console.log("🔍 Upload response type:", typeof uris);
      // console.log(
      //   "🔍 Upload response length:",
      //   Array.isArray(uris) ? uris.length : "Not array"
      // );

      // Check if we get a valid IPFS URI
      const imageUri = Array.isArray(uris) ? uris[0] : uris;
      // console.log("✅ Image uploaded to IPFS:", imageUri);

      // Validate the URI format
      if (
        !imageUri ||
        (!imageUri.startsWith("ipfs://") && !imageUri.startsWith("https://"))
      ) {
        throw new Error(`Invalid IPFS URI returned: ${imageUri}`);
      }

      // Keep the original ipfs:// format for metadata storage
      // console.log(
      //   "🌐 Image URI (keeping ipfs:// format for metadata):",
      //   imageUri
      // );

      return imageUri;
    } catch (error) {
      console.error("❌ Image upload failed:", error);
      throw new Error(
        `Failed to upload image to IPFS: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  // Create and upload JSON metadata to IPFS
  const uploadMetadataToIPFS = async (imageUri: string): Promise<string> => {
    try {
      const metadata = {
        name: `NanoNFT by moayaan.eth #${Date.now()}`,
        description: `AI-generated NFT: ${prompt}`,
        image: imageUri,
        attributes: [
          {
            trait_type: "AI Model",
            value: "Gemini Nano Banana",
          },
          {
            trait_type: "Generation Date",
            value: new Date().toISOString().split("T")[0],
          },
          {
            trait_type: "Prompt",
            value: prompt.slice(0, 100) + (prompt.length > 100 ? "..." : ""),
          },
          {
            trait_type: "Created At",
            value: new Date().toISOString(),
          },
        ],
      };

      // console.log("📋 Creating metadata JSON:", metadata);

      const metadataFile = new File(
        [JSON.stringify(metadata, null, 2)],
        "metadata.json",
        { type: "application/json" }
      );

      // console.log("📤 Uploading metadata file size:", metadataFile.size);

      const uris = await upload({
        client,
        files: [metadataFile],
      });

      // console.log("🔍 Metadata upload response:", uris);
      // console.log("🔍 Metadata response type:", typeof uris);
      // console.log(
      //   "🔍 Metadata response length:",
      //   Array.isArray(uris) ? uris.length : "Not array"
      // );

      const metadataUri = Array.isArray(uris) ? uris[0] : uris;
      // console.log("✅ Metadata uploaded to IPFS:", metadataUri);

      // Validate the metadata URI format
      if (
        !metadataUri ||
        (!metadataUri.startsWith("ipfs://") &&
          !metadataUri.startsWith("https://"))
      ) {
        throw new Error(`Invalid metadata IPFS URI returned: ${metadataUri}`);
      }

      // Keep metadata as ipfs:// format for tokenURI (standard)
      // console.log("🌐 Metadata URI (keeping ipfs:// format):", metadataUri);

      return metadataUri;
    } catch (error) {
      console.error("❌ Metadata upload failed:", error);
      throw new Error("Failed to upload metadata to IPFS");
    }
  };

  const handleMint = async () => {
    if (!generatedImage) return;

    setIsMinting(true);
    setError(null);
    setMintSuccess(false);

    try {
      // Step 1: Convert base64 image to File object
      const response = await fetch(generatedImage);
      const blob = await response.blob();
      const imageFile = new File([blob], `nft-${Date.now()}.png`, {
        type: "image/png",
      });

      // Step 2: Upload image to IPFS
      // console.log("Uploading image to IPFS...");
      const imageUri = await uploadImageToIPFS(imageFile);
      // console.log("Image uploaded:", imageUri);

      // Step 3: Create and upload metadata to IPFS
      // console.log("Creating metadata and uploading to IPFS...");
      const metadataUri = await uploadMetadataToIPFS(imageUri);
      // console.log("Metadata uploaded:", metadataUri);

      // Step 4: Check if user can mint for free and mint the NFT
      const canCreateFree = Boolean(mintEligibility?.[0]);

      // console.log("Minting NFT with tokenURI:", metadataUri);
      // console.log("Can create free:", canCreateFree);
      // console.log("Account address:", account.address);

      // Prepare the contract call
      // console.log("Preparing contract call...");
      const transaction = prepareContractCall({
        contract: nanoNFTContract,
        method:
          "function createNFT(string _tokenURI, bool isFree) external returns (uint256)",
        params: [metadataUri, canCreateFree],
      });

      // console.log("Transaction prepared:", transaction);

      // Send the transaction with timeout
      // console.log("Sending transaction...");
      try {
        // Add timeout to prevent infinite hanging
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error("Transaction timeout after 60 seconds")),
            60000
          )
        );

        const result = (await Promise.race([
          sendTransaction(transaction),
          timeoutPromise,
        ])) as { transactionHash?: string; hash?: string };

        // console.log("Transaction sent, result:", result);

        // Wait for transaction confirmation
        // console.log(
        //   "Mint transaction result:",
        //   result?.transactionHash || result
        // );

        // Store transaction hash and show success
        const transactionHash = result?.transactionHash || result?.hash || "";
        if (transactionHash) {
          setTxHash(transactionHash);
          setMintSuccess(true);
          // console.log("✅ Minting successful! TX Hash:", transactionHash);
        } else {
          throw new Error("Transaction completed but no hash received");
        }
      } catch (txError) {
        console.error("❌ Transaction failed:", txError);
        throw new Error(
          `Transaction failed: ${
            txError instanceof Error
              ? txError.message
              : "Unknown transaction error"
          }`
        );
      }

      // Refresh NFTs after successful mint (with delay to allow blockchain to update)
      setTimeout(() => {
        // Trigger a refresh of user NFTs by updating userStats dependency
        const loadUserNFTs = async () => {
          setIsLoadingNFTs(true);
          try {
            const userNFTList = [];
            const maxTokenId = await readContract({
              contract: nanoNFTContract,
              method:
                "function getNextTokenId() external view returns (uint256)",
            });

            // Check recent tokens for the newly minted NFT
            const startId = Math.max(1, Number(maxTokenId) - 20);
            const endId = Number(maxTokenId) - 1; // getNextTokenId returns the NEXT id, so actual max is -1

            for (
              let tokenId = startId;
              tokenId <= endId && userNFTList.length < 10;
              tokenId++
            ) {
              try {
                const owner = await readContract({
                  contract: nanoNFTContract,
                  method:
                    "function ownerOf(uint256 tokenId) external view returns (address)",
                  params: [BigInt(tokenId)],
                });

                if (
                  (owner as string).toLowerCase() ===
                  account.address.toLowerCase()
                ) {
                  const tokenURI = await readContract({
                    contract: nanoNFTContract,
                    method:
                      "function tokenURI(uint256 tokenId) external view returns (string)",
                    params: [BigInt(tokenId)],
                  });

                  if (tokenURI) {
                    const metadata = await fetchNFTMetadata(tokenURI as string);
                    if (metadata) {
                      userNFTList.push({
                        id: tokenId,
                        name: metadata.name || `NanoNFT #${tokenId}`,
                        description: metadata.description || "AI-generated NFT",
                        image: metadata.image || "/icon.png",
                      });
                    }
                  }
                }
              } catch (error) {
                console.error(
                  "Error checking token ownership in refresh:",
                  error
                );
                continue;
              }
            }

            setUserNFTs(userNFTList.reverse());
          } catch (error) {
            console.error("Error refreshing NFTs:", error);
          } finally {
            setIsLoadingNFTs(false);
          }
        };

        loadUserNFTs();
      }, 3000); // Wait 3 seconds for blockchain to update

      // Don't auto-reset - let user see the transaction hash
    } catch (err) {
      console.error("Minting error:", err);
      setError(err instanceof Error ? err.message : "Failed to mint NFT");
    } finally {
      setIsMinting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.8 }}
      className="container mx-auto px-4 py-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="max-w-2xl mx-auto">
        <div className="bg-gradient-to-br from-cyan-900/30 to-purple-900/30 backdrop-blur-sm rounded-2xl p-4 shadow-2xl border border-cyan-500/20">
          <div className="text-center mb-3">
            <div className="inline-flex items-center justify-center mb-2">
              <Image
                src="/icon.png"
                alt="NanoNFT"
                width={60}
                height={60}
                className="w-15 h-15 object-contain"
              />
            </div>
            <h2 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mb-1 tracking-wide">
              Create Your NFT
            </h2>
            <p className="text-cyan-300 text-sm font-light">
              Describe your vision and let Gemini Nano Banana AI bring it to
              life
            </p>
          </div>

          <NFTMintForm
            prompt={prompt}
            setPrompt={setPrompt}
            isGenerating={isGenerating}
            handleGenerate={handleGenerate}
            generatedImage={generatedImage}
            isMinting={isMinting}
            handleMint={handleMint}
            mintSuccess={mintSuccess}
            txHash={txHash}
            error={error}
            quotaExceeded={quotaExceeded}
          />

          {/* Your Stats Section */}
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
                {_isLoadingEligibility ? (
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
                      Next free mint:{" "}
                      {Math.ceil(Number(mintEligibility?.[2]) / 3600)} hours
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
        </div>
      </motion.div>

      {/* Your Mints Section */}
      {account && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.8 }}
          className="max-w-6xl mx-auto mt-4">
          <div className="bg-gradient-to-br from-cyan-900/20 to-purple-900/20 backdrop-blur-sm rounded-2xl p-4 shadow-2xl border border-cyan-500/20">
            <div className="text-center mb-3">
              <h2 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mb-1 tracking-wide">
                Your Mints
              </h2>
              <p className="text-cyan-300 text-sm">
                Your AI-generated NFT collection
              </p>
            </div>

            <NFTGallery
              userNFTs={userNFTs}
              isLoadingNFTs={isLoadingNFTs}
            />
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
