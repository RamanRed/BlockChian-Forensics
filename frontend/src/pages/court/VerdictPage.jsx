import { useState, useContext } from "react";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import { AuthContext } from "../../context/AuthContext";
import { useFetch } from "../../hooks/useFetch";
import { firService, chargesheetService, verdictService } from "../../services/dirsService";
import Loader from "../../components/Loader";
import {
  HiOutlineScale,
  HiOutlineSearch,
  HiOutlineCheckCircle,
} from "react-icons/hi";

function VerdictPage() {
  const router = useRouter();
  const { user } = useContext(AuthContext);

  // Pre-fill from query if coming from case detail
  const initialFir = router.query.fir || "";

  const [selectedFirId, setSelectedFirId] = useState(initialFir);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    chargesheet_id: "",
    verdict_type: "adjourn",
    verdict_summary: "",
    reasoning: "",
    sentence: "",
    judge_name: user?.name || "",
    court_name: "",
    next_hearing_date: "",
  });

  // Fetch data
  const { data: firsData, loading: firsLoading } = useFetch(() => firService.list({ limit: 500 }), []);
  const firs = Array.isArray(firsData) ? firsData : [];

  const { data: csData, loading: csLoading } = useFetch(
    () => selectedFirId ? chargesheetService.list({ fir_id: selectedFirId }) : Promise.resolve([]),
    [selectedFirId]
  );
  const chargesheets = Array.isArray(csData) ? csData : [];

  // Previous verdicts
  const { data: prevVerdicts, refetch: refetchVerdicts } = useFetch(
    () => selectedFirId ? verdictService.getByFir(selectedFirId) : Promise.resolve([]),
    [selectedFirId]
  );
  const verdictList = Array.isArray(prevVerdicts) ? prevVerdicts : [];

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFirId || !form.chargesheet_id) {
      toast.error("Please select FIR and Charge Sheet.");
      return;
    }
    setSubmitting(true);
    try {
      await verdictService.issue({
        fir_id: parseInt(selectedFirId),
        chargesheet_id: parseInt(form.chargesheet_id),
        verdict_type: form.verdict_type,
        verdict_summary: form.verdict_summary,
        reasoning: form.reasoning || null,
        sentence: form.sentence || null,
        judge_name: form.judge_name,
        court_name: form.court_name,
        verdict_date: new Date().toISOString(),
        next_hearing_date: form.next_hearing_date ? new Date(form.next_hearing_date).toISOString() : null,
      });
      toast.success("Verdict recorded successfully and anchored on blockchain ✓");
      setForm(f => ({ ...f, verdict_summary: "", reasoning: "", sentence: "", next_hearing_date: "" }));
      refetchVerdicts();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to record verdict.");
    } finally {
      setSubmitting(false);
    }
  };

  const VERDICT_TYPES = [
    { value: "adjourn", label: "Adjourn (Next Hearing)" },
    { value: "conviction", label: "Conviction" },
    { value: "acquittal", label: "Acquittal" },
    { value: "further_investigation", label: "Order Further Investigation" },
    { value: "discharge", label: "Discharge" },
    { value: "compounded", label: "Compounded / Settled" },
  ];

  const VERDICT_COLORS = {
    conviction: "#dc2626",
    acquittal: "#059669",
    adjourn: "#d97706",
    further_investigation: "#0891b2",
    discharge: "#64748b",
    compounded: "#7c3aed",
  };

  return (
    <section>
      <div className="page-header">
        <div>
          <h2>Issue Court Verdict</h2>
          <p className="page-subtitle">Select a case, review the investigation, and pronounce verdict</p>
        </div>
      </div>

      <div style={{ display: "flex", gap: "2rem" }}>
        {/* Left: Form */}
        <div style={{ flex: 1.2 }}>
          <div className="form-card">
            <h3 style={{ marginTop: 0 }}>
              <HiOutlineScale style={{ verticalAlign: "middle", marginRight: 6 }} />
              Verdict Form
            </h3>

            <form onSubmit={handleSubmit}>
              {/* Case Selection */}
              <div className="form-row">
                <div className="form-group">
                  <label>Select Case (FIR) *</label>
                  {firsLoading ? <Loader /> : (
                    <select className="input" value={selectedFirId} onChange={(e) => { setSelectedFirId(e.target.value); setForm(f => ({ ...f, chargesheet_id: "" })); }} required>
                      <option value="">— Choose Case —</option>
                      {firs.map(f => (
                        <option key={f.id} value={f.id}>
                          {f.fir_number} — {f.police_station} [{f.status?.toUpperCase()}]
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                <div className="form-group">
                  <label>Charge Sheet *</label>
                  {csLoading ? <Loader /> : (
                    <select className="input" value={form.chargesheet_id} onChange={set("chargesheet_id")} required>
                      <option value="">— Choose Chargesheet —</option>
                      {chargesheets.map(cs => (
                        <option key={cs.id} value={cs.id}>{cs.chargesheet_number}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Verdict Details */}
              <div className="form-row">
                <div className="form-group">
                  <label>Verdict Type *</label>
                  <select className="input" value={form.verdict_type} onChange={set("verdict_type")} required>
                    {VERDICT_TYPES.map(vt => (
                      <option key={vt.value} value={vt.value}>{vt.label}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Court Name *</label>
                  <input className="input" value={form.court_name} onChange={set("court_name")} placeholder="e.g. District Sessions Court, Delhi" required />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Judge Name / Designation *</label>
                  <input className="input" value={form.judge_name} onChange={set("judge_name")} placeholder="Hon. Justice..." required />
                </div>
                {form.verdict_type === "adjourn" && (
                  <div className="form-group">
                    <label>Next Hearing Date *</label>
                    <input className="input" type="date" value={form.next_hearing_date} onChange={set("next_hearing_date")} required={form.verdict_type === "adjourn"} />
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Verdict Summary / Order *</label>
                <textarea className="input" rows={5} value={form.verdict_summary} onChange={set("verdict_summary")} placeholder="Full verdict, order, or reasoning..." required />
              </div>

              <div className="form-group">
                <label>Detailed Reasoning</label>
                <textarea className="input" rows={3} value={form.reasoning} onChange={set("reasoning")} placeholder="Legal reasoning and analysis..." />
              </div>

              {(form.verdict_type === "conviction") && (
                <div className="form-group">
                  <label>Sentence Details</label>
                  <input className="input" value={form.sentence} onChange={set("sentence")} placeholder="e.g. 7 years RI under IPC 302, fine Rs. 50,000" />
                </div>
              )}

              <button className="btn" type="submit" disabled={submitting}>
                {submitting ? "Recording Verdict..." : "⚖️ Record Official Verdict"}
              </button>
            </form>
          </div>
        </div>

        {/* Right: Previous Verdicts */}
        <div style={{ flex: 0.8 }}>
          <div className="form-card">
            <h3 style={{ marginTop: 0 }}>Previous Verdicts</h3>
            {!selectedFirId ? (
              <p className="text-muted" style={{ fontSize: "0.85rem" }}>Select a case to see previous verdicts.</p>
            ) : verdictList.length === 0 ? (
              <p className="text-muted" style={{ fontSize: "0.85rem" }}>No verdicts recorded for this case yet.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {verdictList.map(v => (
                  <div key={v.id} style={{
                    padding: "1rem", borderRadius: "10px",
                    border: `1px solid ${VERDICT_COLORS[v.verdict_type] || "#e2e8f0"}`,
                    borderLeft: `4px solid ${VERDICT_COLORS[v.verdict_type] || "#64748b"}`,
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                      <span style={{
                        fontWeight: 700, fontSize: "0.85rem",
                        color: VERDICT_COLORS[v.verdict_type] || "#64748b",
                        textTransform: "uppercase",
                      }}>{v.verdict_type?.replace("_", " ")}</span>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        {v.verdict_date ? new Date(v.verdict_date).toLocaleDateString("en-IN") : ""}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: "0.85rem", lineHeight: 1.6 }}>
                      {v.verdict_summary?.slice(0, 200)}{v.verdict_summary?.length > 200 ? "…" : ""}
                    </p>
                    <div style={{ marginTop: "0.5rem", fontSize: "0.78rem", color: "var(--text-muted)" }}>
                      Judge: {v.judge_name} | {v.court_name}
                    </div>
                    {v.blockchain_tx && (
                      <div style={{ marginTop: "4px", fontSize: "0.72rem", color: "#059669", fontFamily: "monospace" }}>
                        <HiOutlineCheckCircle style={{ verticalAlign: "middle" }} /> {v.blockchain_tx.slice(0, 20)}…
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default VerdictPage;
