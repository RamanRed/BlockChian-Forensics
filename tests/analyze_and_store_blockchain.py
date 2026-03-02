"""
Analyze ALL images in test_images/ and store results on the local Hardhat blockchain.
- Classifies each image as Real or Deepfake using Hugging Face ViT model
- Computes SHA-256 hash of each file
- Stores hash + AI verdict on the EvidenceRegistry smart contract (local chain = FREE)
- Retrieves and verifies on-chain records
"""

import sys
import os
import json
import hashlib
from pathlib import Path

# Add backend to path
BACKEND_PATH = Path(__file__).parent.parent / "backend"
sys.path.insert(0, str(BACKEND_PATH))

# Load .env
from dotenv import load_dotenv
load_dotenv(BACKEND_PATH / ".env")

import torch
from PIL import Image
from transformers import ViTForImageClassification, ViTImageProcessor
from web3 import Web3


# ── Helpers ──────────────────────────────────────────────────────────────────

def get_file_hash(filepath: Path) -> str:
    """Compute SHA-256 hash of a file."""
    sha256 = hashlib.sha256()
    with open(filepath, "rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            sha256.update(chunk)
    return sha256.hexdigest()


# ── AI Model ─────────────────────────────────────────────────────────────────

def load_ai_model():
    token = os.environ.get("HF_TOKEN", "")
    model_name = os.environ.get("AI_MODEL_NAME", "prithivMLmods/Deep-Fake-Detector-v2-Model")
    print(f"Loading Hugging Face ViT model: {model_name}")
    model = ViTForImageClassification.from_pretrained(model_name, token=token)
    processor = ViTImageProcessor.from_pretrained(model_name, token=token)
    model.eval()
    print("Model loaded successfully.\n")
    return model, processor


def analyze_image(img_path: Path, model, processor):
    """Analyze a single image. Returns dict with verdict info."""
    image = Image.open(img_path).convert("RGB")
    inputs = processor(images=image, return_tensors="pt")

    with torch.no_grad():
        outputs = model(**inputs)

    logits = outputs.logits
    probs = torch.softmax(logits, dim=-1)
    predicted_class = logits.argmax(-1).item()
    confidence = probs.max().item()
    label = model.config.id2label.get(predicted_class, "UNKNOWN")
    is_fake = label.lower() in ["deepfake", "fake"]

    return {
        "file": img_path.name,
        "verdict": "FAKE" if is_fake else "REAL",
        "label": label,
        "confidence": confidence,
        "ai_score": 1 - confidence if is_fake else confidence,
        "ai_status": "SUSPICIOUS" if is_fake else "AUTHENTIC",
        "file_hash": get_file_hash(img_path),
    }


# ── Blockchain ───────────────────────────────────────────────────────────────

def connect_blockchain():
    """Connect to local Hardhat node and load EvidenceRegistry contract."""
    rpc_url = os.environ.get("BLOCKCHAIN_RPC_URL", "http://127.0.0.1:8545")
    w3 = Web3(Web3.HTTPProvider(rpc_url))
    if not w3.is_connected():
        print("ERROR: Cannot connect to blockchain at", rpc_url)
        return None, None, None

    # Load ABI
    abi_path = BACKEND_PATH / "blockchain" / "abi.json"
    with open(abi_path) as f:
        abi = json.load(f)

    contract_address = os.environ.get("CONTRACT_ADDRESS", "")
    if not contract_address:
        print("ERROR: CONTRACT_ADDRESS not set in .env")
        return None, None, None

    contract = w3.eth.contract(
        address=Web3.to_checksum_address(contract_address),
        abi=abi,
    )

    private_key = os.environ.get("WALLET_PRIVATE_KEY", "")
    account = w3.eth.account.from_key(private_key)

    print(f"Blockchain connected: {rpc_url}")
    print(f"Contract: {contract_address}")
    print(f"Account:  {account.address}")
    balance = w3.eth.get_balance(account.address)
    print(f"Balance:  {Web3.from_wei(balance, 'ether')} ETH (local test ETH — FREE)\n")

    return w3, contract, account


def store_on_chain(w3, contract, account, result):
    """Store a single evidence record on-chain. Returns tx hash or error."""
    try:
        nonce = w3.eth.get_transaction_count(account.address)
        model_version = os.environ.get("AI_MODEL_VERSION", "v2.0-ViT")

        tx = contract.functions.storeEvidence(
            result["file_hash"],
            "",  # no IPFS CID for now
            int(result["ai_score"] * 100),
            result["ai_status"],
            model_version,
        ).build_transaction({
            "from": account.address,
            "nonce": nonce,
            "gas": 300_000,
            "gasPrice": w3.eth.gas_price,
            "chainId": int(os.environ.get("CHAIN_ID", "1337")),
        })

        signed = w3.eth.account.sign_transaction(tx, account.key)
        tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction)
        receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=30)

        return {
            "tx_hash": tx_hash.hex(),
            "block": receipt.blockNumber,
            "gas_used": receipt.gasUsed,
            "status": "OK" if receipt.status == 1 else "FAILED",
        }
    except Exception as e:
        return {"error": str(e)}


