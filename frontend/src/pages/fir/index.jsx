import { useState } from "react";
import Link from "next/link";
import Loader from "../../components/Loader";
import { useFetch } from "../../hooks/useFetch";
import { firService } from "../../services/dirsService";
import { HiOutlineDocumentText, HiOutlinePlus } from "react-icons/hi";

function FIRList() {
  const [statusFilter, setStatusFilter] = useState("");
  const { data, loading, error } = useFetch(
    () => firService.list({ limit: 100, status_filter: statusFilter || undefined }),
    [statusFilter]
  );
  const firs = Array.isArray(data) ? data : data?.data || [];

  const statuses = ["", "open", "under_investigation", "chargesheeted", "closed", "cancelled"];

  return (
    <section>
      <div className="page-header">
        <div>
          <h2>FIR Register</h2>
          <p className="page-subtitle">First Information Reports — Section 154 CrPC</p>
        </div>
        <Link href="/fir/new" className="btn"><HiOutlinePlus style={{ marginRight: 6 }} />Register FIR</Link>
      </div>

      <div className="filter-row">
        {statuses.map((s) => (
          <button
            key={s}
            className={statusFilter === s ? "btn" : "btn btn-secondary"}
            onClick={() => setStatusFilter(s)}
          >
            {s ? s.replace("_", " ").toUpperCase() : "All"}
          </button>
        ))}
      </div>

      {loading && <Loader />}
      {error && <p className="error-text">Failed to load FIRs.</p>}

      {!loading && firs.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon"><HiOutlineDocumentText /></div>
          <p style={{ fontWeight: 600 }}>No FIRs found</p>
          <Link href="/fir/new" className="btn" style={{ marginTop: "1rem" }}>Register First FIR</Link>
        </div>
      )}

      {firs.length > 0 && (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>FIR Number</th><th>Police Station</th><th>District</th>
                <th>Offence Sections</th><th>Complainant</th><th>Status</th>
                <th>Registered</th><th></th>
              </tr>
            </thead>
            <tbody>
              {firs.map((f) => (
                <tr key={f.id}>
                  <td><strong>{f.fir_number}</strong></td>
                  <td>{f.police_station}</td>
                  <td>{f.district}</td>
                  <td style={{ maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.offence_sections}</td>
                  <td>{f.complainant_name}</td>
                  <td>
                    <span className={`badge badge-${f.status === "open" ? "blue" : f.status === "chargesheeted" ? "green" : f.status === "cancelled" ? "red" : "yellow"}`}>
                      {f.status?.replace("_", " ").toUpperCase()}
                    </span>
                  </td>
                  <td>{new Date(f.registered_at).toLocaleDateString("en-IN")}</td>
                  <td>
                    <Link href={`/fir/${f.id}`} className="btn btn-secondary" style={{ padding: "4px 12px", fontSize: "0.8rem" }}>View</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default FIRList;
