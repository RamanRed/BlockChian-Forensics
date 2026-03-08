import { hashShortener } from "../utils/hashShortener";
import { HiOutlineCube, HiOutlineExternalLink } from "react-icons/hi";

function BlockchainInfo({ evidence }) {
  if (!evidence) return null;

  return (
    <div className="section-card">
      <div className="section-card-header">
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <HiOutlineCube style={{ color: "var(--primary)", fontSize: "1.1rem" }} />
          <h3 style={{ margin: 0 }}>Blockchain Record</h3>
        </div>
        {evidence.blockchain_tx && (
          <span className="badge badge-verified">
            <HiOutlineCube /> On-Chain
          </span>
        )}
      </div>
      <div className="section-card-body">
        <div className="detail-grid">
          <div className="detail-item">
            <label>Transaction Hash</label>
            <div className="detail-value" style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
              {evidence.blockchain_tx ? hashShortener(evidence.blockchain_tx) : "Not stored"}
              {evidence.blockchain_tx && <HiOutlineExternalLink style={{ color: "var(--text-muted)", fontSize: "0.85rem" }} />}
            </div>
          </div>
          <div className="detail-item">
            <label>IPFS CID</label>
            <div className="detail-value">{evidence.ipfs_cid || "Not available"}</div>
          </div>
          <div className="detail-item">
            <label>File Hash (SHA-256)</label>
            <div className="detail-value" style={{ fontFamily: "'Courier New', monospace", fontSize: "0.82rem" }}>
              {hashShortener(evidence.file_hash, 14, 10)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BlockchainInfo;
