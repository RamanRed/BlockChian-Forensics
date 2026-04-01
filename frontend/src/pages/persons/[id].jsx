import { useRouter } from "next/router";
import Link from "next/link";
import Loader from "../../components/Loader";
import { useFetch } from "../../hooks/useFetch";
import { personService } from "../../services/dirsService";

function PersonDetail() {
  const router = useRouter();
  const { id } = router.query;

  const { data: person, loading: pLoading } = useFetch(
    () => (id ? personService.getById(id) : Promise.resolve(null)),
    [id]
  );
  const { data: cases, loading: cLoading } = useFetch(
    () => (id ? personService.getCases(id) : Promise.resolve(null)),
    [id]
  );

  if (pLoading || cLoading) return <Loader />;
  if (!person) return (
    <section>
      <div className="page-header"><Link href="/persons" className="btn btn-secondary">← Back</Link></div>
      <p className="error-text">Person not found.</p>
    </section>
  );

  return (
    <section>
      <div className="page-header">
        <div>
          <h2>Person: {person.name}</h2>
          <p className="page-subtitle">Cross-Case Intelligence View</p>
        </div>
        <Link href="/persons" className="btn btn-secondary">← Back to Directory</Link>
      </div>

      <div className="form-card" style={{ marginBottom: "2rem" }}>
        <h3 style={{ marginTop: 0 }}>Personal Details</h3>
        <div className="detail-grid">
          <div className="detail-item"><label>Alias</label><div className="detail-value">{person.alias || "—"}</div></div>
          <div className="detail-item"><label>Gender</label><div className="detail-value">{person.gender || "—"}</div></div>
          <div className="detail-item"><label>Contact</label><div className="detail-value">{person.contact || "—"}</div></div>
          <div className="detail-item"><label>Occupation</label><div className="detail-value">{person.occupation || "—"}</div></div>
          <div className="detail-item"><label>Address</label><div className="detail-value">{person.address || "—"}</div></div>
          <div className="detail-item"><label>Registered At</label><div className="detail-value">{new Date(person.created_at).toLocaleString("en-IN")}</div></div>
        </div>
      </div>

      <div className="form-card">
        <h3 style={{ marginTop: 0 }}>Linked Cases</h3>
        {!cases || cases.length === 0 ? (
          <p className="text-muted">Not linked to any cases.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>FIR ID</th><th>Role</th><th>Remarks</th><th>Added At</th></tr></thead>
              <tbody>
                {cases.map(c => (
                  <tr key={c.id}>
                    <td><Link href={`/fir/${c.fir_id}`} style={{ color: "var(--primary)" }}>FIR #{c.fir_id}</Link></td>
                    <td>{c.role.toUpperCase()}</td>
                    <td>{c.remarks || "—"}</td>
                    <td>{new Date(c.added_at).toLocaleString("en-IN")}</td>
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
export default PersonDetail;
