import React, { useState, useContext } from "react";
import Link from "next/link";
import { AuthContext } from "../../context/AuthContext";
import { useFetch } from "../../hooks/useFetch";
import { forensicSubmissionService, seizureService } from "../../services/dirsService";
import { toast } from "react-toastify";
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

  const [expandedRow, setExpandedRow] = useState(null);
  const [evidenceDetails, setEvidenceDetails] = useState({});
  const [evidenceLoading, setEvidenceLoading] = useState(false);

  const toggleEvidenceDetails = async (propertyId, submissionId) => {
    if (expandedRow === submissionId) {
      setExpandedRow(null);
      return;
    }
    setExpandedRow(submissionId);
    
    if (!evidenceDetails[propertyId]) {
      setEvidenceLoading(true);
      try {
        const data = await seizureService.getProperty(propertyId);
        setEvidenceDetails(prev => ({ ...prev, [propertyId]: data }));
      } catch (err) {
        toast.error("Failed to load evidence details");
      } finally {
        setEvidenceLoading(false);
      }
    }
  };

  const handleDownloadFile = async (propertyId) => {
    const toastId = toast.loading("Downloading secure file...");
    try {
      await seizureService.downloadPropertyFile(propertyId);
      toast.update(toastId, { render: "Download complete ✓", type: "success", isLoading: false, autoClose: 3000 });
    } catch (err) {
      toast.update(toastId, { render: "Failed to download file.", type: "error", isLoading: false, autoClose: 3000 });
    }
  };

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
                <React.Fragment key={s.id}>
                  <tr>
                    <td><strong>#{s.id}</strong></td>
                    <td>FIR/{s.fir_id}</td>
                    <td>
                      <button 
                        className="btn btn-secondary" 
                        style={{ padding: "2px 8px", fontSize: "0.8rem", background: "none", color: "var(--primary)", border: "1px solid var(--primary)" }}
                        onClick={() => toggleEvidenceDetails(s.property_id, s.id)}
                        title="Click to view evidence details, descriptions, and uploaded records"
                      >
                        PROP-{s.property_id}
                      </button>
                    </td>
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
                  
                  {/* Expanded Evidence Details Row */}
                  {expandedRow === s.id && (
                    <tr style={{ background: "var(--bg-secondary)" }}>
                      <td colSpan="9" style={{ padding: "1rem" }}>
                        {evidenceLoading && !evidenceDetails[s.property_id] ? (
                          <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <div className="spinner" style={{width: 16, height: 16, borderWidth: 2}}></div> Loading evidence data from properties registry...
                          </div>
                        ) : evidenceDetails[s.property_id] ? (
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", fontSize: "0.85rem", background: "var(--bg-color)", padding: "1.25rem", borderRadius: "8px", border: "1px solid var(--border-color)", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>
                            <div>
                              <p style={{marginBottom: "0.5rem"}}><strong style={{color:"var(--text-muted)"}}>Property Number:</strong> {evidenceDetails[s.property_id].property_number}</p>
                              <p style={{marginBottom: "0.5rem"}}><strong style={{color:"var(--text-muted)"}}>Type:</strong> <span style={{textTransform: "capitalize"}}>{evidenceDetails[s.property_id].item_type}</span></p>
                              <p style={{marginBottom: "0.5rem"}}><strong style={{color:"var(--text-muted)"}}>Condition:</strong> <span style={{textTransform: "capitalize"}}>{evidenceDetails[s.property_id].condition}</span></p>
                              {evidenceDetails[s.property_id].ai_status && (
                                <p style={{marginBottom: "0.5rem"}}><strong style={{color:"var(--text-muted)"}}>AI Pre-Check:</strong> <span style={{fontWeight: 600, color: evidenceDetails[s.property_id].ai_status === 'AUTHENTIC' ? '#059669' : '#dc2626'}}>{evidenceDetails[s.property_id].ai_status}</span></p>
                              )}
                            </div>
                            <div>
                              <p style={{marginBottom: "0.5rem"}}><strong style={{color:"var(--text-muted)"}}>Description:</strong> {evidenceDetails[s.property_id].description}</p>
                              {evidenceDetails[s.property_id].original_filename && (
                                <div style={{marginBottom: "0.5rem", background: "#f8fafc", padding: "8px 12px", borderRadius: "4px", border: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center"}}>
                                  <div>
                                    <strong style={{color:"var(--text-muted)"}}>File Uploaded:</strong><br />
                                    <span style={{fontWeight: 600}}>{evidenceDetails[s.property_id].original_filename}</span>
                                    <span style={{color: "var(--text-muted)", marginLeft: "8px", fontSize: "0.8rem"}}>
                                      ({(evidenceDetails[s.property_id].file_size / 1024).toFixed(1)} KB)
                                    </span>
                                  </div>
                                  <button 
                                    className="btn btn-secondary" 
                                    onClick={() => handleDownloadFile(s.property_id)}
                                    style={{padding: "6px 12px", fontSize: "0.8rem"}}
                                  >
                                    View / Download
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div style={{ fontSize: "0.85rem", color: "var(--danger)" }}>Could not load property details. Access denied or record missing.</div>
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
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
