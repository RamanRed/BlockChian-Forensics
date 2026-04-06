import { useState } from "react";
import { toast } from "react-toastify";
import Loader from "../../components/Loader";
import { useFetch } from "../../hooks/useFetch";
import { chargesheetService, firService, courtService } from "../../services/dirsService";
import { HiOutlineClipboardCheck } from "react-icons/hi";
import Link from "next/link";

function ChargesheetPage() {
  const [tab, setTab] = useState("list");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    fir_id: "", chargesheet_number: "", offence_summary: "", io_conclusion: "", assigned_court_id: "",
  });

  const { data: firData } = useFetch(() => firService.list({ limit: 100 }), []);
  const firs = Array.isArray(firData) ? firData : [];

  const { data: courtData } = useFetch(() => courtService.listCourts(), []);
  const courts = Array.isArray(courtData) ? courtData : [];

  const { data: csData, loading: csLoading, refetch } = useFetch(
    () => chargesheetService.list({ limit: 100 }),
    []
  );
  const sheets = Array.isArray(csData) ? csData : [];

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...form,
        fir_id: parseInt(form.fir_id),
        assigned_court_id: form.assigned_court_id ? parseInt(form.assigned_court_id) : null,
      };
      await chargesheetService.create(payload);
      toast.success("Charge Sheet draft created ✓");
      setForm({ fir_id: "", chargesheet_number: "", offence_summary: "", io_conclusion: "", assigned_court_id: "" });
      setTab("list");
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed");
    } finally { setLoading(false); }
  };

  const handleFile = async (csId) => {
    if (!confirm("Officially file this Charge Sheet? This action triggers a blockchain write and updates the FIR status.")) return;
    try {
      await chargesheetService.file(csId);
      toast.success("Charge Sheet officially filed ✓");
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Filing failed");
    }
  };

  return (
    <section>
      <div className="page-header">
        <div>
          <h2>Charge Sheet</h2>
          <p className="page-subtitle">Final Report — Section 173 CrPC</p>
        </div>
        <button className={tab === "new" ? "btn" : "btn btn-secondary"} onClick={() => setTab(tab === "new" ? "list" : "new")}>
          {tab === "new" ? "← Back to List" : "+ New Charge Sheet"}
        </button>
      </div>

      {tab === "new" && (
        <div className="form-card">
          <h3 style={{ marginTop: 0 }}>Create Charge Sheet Draft</h3>
          <form onSubmit={handleCreate}>
            <div className="form-row">
              <div className="form-group">
                <label>FIR *</label>
                <select className="input" value={form.fir_id} onChange={set("fir_id")} required>
                  <option value="">— Select FIR —</option>
                  {firs.map((f) => <option key={f.id} value={f.id}>{f.fir_number}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Charge Sheet Number *</label>
                <input className="input" value={form.chargesheet_number} onChange={set("chargesheet_number")} required />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Assign to Court</label>
                <select className="input" value={form.assigned_court_id} onChange={set("assigned_court_id")}>
                  <option value="">— Select Court (Optional) —</option>
                  {courts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}{c.district ? ` — ${c.district}` : ""}{c.police_station ? ` (${c.police_station})` : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Offence Summary *</label>
              <textarea className="input" rows={4} value={form.offence_summary} onChange={set("offence_summary")} required />
            </div>
            <div className="form-group">
              <label>IO Conclusion</label>
              <textarea className="input" rows={3} value={form.io_conclusion} onChange={set("io_conclusion")} />
            </div>
            <button className="btn" type="submit" disabled={loading}>{loading ? "Creating…" : "Create Draft"}</button>
          </form>
        </div>
      )}

      {tab === "list" && (
        <>
          {csLoading && <Loader />}
          {!csLoading && sheets.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon"><HiOutlineClipboardCheck /></div>
              <p>No charge sheets yet.</p>
            </div>
          )}
          {sheets.length > 0 && (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr><th>CS Number</th><th>FIR ID</th><th>Assigned Court</th><th>Status</th><th>Created</th><th>Hash</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {sheets.map((cs) => (
                    <tr key={cs.id}>
                      <td><strong>{cs.chargesheet_number}</strong></td>
                      <td>{cs.fir_id}</td>
                      <td>
                        {cs.assigned_court_name ? (
                          <span className="badge badge-blue">{cs.assigned_court_name}</span>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td>
                        <span className={`badge badge-${cs.status === "filed" ? "green" : cs.status === "draft" ? "yellow" : "blue"}`}>
                          {cs.status?.toUpperCase()}
                        </span>
                      </td>
                      <td>{new Date(cs.created_at).toLocaleDateString("en-IN")}</td>
                      <td style={{ fontFamily: "monospace", fontSize: "0.75rem" }}>
                        {cs.data_hash ? cs.data_hash.slice(0, 14) + "…" : "—"}
                      </td>
                      <td style={{ display: "flex", gap: 8 }}>
                        <Link href={`/chargesheet/${cs.id}`} className="btn btn-secondary" style={{ padding: "4px 10px", fontSize: "0.8rem" }}>View</Link>
                        {cs.status === "draft" && (
                          <button className="btn" style={{ padding: "4px 10px", fontSize: "0.8rem" }} onClick={() => handleFile(cs.id)}>
                            ⛓ File
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </section>
  );
}

export default ChargesheetPage;
