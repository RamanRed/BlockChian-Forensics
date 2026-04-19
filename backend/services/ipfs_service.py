import httpx
from fastapi import HTTPException
from typing import Dict, Any
from config import settings

class PinataIPFSService:
    def __init__(self):
        self.jwt = settings.PINATA_JWT
        self.headers = {
            "Authorization": f"Bearer {self.jwt}"
        } if self.jwt else {}

    async def upload_file(self, file_bytes: bytes, filename: str, content_type: str = "application/octet-stream") -> Dict[str, str]:
        if not self.jwt:
            raise HTTPException(status_code=502, detail="IPFS upload failed: PINATA_JWT not configured")
            
        async with httpx.AsyncClient() as client:
            files = {"file": (filename, file_bytes, content_type)}
            try:
                response = await client.post(
                    "https://api.pinata.cloud/pinning/pinFileToIPFS",
                    headers=self.headers,
                    files=files,
                    timeout=300.0
                )
                response.raise_for_status()
                data = response.json()
                cid = data.get("IpfsHash")
                return {
                    "cid": cid,
                    "pinata_url": f"https://gateway.pinata.cloud/ipfs/{cid}",
                    "ipfs_url": f"ipfs://{cid}"
                }
            except Exception as e:
                raise HTTPException(status_code=502, detail=f"IPFS upload failed: {str(e)}")

    async def get_file(self, cid: str) -> bytes:
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    f"https://gateway.pinata.cloud/ipfs/{cid}",
                    timeout=120.0
                )
                response.raise_for_status()
                return response.content
            except Exception as e:
                raise HTTPException(status_code=502, detail=f"IPFS retrieve failed: {str(e)}")

    async def pin_cid(self, hash_to_pin: str) -> Dict[str, Any]:
        if not self.jwt:
            raise HTTPException(status_code=502, detail="IPFS upload failed: PINATA_JWT not configured")

        async with httpx.AsyncClient() as client:
            json_payload = {"hashToPin": hash_to_pin}
            try:
                response = await client.post(
                    "https://api.pinata.cloud/pinning/pinByHash",
                    headers=self.headers,
                    json=json_payload,
                    timeout=60.0
                )
                response.raise_for_status()
                return response.json()
            except Exception as e:
                raise HTTPException(status_code=502, detail=f"IPFS upload failed: {str(e)}")

    async def unpin(self, cid: str) -> Dict[str, str]:
        if not self.jwt:
            raise HTTPException(status_code=502, detail="IPFS upload failed: PINATA_JWT not configured")

        async with httpx.AsyncClient() as client:
            try:
                response = await client.delete(
                    f"https://api.pinata.cloud/pinning/unpin/{cid}",
                    headers=self.headers,
                    timeout=60.0
                )
                if response.status_code == 200:
                    return {"status": "success"}
                response.raise_for_status()
                return {}
            except Exception as e:
                raise HTTPException(status_code=502, detail=f"IPFS unpin failed: {str(e)}")

# Legacy wrapper for backwards compatibility with existing working routes
async def upload_to_ipfs(file_path: str) -> str:
    """Upload a local file to Pinata IPFS. Returns CID string or empty string on failure."""
    from config import settings
    import os
    if not settings.PINATA_JWT:
        return ""

    filename = os.path.basename(file_path)
    ext = filename.lower().rsplit('.', 1)[-1] if '.' in filename else ''
    MIME_MAP = {
        "jpg": "image/jpeg", "jpeg": "image/jpeg",
        "png": "image/png", "bmp": "image/bmp",
        "tiff": "image/tiff", "webp": "image/webp",
        "mp4": "video/mp4", "avi": "video/avi",
        "mov": "video/quicktime", "mkv": "video/x-matroska",
        "webm": "video/webm",
        "wav": "audio/wav", "mp3": "audio/mpeg",
        "ogg": "audio/ogg", "m4a": "audio/m4a",
        "pdf": "application/pdf",
        "doc": "application/msword",
        "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "txt": "text/plain",
    }
    content_type = MIME_MAP.get(ext, "application/octet-stream")

    try:
        with open(file_path, "rb") as fh:
            file_bytes = fh.read()
    except OSError as e:
        print(f"[IPFS] Could not read file {file_path}: {e}")
        return ""

    service = PinataIPFSService()
    try:
        result = await service.upload_file(file_bytes, filename, content_type)
        return result.get("cid", "")
    except Exception as e:
        print(f"[IPFS] Pinata upload error: {e}")
        return ""
