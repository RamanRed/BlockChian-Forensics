import { useState } from "react";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import { seizureService } from "../../services/dirsService";
import { firService } from "../../services/dirsService";
import { useFetch } from "../../hooks/useFetch";
import Loader from "../../components/Loader";
import {
  HiOutlineArchive,
  HiOutlinePhotograph,
  HiOutlineClipboardCheck,
  HiOutlineShieldCheck,
} from "react-icons/hi";

/* ─── Seizure Memo Form ─────────────────────────────────────── */
function SeizureMemoForm({ firs, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    fir_id: "",
    seizure_date: new Date().toISOString().slice(0, 16),
    place_of_seizure: "",
    seized_from: "",
    seizure_officer_name: "",
    witness_names: "",
    remarks: "",
  });

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await seizureService.createMemo({
        ...form,
        fir_id: parseInt(form.fir_id),
        seizure_date: new Date(form.seizure_date).toISOString(),
      });
      toast.success("Seizure memo recorded and hashed ✓");
      if (onSuccess) onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to create seizure memo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-card">
      <h3 style={{ margin: "0 0 1.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <HiOutlineClipboardCheck style={{ color: "var(--primary)" }} />
        Seizure Memo
      </h3>
      <form onSubmit={handleSubmit}>
        <div className="form-section-label">Case Reference</div>
        <div className="form-group">
          <label>Select FIR *</label>
          <select className="input" value={form.fir_id} onChange={set("fir_id")} required>
            <option value="">— Choose FIR —</option>
            {firs.map((f) => (
              <option key={f.id} value={f.id}>
                {f.fir_number} — {f.police_station}
              </option>
            ))}
          </select>
        </div>

        <div className="form-section-label">Seizure Details</div>
        <div className="form-row">
          <div className="form-group">
            <label>Date &amp; Time of Seizure *</label>
            <input
              className="input"
              type="datetime-local"
              value={form.seizure_date}
              onChange={set("seizure_date")}
              required
            />
          </div>
          <div className="form-group" style={{ flex: 2 }}>
            <label>Place of Seizure *</label>
            <input className="input" value={form.place_of_seizure} onChange={set("place_of_seizure")} required />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Seized From (Name / Entity)</label>
            <input className="input" value={form.seized_from} onChange={set("seized_from")} />
          </div>
          <div className="form-group">
            <label>Seizing Officer Name *</label>
            <input className="input" value={form.seizure_officer_name} onChange={set("seizure_officer_name")} required />
          </div>
        </div>
        <div className="form-group">
          <label>Witness Names</label>
          <input className="input" value={form.witness_names} onChange={set("witness_names")} placeholder="Comma-separated names" />
        </div>
        <div className="form-group">
          <label>Remarks</label>
          <textarea className="input" rows={2} value={form.remarks} onChange={set("remarks")} />
        </div>

        <button className="btn" type="submit" disabled={loading}>
          {loading ? "Recording…" : "📋 Record Seizure Memo"}
        </button>
      </form>
    </div>
  );
}

