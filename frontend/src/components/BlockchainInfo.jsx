import { hashShortener } from "../utils/hashShortener";

function BlockchainInfo({ evidence }) {
  if (!evidence) return null;

  return (
    <section className="card">
      <h3>Blockchain</h3>
      <p>TX Hash: {evidence.blockchain_tx ? hashShortener(evidence.blockchain_tx) : "Not stored"}</p>
      <p>CID: {evidence.ipfs_cid || "Not available"}</p>
      <p>File Hash: {hashShortener(evidence.file_hash, 12, 10)}</p>
    </section>
  );
}

export default BlockchainInfo;
