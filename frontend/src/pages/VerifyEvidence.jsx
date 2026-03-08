import { useRouter } from "next/router";
import { useState } from "react";
import verificationService from "../services/verificationService";
import { HiOutlineShieldCheck, HiCheckCircle, HiXCircle, HiOutlineArrowLeft } from "react-icons/hi";
import { hashShortener } from "../utils/hashShortener";

const verdictStyles = {
  VERIFIED: { bg: "var(--success-light)", color: "var(--success)", icon: <HiCheckCircle /> },
  PARTIAL: { bg: "var(--warn-light)", color: "var(--warn)", icon: <HiCheckCircle /> },
  COMPROMISED: { bg: "var(--danger-light)", color: "var(--danger)", icon: <HiXCircle /> }
};

function VerifyEvidence() {
  const router = useRouter();
  const { id } = router.query;
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleVerify = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await verificationService.verifyEvidence(id);
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.detail || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const vs = result ? (verdictStyles[result.verdict] || verdictStyles.COMPROMISED) : null;

  return (
    <section>
      <div className="page-header">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.25rem" }}>
            <button className="btn btn-sm btn-secondary" onClick={() => router.back()}>
              <HiOutlineArrowLeft /> Back
            </button>
            <h2 style={{ margin: 0 }}>Verify Evidence #{id}</h2>
          </div>
          <p className="page-subtitle">Perform integrity verification against blockchain and hash records</p>
        </div>
      </div>

      {!result && (
        <div className="section-card">
          <div className="section-card-body" style={{ textAlign: "center", padding: "3rem" }}>
            <HiOutlineShieldCheck style={{ fontSize: "3rem", color: "var(--primary)", marginBottom: "1rem" }} />
            <h3 style={{ marginBottom: "0.5rem" }}>Ready to Verify</h3>
            <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem", maxWidth: 400, margin: "0 auto 1.5rem" }}>
              This will re-compute the SHA-256 hash and cross-reference with the blockchain record to verify evidence integrity.
            </p>
            <button className="btn" disabled={loading || !id} onClick={handleVerify}>
              <HiOutlineShieldCheck />
              {loading ? "Verifying..." : "Run Verification"}
            </button>
          </div>
        </div>
      )}

      {error && <p className="error-text">{error}</p>}

      {result && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* Verdict Banner */}
          <div
            className="card"
            style={{ background: vs.bg, border: "none", display: "flex", alignItems: "center", gap: "1rem", padding: "1.5rem" }}
          >
            <div style={{ fontSize: "2.5rem", color: vs.color }}>{vs.icon}</div>
            <div>
              <div style={{ fontSize: "1.3rem", fontWeight: 800, color: vs.color }}>{result.verdict}</div>
              <div style={{ fontSize: "0.88rem", color: vs.color, opacity: 0.8 }}>
                {result.verdict === "VERIFIED" && "File integrity confirmed — hash and blockchain records match."}
                {result.verdict === "PARTIAL" && "Hash matches but blockchain verification could not be confirmed."}
                {result.verdict === "COMPROMISED" && "File integrity check failed — the file may have been tampered with."}
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="section-card">
            <div className="section-card-header">
              <h3 style={{ margin: 0 }}>Verification Details</h3>
            </div>
            <div className="section-card-body">
              <div className="detail-grid">
                <div className="detail-item">
                  <label>Hash Match</label>
                  <div className="detail-value" style={{ color: result.hash_match ? "var(--success)" : "var(--danger)" }}>
                    {result.hash_match ? "Passed" : "Failed"}
                  </div>
                </div>
                <div className="detail-item">
                  <label>Blockchain Verified</label>
                  <div className="detail-value" style={{ color: result.blockchain_verified ? "var(--success)" : "var(--danger)" }}>
                    {result.blockchain_verified ? "Confirmed" : "Not confirmed"}
                  </div>
                </div>
                {result.blockchain_tx && (
                  <div className="detail-item">
                    <label>Transaction Hash</label>
                    <div className="detail-value" style={{ fontFamily: "'Courier New', monospace", fontSize: "0.82rem" }}>
                      {hashShortener(result.blockchain_tx, 16, 12)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <button className="btn btn-secondary" onClick={() => setResult(null)} style={{ alignSelf: "flex-start" }}>
            Run Again
          </button>
        </div>
      )}
    </section>
  );
}

export default VerifyEvidence;
