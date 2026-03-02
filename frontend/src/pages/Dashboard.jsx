import { useMemo, useState } from "react";
import EvidenceCard from "../components/EvidenceCard";
import Loader from "../components/Loader";
import evidenceService from "../services/evidenceService";
import { useFetch } from "../hooks/useFetch";

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
    return { total: list.length, authentic, suspicious };
  }, [list]);

  return (
    <section>
      <h2>Dashboard</h2>
      <div className="stats-row">
        <div className="card"><strong>{stats.total}</strong><p>Total</p></div>
        <div className="card"><strong>{stats.authentic}</strong><p>Authentic</p></div>
        <div className="card"><strong>{stats.suspicious}</strong><p>Suspicious</p></div>
      </div>

      <div className="filter-row">
        <button className={filter === "ALL" ? "btn" : "btn btn-secondary"} onClick={() => setFilter("ALL")}>All</button>
        <button className={filter === "AUTHENTIC" ? "btn" : "btn btn-secondary"} onClick={() => setFilter("AUTHENTIC")}>Authentic</button>
        <button className={filter === "SUSPICIOUS" ? "btn" : "btn btn-secondary"} onClick={() => setFilter("SUSPICIOUS")}>Suspicious</button>
      </div>

      {loading ? <Loader /> : null}
      {error ? <p className="error-text">Failed to load evidence list.</p> : null}

      <div className="grid">
        {filtered.map((item) => <EvidenceCard key={item.id} item={item} />)}
      </div>
    </section>
  );
}

export default Dashboard;
