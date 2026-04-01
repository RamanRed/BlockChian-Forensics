// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title  DIRSRegistry
 * @notice Immutable on-chain registry for the Digital Investigation Record System (DIRS).
 *         Stores cryptographic hashes of all record types:
 *           FIR, Case Diary entries, Seizure Memos, Property Register items,
 *           Property Movements (Chain of Custody), Charge Sheets, and digital evidence.
 *
 * @dev    This contract is the blockchain integrity layer described in Section 4 of
 *         the DIRS_Developer_README. It stores ONLY hashes — no PII, no full records.
 *
 *         ABI consumed by blockchain_service.py:
 *           storeRecordHash(recordType, recordId, dataHash)
 *           getRecord(dataHash) returns (recordType, recordId, dataHash, timestamp, submitter)
 *           recordExists(dataHash) returns (bool)
 *
 *         Legacy ABI (backward compat with original EvidenceRegistry):
 *           storeEvidence(fileHash, ipfsCid, aiScore, aiStatus, modelVersion)
 *           getEvidence(fileHash)
 *           evidenceExists(fileHash)
 *
 *         Events:
 *           RecordStored(dataHash, recordType, recordId, submitter, timestamp)
 *           EvidenceStored(fileHash, submitter, timestamp)   -- legacy
 */
contract DIRSRegistry {

    // ------------------------------------------------------------------
    // Generic DIRS Record
    // ------------------------------------------------------------------

    struct DIRSRecord {
        string  recordType;   // fir | diary | seizure | property | custody | chargesheet | evidence
        string  recordId;     // Unique identifier (fir_number, property_number, etc.)
        string  dataHash;     // SHA-256 hex of the canonical record content
        uint256 timestamp;    // Block timestamp of submission
        address submitter;    // Submitting wallet address
        bool    exists;
    }

    mapping(string => DIRSRecord) private _records;  // keyed by dataHash

    // ------------------------------------------------------------------
    // Legacy Evidence Record (backward compatibility)
    // ------------------------------------------------------------------

    struct EvidenceRecord {
        string  evidenceHash;
        string  ipfsCid;
        uint256 aiScore;
        string  aiStatus;
        string  modelVersion;
        uint256 timestamp;
        address submitter;
        bool    exists;
    }

    mapping(string => EvidenceRecord) private _evidence;

    // ------------------------------------------------------------------
    // Events
    // ------------------------------------------------------------------

    event RecordStored(
        string indexed dataHash,
        string  recordType,
        string  recordId,
        string  ipfsCid,
        address indexed submitter,
        uint256 timestamp
    );

    event EvidenceStored(
        string indexed fileHash,
        address indexed submitter,
        uint256 timestamp
    );

    mapping(bytes32 => string) public recordCID;

    function getRecordCID(bytes32 key) external view returns (string memory) {
        return recordCID[key];
    }

    // ------------------------------------------------------------------
    // Generic Write (used by all DIRS modules)
    // ------------------------------------------------------------------

    /**
     * @notice Store a DIRS record hash on-chain. Reverts if already registered.
     * @param recordType  fir | diary | seizure | property | custody | chargesheet | evidence
     * @param recordId    Module-specific unique ID string (e.g. FIR number)
     * @param dataHash    SHA-256 hex of canonical record content
     */
    function storeRecordHash(
        string calldata recordType,
        string calldata recordId,
        string calldata dataHash,
        string calldata ipfsCid
    ) external {
        require(!_records[dataHash].exists, "DIRSRegistry: hash already registered");

        _records[dataHash] = DIRSRecord({
            recordType: recordType,
            recordId:   recordId,
            dataHash:   dataHash,
            timestamp:  block.timestamp,
            submitter:  msg.sender,
            exists:     true
        });

        bytes32 key = keccak256(abi.encodePacked(dataHash));
        recordCID[key] = ipfsCid;

        emit RecordStored(dataHash, recordType, recordId, ipfsCid, msg.sender, block.timestamp);
    }

    // ------------------------------------------------------------------
    // Generic Read
    // ------------------------------------------------------------------

    /** @notice Check whether a data hash has been registered. */
    function recordExists(string calldata dataHash) external view returns (bool) {
        return _records[dataHash].exists;
    }

    /**
     * @notice Retrieve a DIRS record by its data hash.
     */
    function getRecord(string calldata dataHash)
        external
        view
        returns (
            string  memory recordType,
            string  memory recordId,
            string  memory storedHash,
            uint256        timestamp,
            address        submitter
        )
    {
        DIRSRecord storage r = _records[dataHash];
        require(r.exists, "DIRSRegistry: record not found");
        return (r.recordType, r.recordId, r.dataHash, r.timestamp, r.submitter);
    }

    // ------------------------------------------------------------------
    // Legacy Evidence API (backward compatibility — Section 4 of README)
    // ------------------------------------------------------------------

    /**
     * @notice Store a digital evidence record (legacy API, retained for compatibility).
     */
    function storeEvidence(
        string calldata fileHash,
        string calldata ipfsCid,
        uint256         aiScore,
        string calldata aiStatus,
        string calldata modelVersion
    ) external {
        require(!_evidence[fileHash].exists, "DIRSRegistry: evidence hash already registered");

        _evidence[fileHash] = EvidenceRecord({
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

    /** @notice Check if an evidence hash exists (legacy). */
    function evidenceExists(string calldata fileHash) external view returns (bool) {
        return _evidence[fileHash].exists;
    }

    /**
     * @notice Retrieve a stored evidence record (legacy).
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
        EvidenceRecord storage r = _evidence[fileHash];
        require(r.exists, "DIRSRegistry: evidence record not found");
        return (r.evidenceHash, r.ipfsCid, r.aiScore, r.aiStatus, r.modelVersion, r.timestamp, r.submitter);
    }
}
