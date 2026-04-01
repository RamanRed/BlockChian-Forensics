import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Loader from "../components/Loader";
import { useFetch } from "../hooks/useFetch";
import { firService, diaryService } from "../services/dirsService";
import { toast } from "react-toastify";
import { HiOutlineBookOpen, HiOutlineLockClosed } from "react-icons/hi";

function CaseDiary() {
  const router = useRouter();
  const [selectedFir, setSelectedFir] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    entry_date: new Date().toISOString().slice(0, 16),
    place_visited: "",
    persons_met: "",
    action_taken: "",
    observations: "",
    next_steps: "",
  });

  const { data: firData, loading: firsLoading } = useFetch(() => firService.list({ limit: 100 }), []);
  const firs = Array.isArray(firData) ? firData : [];

  const { data: entries, loading: entriesLoading, refetch } = useFetch(
    () => selectedFir ? diaryService.getEntries(selectedFir) : Promise.resolve([]),
    [selectedFir]
  );

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFir) return toast.error("Select a FIR first");
    setSubmitting(true);
    try {
      const payload = { ...form, entry_date: new Date(form.entry_date).toISOString() };
      await diaryService.addEntry(selectedFir, payload);
      toast.success("Diary entry appended ✓");
      setForm({ entry_date: new Date().toISOString().slice(0, 16), place_visited: "", persons_met: "", action_taken: "", observations: "", next_steps: "" });
      if (refetch) refetch();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to add entry");
    } finally {
      setSubmitting(false);
    }
  };

  const diaryEntries = Array.isArray(entries) ? entries : [];

  return (
    <section>
      <div className="page-header">
        <div>
          <h2>Case Diary</h2>
          <p className="page-subtitle">Investigation Journal — Section 172 CrPC (Append-Only)</p>
        </div>
        <span className="badge badge-yellow" style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px" }}>
          <HiOutlineLockClosed /> Append-Only
        </span>
      </div>

      <div className="form-row" style={{ alignItems: "flex-start", gap: "2rem" }}>
        {/* Entry Form */}
        <div className="form-card" style={{ flex: 1 }}>
          <h3 style={{ margin: "0 0 1rem" }}>Add Diary Entry</h3>
          <div className="form-group">
            <label>Select FIR *</label>
            {firsLoading ? <Loader /> : (
              <select className="input" value={selectedFir} onChange={(e) => setSelectedFir(e.target.value)} required>
                <option value="">— Choose FIR —</option>
                {firs.map((f) => (
                  <option key={f.id} value={f.id}>{f.fir_number} — {f.police_station}</option>
                ))}
              </select>
            )}
          </div>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Date & Time *</label>
              <input className="input" type="datetime-local" value={form.entry_date} onChange={set("entry_date")} required />
            </div>
            <div className="form-group">
              <label>Place Visited</label>
              <input className="input" value={form.place_visited} onChange={set("place_visited")} />
            </div>
            <div className="form-group">
              <label>Persons Met</label>
              <input className="input" value={form.persons_met} onChange={set("persons_met")} />
            </div>
            <div className="form-group">
              <label>Action Taken *</label>
              <textarea className="input" rows={3} value={form.action_taken} onChange={set("action_taken")} required placeholder="Min 10 characters" />
            </div>
            <div className="form-group">
              <label>Observations</label>
              <textarea className="input" rows={2} value={form.observations} onChange={set("observations")} />
            </div>
            <div className="form-group">
              <label>Next Steps</label>
              <textarea className="input" rows={2} value={form.next_steps} onChange={set("next_steps")} />
            </div>
            <button className="btn" type="submit" disabled={submitting || !selectedFir}>
              {submitting ? "Appending…" : "+ Append Entry"}
            </button>
          </form>
        </div>

        {/* Diary Entries List */}
        <div style={{ flex: 1.5 }}>
          <h3 style={{ marginBottom: "1rem" }}>
            <HiOutlineBookOpen style={{ verticalAlign: "middle", marginRight: 8 }} />
            Diary Entries {selectedFir && `(FIR ID: ${selectedFir})`}
          </h3>
          {entriesLoading && <Loader />}
          {!selectedFir && <p className="text-muted">Select a FIR to view its diary.</p>}
          {!entriesLoading && selectedFir && diaryEntries.length === 0 && (
            <div className="empty-state"><p>No diary entries yet for this FIR.</p></div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {diaryEntries.map((entry) => (
              <div key={entry.id} className="evidence-card" style={{ padding: "1rem 1.25rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <strong style={{ color: "var(--primary)" }}>Entry #{entry.entry_number}</strong>
                  <span className="text-muted" style={{ fontSize: "0.8rem" }}>{new Date(entry.entry_date).toLocaleString("en-IN")}</span>
                </div>
                {entry.place_visited && <p style={{ margin: "4px 0", fontSize: "0.85rem" }}>📍 {entry.place_visited}</p>}
                <p style={{ margin: "4px 0", fontSize: "0.9rem" }}>{entry.action_taken}</p>
                {entry.entry_hash && (
                  <p className="text-muted" style={{ fontSize: "0.75rem", marginTop: 8, fontFamily: "monospace" }}>
                    Hash: {entry.entry_hash.slice(0, 20)}…
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default CaseDiary;
