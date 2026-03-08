import Link from "next/link";
import StatusBadge from "./StatusBadge";
import { formatDate } from "../utils/formatDate";
import { HiOutlineDocumentText, HiOutlineEye, HiOutlineShieldCheck } from "react-icons/hi";

function EvidenceCard({ item }) {
  const scorePercent = item.ai_score != null ? Math.round(item.ai_score * 100) : null;

  return (
    <article className="card" style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <div className="stat-icon purple" style={{ width: 38, height: 38, borderRadius: 10, fontSize: "1rem" }}>
            <HiOutlineDocumentText />
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: "0.92rem", color: "var(--text)" }}>{item.original_filename}</div>
            <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>ID: {item.id}</div>
          </div>
        </div>
        <StatusBadge status={item.ai_status} />
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>AI Score</div>
          <div style={{ fontWeight: 700, fontSize: "1.1rem", color: scorePercent != null && scorePercent < 50 ? "var(--danger)" : "var(--success)" }}>
            {scorePercent != null ? `${scorePercent}%` : "-"}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Uploaded</div>
          <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>{formatDate(item.timestamp)}</div>
        </div>
      </div>

      <div className="row-gap" style={{ marginTop: "auto", paddingTop: "0.5rem", borderTop: "1px solid var(--line-light)" }}>
        <Link className="btn btn-sm" href={`/evidence/${item.id}`}>
          <HiOutlineEye /> View
        </Link>
        <Link className="btn btn-sm btn-secondary" href={`/verify/${item.id}`}>
          <HiOutlineShieldCheck /> Verify
        </Link>
      </div>
    </article>
  );
}

export default EvidenceCard;
