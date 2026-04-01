import { useState } from "react";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import { firService } from "../../services/dirsService";

function RegisterFIR() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    fir_number: "",
    police_station: "",
    district: "",
    state: "India",
    date_of_offence: "",
    place_of_offence: "",
    offence_sections: "",
    offence_description: "",
    accused_description: "",
    complainant_name: "",
    complainant_contact: "",
  });

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...form,
        date_of_offence: new Date(form.date_of_offence).toISOString(),
      };
      await firService.register(payload);
      toast.success("FIR registered successfully");
      router.push("/fir");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to register FIR");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section>
      <div className="page-header">
        <div>
          <h2>Register FIR</h2>
          <p className="page-subtitle">First Information Report — Section 154 CrPC (Immutable after registration)</p>
        </div>
      </div>

      <div className="form-card">
        <form onSubmit={handleSubmit}>
          <div className="form-section-label">FIR Identity</div>
          <div className="form-row">
            <div className="form-group">
              <label>FIR Number *</label>
              <input className="input" value={form.fir_number} onChange={set("fir_number")} placeholder="e.g. FIR/2026/DELHI/001" required />
            </div>
            <div className="form-group">
              <label>Police Station *</label>
              <input className="input" value={form.police_station} onChange={set("police_station")} required />
            </div>
            <div className="form-group">
              <label>District *</label>
              <input className="input" value={form.district} onChange={set("district")} required />
            </div>
            <div className="form-group">
              <label>State</label>
              <input className="input" value={form.state} onChange={set("state")} />
            </div>
          </div>

          <div className="form-section-label">Offence Details</div>
          <div className="form-row">
            <div className="form-group">
              <label>Date & Time of Offence *</label>
              <input className="input" type="datetime-local" value={form.date_of_offence} onChange={set("date_of_offence")} required />
            </div>
            <div className="form-group" style={{ flex: 2 }}>
              <label>Place of Offence *</label>
              <input className="input" value={form.place_of_offence} onChange={set("place_of_offence")} required />
            </div>
          </div>
          <div className="form-group">
            <label>Offence Sections * <span className="text-muted">(e.g. IPC 302, IPC 120B)</span></label>
            <input className="input" value={form.offence_sections} onChange={set("offence_sections")} required />
          </div>
          <div className="form-group">
            <label>Offence Description *</label>
            <textarea className="input" rows={3} value={form.offence_description} onChange={set("offence_description")} required />
          </div>
          <div className="form-group">
            <label>Accused Description</label>
            <textarea className="input" rows={2} value={form.accused_description} onChange={set("accused_description")} />
          </div>

          <div className="form-section-label">Complainant</div>
          <div className="form-row">
            <div className="form-group">
              <label>Complainant Name *</label>
              <input className="input" value={form.complainant_name} onChange={set("complainant_name")} required />
            </div>
            <div className="form-group">
              <label>Contact</label>
              <input className="input" value={form.complainant_contact} onChange={set("complainant_contact")} />
            </div>
          </div>

          <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
            <button className="btn" type="submit" disabled={loading}>
              {loading ? "Registering…" : "⚖ Register FIR"}
            </button>
            <button className="btn btn-secondary" type="button" onClick={() => router.push("/fir")}>Cancel</button>
          </div>
          <p className="text-muted" style={{ marginTop: "0.75rem", fontSize: "0.8rem" }}>
            ⚠ FIR is immutable after registration. Use the Correction endpoint for post-registration amendments.
          </p>
        </form>
      </div>
    </section>
  );
}

export default RegisterFIR;
