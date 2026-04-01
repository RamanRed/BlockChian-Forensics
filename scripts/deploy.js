/**
 * Deploy DIRSRegistry to Hardhat local / Polygon Amoy / Polygon mainnet.
 * modification branch (v2.1.0)
 *
 * FIXED: v1 script referenced "EvidenceRegistry" — the actual contract is "DIRSRegistry".
 *
 * Usage:
 *   Local:   npx hardhat run scripts/deploy.js --network localhost
 *   Amoy:    npx hardhat run scripts/deploy.js --network amoy
 *   Mainnet: npx hardhat run scripts/deploy.js --network polygon
 *
 * After deployment, copy the printed CONTRACT_ADDRESS into backend/.env
 * and set CHAIN_ID to match the target network:
 *   Local Hardhat → 1337
 *   Polygon Amoy  → 80002
 *   Polygon       → 137
 *
 * Also set USE_EIP1559=True in backend/.env when deploying to Polygon.
 */

import pkg from "hardhat";
const { ethers, artifacts, network } = pkg;
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

async function main() {
  const [deployer] = await ethers.getSigners();
  const balance    = await ethers.provider.getBalance(deployer.address);

  console.log("═".repeat(60));
  console.log("  DIRS — DIRSRegistry Deployment");
  console.log("═".repeat(60));
  console.log(`  Network   : ${network.name}`);
  console.log(`  Deployer  : ${deployer.address}`);
  console.log(`  Balance   : ${ethers.formatEther(balance)} ETH/MATIC`);
  console.log("═".repeat(60));

  // Deploy DIRSRegistry (correct contract name — was "EvidenceRegistry" in v1, now fixed)
  const Registry = await ethers.getContractFactory("DIRSRegistry");
  console.log("Deploying DIRSRegistry...");
  const registry = await Registry.deploy();
  await registry.waitForDeployment();

  const address = await registry.getAddress();
  const deployTx = registry.deploymentTransaction();

  console.log(`\n✅  DIRSRegistry deployed at: ${address}`);
  if (deployTx) {
    console.log(`    Transaction hash       : ${deployTx.hash}`);
  }

  // ── Persist ABI + address for Python backend ──────────────────────────
  const backendDir = path.join(__dirname, "../backend/blockchain");
  fs.mkdirSync(backendDir, { recursive: true });

  // Write contract address
  fs.writeFileSync(path.join(backendDir, "contract_address.txt"), address);

  // Write ABI
  const artifact = await artifacts.readArtifact("DIRSRegistry");
  fs.writeFileSync(
    path.join(backendDir, "abi.json"),
    JSON.stringify(artifact.abi, null, 2)
  );

  // Write deployment metadata
  const meta = {
    network:         network.name,
    contract:        "DIRSRegistry",
    address,
    deployer:        deployer.address,
    txHash:          deployTx?.hash ?? "n/a",
    deployedAt:      new Date().toISOString(),
  };
  fs.writeFileSync(
    path.join(backendDir, "deployment.json"),
    JSON.stringify(meta, null, 2)
  );

  console.log(`\n  ABI + metadata written to: ${backendDir}`);
  console.log("\n  ── Add to backend/.env ──────────────────────────────");
  console.log(`  CONTRACT_ADDRESS=${address}`);
  console.log(`  CHAIN_ID=${(await ethers.provider.getNetwork()).chainId}`);
  if (network.name !== "hardhat" && network.name !== "localhost") {
    console.log("  USE_EIP1559=True");
  }
  console.log("═".repeat(60));
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
