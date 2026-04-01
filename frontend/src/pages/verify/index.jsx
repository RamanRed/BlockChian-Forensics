import { useState } from "react";
import { courtService } from "../../services/dirsService";
import { HiOutlineShieldCheck, HiOutlineSearch } from "react-icons/hi";

function VerifyPage() {
  const [hash, setHash] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!hash.trim()) return;
    setLoading(true); setResult(null); setError("");
    try {
      const res = await courtService.publicVerify(hash.trim());
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Verification failed. Check the hash and try again.");
    } finally { setLoading(false); }
  };

  const verified = result?.blockchain_found === true;

  return (
    <section>
      <div className="page-header">
        <div>
          <h2>Public Hash Verification</h2>
          <p className="page-subtitle">Verify any DIRS record against the blockchain — No login required for court/defence use</p>
        </div>
      </div>

      <div className="form-card" style={{ maxWidth: 680 }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>
            <HiOutlineShieldCheck style={{ color: "var(--primary)" }} />
          </div>
          <h3 style={{ margin: 0 }}>Blockchain Integrity Check</h3>
          <p className="text-muted" style={{ marginTop: 8 }}>
            Paste the SHA-256 hash of any FIR, Case Diary entry, Property, or Charge Sheet to verify it was registered on-chain.
          </p>
        </div>

        <form onSubmit={handleVerify}>
          <div className="form-group">
            <label>Record Hash (SHA-256)</label>
            <input
              className="input"
              value={hash}
              onChange={(e) => setHash(e.target.value)}
              placeholder="e.g. a3b4c5d6e7f8...64 hex chars"
              style={{ fontFamily: "monospace", fontSize: "0.9rem" }}
              required
            />
          </div>
          <button className="btn" type="submit" disabled={loading} style={{ width: "100%" }}>
            {loading ? "Querying blockchain…" : <><HiOutlineSearch style={{ verticalAlign: "middle", marginRight: 8 }} />Verify Hash</>}
          </button>
        </form>

        {error && (
          <div style={{ marginTop: "1.5rem", padding: "1rem", background: "var(--error-bg, #fee)", borderRadius: 8, border: "1px solid var(--error, #d00)" }}>
            <strong>Error:</strong> {error}
          </div>
        )}

        {result && (
          <div style={{
            marginTop: "1.5rem",
            padding: "1.5rem",
            background: verified ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)",
            borderRadius: 10,
            border: `1.5px solid ${verified ? "var(--success, #22c55e)" : "var(--error, #ef4444)"}`,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <span style={{ fontSize: "2rem" }}>{verified ? "✅" : "❌"}</span>
              <div>
                <strong style={{ fontSize: "1.1rem", color: verified ? "#22c55e" : "#ef4444" }}>
                  {verified ? "VERIFIED" : "NOT FOUND"}
                </strong>
                <p className="text-muted" style={{ margin: 0, fontSize: "0.85rem" }}>{result.verdict}</p>
              </div>
            </div>
            {result.blockchain_tx && (
              <div style={{ fontSize: "0.82rem", fontFamily: "monospace" }}>
                <strong>TX Hash:</strong> {result.blockchain_tx}
              </div>
            )}
            {result.timestamp_on_chain && (
              <div style={{ fontSize: "0.82rem", marginTop: 4 }}>
                <strong>Block Timestamp:</strong> {new Date(result.timestamp_on_chain * 1000).toLocaleString("en-IN")}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

export default VerifyPage;
