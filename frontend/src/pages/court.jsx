import { useState, useContext } from "react";
import { toast } from "react-toastify";
import Loader from "../components/Loader";
import { useFetch } from "../hooks/useFetch";
import { courtService, chargesheetService, firService } from "../services/dirsService";
import { AuthContext } from "../context/AuthContext";
import {
  HiOutlineScale,
  HiOutlineSearch,
  HiOutlineShieldCheck,
  HiOutlinePlus,
} from "react-icons/hi";

function CourtPage() {
  const [tab, setTab] = useState("proceedings");
  const [loading, setLoading] = useState(false);

  // Add Proceeding form
  const [form, setForm] = useState({
    chargesheet_id: "",
    court_name: "",
    hearing_date: new Date().toISOString().slice(0, 10),
    judge_name: "",
    notes: "",
    next_date: "",
  });

  // Proceedings viewer
  const [csId, setCsId] = useState("");
  const [searchedCs, setSearchedCs] = useState("");

  const { data: firData } = useFetch(() => firService.list({ limit: 100 }), []);
  const { data: csData } = useFetch(() => chargesheetService.list({ limit: 100 }), []);
  const chargesheets = Array.isArray(csData) ? csData : [];

  const { data: procData, loading: pLoading, refetch } = useFetch(
    () => searchedCs ? courtService.getProceedings(searchedCs) : Promise.resolve([]),
    [searchedCs]
  );
  const proceedings = Array.isArray(procData) ? procData : [];

  const { user, role } = useContext(AuthContext);
  
  // Sort chargesheets so the officer's own cases are on top
  const sortedChargesheets = [...chargesheets].sort((a, b) => {
    if (!user) return 0;
    const aIsMine = a.filed_by_io_id === user.id;
    const bIsMine = b.filed_by_io_id === user.id;
    if (aIsMine && !bIsMine) return -1;
    if (!aIsMine && bIsMine) return 1;
    return 0;
  });

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...form,
        chargesheet_id: parseInt(form.chargesheet_id),
        hearing_date: form.hearing_date ? new Date(form.hearing_date).toISOString() : null,
        next_date: form.next_date ? new Date(form.next_date).toISOString() : null,
      };
      await courtService.addProceeding(payload);
      toast.success("Court proceeding recorded ✓");
      setForm({ chargesheet_id: "", court_name: "", hearing_date: new Date().toISOString().slice(0, 10), judge_name: "", notes: "", next_date: "" });
      if (searchedCs) refetch();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to record proceeding");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section>
      <div className="page-header">
        <div>
          <h2>Court Portal</h2>
          <p className="page-subtitle">Court Proceedings + Public Verification</p>
        </div>
      </div>

      <div className="filter-row">
        <button className={tab === "proceedings" ? "btn" : "btn btn-secondary"} onClick={() => setTab("proceedings")}>
          <HiOutlineScale style={{ verticalAlign: "middle", marginRight: 4 }} /> Proceedings
        </button>
        {role === "court" && (
          <button className={tab === "add" ? "btn" : "btn btn-secondary"} onClick={() => setTab("add")}>
            <HiOutlinePlus style={{ verticalAlign: "middle", marginRight: 4 }} /> Add Proceeding
          </button>
        )}
      </div>

      {tab === "add" && (
        <div className="form-card">
          <h3 style={{ marginTop: 0 }}>Record Court Proceeding</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Charge Sheet *</label>
                <select className="input" value={form.chargesheet_id} onChange={set("chargesheet_id")} required>
                  <option value="">— Select Charge Sheet —</option>
                  {sortedChargesheets.map((cs) => {
                    const isMine = user && cs.filed_by_io_id === user.id;
                    return (
                      <option key={cs.id} value={cs.id}>
                        {isMine ? "⭐ [Your Case] " : ""}{cs.chargesheet_number}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div className="form-group">
                <label>Court Name *</label>
                <input className="input" value={form.court_name} onChange={set("court_name")} placeholder="e.g. Sessions Court Delhi" required />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Hearing Date *</label>
                <input className="input" type="date" value={form.hearing_date} onChange={set("hearing_date")} required />
              </div>
              <div className="form-group">
                <label>Judge Name</label>
                <input className="input" value={form.judge_name} onChange={set("judge_name")} placeholder="Hon. Justice…" />
              </div>
              <div className="form-group">
                <label>Next Date</label>
                <input className="input" type="date" value={form.next_date} onChange={set("next_date")} />
              </div>
            </div>
            <div className="form-group">
              <label>Proceeding Notes *</label>
              <textarea className="input" rows={4} value={form.notes} onChange={set("notes")} placeholder="Order passed, arguments heard, witnesses examined…" required />
            </div>
            <button className="btn" type="submit" disabled={loading}>
              {loading ? "Recording…" : "Record Proceeding"}
            </button>
          </form>
        </div>
      )}

      {tab === "proceedings" && (
        <>
          <div className="form-card" style={{ marginBottom: "1.5rem" }}>
            <h3 style={{ marginTop: 0 }}>View Proceedings by Charge Sheet</h3>
            <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-end" }}>
              <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                <label>Charge Sheet</label>
                <select className="input" value={csId} onChange={(e) => setCsId(e.target.value)}>
                  <option value="">— Select Charge Sheet —</option>
                  {sortedChargesheets.map((cs) => {
                    const isMine = user && cs.filed_by_io_id === user.id;
                    return (
                      <option key={cs.id} value={cs.id}>
                        {isMine ? "⭐ [Your Case] " : ""}{cs.chargesheet_number}
                      </option>
                    );
                  })}
                </select>
              </div>
              <button
                className="btn btn-secondary"
                style={{ marginBottom: 0 }}
                onClick={() => setSearchedCs(csId)}
              >
                <HiOutlineSearch style={{ verticalAlign: "middle", marginRight: 4 }} />
                Load
              </button>
            </div>
          </div>

          {pLoading && <Loader />}
          {!searchedCs && (
            <div className="empty-state">
              <div className="empty-state-icon"><HiOutlineScale /></div>
              <p>Select a charge sheet to view its proceedings.</p>
            </div>
          )}
          {searchedCs && !pLoading && proceedings.length === 0 && (
            <div className="empty-state">
              <p className="text-muted">No proceedings recorded for this charge sheet.</p>
            </div>
          )}
          {proceedings.length > 0 && (
            <div className="timeline" style={{ paddingLeft: "2rem" }}>
              {proceedings.map((p) => (
                <div key={p.id} className="timeline-item">
                  <div className="evidence-card">
                    <div className="flex-between" style={{ marginBottom: "0.5rem" }}>
                      <div>
                        <strong>{p.court_name}</strong>
                        {p.judge_name && <span className="text-muted" style={{ marginLeft: 8, fontSize: "0.82rem" }}>— {p.judge_name}</span>}
                      </div>
                      <span className="badge badge-blue">
                        {p.hearing_date ? new Date(p.hearing_date).toLocaleDateString("en-IN") : ""}
                      </span>
                    </div>
                    <p style={{ fontSize: "0.9rem", lineHeight: 1.6 }}>{p.notes}</p>
                    {p.next_date && (
                      <p className="text-muted text-sm" style={{ marginTop: "0.5rem" }}>
                        📅 Next date: <strong>{new Date(p.next_date).toLocaleDateString("en-IN")}</strong>
                      </p>
                    )}
                    {p.proceeding_hash && (
                      <div className="hash-mono" style={{ marginTop: "0.5rem" }}>
                        {p.proceeding_hash.slice(0, 20)}…
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}

export default CourtPage;
