import { useState, useContext } from "react";
import { toast } from "react-toastify";
import { AuthContext } from "../../context/AuthContext";
import { firService, custodyService, seizureService } from "../../services/dirsService";
import { useFetch } from "../../hooks/useFetch";
import Loader from "../../components/Loader";
import {
  HiOutlineBeaker,
  HiOutlineOfficeBuilding,
  HiOutlineClipboardList,
  HiOutlineCheckCircle,
  HiOutlineArchive,
} from "react-icons/hi";

/* ─── Lab Card ──────────────────────────────────────────────── */
function LabCard({ lab, selected, onSelect }) {
  return (
    <div
      onClick={() => onSelect(lab)}
      style={{
        border: `2px solid ${selected ? "var(--primary)" : "var(--border)"}`,
        borderRadius: "12px",
        padding: "1rem 1.25rem",
        cursor: "pointer",
        background: selected ? "var(--primary)10" : "var(--card-bg)",
        transition: "all 0.2s ease",
        display: "flex",
        alignItems: "center",
        gap: "1rem",
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: "10px",
          background: selected ? "var(--primary)" : "#4f46e520",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "1.3rem",
          color: selected ? "#fff" : "var(--primary)",
          flexShrink: 0,
        }}
      >
        <HiOutlineBeaker />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>{lab.name}</div>
        <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
          ID: #{lab.id} &nbsp;·&nbsp; Role: {lab.role?.toUpperCase()}
        </div>
        {lab.email && (
          <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{lab.email}</div>
        )}
      </div>
      {selected && (
        <HiOutlineCheckCircle style={{ fontSize: "1.4rem", color: "var(--primary)", flexShrink: 0 }} />
      )}
    </div>
  );
}

