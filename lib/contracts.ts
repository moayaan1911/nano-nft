import { getContract } from "thirdweb";
import { sepolia } from "thirdweb/chains";
import { client } from "@/lib/client";
// Contract Addresses on Sepolia
export const CONTRACT_ADDRESSES = {
  NANO_NFT: "0x99d60b29ec9238c94046a801894e04118bb21259", // https://sepolia.etherscan.io/address/0x99d60b29ec9238c94046a801894e04118bb21259
} as const;

// Contract instances
export const nanoNFTContract = getContract({
  client,
  chain: sepolia,
  address: CONTRACT_ADDRESSES.NANO_NFT,
});
