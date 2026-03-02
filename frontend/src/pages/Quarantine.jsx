import EvidenceCard from "../components/EvidenceCard";
import Loader from "../components/Loader";
import evidenceService from "../services/evidenceService";
import { useFetch } from "../hooks/useFetch";

function Quarantine() {
  const { data, loading, error } = useFetch(() => evidenceService.getQuarantineList(), []);

  return (
    <section>
      <h2>Quarantine</h2>
      {loading ? <Loader /> : null}
      {error ? <p className="error-text">Unable to load quarantined records.</p> : null}
      <div className="grid">
        {(data || []).map((item) => <EvidenceCard key={item.id} item={item} />)}
      </div>
    </section>
  );
}

export default Quarantine;