/* ─── Main Page ─────────────────────────────────────────────── */
function ForwardToLab() {
  const { role } = useContext(AuthContext);

  const [selectedLab, setSelectedLab] = useState(null);
  const [selectedFirId, setSelectedFirId] = useState("");
  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1); // 1: select lab, 2: select case/evidence, 3: confirm

  // Fetch registered forensic labs (CFSL users)
  const { data: labsData, loading: labsLoading, error: labsError } = useFetch(
    () => custodyService.getAvailableLabs(),
    []
  );
  const labs = Array.isArray(labsData) ? labsData : labsData?.data || [];

  // Fetch FIRs
  const { data: firData, loading: firsLoading } = useFetch(() => firService.list({ limit: 200 }), []);
  const firs = Array.isArray(firData) ? firData : firData?.data || [];

  // Fetch properties when FIR is selected
  const { data: propsData, loading: propsLoading } = useFetch(
    () =>
      selectedFirId
        ? seizureService.listProperties({ fir_id: selectedFirId, limit: 100 })
        : Promise.resolve([]),
    [selectedFirId]
  );
  const properties = Array.isArray(propsData) ? propsData : propsData?.data || [];

  const handleForward = async () => {
    if (!selectedLab) return toast.error("Please select a forensic lab");
    if (!selectedFirId) return toast.error("Please select a FIR/Case");
    if (!selectedPropertyId) return toast.error("Please select an evidence item to forward");

    setSubmitting(true);
    try {
      await custodyService.transfer({
        property_id: parseInt(selectedPropertyId),
        to_user_id: selectedLab.id,
        transfer_reason: notes || `Forwarded to ${selectedLab.name} for forensic analysis`,
      });
      toast.success(`Successfully forwarded to ${selectedLab.name} ✓`);
      setStep(1);
      setSelectedLab(null);
      setSelectedFirId("");
      setSelectedPropertyId("");
      setNotes("");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to forward to lab");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section>
      {/* Header */}
      <div className="page-header">
        <div>
          <h2>Forward to Forensic Lab</h2>
          <p className="page-subtitle">
            Transfer evidence custody to a registered forensic laboratory — Section 293 CrPC
          </p>
        </div>
        <span
          style={{
            background: "#0891b220",
            color: "#0891b2",
            borderRadius: "8px",
            padding: "6px 14px",
            fontSize: "0.85rem",
            fontWeight: 600,
          }}
        >
          Role: {role?.toUpperCase()}
        </span>
      </div>

      {/* Step Indicator */}
      <div
        style={{
          display: "flex",
          gap: "0",
          marginBottom: "2rem",
          background: "var(--card-bg)",
          borderRadius: "12px",
          border: "1px solid var(--border)",
          overflow: "hidden",
        }}
      >
        {[
          { n: 1, label: "Select Lab", icon: <HiOutlineBeaker /> },
          { n: 2, label: "Select Case & Evidence", icon: <HiOutlineArchive /> },
          { n: 3, label: "Confirm & Forward", icon: <HiOutlineCheckCircle /> },
        ].map((s) => (
          <div
            key={s.n}
            onClick={() => step >= s.n && setStep(s.n)}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              padding: "1rem",
              background: step === s.n ? "var(--primary)" : step > s.n ? "#4f46e520" : "transparent",
              color: step === s.n ? "#fff" : step > s.n ? "var(--primary)" : "var(--text-muted)",
              fontWeight: step === s.n ? 700 : 500,
              fontSize: "0.9rem",
              cursor: step >= s.n ? "pointer" : "default",
              transition: "all 0.2s",
              borderRight: s.n < 3 ? "1px solid var(--border)" : "none",
            }}
          >
            {s.icon}
            <span>
              {s.n}. {s.label}
            </span>
          </div>
        ))}
      </div>

      {/* Step 1: Select Lab */}
      {step === 1 && (
        <div>
          <h3 style={{ marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <HiOutlineOfficeBuilding style={{ color: "var(--primary)" }} />
            Select Registered Forensic Laboratory
          </h3>

          {labsLoading && <Loader />}
          {labsError && (
            <div className="empty-state">
              <p className="error-text">Failed to load registered labs. Ensure lab users are registered in the system.</p>
            </div>
          )}

          {!labsLoading && labs.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon">
                <HiOutlineBeaker />
              </div>
              <p style={{ fontWeight: 600 }}>No forensic labs registered</p>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                Ask the admin to register CFSL users in the system first.
              </p>
            </div>
          )}

          {!labsLoading && labs.length > 0 && (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem", marginBottom: "1.5rem" }}>
                {labs.map((lab) => (
                  <LabCard
                    key={lab.id}
                    lab={lab}
                    selected={selectedLab?.id === lab.id}
                    onSelect={setSelectedLab}
                  />
                ))}
              </div>
              <button
                className="btn"
                disabled={!selectedLab}
                onClick={() => setStep(2)}
              >
                Next: Select Case &amp; Evidence →
              </button>
            </>
          )}
        </div>
      )}

      {/* Step 2: Select Case & Evidence */}
      {step === 2 && (
        <div>
          <h3 style={{ marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <HiOutlineArchive style={{ color: "var(--primary)" }} />
            Select Case &amp; Evidence to Forward
          </h3>

          {/* Selected Lab summary */}
          <div
            style={{
              background: "#4f46e510",
              border: "1px solid #4f46e530",
              borderRadius: "10px",
              padding: "0.85rem 1.25rem",
              marginBottom: "1.5rem",
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              fontSize: "0.9rem",
            }}
          >
            <HiOutlineBeaker style={{ color: "var(--primary)", fontSize: "1.2rem" }} />
            <span>
              Forwarding to: <strong>{selectedLab?.name}</strong> (ID: #{selectedLab?.id})
            </span>
          </div>

          <div className="form-card">
            {/* FIR Select */}
            <div className="form-group">
              <label>Select FIR / Case *</label>
              {firsLoading ? (
                <Loader />
              ) : (
                <select
                  className="input"
                  value={selectedFirId}
                  onChange={(e) => {
                    setSelectedFirId(e.target.value);
                    setSelectedPropertyId("");
                  }}
                  required
                >
                  <option value="">— Choose a Case (FIR) —</option>
                  {firs.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.fir_number} — {f.police_station} [{f.status?.toUpperCase()}]
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Property Select */}
            {selectedFirId && (
              <div className="form-group">
                <label>Select Evidence / Property *</label>
                {propsLoading ? (
                  <Loader />
                ) : properties.length === 0 ? (
                  <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                    No evidence recorded for this FIR yet. Please record evidence first.
                  </p>
                ) : (
                  <select
                    className="input"
                    value={selectedPropertyId}
                    onChange={(e) => setSelectedPropertyId(e.target.value)}
                    required
                  >
                    <option value="">— Choose Evidence Item —</option>
                    {properties.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.property_number} — {p.item_description?.slice(0, 60)} [{p.item_type}]
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {/* Notes */}
            <div className="form-group">
              <label>Transfer Notes / Analysis Request</label>
              <textarea
                className="input"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Describe what analysis is required from the lab..."
              />
            </div>

            <div style={{ display: "flex", gap: "1rem" }}>
              <button className="btn btn-secondary" onClick={() => setStep(1)}>
                ← Back
              </button>
              <button
                className="btn"
                disabled={!selectedFirId || !selectedPropertyId}
                onClick={() => setStep(3)}
              >
                Next: Confirm Forward →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Confirm */}
      {step === 3 && (
        <div>
          <h3 style={{ marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <HiOutlineCheckCircle style={{ color: "var(--success)" }} />
            Confirm &amp; Forward
          </h3>

          <div
            style={{
              background: "var(--card-bg)",
              border: "1px solid var(--border)",
              borderRadius: "12px",
              padding: "1.5rem",
              marginBottom: "1.5rem",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "1rem",
                marginBottom: "1rem",
              }}
            >
              <div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "4px" }}>FORENSIC LAB</div>
                <div style={{ fontWeight: 600 }}>{selectedLab?.name}</div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Lab ID: #{selectedLab?.id}</div>
              </div>
              <div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "4px" }}>FIR / CASE</div>
                <div style={{ fontWeight: 600 }}>
                  {firs.find((f) => String(f.id) === String(selectedFirId))?.fir_number || `FIR #${selectedFirId}`}
                </div>
              </div>
              <div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "4px" }}>EVIDENCE ITEM</div>
                <div style={{ fontWeight: 600 }}>
                  {properties.find((p) => String(p.id) === String(selectedPropertyId))?.property_number ||
                    `Property #${selectedPropertyId}`}
                </div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  {properties.find((p) => String(p.id) === String(selectedPropertyId))?.item_description?.slice(0, 60)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "4px" }}>TRANSFER NOTES</div>
                <div style={{ fontSize: "0.9rem" }}>{notes || "No notes provided"}</div>
              </div>
            </div>

            <div
              style={{
                background: "#f59e0b10",
                border: "1px solid #f59e0b30",
                borderRadius: "8px",
                padding: "0.75rem 1rem",
                fontSize: "0.85rem",
                color: "#92400e",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <HiOutlineClipboardList />
              This transfer will be permanently recorded in the chain of custody. It cannot be undone.
            </div>
          </div>

          <div style={{ display: "flex", gap: "1rem" }}>
            <button className="btn btn-secondary" onClick={() => setStep(2)}>
              ← Back
            </button>
            <button className="btn" onClick={handleForward} disabled={submitting}>
              {submitting ? "Forwarding…" : "✓ Confirm Forward to Lab"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

export default ForwardToLab;
