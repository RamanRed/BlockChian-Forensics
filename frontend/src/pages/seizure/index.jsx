import { useState } from "react";
import { toast } from "react-toastify";
import Loader from "../../components/Loader";
import { useFetch } from "../../hooks/useFetch";
import { firService, seizureService } from "../../services/dirsService";

function SeizurePage() {
  const [tab, setTab] = useState("list"); // list | memo | upload
  const [loading, setLoading] = useState(false);
  const { data: firData } = useFetch(() => firService.list({ limit: 100 }), []);
  const firs = Array.isArray(firData) ? firData : [];

  const { data: memosData, loading: memosLoading } = useFetch(
    () => seizureService.listMemos({ limit: 100 }),
    []
  );
  const memos = Array.isArray(memosData) ? memosData : [];

  const [memo, setMemo] = useState({
    fir_id: "", memo_number: "", date_time: new Date().toISOString().slice(0, 16),
    place_of_seizure: "", witness_1_name: "", witness_1_contact: "",
    witness_2_name: "", witness_2_contact: "", items_description: "",
  });
  const [upload, setUpload] = useState({
    seizure_memo_id: "", property_number: "", description: "", item_type: "digital", storage_location: "",
  });
  const [file, setFile] = useState(null);

  const setM = (k) => (e) => setMemo((f) => ({ ...f, [k]: e.target.value }));
  const setU = (k) => (e) => setUpload((f) => ({ ...f, [k]: e.target.value }));

  const handleMemoSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...memo, fir_id: parseInt(memo.fir_id), date_time: new Date(memo.date_time).toISOString() };
      await seizureService.createMemo(payload);
      toast.success("Seizure Memo created ✓");
      setMemo({ fir_id: "", memo_number: "", date_time: new Date().toISOString().slice(0, 16), place_of_seizure: "", witness_1_name: "", witness_1_contact: "", witness_2_name: "", witness_2_contact: "", items_description: "" });
    } catch (err) {
      toast.error(err.response?.data?.detail?.message || err.response?.data?.detail || "Failed");
    } finally { setLoading(false); }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!file) return toast.error("Select a file");
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("seizure_memo_id", upload.seizure_memo_id);
      fd.append("property_number", upload.property_number);
      fd.append("description", upload.description);
      fd.append("item_type", upload.item_type);
      fd.append("storage_location", upload.storage_location);
      await seizureService.uploadProperty(fd);
      toast.success("Digital evidence registered & analysed ✓");
      setFile(null); setUpload({ seizure_memo_id: "", property_number: "", description: "", item_type: "digital", storage_location: "" });
    } catch (err) {
      toast.error(err.response?.data?.detail || "Upload failed");
    } finally { setLoading(false); }
  };

  return (
    <section>
      <div className="page-header">
        <div>
          <h2>Seizure & Property Register</h2>
          <p className="page-subtitle">Seizure Memo + Malkhana Property Register</p>
        </div>
      </div>

      <div className="filter-row">
        <button className={tab === "list" ? "btn" : "btn btn-secondary"} onClick={() => setTab("list")}>View Memos</button>
        <button className={tab === "memo" ? "btn" : "btn btn-secondary"} onClick={() => setTab("memo")}>Create Seizure Memo</button>
        <button className={tab === "upload" ? "btn" : "btn btn-secondary"} onClick={() => setTab("upload")}>Register Digital Evidence</button>
      </div>

      {tab === "list" && (
        <div className="form-card">
          <h3 style={{ marginTop: 0 }}>Recent Seizure Memos</h3>
          {memosLoading ? <Loader /> : memos.length === 0 ? (
            <p className="text-muted">No seizure memos found.</p>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>Memo #</th><th>FIR ID</th><th>Date/Time</th><th>Place</th><th>Actions</th></tr></thead>
                <tbody>
                  {memos.map(m => (
                    <tr key={m.id}>
                      <td><strong>{m.memo_number}</strong></td>
                      <td>{m.fir_id}</td>
                      <td>{new Date(m.date_time).toLocaleString("en-IN")}</td>
                      <td>{m.place_of_seizure}</td>
                      <td>
                        <a href={`/seizure/${m.id}`} className="btn btn-secondary" style={{ padding: "4px 10px", fontSize: "0.8rem", textDecoration: "none" }}>View</a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === "memo" && (
        <div className="form-card">
          <h3 style={{ marginTop: 0 }}>Create Seizure Memo</h3>
          <form onSubmit={handleMemoSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>FIR *</label>
                <select className="input" value={memo.fir_id} onChange={setM("fir_id")} required>
                  <option value="">— Select FIR —</option>
                  {firs.map((f) => <option key={f.id} value={f.id}>{f.fir_number}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Memo Number *</label>
                <input className="input" value={memo.memo_number} onChange={setM("memo_number")} required />
              </div>
              <div className="form-group">
                <label>Date & Time *</label>
                <input className="input" type="datetime-local" value={memo.date_time} onChange={setM("date_time")} required />
              </div>
            </div>
            <div className="form-group">
              <label>Place of Seizure *</label>
              <input className="input" value={memo.place_of_seizure} onChange={setM("place_of_seizure")} required />
            </div>
            <div className="form-section-label">Witnesses (Min 1 required)</div>
            <div className="form-row">
              <div className="form-group">
                <label>Witness 1 Name *</label>
                <input className="input" value={memo.witness_1_name} onChange={setM("witness_1_name")} required />
              </div>
              <div className="form-group"><label>Contact</label><input className="input" value={memo.witness_1_contact} onChange={setM("witness_1_contact")} /></div>
              <div className="form-group"><label>Witness 2 Name</label><input className="input" value={memo.witness_2_name} onChange={setM("witness_2_name")} /></div>
              <div className="form-group"><label>Contact</label><input className="input" value={memo.witness_2_contact} onChange={setM("witness_2_contact")} /></div>
            </div>
            <div className="form-group">
              <label>Items Description *</label>
              <textarea className="input" rows={3} value={memo.items_description} onChange={setM("items_description")} required />
            </div>
            <button className="btn" type="submit" disabled={loading}>{loading ? "Creating…" : "Create Seizure Memo"}</button>
          </form>
        </div>
      )}

      {tab === "upload" && (
        <div className="form-card">
          <h3 style={{ marginTop: 0 }}>Register Digital Evidence Item</h3>
          <p className="text-muted" style={{ marginBottom: "1rem" }}>File will be SHA-256 hashed, AI-analysed, and blockchain-anchored.</p>
          <form onSubmit={handleUploadSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Seizure Memo ID *</label>
                <input className="input" type="number" value={upload.seizure_memo_id} onChange={setU("seizure_memo_id")} required />
              </div>
              <div className="form-group">
                <label>Property Number *</label>
                <input className="input" value={upload.property_number} onChange={setU("property_number")} required />
              </div>
            </div>
            <div className="form-group"><label>Description *</label><input className="input" value={upload.description} onChange={setU("description")} required /></div>
            <div className="form-row">
              <div className="form-group">
                <label>Item Type</label>
                <select className="input" value={upload.item_type} onChange={setU("item_type")}>
                  <option value="digital">Digital</option>
                  <option value="physical">Physical</option>
                  <option value="document">Document</option>
                </select>
              </div>
              <div className="form-group"><label>Storage Location</label><input className="input" value={upload.storage_location} onChange={setU("storage_location")} /></div>
            </div>
            <div className="form-group">
              <label>Evidence File *</label>
              <input className="input" type="file" accept="image/*,video/*" onChange={(e) => setFile(e.target.files[0])} required />
            </div>
            <button className="btn" type="submit" disabled={loading}>{loading ? "Uploading & Analysing…" : "Register & Analyse"}</button>
          </form>
        </div>
      )}
    </section>
  );
}

export default SeizurePage;