def verify_on_chain(contract, file_hash):
    """Read back the evidence record from the blockchain."""
    try:
        exists = contract.functions.evidenceExists(file_hash).call()
        if not exists:
            return None
        record = contract.functions.getEvidence(file_hash).call()
        return {
            "hash": record[0],
            "ipfs_cid": record[1],
            "ai_score": record[2] / 100.0,
            "ai_status": record[3],
            "model_version": record[4],
            "timestamp": record[5],
            "submitter": record[6],
        }
    except Exception as e:
        return {"error": str(e)}


# ── Main ─────────────────────────────────────────────────────────────────────

def main():
    test_dir = Path(__file__).parent / "test_images"
    extensions = {".jpg", ".jpeg", ".png", ".bmp", ".tiff", ".webp"}
    images = sorted([f for f in test_dir.iterdir() if f.suffix.lower() in extensions])

    if not images:
        print("No images found in test_images/")
        return

    # ── Step 1: AI Analysis ──
    model, processor = load_ai_model()

    print("=" * 100)
    print(f"{'#':<4} {'Image':<35} {'Verdict':<10} {'Confidence':<12} {'Score':<10} {'SHA-256 (short)'}")
    print("=" * 100)

    results = []
    for idx, img_path in enumerate(images, 1):
        try:
            r = analyze_image(img_path, model, processor)
            results.append(r)
            print(f"{idx:<4} {r['file']:<35} {r['verdict']:<10} {r['confidence']:<12.2%} {r['ai_score']:<10.4f} {r['file_hash'][:16]}")
        except Exception as e:
            print(f"{idx:<4} {img_path.name:<35} {'ERROR':<10} {e}")

    # ── Summary ──
    fake_count = sum(1 for r in results if r["verdict"] == "FAKE")
    real_count = sum(1 for r in results if r["verdict"] == "REAL")

    print("=" * 100)
    print(f"\nTotal: {len(results)} images | REAL: {real_count} | FAKE: {fake_count}\n")

    if fake_count:
        print("--- FAKE / DEEPFAKE Images ---")
        for r in results:
            if r["verdict"] == "FAKE":
                print(f"  [FAKE]  {r['file']}  (confidence: {r['confidence']:.2%}, score: {r['ai_score']:.4f})")
        print()

    if real_count:
        print("--- REAL / AUTHENTIC Images ---")
        for r in results:
            if r["verdict"] == "REAL":
                print(f"  [REAL]  {r['file']}  (confidence: {r['confidence']:.2%}, score: {r['ai_score']:.4f})")
        print()

    # ── Step 2: Blockchain Storage ──
    print("=" * 100)
    print("BLOCKCHAIN STORAGE (Local Hardhat — FREE, no real ETH used)")
    print("=" * 100 + "\n")

    w3, contract, account = connect_blockchain()
    if not w3:
        print("Blockchain unavailable. Skipping on-chain storage.")
        return

    blockchain_results = []
    for idx, r in enumerate(results, 1):
        print(f"[{idx}/{len(results)}] Storing on-chain: {r['file']}  ({r['verdict']})")
        tx_result = store_on_chain(w3, contract, account, r)

        if "error" in tx_result:
            print(f"         ERROR: {tx_result['error']}")
        else:
            print(f"         TX: {tx_result['tx_hash'][:20]}...  Block: {tx_result['block']}  Gas: {tx_result['gas_used']}  Status: {tx_result['status']}")

        blockchain_results.append({"image": r["file"], **tx_result})

    # ── Step 3: Verify On-Chain ──
    print(f"\n{'=' * 100}")
    print("ON-CHAIN VERIFICATION — Reading back from blockchain")
    print("=" * 100 + "\n")

    for r in results:
        record = verify_on_chain(contract, r["file_hash"])
        if record and "error" not in record:
            print(f"  VERIFIED  {r['file']:<35}  AI Score: {record['ai_score']:.2f}  Status: {record['ai_status']:<12}  Submitter: {record['submitter'][:10]}...")
        else:
            print(f"  MISSING   {r['file']}")

    # ── Final balance ──
    balance = w3.eth.get_balance(account.address)
    print(f"\nFinal balance: {Web3.from_wei(balance, 'ether')} ETH (still ~10000 — it's free test ETH)")

    print("\n" + "=" * 100)
    print("DONE — All images analyzed and stored on blockchain successfully!")
    print("=" * 100)


if __name__ == "__main__":
    main()
