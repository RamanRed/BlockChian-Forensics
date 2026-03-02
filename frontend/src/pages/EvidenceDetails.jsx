import { useRouter } from "next/router";
import AIResultCard from "../components/AIResultCard";
import BlockchainInfo from "../components/BlockchainInfo";
import Loader from "../components/Loader";
import StatusBadge from "../components/StatusBadge";
import evidenceService from "../services/evidenceService";
import { useFetch } from "../hooks/useFetch";
import { formatDate } from "../utils/formatDate";

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
      <h2>Evidence Details #{data.id}</h2>
      <div className="card">
        <p>Filename: {data.original_filename}</p>
        <p>Hash: {data.file_hash}</p>
        <p>Case Number: {data.case_number || "-"}</p>
        <p>Timestamp: {formatDate(data.timestamp)}</p>
        <StatusBadge status={data.ai_status} />
      </div>
      <div className="grid grid-two">
        <AIResultCard evidence={data} />
        <BlockchainInfo evidence={data} />
      </div>
    </section>
  );
}

export default EvidenceDetails;
