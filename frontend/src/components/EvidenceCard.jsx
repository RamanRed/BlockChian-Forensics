import Link from "next/link";
import StatusBadge from "./StatusBadge";
import { formatDate } from "../utils/formatDate";

function EvidenceCard({ item }) {
  return (
    <article className="card">
      <h3>{item.original_filename}</h3>
      <p>ID: {item.id}</p>
      <p>AI Score: {item.ai_score ?? "-"}</p>
      <p>Uploaded: {formatDate(item.timestamp)}</p>
      <StatusBadge status={item.ai_status} />
      <div className="row-gap">
        <Link className="btn" href={`/evidence/${item.id}`}>View</Link>
        <Link className="btn btn-secondary" href={`/verify/${item.id}`}>Verify</Link>
      </div>
    </article>
  );
}

export default EvidenceCard;
