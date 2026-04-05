import { useState } from "react";
import { toast } from "react-toastify";
import Loader from "../../components/Loader";
import { useFetch } from "../../hooks/useFetch";
import { useAuth } from "../../hooks/useAuth";
import { custodyService, seizureService, findingsService } from "../../services/dirsService";
import { HiOutlineSwitchHorizontal, HiOutlineDocumentText } from "react-icons/hi";

function CustodyPage() {
  const { role } = useAuth();
  const [propertyId, setPropertyId] = useState("");
  const [searched, setSearched] = useState("");
  const [form, setForm] = useState({
    property_id: "", to_custodian_name: "", purpose: "",
    movement_date: new Date().toISOString().slice(0, 16), lab_case_number: "",
  });
  const [reportForm, setReportForm] = useState({
    title: "CFSL Forensic Analysis Report",
    description: "",
    lab_reference_number: "",
    lab_name: "Central Forensic Science Laboratory",
    file: null,
  });
  const [transferring, setTransferring] = useState(false);
  const [uploadingReport, setUploadingReport] = useState(false);

  const { data: propertiesData } = useFetch(
    () => seizureService.listProperties({ limit: 100 }),
    []
  );
  const properties = Array.isArray(propertiesData) ? propertiesData : [];

  const { data: cfslLabsData } = useFetch(
    () => custodyService.getAvailableLabs().catch(() => []),
    []
  );
  const cfslLabs = Array.isArray(cfslLabsData) ? cfslLabsData : [];

  const { data: memosData } = useFetch(
    () => role === "cfsl" ? seizureService.listMemos({ limit: 1000 }) : Promise.resolve([]),
    [role]
  );
  const memos = Array.isArray(memosData) ? memosData : [];

  const { data: history, loading, refetch } = useFetch(
    () => searched ? custodyService.getHistory(searched) : Promise.resolve([]),
    [searched]
  );
  const movements = Array.isArray(history) ? history : [];

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleUploadReport = async (e) => {
    e.preventDefault();
    if (!searched || !reportForm.file) return toast.error("Please load a property chain and select a report file first");
    
    const prop = properties.find(p => p.id === parseInt(searched));
    if (!prop) return toast.error("Property not found");
    const memo = memos.find(m => m.id === prop.seizure_memo_id);
    if (!memo) return toast.error("Associated Seizure Memo / FIR not found for this property");
    
    setUploadingReport(true);
    try {
      const formData = new FormData();
      formData.append("title", reportForm.title + " (Prop: " + prop.property_number + ")");
      formData.append("description", reportForm.description);
      formData.append("lab_reference_number", reportForm.lab_reference_number);
      formData.append("lab_name", reportForm.lab_name);
      formData.append("file", reportForm.file);

      await findingsService.uploadLabReport(memo.fir_id, formData);
      toast.success("Forensic Lab Report successfully submitted to Chain!");
      setReportForm({ ...reportForm, file: null, description: "", lab_reference_number: "" });
    } catch (err) {
      toast.error(err.response?.data?.detail || "Upload failed");
    } finally {
      setUploadingReport(false);
    }
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    setTransferring(true);
    try {
      await custodyService.transfer({
        ...form,
        property_id: parseInt(form.property_id),
        movement_date: new Date(form.movement_date).toISOString(),
      });
      toast.success("Custody transfer recorded ✓");
      if (searched) refetch();
      setForm({ property_id: "", to_custodian_name: "", purpose: "", movement_date: new Date().toISOString().slice(0, 16), lab_case_number: "" });
    } catch (err) {
      toast.error(err.response?.data?.detail || "Transfer failed");
    } finally { setTransferring(false); }
  };

  return (
    <section>
      <div className="page-header">
        <div>
          <h2>Chain of Custody</h2>
          <p className="page-subtitle">Property Movement Register — every transfer hashed & blockchain-anchored</p>
        </div>
      </div>

      <div className="form-row" style={{ alignItems: "flex-start", gap: "2rem" }}>
        {/* Transfer Form */}
                <div className="form-card" style={{ flex: 1 }}>
          {role === "cfsl" ? (
            <>
              <h3 style={{ marginTop: 0 }}>Submit Report to Chain</h3>
              <p className="text-muted" style={{ marginBottom: "1rem", fontSize: "0.85rem" }}>
                Load a property chain on the right, then attach the lab findings here.
              </p>
              <form onSubmit={handleUploadReport}>
                <div className="form-group">
                  <label>Selected Property</label>
                  <input className="input" value={searched ? (properties.find(p => p.id === parseInt(searched))?.property_number + ` (ID: ${searched})` || searched) : "None Selected"} disabled style={{ backgroundColor: "var(--bg-lighter)" }} />
                </div>
                <div className="form-group">
                  <label>Report File (.pdf, .jpg, .img, .mp4) *</label>
                  <input type="file" className="input" onChange={(e) => setReportForm(f => ({...f, file: e.target.files[0]}))} required />
                </div>
                <div className="form-group">
                  <label>Title</label>
                  <input className="input" value={reportForm.title} onChange={(e) => setReportForm(f => ({...f, title: e.target.value}))} required />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Lab Ref Number</label>
                    <input className="input" value={reportForm.lab_reference_number} onChange={(e) => setReportForm(f => ({...f, lab_reference_number: e.target.value}))} />
                  </div>
                  <div className="form-group">
                    <label>Lab Name</label>
                    <input className="input" value={reportForm.lab_name} onChange={(e) => setReportForm(f => ({...f, lab_name: e.target.value}))} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea className="input" rows={2} value={reportForm.description} onChange={(e) => setReportForm(f => ({...f, description: e.target.value}))} />
                </div>
                <button className="btn" type="submit" disabled={uploadingReport || !searched}>
                  {uploadingReport ? "Uploading..." : <><HiOutlineDocumentText style={{ verticalAlign: "middle", marginRight: 6 }} />Submit Record</>}
                </button>
              </form>
            </>
          ) : (
            <>
              <h3 style={{ marginTop: 0 }}>Record Transfer</h3>
              <form onSubmit={handleTransfer}>
                <div className="form-group">
                  <label>Property *</label>
                  <select className="input" value={form.property_id} onChange={set("property_id")} required>
                    <option value="">� Select Property �</option>
                    {properties.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.property_number} ({p.item_type}) - ID: {p.id}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Transfer To *</label>
                  <select
                    className="input"
                    value={cfslLabs.some(l => `${l.name} (${l.email})` === form.to_custodian_name)
                      ? form.to_custodian_name
                      : form.to_custodian_name ? "custom" : ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "custom") {
                        setForm(f => ({ ...f, to_custodian_name: "" }));
                      } else {
                        setForm(f => ({ ...f, to_custodian_name: val }));
                      }
                    }}
                    required={!form.to_custodian_name}
                  >
                    <option value="">� Select Official Forensic Lab �</option>
                    {cfslLabs.map(lab => (
                      <option key={lab.id} value={`${lab.name} (${lab.email})`}>
                        {lab.name} � {lab.email}
                      </option>
                    ))}
                    <option value="custom">Other / Manual Entry</option>
                  </select>

                  {(cfslLabs.every(l => `${l.name} (${l.email})` !== form.to_custodian_name) && form.to_custodian_name !== "") || form.to_custodian_name === "" ? ( 
                    <input
                      className="input"
                      value={cfslLabs.some(l => `${l.name} (${l.email})` === form.to_custodian_name) ? "" : form.to_custodian_name}
                      onChange={set("to_custodian_name")}
                      placeholder="Manually enter Name / Court"
                      style={{ marginTop: "10px" }}
                      required
                    />
                  ) : null}
                </div>
                <div className="form-group">
                  <label>Purpose *</label>
                  <textarea className="input" rows={2} value={form.purpose} onChange={set("purpose")} placeholder="e.g. Sent to CFSL for fingerprint analysis" required />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Movement Date *</label>
                    <input className="input" type="datetime-local" value={form.movement_date} onChange={set("movement_date")} required />
                  </div>
                  <div className="form-group">
                    <label>Lab Case No.</label>
                    <input className="input" value={form.lab_case_number} onChange={set("lab_case_number")} />
                  </div>
                </div>
                <button className="btn" type="submit" disabled={transferring}>
                  {transferring ? "Recording..." : <><HiOutlineSwitchHorizontal style={{ verticalAlign: "middle", marginRight: 6 }} />Record Transfer</>}
                </button>
              </form>
            </>
          )}
        </div>

        {/* History View */}
        <div style={{ flex: 1.5 }}>
          <h3 style={{ marginBottom: "1rem" }}>View Custody Chain</h3>
          <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.5rem" }}>
            <select className="input" value={propertyId} onChange={(e) => setPropertyId(e.target.value)} style={{ maxWidth: 300 }}>
              <option value="">— Select Property —</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.property_number} - ID: {p.id}
                </option>
              ))}
            </select>
            <button className="btn btn-secondary" onClick={() => setSearched(propertyId)} disabled={!propertyId}>Load Chain</button>
          </div>

          {loading && <Loader />}
          {!searched && <p className="text-muted">Enter a Property ID to view its full custody chain.</p>}
          {searched && !loading && movements.length === 0 && <p className="text-muted">No movements recorded for this property.</p>}

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {movements.map((m, i) => (
              <div key={m.id} className="evidence-card" style={{ padding: "1rem 1.25rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <strong style={{ color: "var(--primary)" }}>Move #{i + 1}</strong>
                  <span className="text-muted" style={{ fontSize: "0.8rem" }}>{new Date(m.movement_date).toLocaleString("en-IN")}</span>
                </div>
                <p style={{ margin: "4px 0" }}>
                  <strong>{m.from_custodian_name}</strong>
                  <HiOutlineSwitchHorizontal style={{ margin: "0 8px", verticalAlign: "middle" }} />
                  <strong>{m.to_custodian_name}</strong>
                </p>
                <p className="text-muted" style={{ fontSize: "0.85rem", margin: "4px 0" }}>{m.purpose}</p>
                {m.lab_case_number && <p style={{ fontSize: "0.8rem", color: "var(--primary)" }}>Lab: {m.lab_case_number}</p>}
                {m.signature_hash && <p className="text-muted" style={{ fontSize: "0.75rem", fontFamily: "monospace" }}>Hash: {m.signature_hash.slice(0, 20)}…</p>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default CustodyPage;
