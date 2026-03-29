"""
DIRS — Digital Investigation Record System
Blockchain Service (Generalized)
Stores any record hash on the blockchain via the DIRSRegistry smart contract.
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
    """Establish connection to blockchain node and load DIRSRegistry contract."""
    global _web3, _contract
    try:
        from web3 import Web3
        _web3 = Web3(Web3.HTTPProvider(settings.BLOCKCHAIN_RPC_URL))
        if not _web3.is_connected():
            logger.error("Failed to connect to blockchain node.")
            return None

        abi_path = os.path.join(os.path.dirname(__file__), "../blockchain/abi.json")
        if not os.path.exists(abi_path):
            logger.warning("ABI file not found. Blockchain features disabled.")
            return None

        with open(abi_path) as f:
            abi = json.load(f)

        address = settings.CONTRACT_ADDRESS
        if not address:
            logger.warning("CONTRACT_ADDRESS not set. Blockchain features disabled.")
            return None

        _contract = _web3.eth.contract(
            address=Web3.to_checksum_address(address), abi=abi
        )
        logger.info(f"Connected to DIRSRegistry at {settings.BLOCKCHAIN_RPC_URL}")
        return _web3
    except ImportError:
        logger.warning("web3 not installed. Blockchain features disabled.")
        return None
    except Exception as e:
        logger.error(f"Blockchain connection error: {e}")
        return None


async def store_record_hash(
    record_type: str,
    record_id: str,
    data_hash: str,
) -> Optional[Dict[str, Any]]:
    """
    Generalized blockchain write — stores ANY record hash.
    record_type: fir | evidence | diary | seizure | custody | property | chargesheet
    record_id:   unique string identifier (e.g. fir_number, property_number)
    data_hash:   SHA-256 hex string of the record's canonical data
    """
    web3 = connect_to_blockchain()
    if not web3 or not _contract:
        logger.warning(f"Blockchain unavailable. Skipping {record_type}/{record_id} hash write.")
        return None

    try:
        from web3 import Web3
        account = web3.eth.account.from_key(settings.WALLET_PRIVATE_KEY)
        nonce = web3.eth.get_transaction_count(account.address)

        tx = _contract.functions.storeRecordHash(
            record_type,
            record_id,
            data_hash,
        ).build_transaction({
            "from": account.address,
            "nonce": nonce,
            "gas": 300000,
            "gasPrice": web3.eth.gas_price,
            "chainId": settings.CHAIN_ID,
        })

        signed_tx = web3.eth.account.sign_transaction(tx, settings.WALLET_PRIVATE_KEY)
        tx_hash = web3.eth.send_raw_transaction(signed_tx.rawTransaction)
        receipt = web3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)

        result = {
            "tx_hash": tx_hash.hex(),
            "block_number": receipt.blockNumber,
            "status": receipt.status,
        }
        logger.info(f"[{record_type}:{record_id}] hash stored on blockchain: tx={result['tx_hash'][:20]}...")
        return result
    except Exception as e:
        logger.error(f"Blockchain store_record_hash error [{record_type}:{record_id}]: {e}")
        return None


# Backward-compatible alias for evidence pipeline
async def store_evidence_hash(bound_data: dict) -> Optional[Dict[str, Any]]:
    """Alias retained for existing evidence upload pipeline compatibility."""
    return await store_record_hash(
        "evidence",
        bound_data.get("file_hash", "unknown"),
        bound_data.get("file_hash", ""),
    )


async def check_existing_hash(file_hash: str) -> bool:
    """Check if a hash already exists on blockchain."""
    web3 = connect_to_blockchain()
    if not web3 or not _contract:
        return False
    try:
        return _contract.functions.recordExists(file_hash).call()
    except Exception as e:
        logger.error(f"Blockchain check error: {e}")
        return False


async def get_blockchain_record(data_hash: str) -> Optional[Dict[str, Any]]:
    """Retrieve a stored record from blockchain by hash."""
    web3 = connect_to_blockchain()
    if not web3 or not _contract:
        return None
    try:
        record = _contract.functions.getRecord(data_hash).call()
        return {
            "record_type": record[0],
            "record_id":   record[1],
            "data_hash":   record[2],
            "timestamp":   record[3],
            "submitter":   record[4],
            "tx_hash":     None,  # Not stored on-chain, returned via receipt
        }
    except Exception as e:
        logger.error(f"Blockchain get_record error: {e}")
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
