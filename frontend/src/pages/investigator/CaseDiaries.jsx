import { useState } from "react";
import Loader from "../../components/Loader";
import { useFetch } from "../../hooks/useFetch";
import { firService, diaryService } from "../../services/dirsService";
import { toast } from "react-toastify";
import {
  HiOutlineBookOpen,
  HiOutlineLockClosed,
  HiOutlinePencil,
  HiOutlineDocumentText,
} from "react-icons/hi";

/* ─── Entry Card ────────────────────────────────────────────── */
function EntryCard({ entry }) {
  return (
    <div
      className="evidence-card"
      style={{
        padding: "1rem 1.25rem",
        borderLeft: "3px solid var(--primary)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <strong style={{ color: "var(--primary)", display: "flex", alignItems: "center", gap: 6 }}>
          <HiOutlineDocumentText />
          Entry #{entry.entry_number}
        </strong>
        <span className="text-muted" style={{ fontSize: "0.8rem" }}>
          {new Date(entry.entry_date).toLocaleString("en-IN")}
        </span>
      </div>
      {entry.place_visited && (
        <p style={{ margin: "4px 0", fontSize: "0.85rem" }}>📍 {entry.place_visited}</p>
      )}
      {entry.persons_met && (
        <p style={{ margin: "4px 0", fontSize: "0.85rem" }}>👤 Persons met: {entry.persons_met}</p>
      )}
      <p style={{ margin: "6px 0", fontSize: "0.9rem" }}>{entry.action_taken}</p>
      {entry.observations && (
        <p style={{ margin: "4px 0", fontSize: "0.85rem", color: "var(--text-muted)" }}>
          Observations: {entry.observations}
        </p>
      )}
      {entry.next_steps && (
        <p style={{ margin: "4px 0", fontSize: "0.85rem", color: "var(--text-muted)" }}>
          Next steps: {entry.next_steps}
        </p>
      )}
      {entry.entry_hash && (
        <p
          style={{
            margin: "8px 0 0",
            fontSize: "0.72rem",
            fontFamily: "monospace",
            color: "var(--text-muted)",
            background: "#0000000a",
            borderRadius: "4px",
            padding: "4px 8px",
            wordBreak: "break-all",
          }}
        >
          🔒 Hash: {entry.entry_hash}
        </p>
      )}
    </div>
  );
}

/* ─── Main Page ─────────────────────────────────────────────── */
function CaseDiaries() {
  const [selectedFir, setSelectedFir] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("view"); // view | add
  const [form, setForm] = useState({
    entry_date: new Date().toISOString().slice(0, 16),
    place_visited: "",
    persons_met: "",
    action_taken: "",
    observations: "",
    next_steps: "",
  });

  const { data: firData, loading: firsLoading } = useFetch(() => firService.list({ limit: 100 }), []);
  const firs = Array.isArray(firData) ? firData : firData?.data || [];

  const { data: entries, loading: entriesLoading, refetch } = useFetch(
    () => (selectedFir ? diaryService.getEntries(selectedFir) : Promise.resolve([])),
    [selectedFir]
  );
  const diaryEntries = Array.isArray(entries) ? entries : [];

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFir) return toast.error("Select a FIR first");
    setSubmitting(true);
    try {
      await diaryService.addEntry(selectedFir, {
        ...form,
        entry_date: new Date(form.entry_date).toISOString(),
      });
      toast.success("Diary entry appended & hashed ✓");
      setForm({
        entry_date: new Date().toISOString().slice(0, 16),
        place_visited: "",
        persons_met: "",
        action_taken: "",
        observations: "",
        next_steps: "",
      });
      setActiveTab("view");
      if (refetch) refetch();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to add entry");
    } finally {
      setSubmitting(false);
    }
  };

  const selectedFirObj = firs.find((f) => String(f.id) === String(selectedFir));

  return (
    <section>
      {/* Header */}
      <div className="page-header">
        <div>
          <h2>Case Diaries</h2>
          <p className="page-subtitle">Investigation Journal — Section 172 CrPC</p>
        </div>
        <span
          className="badge badge-yellow"
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px" }}
        >
          <HiOutlineLockClosed />
          Append-Only
        </span>
      </div>

      {/* Case Selector */}
      <div className="form-card" style={{ marginBottom: "1.5rem" }}>
        <div className="form-group" style={{ margin: 0 }}>
          <label>
            <HiOutlineBookOpen style={{ verticalAlign: "middle", marginRight: 6 }} />
            Select Case (FIR) *
          </label>
          {firsLoading ? (
            <Loader />
          ) : (
            <select
              className="input"
              value={selectedFir}
              onChange={(e) => {
                setSelectedFir(e.target.value);
                setActiveTab("view");
              }}
            >
              <option value="">— Choose a Case —</option>
              {firs.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.fir_number} — {f.police_station} [{f.status?.toUpperCase()}]
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Case context banner */}
      {selectedFirObj && (
        <div
          style={{
            background: "linear-gradient(135deg, #4f46e510, #6366f105)",
            border: "1px solid #4f46e525",
            borderRadius: "10px",
            padding: "0.85rem 1.25rem",
            marginBottom: "1.5rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "0.5rem",
          }}
        >
          <div>
            <strong style={{ color: "var(--primary)" }}>{selectedFirObj.fir_number}</strong>
            <span style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginLeft: "1rem" }}>
              {selectedFirObj.police_station}, {selectedFirObj.district}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <span
              className={`badge badge-${
                selectedFirObj.status === "open"
                  ? "blue"
                  : selectedFirObj.status === "chargesheeted"
                  ? "green"
                  : "yellow"
              }`}
            >
              {selectedFirObj.status?.replace("_", " ").toUpperCase()}
            </span>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
              {diaryEntries.length} entries
            </span>
          </div>
        </div>
      )}

      {selectedFir && (
        <>
          {/* Tabs */}
          <div className="tabs" style={{ marginBottom: "1.5rem" }}>
            <button
              className={`tab-btn ${activeTab === "view" ? "active" : ""}`}
              onClick={() => setActiveTab("view")}
            >
              <HiOutlineBookOpen style={{ marginRight: 6 }} />
              View Entries ({diaryEntries.length})
            </button>
            <button
              className={`tab-btn ${activeTab === "add" ? "active" : ""}`}
              onClick={() => setActiveTab("add")}
            >
              <HiOutlinePencil style={{ marginRight: 6 }} />
              Add Entry
            </button>
          </div>

          {/* View Entries */}
          {activeTab === "view" && (
            <div>
              {entriesLoading && <Loader />}
              {!entriesLoading && diaryEntries.length === 0 && (
                <div className="empty-state">
                  <div className="empty-state-icon">
                    <HiOutlineBookOpen />
                  </div>
                  <p style={{ fontWeight: 600 }}>No diary entries yet</p>
                  <button className="btn" style={{ marginTop: "1rem" }} onClick={() => setActiveTab("add")}>
                    + Add First Entry
                  </button>
                </div>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {diaryEntries.map((entry) => (
                  <EntryCard key={entry.id} entry={entry} />
                ))}
              </div>
            </div>
          )}

          {/* Add Entry */}
          {activeTab === "add" && (
            <div className="form-card">
              <h3 style={{ margin: "0 0 1.25rem", display: "flex", alignItems: "center", gap: 8 }}>
                <HiOutlinePencil style={{ color: "var(--primary)" }} />
                New Diary Entry
              </h3>
              <form onSubmit={handleSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Date &amp; Time *</label>
                    <input
                      className="input"
                      type="datetime-local"
                      value={form.entry_date}
                      onChange={set("entry_date")}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Place Visited</label>
                    <input className="input" value={form.place_visited} onChange={set("place_visited")} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Persons Met</label>
                  <input
                    className="input"
                    value={form.persons_met}
                    onChange={set("persons_met")}
                    placeholder="Names of persons interviewed or met"
                  />
                </div>
                <div className="form-group">
                  <label>Action Taken *</label>
                  <textarea
                    className="input"
                    rows={3}
                    value={form.action_taken}
                    onChange={set("action_taken")}
                    required
                    placeholder="Describe the investigative actions taken (min 10 characters)"
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Observations</label>
                    <textarea
                      className="input"
                      rows={2}
                      value={form.observations}
                      onChange={set("observations")}
                    />
                  </div>
                  <div className="form-group">
                    <label>Next Steps</label>
                    <textarea
                      className="input"
                      rows={2}
                      value={form.next_steps}
                      onChange={set("next_steps")}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem", alignItems: "center" }}>
                  <button className="btn" type="submit" disabled={submitting}>
                    {submitting ? "Appending…" : "+ Append Entry"}
                  </button>
                  <button className="btn btn-secondary" type="button" onClick={() => setActiveTab("view")}>
                    Cancel
                  </button>
                  <span
                    style={{
                      marginLeft: "auto",
                      fontSize: "0.8rem",
                      color: "var(--text-muted)",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <HiOutlineLockClosed />
                    Entries are immutable once appended
                  </span>
                </div>
              </form>
            </div>
          )}
        </>
      )}

      {!selectedFir && !firsLoading && (
        <div className="empty-state" style={{ marginTop: "2rem" }}>
          <div className="empty-state-icon">
            <HiOutlineBookOpen />
          </div>
          <p style={{ fontWeight: 600 }}>Select a case to view its diary</p>
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
            Choose a FIR from the dropdown above to view or append diary entries.
          </p>
        </div>
      )}
    </section>
  );
}

export default CaseDiaries;
