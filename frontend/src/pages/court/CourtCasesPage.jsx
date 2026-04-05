import { useState, useContext } from "react";
import Link from "next/link";
import { AuthContext } from "../../context/AuthContext";
import { useFetch } from "../../hooks/useFetch";
import { courtService } from "../../services/dirsService";
import Loader from "../../components/Loader";
import {
  HiOutlineCollection,
  HiOutlineSearch,
  HiOutlineScale,
} from "react-icons/hi";

function CourtCasesPage() {
  const { user } = useContext(AuthContext);
  const [search, setSearch] = useState("");

  const { data: cases, loading } = useFetch(() => courtService.listCases(), []);
  const caseList = Array.isArray(cases) ? cases : [];

  const filtered = caseList.filter(c => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      c.fir_number?.toLowerCase().includes(s) ||
      c.police_station?.toLowerCase().includes(s) ||
      c.offence_sections?.toLowerCase().includes(s) ||
      c.complainant_name?.toLowerCase().includes(s)
    );
  });

  return (
    <section>
      <div className="page-header">
        <div>
          <h2>Court Cases Registry</h2>
          <p className="page-subtitle">All chargesheeted cases available for court review</p>
        </div>
        <Link href="/court/verdict" className="btn">
          <HiOutlineScale style={{ verticalAlign: "middle", marginRight: 4 }} /> Issue Verdict
        </Link>
      </div>

      {/* Search */}
      <div className="form-card" style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <HiOutlineSearch style={{ fontSize: "1.2rem", color: "var(--text-muted)" }} />
          <input
            className="input"
            type="text"
            placeholder="Search by FIR number, police station, offence, or complainant..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: 1, marginBottom: 0 }}
          />
        </div>
      </div>

      {loading && <Loader />}

      {!loading && filtered.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon"><HiOutlineCollection /></div>
          <p>{search ? "No cases match your search." : "No chargesheeted cases found."}</p>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>FIR Number</th>
                <th>Police Station</th>
                <th>Offence Sections</th>
                <th>Complainant</th>
                <th>State</th>
                <th>Chargesheets</th>
                <th>Verdict</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id}>
                  <td><strong>{c.fir_number}</strong></td>
                  <td>{c.police_station}</td>
                  <td style={{ maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {c.offence_sections}
                  </td>
                  <td>{c.complainant_name}</td>
                  <td>
                    <span className={`badge badge-${c.investigation_state === "active" ? "blue" : c.investigation_state === "closed" ? "green" : "yellow"}`}>
                      {c.investigation_state?.replace("_", " ").toUpperCase()}
                    </span>
                  </td>
                  <td>
                    {c.chargesheets?.map(cs => (
                      <span key={cs.id} className="badge badge-blue" style={{ marginRight: 4, fontSize: "0.7rem" }}>
                        {cs.number}
                      </span>
                    ))}
                  </td>
                  <td>
                    <span className={`badge badge-${c.verdict_count > 0 ? "green" : "yellow"}`}>
                      {c.verdict_count > 0 ? `${c.verdict_count} Issued` : "Pending"}
                    </span>
                  </td>
                  <td>
                    <Link
                      href={`/court/case/${c.id}`}
                      className="btn btn-secondary"
                      style={{ padding: "4px 12px", fontSize: "0.8rem" }}
                    >
                      Open Case
                    </Link>
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

export default CourtCasesPage;
