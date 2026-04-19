# Polygon Amoy Deployment Guide

## How the NETWORK switch works

Set `NETWORK` in `backend/.env`:

| Value | Blockchain Used | RPC | ChainId | Gas |
|-------|----------------|-----|---------|-----|
| `local` | Hardhat (local node) | `http://127.0.0.1:8545` | 1337 | Legacy gasPrice |
| `global` | Polygon Amoy testnet | `https://rpc-amoy.polygon.technology` | 80002 | EIP-1559 |

All of `blockchain_service.py`, `config.py`, and `hardhat.config.js` read this single flag — no other changes needed when switching.

---

## Step-by-step: Deploy to Polygon Amoy

### 1. Get a wallet & private key
- Install [MetaMask](https://metamask.io)
- Add Polygon Amoy network to MetaMask:
  - Network name: `Polygon Amoy`
  - RPC URL: `https://rpc-amoy.polygon.technology`
  - Chain ID: `80002`
  - Currency: `MATIC`
- Copy your wallet's private key (MetaMask → Account Details → Export Private Key)

### 2. Get free testnet MATIC from the faucet
- Go to: https://faucet.polygon.technology
- Select **Amoy** testnet
- Paste your wallet address and claim MATIC (you need some to pay gas)

### 3. Set your private key in backend/.env
```env
DEPLOYER_PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE
```
> ⚠️ Never commit your real private key to git. The `.gitignore` already excludes `.env` files.

### 4. Deploy the contract to Polygon Amoy
Run from the project root (`blockchain/` folder):
```bash
npx hardhat run scripts/deploy.js --network polygonAmoy
```

You'll see output like:
```
✅  DIRSRegistry deployed at: 0xABCDEF...
    Transaction hash: 0x1234...
```

### 5. Copy the contract address into backend/.env
```env
CONTRACT_ADDRESS_AMOY=0xABCDEF...   # paste the address from step 4
```

### 6. Switch the backend to Polygon
```env
NETWORK=global
```

### 7. Restart the backend
```bash
cd backend
uvicorn main:app --reload --port 8000
```

On startup you'll see:
```
[Blockchain] DIRSRegistry connected | network=global | rpc=https://rpc-amoy.polygon.technology | chainId=80002 | contract=0xABCDEF...
```

---

## Switching back to local Hardhat

```env
NETWORK=local
```

Then start the local node and redeploy if needed:
```bash
npx hardhat node
npx hardhat run scripts/deploy.js --network localhost
# copy the printed address into CONTRACT_ADDRESS in backend/.env
```

---

## Verify the contract on Polygonscan (optional)
```bash
npx hardhat verify --network polygonAmoy 0xYOUR_CONTRACT_ADDRESS
```
Requires `POLYGONSCAN_API_KEY` in the root `.env`.

---

## File reference

| File | What it controls |
|------|-----------------|
| `backend/.env` → `NETWORK` | The single switch: `local` or `global` |
| `backend/.env` → `CONTRACT_ADDRESS` | Hardhat local contract address |
| `backend/.env` → `CONTRACT_ADDRESS_AMOY` | Polygon Amoy contract address |
| `backend/.env` → `DEPLOYER_PRIVATE_KEY` | Wallet key used for Polygon |
| `backend/.env` → `WALLET_PRIVATE_KEY` | Wallet key used for Hardhat |
| `backend/config.py` | Reads `NETWORK`, exposes `_blockchain_rpc`, `_contract_address`, etc. |
| `backend/services/blockchain_service.py` | Uses `settings._*` properties — no hardcoded chain |
| `hardhat.config.js` | Has `hardhat`, `localhost`, `polygonAmoy`, `polygon` networks |
| `scripts/deploy.js` | Deploys `DIRSRegistry` to whichever `--network` you pass |
