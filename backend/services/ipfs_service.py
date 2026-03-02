"""
IPFS Storage Service
Upload and retrieve files from IPFS
"""

import aiohttp
import aiofiles
from typing import Optional
from config import settings
from utils.logger import setup_logger

logger = setup_logger(__name__)


async def upload_to_ipfs(file_path: str) -> Optional[str]:
    """
    Upload a file to IPFS and return its CID.
    Returns None if IPFS is unavailable.
    """
    try:
        async with aiofiles.open(file_path, "rb") as f:
            file_bytes = await f.read()

        data = aiohttp.FormData()
        data.add_field("file", file_bytes, filename=file_path.split("/")[-1])

        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{settings.IPFS_API_URL}/api/v0/add",
                data=data,
                timeout=aiohttp.ClientTimeout(total=60)
            ) as response:
                if response.status == 200:
                    result = await response.json()
                    cid = result.get("Hash")
                    logger.info(f"File uploaded to IPFS: CID={cid}")
                    return cid
                else:
                    logger.error(f"IPFS upload failed: HTTP {response.status}")
                    return None

    except aiohttp.ClientConnectorError:
        logger.warning("IPFS node not reachable. Skipping IPFS upload.")
        return None
    except Exception as e:
        logger.error(f"IPFS upload error: {e}")
        return None


async def retrieve_from_ipfs(cid: str, output_path: str) -> bool:
    """
    Retrieve a file from IPFS by CID and save it to output_path.
    Returns True on success.
    """
    try:
        gateway_url = f"{settings.IPFS_GATEWAY_URL}{cid}"
        async with aiohttp.ClientSession() as session:
            async with session.get(gateway_url, timeout=aiohttp.ClientTimeout(total=60)) as response:
                if response.status == 200:
                    content = await response.read()
                    async with aiofiles.open(output_path, "wb") as f:
                        await f.write(content)
                    logger.info(f"File retrieved from IPFS: CID={cid}")
                    return True
                else:
                    logger.error(f"IPFS retrieval failed: HTTP {response.status}")
                    return False
    except Exception as e:
        logger.error(f"IPFS retrieval error: {e}")
        return False


def get_ipfs_url(cid: str) -> str:
    """Get a public IPFS gateway URL for a CID."""
    return f"https://ipfs.io/ipfs/{cid}"
