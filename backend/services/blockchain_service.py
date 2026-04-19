"""
DIRS — Blockchain Service (Polygon EIP-1559 + local Hardhat)
modification branch (v2.1.0)

Changes vs v1:
  - EIP-1559 gas strategy added for Polygon Amoy / Polygon mainnet
  - Falls back to legacy gasPrice for local Hardhat (chainId 1337)
  - USE_EIP1559=True in .env activates Polygon gas mode
  - store_record_hash now includes ipfs_cid in log (does not change contract — CID stored in DB)
"""

import json
import os
from typing import Optional, Dict, Any
from config import settings
from utils.logger import setup_logger

logger = setup_logger(__name__)

_web3 = None
_contract = None


def _to_wei(gwei: float) -> int:
    """Convert Gwei float to Wei int."""
    return int(gwei * 1_000_000_000)


def connect_to_blockchain():
    """Establish connection to blockchain node and load DIRSRegistry contract.

    Network is selected automatically from settings.NETWORK:
      'local'  → Hardhat (http://127.0.0.1:8545, chainId 1337)
      'global' → Polygon Amoy testnet (chainId 80002)
    """
    global _web3, _contract
    try:
        from web3 import Web3

        rpc_url = settings._blockchain_rpc
        _web3 = Web3(Web3.HTTPProvider(rpc_url))
        if not _web3.is_connected():
            logger.error("[Blockchain] Cannot connect to node: %s  (NETWORK=%s)",
                         rpc_url, settings.NETWORK)
            return None

        abi_path = os.path.join(os.path.dirname(__file__), "../blockchain/abi.json")
        if not os.path.exists(abi_path):
            logger.warning("[Blockchain] ABI not found at %s — blockchain disabled.", abi_path)
            return None

        with open(abi_path) as f:
            abi = json.load(f)

        address = settings._contract_address
        if not address:
            logger.warning(
                "[Blockchain] No contract address for NETWORK=%s — blockchain disabled.\n"
                "  local  → set CONTRACT_ADDRESS in backend/.env\n"
                "  global → set CONTRACT_ADDRESS_AMOY in backend/.env",
                settings.NETWORK,
            )
            return None

        _contract = _web3.eth.contract(
            address=Web3.to_checksum_address(address), abi=abi
        )
        logger.info(
            "[Blockchain] DIRSRegistry connected | network=%s | rpc=%s | chainId=%s | contract=%s",
            settings.NETWORK, rpc_url, settings._chain_id, address,
        )
        return _web3

    except ImportError:
        logger.warning("[Blockchain] web3 not installed — blockchain disabled.")
        return None
    except Exception as e:
        logger.error("[Blockchain] Connection error: %s", e)
        return None

async def get_eip1559_gas_params(web3) -> Dict[str, Any]:
    try:
        latest_block = web3.eth.get_block("latest")
        base_fee = latest_block.get('baseFeePerGas', 0)
        max_priority_fee = web3.to_wei(30, "gwei")
        max_fee = (2 * base_fee) + max_priority_fee
        return {
            "maxFeePerGas": max_fee,
            "maxPriorityFeePerGas": max_priority_fee,
        }
    except Exception as e:
        logger.error("[Blockchain] Failed to get EIP-1559 gas params: %s", e)
        return {}


def _build_gas_params(web3) -> Dict[str, Any]:
    """
    Build gas parameters for the transaction.
    - EIP-1559 (Polygon Amoy / mainnet): uses maxFeePerGas + maxPriorityFeePerGas
    - Legacy (Hardhat local):            uses gasPrice

    When NETWORK='global', EIP-1559 is always active.
    When NETWORK='local', falls back to legacy gasPrice.
    """
    if settings._use_eip1559:
        # Polygon EIP-1559
        max_fee       = _to_wei(settings.MAX_FEE_PER_GAS_GWEI)
        priority_fee  = _to_wei(settings.MAX_PRIORITY_FEE_GWEI)
        logger.debug("[Blockchain] EIP-1559 gas: maxFee=%d wei, priorityFee=%d wei",
                     max_fee, priority_fee)
        return {
            "maxFeePerGas":         max_fee,
            "maxPriorityFeePerGas": priority_fee,
        }
    else:
        # Legacy Hardhat / PoA
        gas_price = web3.eth.gas_price
        logger.debug("[Blockchain] Legacy gasPrice: %d wei", gas_price)
        return {"gasPrice": gas_price}


async def store_record_hash(
    record_type: str,
    record_id: str,
    data_hash: str,
    ipfs_cid: Optional[str] = None,   # informational — logged but NOT stored on-chain
) -> Optional[Dict[str, Any]]:
    """
    Generalized blockchain write — stores ANY record hash on DIRSRegistry.

    record_type : fir | evidence | diary | seizure | custody | property | chargesheet | finding
    record_id   : unique string identifier (fir_number, property_number, finding_id, etc.)
    data_hash   : SHA-256 hex of the record's canonical JSON
    ipfs_cid    : Pinata CID — logged here for traceability, stored in DB (not on-chain)
    """
    web3 = connect_to_blockchain()
    if not web3 or not _contract:
        logger.warning("[Blockchain] Unavailable — skipping hash write for %s/%s", record_type, record_id)
        return None

    try:
        from web3 import Web3
        account = web3.eth.account.from_key(settings._wallet_private_key)
        nonce   = web3.eth.get_transaction_count(account.address)

        if settings._chain_id in {137, 80002}:
            gas_params = await get_eip1559_gas_params(web3)
        else:
            gas_params = _build_gas_params(web3)

        tx = _contract.functions.storeRecordHash(
            record_type,
            record_id,
            data_hash,
            ipfs_cid or ""
        ).build_transaction({
            "from":    account.address,
            "nonce":   nonce,
            "gas":     300_000,
            "chainId": settings._chain_id,
            **gas_params,
        })

        signed_tx = web3.eth.account.sign_transaction(tx, settings._wallet_private_key)
        tx_hash   = web3.eth.send_raw_transaction(signed_tx.raw_transaction)
        receipt   = web3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)

        result = {
            "tx_hash":      tx_hash.hex(),
            "block_number": receipt.blockNumber,
            "status":       receipt.status,
            "ipfs_cid":     ipfs_cid,
        }
        logger.info(
            "[Blockchain] %s/%s stored | tx=%s... | block=%s | cid=%s",
            record_type, record_id, result["tx_hash"][:20], receipt.blockNumber, ipfs_cid
        )
        return result

    except Exception as e:
        logger.error("[Blockchain] store_record_hash error [%s/%s]: %s", record_type, record_id, e)
        return None


async def store_evidence_hash(bound_data: dict) -> Optional[Dict[str, Any]]:
    """Backward-compatible alias for the evidence upload pipeline."""
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
        logger.error("[Blockchain] check_existing_hash error: %s", e)
        return False


async def get_blockchain_record(data_hash: str) -> Optional[Dict[str, Any]]:
    """Retrieve a stored DIRS record from blockchain by data hash."""
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
        }
    except Exception as e:
        logger.error("[Blockchain] get_blockchain_record error: %s", e)
        return None


async def get_transaction_receipt(tx_hash: str) -> Optional[Dict[str, Any]]:
    """Get receipt for a specific transaction hash."""
    web3 = connect_to_blockchain()
    if not web3:
        return None
    try:
        receipt = web3.eth.get_transaction_receipt(tx_hash)
        return dict(receipt) if receipt else None
    except Exception as e:
        logger.error("[Blockchain] get_transaction_receipt error: %s", e)
        return None
