// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title  EvidenceRegistry
 * @notice Immutable on-chain registry for digital forensic evidence.
 *
 *         Each evidence item is stored by its SHA-256 file hash and includes:
 *           - IPFS CID (off-chain content address)
 *           - AI authenticity score  (0–100, where 100 = fully authentic)
 *           - AI status string       ("AUTHENTIC" | "SUSPICIOUS")
 *           - AI model version
 *           - Block timestamp
 *           - Submitter address
 *
 *         NOTE: This is a placeholder file.
 *               Pass your Solidity implementation here to integrate it with
 *               the backend's blockchain_service.py.
 *
 * @dev    Expected ABI surface consumed by blockchain_service.py:
 *
 *           storeEvidence(fileHash, ipfsCid, aiScore, aiStatus, modelVersion)
 *           getEvidence(fileHash) returns (hash, cid, score, status, model, ts, submitter)
 *           evidenceExists(fileHash) returns (bool)
 *
 *         Event:
 *           EvidenceStored(fileHash, submitter, timestamp)
 */
contract EvidenceRegistry {
    // ------------------------------------------------------------------
    // Storage
    // ------------------------------------------------------------------

    struct EvidenceRecord {
        string  evidenceHash;
        string  ipfsCid;
        uint256 aiScore;          // multiplied by 100 (e.g. 85 => 0.85)
        string  aiStatus;
        string  modelVersion;
        uint256 timestamp;
        address submitter;
        bool    exists;
    }

    mapping(string => EvidenceRecord) private _records;

    // ------------------------------------------------------------------
    // Events
    // ------------------------------------------------------------------

    event EvidenceStored(
        string indexed fileHash,
        address indexed submitter,
        uint256 timestamp
    );

    // ------------------------------------------------------------------
    // Write
    // ------------------------------------------------------------------

    /**
     * @notice Store a new evidence record. Reverts if the hash already exists.
     */
    function storeEvidence(
        string calldata fileHash,
        string calldata ipfsCid,
        uint256         aiScore,
        string calldata aiStatus,
        string calldata modelVersion
    ) external {
        require(!_records[fileHash].exists, "EvidenceRegistry: hash already registered");

        _records[fileHash] = EvidenceRecord({
            evidenceHash: fileHash,
            ipfsCid:      ipfsCid,
            aiScore:      aiScore,
            aiStatus:     aiStatus,
            modelVersion: modelVersion,
            timestamp:    block.timestamp,
            submitter:    msg.sender,
            exists:       true
        });

        emit EvidenceStored(fileHash, msg.sender, block.timestamp);
    }

    // ------------------------------------------------------------------
    // Read
    // ------------------------------------------------------------------

    /** @notice Check whether a hash has already been recorded. */
    function evidenceExists(string calldata fileHash) external view returns (bool) {
        return _records[fileHash].exists;
    }

    /**
     * @notice Retrieve a stored evidence record.
     * @return evidenceHash  Original SHA-256 hex string
     * @return ipfsCid       IPFS content identifier
     * @return aiScore       AI score × 100
     * @return aiStatus      "AUTHENTIC" or "SUSPICIOUS"
     * @return modelVersion  AI model version tag
     * @return timestamp     Unix timestamp of submission
     * @return submitter     Ethereum address of submitter
     */
    function getEvidence(string calldata fileHash)
        external
        view
        returns (
            string  memory evidenceHash,
            string  memory ipfsCid,
            uint256        aiScore,
            string  memory aiStatus,
            string  memory modelVersion,
            uint256        timestamp,
            address        submitter
        )
    {
        EvidenceRecord storage r = _records[fileHash];
        require(r.exists, "EvidenceRegistry: record not found");
        return (r.evidenceHash, r.ipfsCid, r.aiScore, r.aiStatus, r.modelVersion, r.timestamp, r.submitter);
    }
}
