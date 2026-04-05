import { useState, useContext } from "react";
import Link from "next/link";
import { AuthContext } from "../../context/AuthContext";
import { useFetch } from "../../hooks/useFetch";
import { forensicSubmissionService } from "../../services/dirsService";
import Loader from "../../components/Loader";
import {
  HiOutlineArchive,
  HiOutlineSearch,
  HiOutlineBeaker,
  HiOutlineCheckCircle,
} from "react-icons/hi";

function ForensicEvidencePage() {
  const { user } = useContext(AuthContext);
  const [filter, setFilter] = useState("all"); // all, pending, in_progress, completed

  const { data: incoming, loading } = useFetch(() => forensicSubmissionService.getIncoming(), []);
  const submissions = Array.isArray(incoming) ? incoming : [];

  const filtered = submissions.filter(s => {
    if (filter === "all") return true;
    return s.status === filter;
  });

  const statusCounts = {
    all: submissions.length,
    pending: submissions.filter(s => s.status === "pending").length,
    in_progress: submissions.filter(s => s.status === "in_progress").length,
    completed: submissions.filter(s => s.status === "completed").length,
  };

  return (
    <section>
      <div className="page-header">
        <div>
          <h2>Incoming Evidence</h2>
          <p className="page-subtitle">Evidence submitted by Investigation Officers for forensic analysis</p>
        </div>
        <Link href="/forensic/submit-report" className="btn">
          <HiOutlineBeaker style={{ verticalAlign: "middle", marginRight: 4 }} /> Submit Report
        </Link>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
        {[
          { key: "all", label: "All" },
          { key: "pending", label: "Pending" },
          { key: "in_progress", label: "In Progress" },
          { key: "completed", label: "Completed" },
        ].map(f => (
          <button
            key={f.key}
            className={filter === f.key ? "btn" : "btn btn-secondary"}
            onClick={() => setFilter(f.key)}
            style={{ fontSize: "0.85rem", padding: "6px 16px" }}
          >
            {f.label} ({statusCounts[f.key]})
          </button>
        ))}
      </div>

      {loading && <Loader />}

      {!loading && filtered.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon"><HiOutlineArchive /></div>
          <p>{filter === "all" ? "No evidence submitted yet." : `No ${filter.replace("_", " ")} submissions.`}</p>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Submission ID</th>
                <th>FIR ID</th>
                <th>Property ID</th>
                <th>Submitted By (User ID)</th>
                <th>Notes</th>
                <th>Status</th>
                <th>Submitted On</th>
                <th>Completed</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.id}>
                  <td><strong>#{s.id}</strong></td>
                  <td>FIR/{s.fir_id}</td>
                  <td>PROP-{s.property_id}</td>
                  <td>User #{s.submitted_by}</td>
                  <td style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {s.notes || "—"}
                  </td>
                  <td>
                    <span className={`badge badge-${s.status === "completed" ? "green" : s.status === "in_progress" ? "blue" : "yellow"}`}>
                      {s.status?.replace("_", " ").toUpperCase()}
                    </span>
                  </td>
                  <td>{s.submitted_at ? new Date(s.submitted_at).toLocaleDateString("en-IN") : "—"}</td>
                  <td>{s.completed_at ? new Date(s.completed_at).toLocaleDateString("en-IN") : "—"}</td>
                  <td>
                    {s.status !== "completed" ? (
                      <Link
                        href={`/forensic/submit-report?submission=${s.id}`}
                        className="btn btn-secondary"
                        style={{ padding: "4px 12px", fontSize: "0.8rem" }}
                      >
                        <HiOutlineBeaker style={{ verticalAlign: "middle" }} /> Submit Report
                      </Link>
                    ) : (
                      <span style={{ color: "#059669", fontSize: "0.85rem", fontWeight: 600 }}>
                        <HiOutlineCheckCircle style={{ verticalAlign: "middle" }} /> Report Filed
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Lab Observations for completed items */}
      {filter === "completed" && filtered.filter(s => s.lab_conclusion).length > 0 && (
        <>
          <div className="page-header" style={{ marginTop: "2rem" }}>
            <h3 style={{ margin: 0 }}>Lab Conclusions</h3>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {filtered.filter(s => s.lab_conclusion).map(s => (
              <div key={s.id} className="form-card" style={{ borderLeft: "4px solid #059669" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                  <strong>Submission #{s.id} — Property #{s.property_id}</strong>
                  <span className="text-muted" style={{ fontSize: "0.8rem" }}>
                    {s.completed_at ? new Date(s.completed_at).toLocaleDateString("en-IN") : ""}
                  </span>
                </div>
                <p style={{ margin: "0.5rem 0", fontSize: "0.9rem" }}><strong>Observations:</strong> {s.lab_observations}</p>
                <p style={{ margin: "0.5rem 0", fontSize: "0.9rem" }}><strong>Conclusion:</strong> {s.lab_conclusion}</p>
                {s.blockchain_tx && (
                  <div style={{ fontSize: "0.75rem", color: "#059669", fontFamily: "monospace", marginTop: "0.5rem" }}>
                    <HiOutlineCheckCircle style={{ verticalAlign: "middle" }} /> Blockchain: {s.blockchain_tx.slice(0, 24)}…
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

export default ForensicEvidencePage;
