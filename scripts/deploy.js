/**
 * Deploy EvidenceRegistry to a local Hardhat node.
 *
 * Run:
 *   npx hardhat run scripts/deploy.js --network localhost
 *
 * After deployment, copy the printed address into backend/.env as CONTRACT_ADDRESS.
 */

const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(`Deploying from: ${deployer.address}`);

  const Registry = await ethers.getContractFactory("EvidenceRegistry");
  const registry = await Registry.deploy();
  await registry.waitForDeployment();

  const address = await registry.getAddress();
  console.log(`EvidenceRegistry deployed to: ${address}`);

  // Persist address and ABI for the Python backend
  const backendDir = path.join(__dirname, "../backend/blockchain");
  fs.mkdirSync(backendDir, { recursive: true });

  fs.writeFileSync(path.join(backendDir, "contract_address.txt"), address);

  const artifact = await artifacts.readArtifact("EvidenceRegistry");
  fs.writeFileSync(
    path.join(backendDir, "abi.json"),
    JSON.stringify(artifact.abi, null, 2)
  );

  console.log(`ABI and address written to ${backendDir}`);
  console.log(`\nAdd to backend/.env:\n  CONTRACT_ADDRESS=${address}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
