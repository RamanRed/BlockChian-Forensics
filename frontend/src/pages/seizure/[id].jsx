import { useRouter } from "next/router";
import Link from "next/link";
import Loader from "../../components/Loader";
import { useFetch } from "../../hooks/useFetch";
import { seizureService } from "../../services/dirsService";
import { HiOutlineDocumentText } from "react-icons/hi";

function SeizureDetail() {
  const router = useRouter();
  const { id } = router.query;

  const { data: memoData, loading: memoLoading } = useFetch(
    () => (id ? seizureService.getMemo(id) : Promise.resolve(null)),
    [id]
  );
  
  const { data: propertiesData, loading: propsLoading } = useFetch(
    () => (id ? seizureService.listProperties({ seizure_memo_id: id }) : Promise.resolve(null)),
    [id]
  );

  if (memoLoading || propsLoading) return <Loader />;
  if (!memoData) return (
    <section>
      <div className="page-header"><Link href="/seizure" className="btn btn-secondary">← Back</Link></div>
      <p className="error-text">Seizure Memo not found.</p>
    </section>
  );

  return (
    <section>
      <div className="page-header">
        <div>
          <h2>Seizure Memo {memoData.memo_number}</h2>
          <p className="page-subtitle">Evidence Collection Record</p>
        </div>
        <Link href="/seizure" className="btn btn-secondary">← Back to List</Link>
      </div>

      <div className="form-card" style={{ marginBottom: "2rem" }}>
        <h3 style={{ marginTop: 0 }}>Memo Details</h3>
        <div className="detail-grid">
          <div className="detail-item"><label>FIR ID</label><div className="detail-value">{memoData.fir_id}</div></div>
          <div className="detail-item"><label>Date & Time</label><div className="detail-value">{new Date(memoData.date_time).toLocaleString("en-IN")}</div></div>
          <div className="detail-item"><label>Place of Seizure</label><div className="detail-value">{memoData.place_of_seizure}</div></div>
          <div className="detail-item"><label>Witness 1</label><div className="detail-value">{memoData.witness_1_name}</div></div>
          {memoData.witness_2_name && <div className="detail-item"><label>Witness 2</label><div className="detail-value">{memoData.witness_2_name}</div></div>}
          <div className="detail-item"><label>Hash</label><div className="detail-value hash-mono" style={{fontSize: "0.8rem"}}>{memoData.seizure_hash}</div></div>
        </div>
        <div style={{ marginTop: "1rem" }}>
          <div className="info-label">Items Description</div>
          <p style={{ marginTop: "0.4rem" }}>{memoData.items_description}</p>
        </div>
      </div>

      <div className="form-card">
        <h3 style={{ marginTop: 0 }}>Associated Properties (Malkhana Register)</h3>
        {!propertiesData || propertiesData.length === 0 ? (
          <p className="text-muted">No properties registered for this memo yet.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Property #</th><th>Type</th><th>Condition</th><th>AI Status</th><th>Storage</th></tr></thead>
              <tbody>
                {propertiesData.map(p => (
                  <tr key={p.id}>
                    <td>{p.property_number}</td>
                    <td>{p.item_type}</td>
                    <td>{p.condition}</td>
                    <td><span className={`badge badge-${p.ai_status === 'AUTHENTIC' ? 'green' : p.ai_status === 'SUSPICIOUS' ? 'red' : 'yellow'}`}>{p.ai_status}</span></td>
                    <td>{p.storage_location || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

export default SeizureDetail;
