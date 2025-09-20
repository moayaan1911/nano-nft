# Contracts README — NanoNFT by Ayaan (NNFT)

- Network: Sepolia (11155111)
- Contract: `NanoNFT`
- Deployed Address: `0x99d60b29Ec9238c94046A801894E04118Bb21259`
- Etherscan: https://sepolia.etherscan.io/address/0x99d60b29ec9238c94046a801894e04118bb21259
- Verification: Verified on Etherscan
- ABI: `out/NanoNFT.sol/NanoNFT.json`
- Broadcast: `broadcast/NanoNFT.s.sol/11155111/run-latest.json`

## Makefile Targets

- `make build` — Forge build
- `make test-all` — Run full test suite
- `make deploy -- --network sepolia` — Deploy `NanoNFT` to Sepolia (uses `script/NanoNFT.s.sol:DeployNanoNFT`)
- `make deploy-nanonft ARGS="--network sepolia"` — Alias for the same deploy

## Required Environment (.env)

- `SEPOLIA_RPC_URL` — Sepolia RPC endpoint
- `PRIVATE_KEY` — Deployer private key (funded test account)
- `ETHERSCAN_API_KEY` — For contract verification

Example entries exist in `.env.example`.

## Collection Metadata

- Name: NanoNFT by Ayaan
- Symbol: NNFT
- Free Limit: 3 creations per 24 hours
- Max Supply: 10,000

## Notes

- Contract deployed and verified via Makefile using Foundry `forge script` with broadcast and verification enabled.
- Next step: Import this contract into Thirdweb (Sepolia) and configure Gasless transactions.
