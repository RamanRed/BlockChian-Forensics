import { useState } from "react";
import Loader from "../components/Loader";
import adminService from "../services/adminService";
import { useFetch } from "../hooks/useFetch";
import { formatDate } from "../utils/formatDate";
import { HiOutlineClipboardList, HiOutlineSearch } from "react-icons/hi";

const actionColors = {
  EVIDENCE_UPLOADED: "badge-verified",
  USER_LOGIN: "badge-authentic",
  EVIDENCE_VERIFIED: "badge-authentic",
  EVIDENCE_DELETED: "badge-suspicious",
  USER_REGISTERED: "badge-pending",
  USER_ROLE_UPDATED: "badge-pending",
  EVIDENCE_VIEWED: "badge-verified"
};

function AuditLogs() {
  const { data, loading, error } = useFetch(() => adminService.getAuditLogs(), []);
  const [search, setSearch] = useState("");

  const logs = (data || []).filter((log) =>
    !search || log.action?.toLowerCase().includes(search.toLowerCase()) || String(log.user_id).includes(search)
  );

  return (
    <section>
      <div className="page-header">
        <div>
          <h2>Audit Logs</h2>
          <p className="page-subtitle">Complete activity trail for all system actions</p>
        </div>
      </div>

      {loading && <Loader />}
      {error && <p className="error-text">Unable to load audit logs.</p>}

      <div className="section-card">
        <div className="section-card-header">
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <HiOutlineClipboardList style={{ color: "var(--primary)", fontSize: "1.1rem" }} />
            <h3 style={{ margin: 0 }}>Activity Log</h3>
            <span className="badge badge-verified" style={{ marginLeft: "0.25rem" }}>{(data || []).length}</span>
          </div>
          <div className="search-bar">
            <HiOutlineSearch className="search-icon" />
            <input placeholder="Search logs..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>User</th>
                <th>Action</th>
                <th>Evidence</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td style={{ fontWeight: 600, color: "var(--text-secondary)" }}>#{log.id}</td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <div className="avatar avatar-blue" style={{ width: 28, height: 28, fontSize: "0.7rem" }}>
                        {String(log.user_id).charAt(0)}
                      </div>
                      <span>User {log.user_id}</span>
                    </div>
                  </td>
                  <td><span className={`badge ${actionColors[log.action] || "badge-pending"}`}>{log.action}</span></td>
                  <td>{log.evidence_id ? `#${log.evidence_id}` : "-"}</td>
                  <td style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>{formatDate(log.timestamp)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

export default AuditLogs;
