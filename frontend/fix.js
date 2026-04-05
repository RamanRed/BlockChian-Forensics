const fs = require("fs");
let code = fs.readFileSync("src/pages/custody/index.jsx", "utf8");
const newBlock = `        <div className="form-card" style={{ flex: 1 }}>
          {role === "cfsl" ? (
            <>
              <h3 style={{ marginTop: 0 }}>Submit Report to Chain</h3>
              <p className="text-muted" style={{ marginBottom: "1rem", fontSize: "0.85rem" }}>
                Load a property chain on the right, then attach the lab findings here.
              </p>
              <form onSubmit={handleUploadReport}>
                <div className="form-group">
                  <label>Selected Property ID</label>
                  <input className="input" value={searched || "None Selected"} disabled style={{ backgroundColor: "var(--bg-lighter)" }} />
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
                    <option value="">— Select Property —</option>
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
                    value={cfslLabs.some(l => \`\${l.name} (\${l.email})\` === form.to_custodian_name)
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
                    <option value="">— Select Official Forensic Lab —</option>
                    {cfslLabs.map(lab => (
                      <option key={lab.id} value={\`\${lab.name} (\${lab.email})\`}>
                        {lab.name} — {lab.email}
                      </option>
                    ))}
                    <option value="custom">Other / Manual Entry</option>
                  </select>

                  {(cfslLabs.every(l => \`\${l.name} (\${l.email})\` !== form.to_custodian_name) && form.to_custodian_name !== "") || form.to_custodian_name === "" ? ( 
                    <input
                      className="input"
                      value={cfslLabs.some(l => \`\${l.name} (\${l.email})\` === form.to_custodian_name) ? "" : form.to_custodian_name}
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
        </div>`;

code = code.replace(/<div className="form-card" style={{ flex: 1 }}>[\s\S]*?<\/div>\s*\{\/\* History View \*\/\}/g, newBlock + "\n\n        {/* History View */}");

fs.writeFileSync("src/pages/custody/index.jsx", code);

