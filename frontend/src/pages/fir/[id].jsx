import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Loader from "../../components/Loader";
import { useFetch } from "../../hooks/useFetch";
import { firService, findingsService } from "../../services/dirsService";
import { toast } from "react-toastify";
import {
  HiOutlineDocumentText,
  HiOutlineLockClosed,
  HiOutlinePencil,
  HiOutlineRefresh,
  HiOutlineClipboardList
} from "react-icons/hi";

function FIRDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [correctionNote, setCorrectionNote] = useState("");
  const [correcting, setCorrecting] = useState(false);
  const [showCorrect, setShowCorrect] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const { data: fir, loading, error, refetch } = useFetch(
    () => (id ? firService.getById(id) : Promise.resolve(null)),
    [id]
  );
  const firData = fir?.data || fir;

  const { data: labReportsData, loading: labLoading } = useFetch(
    () => (id ? findingsService.getLabReports(id) : Promise.resolve([])),
    [id]
  );
  const labReports = Array.isArray(labReportsData) ? labReportsData : [];

  const handleCorrection = async (e) => {
    e.preventDefault();
    if (!correctionNote.trim()) return;
    setCorrecting(true);
    try {
      await firService.correct(id, correctionNote);
      toast.success("Correction note appended ✓");
      setCorrectionNote("");
      setShowCorrect(false);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Correction failed");
    } finally {
      setCorrecting(false);
    }
  };

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    if (!newStatus) return;
    setUpdatingStatus(true);
    try {
      await firService.updateStatus(id, { status: newStatus });
      toast.success("FIR status updated ✓");
      setNewStatus("");
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Status update failed");
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading) return <Loader />;
  if (error || !firData) return (
    <section>
      <div className="page-header">
        <Link href="/fir" className="btn btn-secondary">← Back to FIR Register</Link>
      </div>
      <p className="error-text">FIR not found or access denied.</p>
    </section>
  );

  const statusColors = {
    open: "blue",
    under_investigation: "yellow",
    chargesheeted: "green",
    closed: "gray",
    cancelled: "red",
  };

  return (
    <section>
      <div className="page-header">
        <div>
          <h2>FIR {firData.fir_number}</h2>
          <p className="page-subtitle">
            <HiOutlineLockClosed style={{ verticalAlign: "middle", marginRight: 4 }} />
            Immutable Record — Section 154 CrPC
          </p>
        </div>
        <div className="row-gap">
          <span className={`badge badge-${statusColors[firData.status] || "gray"}`}>
            {firData.status?.replace("_", " ").toUpperCase()}
          </span>
          <Link href="/fir" className="btn btn-secondary">← Back</Link>
        </div>
      </div>

      {/* Core Details */}
      <div className="form-card">
        <h3 style={{ marginTop: 0 }}>FIR Details</h3>
        <div className="detail-grid">
          <div className="detail-item">
            <label>FIR Number</label>
            <div className="detail-value">{firData.fir_number}</div>
          </div>
          <div className="detail-item">
            <label>Police Station</label>
            <div className="detail-value">{firData.police_station}</div>
          </div>
          <div className="detail-item">
            <label>District</label>
            <div className="detail-value">{firData.district}</div>
          </div>
          <div className="detail-item">
            <label>State</label>
            <div className="detail-value">{firData.state || "—"}</div>
          </div>
          <div className="detail-item">
            <label>Offence Sections</label>
            <div className="detail-value">{firData.offence_sections}</div>
          </div>
          <div className="detail-item">
            <label>Complainant</label>
            <div className="detail-value">{firData.complainant_name}</div>
          </div>
          <div className="detail-item">
            <label>Contact</label>
            <div className="detail-value">{firData.complainant_contact || "—"}</div>
          </div>
          <div className="detail-item">
            <label>Date of Offence</label>
            <div className="detail-value">
              {firData.date_of_offence ? new Date(firData.date_of_offence).toLocaleString("en-IN") : "—"}
            </div>
          </div>
          <div className="detail-item">
            <label>Place of Offence</label>
            <div className="detail-value">{firData.place_of_offence}</div>
          </div>
          <div className="detail-item">
            <label>Registered At</label>
            <div className="detail-value">
              {firData.registered_at ? new Date(firData.registered_at).toLocaleString("en-IN") : "—"}
            </div>
          </div>
        </div>

        {firData.offence_description && (
          <div style={{ marginTop: "1rem" }}>
            <div className="info-label">Offence Description</div>
            <p style={{ fontSize: "0.92rem", lineHeight: 1.7, marginTop: "0.4rem" }}>{firData.offence_description}</p>
          </div>
        )}
        {firData.accused_description && (
          <div style={{ marginTop: "0.75rem" }}>
            <div className="info-label">Accused Description</div>
            <p style={{ fontSize: "0.92rem", lineHeight: 1.7, marginTop: "0.4rem" }}>{firData.accused_description}</p>
          </div>
        )}

        {firData.data_hash && (
          <div style={{ marginTop: "1rem" }}>
            <div className="info-label">Blockchain Hash</div>
            <div className="hash-mono">{firData.data_hash}</div>
          </div>
        )}
      </div>

      {/* Forensic Lab Reports */}
      {labReports?.length > 0 && (
        <div className="form-card">
          <h3 style={{ marginTop: 0 }}>
            <HiOutlineClipboardList style={{ verticalAlign: "middle", marginRight: 6 }} />
            Forensic & Lab Reports
          </h3>
          <p className="page-subtitle" style={{ fontSize: "0.85rem", marginBottom: "1rem" }}>Reports submitted by CFSL against properties seized in this FIR</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {labReports.map((report) => (
              <div key={report.id} className="evidence-card" style={{ padding: "1rem 1.25rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div>
                    <h4 style={{ margin: "0 0 4px", color: "var(--primary)", fontSize: "0.95rem" }}>{report.title}</h4>
                    <span className="text-muted" style={{ fontSize: "0.8rem" }}>
                      Lab: {report.lab_name} {report.lab_reference_number ? `(Ref: ${report.lab_reference_number})` : ""}
                    </span>
                  </div>
                  <span className="text-muted" style={{ fontSize: "0.8rem" }}>
                    {new Date(report.recorded_at).toLocaleString("en-IN")}
                  </span>
                </div>
                {report.description && <p style={{ fontSize: "0.85rem", margin: "8px 0" }}>{report.description}</p>}
                
                {report.ipfs_cid && (
                  <div style={{ marginTop: "10px" }}>
                    <a
                      href={`https://gateway.pinata.cloud/ipfs/${report.ipfs_cid}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-secondary"
                      style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "0.3rem 0.75rem", fontSize: "0.8rem" }}
                    >
                      <HiOutlineDocumentText /> View Full Finding Report
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Correction History */}
      {firData.correction_notes?.length > 0 && (
        <div className="form-card">
          <h3 style={{ marginTop: 0 }}>Correction History</h3>
          <div className="timeline">
            {firData.correction_notes.map((note, i) => (
              <div key={i} className="timeline-item">
                <div className="evidence-card" style={{ padding: "0.75rem 1rem" }}>
                  <p style={{ fontSize: "0.88rem" }}>{note}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="form-row" style={{ alignItems: "flex-start" }}>
        {/* Correction */}
        <div className="form-card" style={{ flex: 1 }}>
          <h3 style={{ marginTop: 0 }}>
            <HiOutlinePencil style={{ verticalAlign: "middle", marginRight: 6 }} />
            Append Correction
          </h3>
          <p className="text-muted" style={{ fontSize: "0.82rem", marginBottom: "1rem" }}>
            FIR content cannot be edited. Corrections are appended immutably.
          </p>
          <form onSubmit={handleCorrection}>
            <div className="form-group">
              <label>Correction Note *</label>
              <textarea
                className="input"
                rows={3}
                value={correctionNote}
                onChange={(e) => setCorrectionNote(e.target.value)}
                placeholder="Describe the correction…"
                required
              />
            </div>
            <button className="btn" type="submit" disabled={correcting}>
              {correcting ? "Appending…" : "+ Append Correction"}
            </button>
          </form>
        </div>

        {/* Status Update */}
        <div className="form-card" style={{ flex: 1 }}>
          <h3 style={{ marginTop: 0 }}>
            <HiOutlineRefresh style={{ verticalAlign: "middle", marginRight: 6 }} />
            Update Status
          </h3>
          <form onSubmit={handleStatusUpdate}>
            <div className="form-group">
              <label>New Status *</label>
              <select
                className="input"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                required
              >
                <option value="">— Select Status —</option>
                <option value="open">Open</option>
                <option value="under_investigation">Under Investigation</option>
                <option value="chargesheeted">Chargesheeted</option>
                <option value="closed">Closed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <button className="btn btn-secondary" type="submit" disabled={updatingStatus || !newStatus}>
              {updatingStatus ? "Updating…" : "Update Status"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

export default FIRDetail;
