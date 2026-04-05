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
    memo_number: "",
    seizure_date: new Date().toISOString().slice(0, 16),
    place_of_seizure: "",
    witness_names: "",
    items_description: "",
  });

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const witnesses = form.witness_names.split(",").map((s) => s.trim());
      
      await seizureService.createMemo({
        fir_id: parseInt(form.fir_id),
        memo_number: form.memo_number,
        date_time: new Date(form.seizure_date).toISOString(),
        place_of_seizure: form.place_of_seizure,
        witness_1_name: witnesses[0] || "",
        witness_2_name: witnesses[1] || "",
        items_description: form.items_description,
      });
      toast.success("Seizure memo recorded and hashed ✓");
      if (onSuccess) onSuccess();
    } catch (err) {
      const detail = err.response?.data?.detail;
      toast.error(
        typeof detail === "string"
          ? detail
          : Array.isArray(detail)
          ? detail.map((e) => e.msg).join(", ")
          : "Failed to create seizure memo"
      );
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
            <label>Memo Number *</label>
            <input className="input" value={form.memo_number} onChange={set("memo_number")} placeholder="e.g. SM/2026/01" required />
          </div>
          <div className="form-group">
            <label>Witness Names *</label>
            <input className="input" value={form.witness_names} onChange={set("witness_names")} placeholder="Comma-separated (min 1 req)" required />
          </div>
        </div>
        <div className="form-group">
          <label>Items Description *</label>
          <textarea className="input" rows={2} value={form.items_description} onChange={set("items_description")} required />
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
    seizure_memo_id: "",
    property_number: "",
    description: "",
    item_type: "physical",
    storage_location: "",
  });
  const [file, setFile] = useState(null);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const { data: memoData, loading: memosLoading } = useFetch(() => seizureService.listMemos({ limit: 200 }), []);
  const memos = Array.isArray(memoData) ? memoData : memoData?.data || [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return toast.error("Please select an evidence file");

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("seizure_memo_id", form.seizure_memo_id);
      fd.append("property_number", form.property_number);
      fd.append("description", form.description);
      fd.append("item_type", form.item_type);
      if (form.storage_location) fd.append("storage_location", form.storage_location);
      fd.append("file", file);

      await seizureService.uploadProperty(fd);
      toast.success("Evidence recorded & blockchain hash generated ✓");
      setForm({ seizure_memo_id: "", property_number: "", description: "", item_type: "physical", storage_location: "" });
      setFile(null);
      if (onSuccess) onSuccess();
    } catch (err) {
      const detail = err.response?.data?.detail;
      toast.error(
        typeof detail === "string"
          ? detail
          : Array.isArray(detail)
          ? detail.map((e) => e.msg).join(", ")
          : "Failed to upload evidence"
      );
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
        <div className="form-group">
          <label>Select Seizure Memo *</label>
          {memosLoading ? <Loader /> : (
            <select className="input" value={form.seizure_memo_id} onChange={set("seizure_memo_id")} required>
              <option value="">— Choose Memo —</option>
              {memos.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.memo_number} — {m.place_of_seizure}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="form-section-label">Item Details</div>
        <div className="form-row">
          <div className="form-group">
            <label>Property Number *</label>
            <input className="input" value={form.property_number} onChange={set("property_number")} placeholder="e.g. PR/2026/12" required />
          </div>
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
        </div>
        <div className="form-group">
          <label>Description *</label>
          <textarea
            className="input"
            rows={2}
            value={form.description}
            onChange={set("description")}
            placeholder="Describe the evidence item..."
            required
          />
        </div>
        <div className="form-group">
          <label>Storage Location</label>
          <input className="input" value={form.storage_location} onChange={set("storage_location")} placeholder="e.g. Locker 4, Shelf B" />
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
