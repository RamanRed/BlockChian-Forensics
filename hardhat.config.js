import "@nomicfoundation/hardhat-toolbox";
import dotenv from "dotenv";
dotenv.config({ path: "./backend/.env" });

/**
 * Hardhat Configuration — DIRS Digital Investigation Record System
 * modification branch (v2.1.0)
 *
 * Networks:
 *   hardhat   — local in-process node (testing, default)
 *   localhost  — local persistent Hardhat node (npx hardhat node)
 *   amoy       — Polygon Amoy testnet (chainId 80002)
 *   polygon    — Polygon mainnet (chainId 137)
 *
 * Env vars required for Polygon deployment:
 *   POLYGON_AMOY_RPC_URL    — Alchemy / QuickNode Amoy endpoint
 *   POLYGON_MAINNET_RPC_URL — Alchemy / QuickNode mainnet endpoint
 *   WALLET_PRIVATE_KEY      — deployer wallet private key (no 0x prefix needed for hardhat)
 *   POLYGONSCAN_API_KEY     — for contract verification on Polygonscan (optional)
 *
 * @type import('hardhat/config').HardhatUserConfig
 */
export default {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: { enabled: true, runs: 200 },
    },
  },

  networks: {
    // ── Local ──────────────────────────────────────────────────────────
    hardhat: {
      chainId: 1337,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 1337,
    },

    // ── Polygon Amoy Testnet ──────────────────────────────────────────
    // chainId: 80002
    // Explorer: https://amoy.polygonscan.com
    // Faucet:   https://faucet.polygon.technology
    polygonAmoy: {
      url: process.env.POLYGON_AMOY_RPC || "https://rpc-amoy.polygon.technology",
      chainId: 80002,
      accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : []
    },
    polygon: {
      url: process.env.POLYGON_MAINNET_RPC || "https://polygon-rpc.com",
      chainId: 137,
      accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : []
    },
  },

  // Polygonscan verification (optional — run: npx hardhat verify --network amoy <address>)
  etherscan: {
    apiKey: {
      polygon:     process.env.POLYGONSCAN_API_KEY || "",
      polygonAmoy: process.env.POLYGONSCAN_API_KEY || "",
    },
  },

  paths: {
    sources:   "./contracts",
    tests:     "./test",
    cache:     "./cache",
    artifacts: "./artifacts",
  },
};
