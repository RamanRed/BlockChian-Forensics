import { useState } from "react";
import { toast } from "react-toastify";
import Loader from "../../components/Loader";
import { useFetch } from "../../hooks/useFetch";
import { personService, firService } from "../../services/dirsService";
import { HiOutlineUserGroup } from "react-icons/hi";

const ROLES = ["complainant", "accused", "witness", "expert", "victim"];

function PersonsPage() {
  const [tab, setTab] = useState("list"); // list | register | link
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", alias: "", gender: "", address: "", contact: "", occupation: "" });
  const [link, setLink] = useState({ fir_id: "", person_id: "", role: "witness", remarks: "" });

  const { data: firData } = useFetch(() => firService.list({ limit: 100 }), []);
  const firs = Array.isArray(firData) ? firData : [];

  const { data: personsData, loading: personsLoading } = useFetch(
    () => personService.list({ limit: 100 }),
    []
  );
  const personsList = Array.isArray(personsData) ? personsData : [];

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setL = (k) => (e) => setLink((f) => ({ ...f, [k]: e.target.value }));

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await personService.register(form);
      toast.success("Person registered ✓");
      setForm({ name: "", alias: "", gender: "", address: "", contact: "", occupation: "" });
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed");
    } finally { setLoading(false); }
  };

  const handleLink = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await personService.linkToFir({ ...link, fir_id: parseInt(link.fir_id), person_id: parseInt(link.person_id) });
      toast.success("Person linked to FIR ✓");
      setLink({ fir_id: "", person_id: "", role: "witness", remarks: "" });
    } catch (err) {
      toast.error(err.response?.data?.detail || "Link failed");
    } finally { setLoading(false); }
  };

  return (
    <section>
      <div className="page-header">
        <div>
          <h2>Person Register</h2>
          <p className="page-subtitle">All Case Persons — Complainants, Accused, Witnesses, Experts</p>
        </div>
      </div>

      <div className="filter-row">
        <button className={tab === "list" ? "btn" : "btn btn-secondary"} onClick={() => setTab("list")}>Directory</button>
        <button className={tab === "register" ? "btn" : "btn btn-secondary"} onClick={() => setTab("register")}>Register Person</button>
        <button className={tab === "link" ? "btn" : "btn btn-secondary"} onClick={() => setTab("link")}>Link to FIR</button>
      </div>

      {tab === "list" && (
        <div className="form-card">
          <h3 style={{ marginTop: 0 }}>Person Directory</h3>
          {personsLoading ? <Loader /> : personsList.length === 0 ? (
            <p className="text-muted">No persons found.</p>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>ID</th><th>Name</th><th>Alias</th><th>Contact</th><th>Actions</th></tr></thead>
                <tbody>
                  {personsList.map(p => (
                    <tr key={p.id}>
                      <td>{p.id}</td>
                      <td><strong>{p.name}</strong></td>
                      <td>{p.alias || "—"}</td>
                      <td>{p.contact || "—"}</td>
                      <td>
                        <a href={`/persons/${p.id}`} className="btn btn-secondary" style={{ padding: "4px 10px", fontSize: "0.8rem", textDecoration: "none" }}>View History</a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === "register" && (
        <div className="form-card">
          <h3 style={{ marginTop: 0 }}>Register Person</h3>
          <form onSubmit={handleRegister}>
            <div className="form-row">
              <div className="form-group">
                <label>Full Name *</label>
                <input className="input" value={form.name} onChange={set("name")} required />
              </div>
              <div className="form-group">
                <label>Alias / Known As</label>
                <input className="input" value={form.alias} onChange={set("alias")} />
              </div>
              <div className="form-group">
                <label>Gender</label>
                <select className="input" value={form.gender} onChange={set("gender")}>
                  <option value="">—</option>
                  <option>Male</option><option>Female</option><option>Other</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Address</label>
              <textarea className="input" rows={2} value={form.address} onChange={set("address")} />
            </div>
            <div className="form-row">
              <div className="form-group"><label>Contact</label><input className="input" value={form.contact} onChange={set("contact")} /></div>
              <div className="form-group"><label>Occupation</label><input className="input" value={form.occupation} onChange={set("occupation")} /></div>
            </div>
            <button className="btn" type="submit" disabled={loading}>{loading ? "Saving…" : "Register Person"}</button>
          </form>
        </div>
      )}

      {tab === "link" && (
        <div className="form-card">
          <h3 style={{ marginTop: 0 }}>Link Person to FIR</h3>
          <form onSubmit={handleLink}>
            <div className="form-row">
              <div className="form-group">
                <label>FIR *</label>
                <select className="input" value={link.fir_id} onChange={setL("fir_id")} required>
                  <option value="">— Select FIR —</option>
                  {firs.map((f) => <option key={f.id} value={f.id}>{f.fir_number}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Person ID *</label>
                <input className="input" type="number" value={link.person_id} onChange={setL("person_id")} placeholder="ID from Person Register" required />
              </div>
              <div className="form-group">
                <label>Role *</label>
                <select className="input" value={link.role} onChange={setL("role")} required>
                  {ROLES.map((r) => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Remarks</label>
              <input className="input" value={link.remarks} onChange={setL("remarks")} />
            </div>
            <button className="btn" type="submit" disabled={loading}>{loading ? "Linking…" : "Link to FIR"}</button>
          </form>
        </div>
      )}
    </section>
  );
}

export default PersonsPage;
