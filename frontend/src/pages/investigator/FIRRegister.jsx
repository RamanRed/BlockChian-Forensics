import { useState, useContext } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { toast } from "react-toastify";
import { AuthContext } from "../../context/AuthContext";
import { firService } from "../../services/dirsService";
import { useFetch } from "../../hooks/useFetch";
import Loader from "../../components/Loader";
import {
  HiOutlineDocumentText,
  HiOutlinePlus,
  HiOutlineEye,
  HiOutlineLockClosed,
} from "react-icons/hi";

/* ─── FIR Registration Form (IO + SP only) ─────────────────── */
function RegisterForm({ onSuccess }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    fir_number: "",
    police_station: "",
    district: "",
    state: "India",
    date_of_offence: "",
    place_of_offence: "",
    offence_sections: "",
    offence_description: "",
    accused_description: "",
    complainant_name: "",
    complainant_contact: "",
  });

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await firService.register({
        ...form,
        date_of_offence: new Date(form.date_of_offence).toISOString(),
      });
      toast.success("FIR registered and hashed successfully ✓");
      if (onSuccess) onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to register FIR");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-card">
      <form onSubmit={handleSubmit}>
        <div className="form-section-label">FIR Identity</div>
        <div className="form-row">
          <div className="form-group">
            <label>FIR Number *</label>
            <input
              className="input"
              value={form.fir_number}
              onChange={set("fir_number")}
              placeholder="e.g. FIR/2026/DELHI/001"
              required
            />
          </div>
          <div className="form-group">
            <label>Police Station *</label>
            <input className="input" value={form.police_station} onChange={set("police_station")} required />
          </div>
          <div className="form-group">
            <label>District *</label>
            <input className="input" value={form.district} onChange={set("district")} required />
          </div>
          <div className="form-group">
            <label>State</label>
            <input className="input" value={form.state} onChange={set("state")} />
          </div>
        </div>

        <div className="form-section-label">Offence Details</div>
        <div className="form-row">
          <div className="form-group">
            <label>Date &amp; Time of Offence *</label>
            <input
              className="input"
              type="datetime-local"
              value={form.date_of_offence}
              onChange={set("date_of_offence")}
              required
            />
          </div>
          <div className="form-group" style={{ flex: 2 }}>
            <label>Place of Offence *</label>
            <input className="input" value={form.place_of_offence} onChange={set("place_of_offence")} required />
          </div>
        </div>
        <div className="form-group">
          <label>
            Offence Sections *{" "}
            <span className="text-muted">(e.g. IPC 302, IPC 120B)</span>
          </label>
          <input className="input" value={form.offence_sections} onChange={set("offence_sections")} required />
        </div>
        <div className="form-group">
          <label>Offence Description *</label>
          <textarea className="input" rows={3} value={form.offence_description} onChange={set("offence_description")} required />
        </div>
        <div className="form-group">
          <label>Accused Description</label>
          <textarea className="input" rows={2} value={form.accused_description} onChange={set("accused_description")} />
        </div>

        <div className="form-section-label">Complainant</div>
        <div className="form-row">
          <div className="form-group">
            <label>Complainant Name *</label>
            <input className="input" value={form.complainant_name} onChange={set("complainant_name")} required />
          </div>
          <div className="form-group">
            <label>Contact</label>
            <input className="input" value={form.complainant_contact} onChange={set("complainant_contact")} />
          </div>
        </div>

        <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem", alignItems: "center" }}>
          <button className="btn" type="submit" disabled={loading}>
            {loading ? "Registering…" : "⚖ Register FIR"}
          </button>
          <Link href="/investigator" className="btn btn-secondary">
            Cancel
          </Link>
          <span
            style={{
              marginLeft: "auto",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "0.8rem",
              color: "var(--text-muted)",
            }}
          >
            <HiOutlineLockClosed />
            Immutable after registration
          </span>
        </div>
      </form>
    </div>
  );
}

/* ─── FIR List (all roles) ──────────────────────────────────── */
function FIRListSection({ canRegister }) {
  const [statusFilter, setStatusFilter] = useState("");
  const { data, loading, error } = useFetch(
    () => firService.list({ limit: 100, status_filter: statusFilter || undefined }),
    [statusFilter]
  );
  const firs = Array.isArray(data) ? data : data?.data || [];
  const statuses = ["", "open", "under_investigation", "chargesheeted", "closed", "cancelled"];

  return (
    <div>
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
          <div className="empty-state-icon">
            <HiOutlineDocumentText />
          </div>
          <p style={{ fontWeight: 600 }}>No FIRs found</p>
          {canRegister && (
            <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
              Switch to the "Register New FIR" tab above
            </span>
          )}
        </div>
      )}

      {firs.length > 0 && (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>FIR Number</th>
                <th>Police Station</th>
                <th>District</th>
                <th>Offence Sections</th>
                <th>Complainant</th>
                <th>Status</th>
                <th>Registered</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {firs.map((f) => (
                <tr key={f.id}>
                  <td>
                    <strong>{f.fir_number}</strong>
                  </td>
                  <td>{f.police_station}</td>
                  <td>{f.district}</td>
                  <td
                    style={{ maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                  >
                    {f.offence_sections}
                  </td>
                  <td>{f.complainant_name}</td>
                  <td>
                    <span
                      className={`badge badge-${
                        f.status === "open"
                          ? "blue"
                          : f.status === "chargesheeted"
                          ? "green"
                          : f.status === "cancelled"
                          ? "red"
                          : "yellow"
                      }`}
                    >
                      {f.status?.replace("_", " ").toUpperCase()}
                    </span>
                  </td>
                  <td>{new Date(f.registered_at).toLocaleDateString("en-IN")}</td>
                  <td>
                    <Link
                      href={`/fir/${f.id}`}
                      className="btn btn-secondary"
                      style={{ padding: "4px 12px", fontSize: "0.8rem", display: "inline-flex", alignItems: "center", gap: 4 }}
                    >
                      <HiOutlineEye /> View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ─── Main Page ─────────────────────────────────────────────── */
function FIRRegister() {
  const { role } = useContext(AuthContext);
  const canRegister = ["io", "sp"].includes(role);
  const [tab, setTab] = useState("list");

  return (
    <section>
      <div className="page-header">
        <div>
          <h2>FIR Register</h2>
          <p className="page-subtitle">
            First Information Reports — Section 154 CrPC
            {!canRegister && (
              <span
                style={{
                  marginLeft: "0.75rem",
                  background: "#7c3aed20",
                  color: "#7c3aed",
                  borderRadius: "6px",
                  padding: "2px 8px",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                }}
              >
                View Only (DSP)
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: "1.5rem" }}>
        <button
          className={`tab-btn ${tab === "list" ? "active" : ""}`}
          onClick={() => setTab("list")}
        >
          <HiOutlineDocumentText style={{ marginRight: 6 }} />
          All FIRs
        </button>
        {canRegister && (
          <button
            className={`tab-btn ${tab === "register" ? "active" : ""}`}
            onClick={() => setTab("register")}
          >
            <HiOutlinePlus style={{ marginRight: 6 }} />
            Register New FIR
          </button>
        )}
      </div>

      {tab === "list" && <FIRListSection canRegister={canRegister} />}
      {tab === "register" && canRegister && (
        <RegisterForm onSuccess={() => setTab("list")} />
      )}
    </section>
  );
}

export default FIRRegister;
