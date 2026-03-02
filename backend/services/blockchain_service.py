"""
Blockchain Service
Interact with the EvidenceRegistry smart contract using Web3.py
"""

import json
import os
from typing import Optional, Dict, Any
from config import settings
from utils.logger import setup_logger

logger = setup_logger(__name__)

_web3 = None
_contract = None


def connect_to_blockchain():
    """Establish connection to blockchain node and load contract."""
    global _web3, _contract
    try:
        from web3 import Web3
        _web3 = Web3(Web3.HTTPProvider(settings.BLOCKCHAIN_RPC_URL))
        if not _web3.is_connected():
            logger.error("Failed to connect to blockchain node.")
            return None

        # Load ABI
        abi_path = os.path.join(os.path.dirname(__file__), "../blockchain/abi.json")
        if not os.path.exists(abi_path):
            logger.warning("ABI file not found. Blockchain features disabled.")
            return None

        with open(abi_path) as f:
            abi = json.load(f)

        address = settings.CONTRACT_ADDRESS
        if not address:
            logger.warning("Contract address not set. Blockchain features disabled.")
            return None

        _contract = _web3.eth.contract(address=Web3.to_checksum_address(address), abi=abi)
        logger.info(f"Connected to blockchain at {settings.BLOCKCHAIN_RPC_URL}")
        return _web3
    except ImportError:
        logger.warning("web3 not installed. Blockchain features disabled.")
        return None
    except Exception as e:
        logger.error(f"Blockchain connection error: {e}")
        return None


async def store_evidence_hash(bound_data: dict) -> Optional[Dict[str, Any]]:
    """
    Store evidence hash and metadata on the blockchain.
    Returns transaction details or None on failure.
    """
    web3 = connect_to_blockchain()
    if not web3 or not _contract:
        logger.warning("Blockchain unavailable. Skipping on-chain storage.")
        return None

    try:
        from web3 import Web3
        account = web3.eth.account.from_key(settings.WALLET_PRIVATE_KEY)
        nonce = web3.eth.get_transaction_count(account.address)

        tx = _contract.functions.storeEvidence(
            bound_data["file_hash"],
            bound_data.get("metadata", {}).get("ipfs_cid", ""),
            int(bound_data["ai_score"] * 100),
            bound_data["ai_status"],
            bound_data["model_version"]
        ).build_transaction({
            "from": account.address,
            "nonce": nonce,
            "gas": 300000,
            "gasPrice": web3.eth.gas_price,
            "chainId": settings.CHAIN_ID
        })

        signed_tx = web3.eth.account.sign_transaction(tx, settings.WALLET_PRIVATE_KEY)
        tx_hash = web3.eth.send_raw_transaction(signed_tx.rawTransaction)
        receipt = web3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)

        result = {
            "tx_hash": tx_hash.hex(),
            "block_number": receipt.blockNumber,
            "status": receipt.status
        }
        logger.info(f"Evidence stored on blockchain: tx={result['tx_hash'][:20]}...")
        return result

    except Exception as e:
        logger.error(f"Blockchain store error: {e}")
        return None


async def check_existing_hash(file_hash: str) -> bool:
    """Check if a hash already exists on the blockchain."""
    web3 = connect_to_blockchain()
    if not web3 or not _contract:
        return False
    try:
        return _contract.functions.evidenceExists(file_hash).call()
    except Exception as e:
        logger.error(f"Blockchain check error: {e}")
        return False


async def get_blockchain_record(file_hash: str) -> Optional[Dict[str, Any]]:
    """Retrieve evidence record from blockchain by hash."""
    web3 = connect_to_blockchain()
    if not web3 or not _contract:
        return None
    try:
        record = _contract.functions.getEvidence(file_hash).call()
        return {
            "evidence_hash": record[0],
            "ipfs_cid": record[1],
            "ai_score": record[2] / 100.0,
            "ai_status": record[3],
            "model_version": record[4],
            "timestamp": record[5],
            "submitter": record[6]
        }
    except Exception as e:
        logger.error(f"Blockchain get record error: {e}")
        return None


async def get_transaction_receipt(tx_hash: str) -> Optional[Dict[str, Any]]:
    """Get the receipt for a specific transaction."""
    web3 = connect_to_blockchain()
    if not web3:
        return None
    try:
        receipt = web3.eth.get_transaction_receipt(tx_hash)
        return dict(receipt) if receipt else None
    except Exception as e:
        logger.error(f"Transaction receipt error: {e}")
        return None
