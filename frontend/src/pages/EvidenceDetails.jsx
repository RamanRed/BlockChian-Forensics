import { useRouter } from "next/router";
import AIResultCard from "../components/AIResultCard";
import BlockchainInfo from "../components/BlockchainInfo";
import Loader from "../components/Loader";
import StatusBadge from "../components/StatusBadge";
import evidenceService from "../services/evidenceService";
import { useFetch } from "../hooks/useFetch";
import { formatDate } from "../utils/formatDate";
import Link from "next/link";
import { HiOutlineArrowLeft, HiOutlineShieldCheck } from "react-icons/hi";

function EvidenceDetails() {
  const router = useRouter();
  const { id } = router.query;
  const { data, loading, error } = useFetch(
    () => evidenceService.getEvidenceById(id),
    [id],
    Boolean(id)
  );

  if (!id || loading) return <Loader />;
  if (error) return <p className="error-text">Evidence not found.</p>;

  return (
    <section>
      <div className="page-header">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.25rem" }}>
            <button className="btn btn-sm btn-secondary" onClick={() => router.back()}>
              <HiOutlineArrowLeft /> Back
            </button>
            <h2 style={{ margin: 0 }}>Evidence #{data.id}</h2>
            <StatusBadge status={data.ai_status} />
          </div>
          <p className="page-subtitle">{data.original_filename}</p>
        </div>
        <Link href={`/verify/${data.id}`} className="btn">
          <HiOutlineShieldCheck /> Verify Integrity
        </Link>
      </div>

      <div className="section-card mb-2">
        <div className="section-card-header">
          <h3 style={{ margin: 0 }}>Evidence Information</h3>
        </div>
        <div className="section-card-body">
          <div className="detail-grid">
            <div className="detail-item">
              <label>Filename</label>
              <div className="detail-value">{data.original_filename}</div>
            </div>
            <div className="detail-item">
              <label>File Hash</label>
              <div className="detail-value" style={{ fontFamily: "'Courier New', monospace", fontSize: "0.82rem" }}>{data.file_hash}</div>
            </div>
            <div className="detail-item">
              <label>Case Number</label>
              <div className="detail-value">{data.case_number || "-"}</div>
            </div>
            <div className="detail-item">
              <label>Upload Date</label>
              <div className="detail-value">{formatDate(data.timestamp)}</div>
            </div>
            {data.description && (
              <div className="detail-item" style={{ gridColumn: "1 / -1" }}>
                <label>Description</label>
                <div className="detail-value" style={{ fontWeight: 400 }}>{data.description}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-two">
        <AIResultCard evidence={data} />
        <BlockchainInfo evidence={data} />
      </div>
    </section>
  );
}

export default EvidenceDetails;
