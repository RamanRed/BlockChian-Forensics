import { useRouter } from "next/router";
import { useState } from "react";
import verificationService from "../services/verificationService";

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

  return (
    <section>
      <h2>Verify Evidence #{id}</h2>
      <button className="btn" disabled={loading || !id} onClick={handleVerify}>
        {loading ? "Verifying..." : "Verify Integrity"}
      </button>

      {error ? <p className="error-text">{error}</p> : null}
      {result ? (
        <div className="card" style={{ marginTop: "1rem" }}>
          <p>Hash Match: {result.hash_match ? "Yes" : "No"}</p>
          <p>Blockchain Verified: {result.blockchain_verified ? "Yes" : "No"}</p>
          <p>Verdict: {result.verdict}</p>
          <p>TX Hash: {result.blockchain_tx || "-"}</p>
        </div>
      ) : null}
    </section>
  );
}

export default VerifyEvidence;
