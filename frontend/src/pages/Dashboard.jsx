import { useMemo, useState } from "react";
import EvidenceCard from "../components/EvidenceCard";
import Loader from "../components/Loader";
import evidenceService from "../services/evidenceService";
import { useFetch } from "../hooks/useFetch";
import { HiOutlineCollection, HiOutlineShieldCheck, HiOutlineExclamation, HiOutlineClock } from "react-icons/hi";

function Dashboard() {
  const [filter, setFilter] = useState("ALL");
  const { data, loading, error } = useFetch(() => evidenceService.getAllEvidence(), []);

  const list = data || [];
  const filtered = useMemo(() => {
    if (filter === "ALL") return list;
    return list.filter((item) => item.ai_status === filter);
  }, [list, filter]);

  const stats = useMemo(() => {
    const authentic = list.filter((x) => x.ai_status === "AUTHENTIC").length;
    const suspicious = list.filter((x) => x.ai_status === "SUSPICIOUS").length;
    const pending = list.filter((x) => x.ai_status === "PENDING").length;
    return { total: list.length, authentic, suspicious, pending };
  }, [list]);

  return (
    <section>
      <div className="page-header">
        <div>
          <h2>Dashboard</h2>
          <p className="page-subtitle">Overview of all digital evidence in the system</p>
        </div>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-icon purple"><HiOutlineCollection /></div>
          <div>
            <div className="stat-value">{stats.total.toLocaleString()}</div>
            <div className="stat-label">Total Evidence</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><HiOutlineShieldCheck /></div>
          <div>
            <div className="stat-value">{stats.authentic.toLocaleString()}</div>
            <div className="stat-label">Authentic</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red"><HiOutlineExclamation /></div>
          <div>
            <div className="stat-value">{stats.suspicious.toLocaleString()}</div>
            <div className="stat-label">Suspicious</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue"><HiOutlineClock /></div>
          <div>
            <div className="stat-value">{stats.pending.toLocaleString()}</div>
            <div className="stat-label">Pending</div>
          </div>
        </div>
      </div>

      <div className="filter-row">
        <button className={filter === "ALL" ? "btn" : "btn btn-secondary"} onClick={() => setFilter("ALL")}>All</button>
        <button className={filter === "AUTHENTIC" ? "btn" : "btn btn-secondary"} onClick={() => setFilter("AUTHENTIC")}>Authentic</button>
        <button className={filter === "SUSPICIOUS" ? "btn" : "btn btn-secondary"} onClick={() => setFilter("SUSPICIOUS")}>Suspicious</button>
      </div>

      {loading && <Loader />}
      {error && <p className="error-text">Failed to load evidence list.</p>}

      {!loading && filtered.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon"><HiOutlineCollection /></div>
          <p style={{ fontWeight: 600, color: "var(--text)" }}>No evidence found</p>
          <p className="text-sm text-muted">Upload your first evidence file to get started</p>
        </div>
      )}

      <div className="grid">
        {filtered.map((item) => <EvidenceCard key={item.id} item={item} />)}
      </div>
    </section>
  );
}

export default Dashboard;
