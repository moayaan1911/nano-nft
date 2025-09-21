"use client";
import { ConnectButton, useActiveAccount } from "thirdweb/react";
import { client } from "@/lib/client";
import { inAppWallet, createWallet } from "thirdweb/wallets";

import { sepolia } from "thirdweb/chains";
import { CONTRACT_ADDRESSES } from "@/lib/contracts";

// Only Sepolia testnet supported
const supportedChains = [sepolia];

const wallets = [
  inAppWallet({
    auth: {
      options: ["guest", "email"],
    },
  }),
  createWallet("io.metamask"),
  createWallet("com.coinbase.wallet"),
  createWallet("me.rainbow"),
  createWallet("com.tangem"),
];

export default function ConnectWallet() {
  const account = useActiveAccount();
  const isConnected = !!account;

  return (
    <ConnectButton
      accountAbstraction={{
        chain: sepolia,
        sponsorGas: true,
      }}
      chains={supportedChains}
      client={client}
      connectButton={{ label: "Connect to NanoNFT" }}
      connectModal={{
        showThirdwebBranding: false,
        size: "compact",
        title: "NanoNFT Sign In",
      }}
      theme={isConnected ? "light" : "dark"}
      wallets={wallets}
      supportedNFTs={{
        [sepolia.id]: [CONTRACT_ADDRESSES.NANO_NFT],
      }}
    />
  );
}