/* ─── Evidence Upload Form ──────────────────────────────────── */
function EvidenceUploadForm({ firs, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    fir_id: "",
    item_description: "",
    item_type: "physical",
    quantity: "1",
    condition_at_seizure: "",
  });
  const [file, setFile] = useState(null);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return toast.error("Please select an evidence file");

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("fir_id", form.fir_id);
      fd.append("item_description", form.item_description);
      fd.append("item_type", form.item_type);
      fd.append("quantity", form.quantity);
      fd.append("condition_at_seizure", form.condition_at_seizure);
      fd.append("file", file);

      await seizureService.uploadProperty(fd);
      toast.success("Evidence recorded & blockchain hash generated ✓");
      setForm({ fir_id: "", item_description: "", item_type: "physical", quantity: "1", condition_at_seizure: "" });
      setFile(null);
      if (onSuccess) onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to upload evidence");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-card">
      <h3 style={{ margin: "0 0 1.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <HiOutlinePhotograph style={{ color: "var(--success)" }} />
        Upload Evidence / Property
      </h3>
      <form onSubmit={handleSubmit}>
        <div className="form-section-label">Evidence Reference</div>
        <div className="form-group">
          <label>Select FIR *</label>
          <select className="input" value={form.fir_id} onChange={set("fir_id")} required>
            <option value="">— Choose FIR —</option>
            {firs.map((f) => (
              <option key={f.id} value={f.id}>
                {f.fir_number} — {f.police_station}
              </option>
            ))}
          </select>
        </div>

        <div className="form-section-label">Item Details</div>
        <div className="form-group">
          <label>Item Description *</label>
          <textarea
            className="input"
            rows={2}
            value={form.item_description}
            onChange={set("item_description")}
            placeholder="Describe the evidence item..."
            required
          />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Item Type *</label>
            <select className="input" value={form.item_type} onChange={set("item_type")} required>
              <option value="physical">Physical</option>
              <option value="digital">Digital</option>
              <option value="biological">Biological</option>
              <option value="documentary">Documentary</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="form-group">
            <label>Quantity</label>
            <input className="input" type="number" min="1" value={form.quantity} onChange={set("quantity")} />
          </div>
          <div className="form-group" style={{ flex: 2 }}>
            <label>Condition at Seizure</label>
            <input
              className="input"
              value={form.condition_at_seizure}
              onChange={set("condition_at_seizure")}
              placeholder="e.g. Good, Damaged, Sealed"
            />
          </div>
        </div>

        <div className="form-group">
          <label>Evidence File (Photo / Document) *</label>
          <input
            type="file"
            className="input"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            accept="image/*,.pdf,.doc,.docx"
            required
          />
          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.35rem" }}>
            Accepted: Images, PDF, Word documents. File will be hashed and stored immutably.
          </p>
        </div>

        <button className="btn" type="submit" disabled={loading}>
          {loading ? "Uploading & Hashing…" : "🔒 Record Evidence"}
        </button>
      </form>
    </div>
  );
}

/* ─── Main Page ─────────────────────────────────────────────── */
function EvidenceRecorder() {
  const [tab, setTab] = useState("seizure");
  const [refreshKey, setRefreshKey] = useState(0);

  const { data: firData, loading: firsLoading } = useFetch(() => firService.list({ limit: 200 }), []);
  const firs = Array.isArray(firData) ? firData : firData?.data || [];

  const handleSuccess = () => setRefreshKey((k) => k + 1);

  return (
    <section>
      <div className="page-header">
        <div>
          <h2>Evidence Recorder</h2>
          <p className="page-subtitle">
            Seizure Memos &amp; Property Upload — IO Access Only
          </p>
        </div>
        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            background: "#10b98120",
            color: "#10b981",
            borderRadius: "8px",
            padding: "6px 14px",
            fontSize: "0.85rem",
            fontWeight: 600,
          }}
        >
          <HiOutlineShieldCheck />
          Blockchain Hashed
        </span>
      </div>

      {/* Info Banner */}
      <div
        style={{
          background: "linear-gradient(135deg, #4f46e520, #6366f110)",
          border: "1px solid #4f46e530",
          borderRadius: "10px",
          padding: "0.85rem 1.25rem",
          marginBottom: "1.5rem",
          fontSize: "0.85rem",
          color: "var(--text-muted)",
        }}
      >
        📌 All evidence uploaded here is blockchain-hashed. Any tampering after submission will be detected automatically.
      </div>

      {firsLoading && <Loader />}

      {!firsLoading && (
        <>
          {/* Tabs */}
          <div className="tabs" style={{ marginBottom: "1.5rem" }}>
            <button
              className={`tab-btn ${tab === "seizure" ? "active" : ""}`}
              onClick={() => setTab("seizure")}
            >
              <HiOutlineClipboardCheck style={{ marginRight: 6 }} />
              Seizure Memo
            </button>
            <button
              className={`tab-btn ${tab === "evidence" ? "active" : ""}`}
              onClick={() => setTab("evidence")}
            >
              <HiOutlineArchive style={{ marginRight: 6 }} />
              Upload Evidence / Property
            </button>
          </div>

          {tab === "seizure" && <SeizureMemoForm firs={firs} onSuccess={handleSuccess} />}
          {tab === "evidence" && <EvidenceUploadForm firs={firs} onSuccess={handleSuccess} />}
        </>
      )}
    </section>
  );
}

export default EvidenceRecorder;
