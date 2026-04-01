import { useState } from "react";
import { toast } from "react-toastify";
import Loader from "../components/Loader";
import { useFetch } from "../hooks/useFetch";
import { adminService } from "../services/dirsService";
import {
  HiOutlineUsers,
  HiOutlineSearch,
  HiOutlineShieldCheck,
  HiOutlineShieldExclamation,
  HiOutlineRefresh,
} from "react-icons/hi";

const ROLES = ["io", "sp", "dsp", "cfsl", "court", "auditor", "admin"];
const roleColors = {
  admin: "avatar-purple",
  io: "avatar-blue",
  sp: "avatar-green",
  dsp: "avatar-green",
  auditor: "avatar-red",
  cfsl: "avatar-blue",
  court: "avatar-blue",
};

function AdminPanel() {
  const [searchUsers, setSearchUsers] = useState("");
  const [searchLogs, setSearchLogs] = useState("");
  const [tab, setTab] = useState("users");
  const [updatingRole, setUpdatingRole] = useState(null);

  const {
    data: usersData,
    loading: usersLoading,
    error: usersError,
    refetch: refetchUsers,
  } = useFetch(() => adminService.getUsers(), []);

  const {
    data: logsData,
    loading: logsLoading,
    error: logsError,
  } = useFetch(() => adminService.getAuditLogs({ limit: 200 }), []);

  const {
    data: quarantineData,
    loading: qLoading,
  } = useFetch(() => adminService.getQuarantine(), []);

  const users = Array.isArray(usersData) ? usersData : [];
  const logs = Array.isArray(logsData) ? logsData : (logsData?.logs || []);
  const quarantine = Array.isArray(quarantineData) ? quarantineData : [];

  const filteredUsers = users.filter(
    (u) =>
      !searchUsers ||
      u.name?.toLowerCase().includes(searchUsers.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchUsers.toLowerCase()) ||
      u.role?.toLowerCase().includes(searchUsers.toLowerCase())
  );

  const filteredLogs = logs.filter(
    (l) =>
      !searchLogs ||
      l.action?.toLowerCase().includes(searchLogs.toLowerCase()) ||
      l.user_name?.toLowerCase().includes(searchLogs.toLowerCase()) ||
      String(l.user_id).includes(searchLogs)
  );

  const handleRoleChange = async (userId, newRole) => {
    setUpdatingRole(userId);
    try {
      await adminService.updateRole(userId, newRole);
      toast.success(`Role updated to ${newRole} ✓`);
      refetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Role update failed");
    } finally {
      setUpdatingRole(null);
    }
  };

  const handleToggleActive = async (userId, currentActive) => {
    try {
      await adminService.toggleActive(userId, !currentActive);
      toast.success(currentActive ? "User deactivated" : "User activated");
      refetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed");
    }
  };

  const actionColor = (action = "") => {
    if (action.includes("LOGIN")) return "badge-green";
    if (action.includes("DELETE")) return "badge-red";
    if (action.includes("REGISTER") || action.includes("CREATE")) return "badge-blue";
    if (action.includes("UPDATE") || action.includes("STATUS")) return "badge-yellow";
    if (action.includes("VIEW") || action.includes("LIST")) return "badge-gray";
    return "badge-purple";
  };

  return (
    <section>
      <div className="page-header">
        <div>
          <h2>Admin Panel</h2>
          <p className="page-subtitle">User management, audit trail, and quarantine</p>
        </div>
      </div>

      <div className="filter-row">
        <button className={tab === "users" ? "btn" : "btn btn-secondary"} onClick={() => setTab("users")}>
          <HiOutlineUsers style={{ verticalAlign: "middle", marginRight: 4 }} /> Users ({users.length})
        </button>
        <button className={tab === "logs" ? "btn" : "btn btn-secondary"} onClick={() => setTab("logs")}>
          Audit Logs ({logs.length})
        </button>
        <button className={tab === "quarantine" ? "btn" : "btn btn-secondary"} onClick={() => setTab("quarantine")}>
          <HiOutlineShieldExclamation style={{ verticalAlign: "middle", marginRight: 4 }} />
          Quarantine ({quarantine.length})
        </button>
      </div>

      {/* ── Users ── */}
      {tab === "users" && (
        <div className="section-card">
          <div className="section-card-header">
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <HiOutlineUsers style={{ color: "var(--primary)", fontSize: "1.1rem" }} />
              <h3 style={{ margin: 0 }}>System Users</h3>
              <span className="badge badge-purple" style={{ marginLeft: 4 }}>{users.length}</span>
            </div>
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <div className="search-bar">
                <HiOutlineSearch className="search-icon" />
                <input placeholder="Search users…" value={searchUsers} onChange={(e) => setSearchUsers(e.target.value)} />
              </div>
              <button className="btn btn-secondary btn-sm btn-icon" onClick={refetchUsers} title="Refresh">
                <HiOutlineRefresh />
              </button>
            </div>
          </div>
          {usersLoading && <Loader />}
          {usersError && <p className="error-text" style={{ padding: "1rem" }}>Failed to load users.</p>}
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                        <div className={`avatar ${roleColors[u.role] || "avatar-purple"}`}>
                          {u.name ? u.name.charAt(0).toUpperCase() : "U"}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{u.name || "—"}</div>
                          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>ID: {u.id}</div>
                        </div>
                      </div>
                    </td>
                    <td>{u.email}</td>
                    <td>
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        disabled={updatingRole === u.id}
                        style={{
                          width: "auto",
                          margin: 0,
                          padding: "0.3rem 0.5rem",
                          fontSize: "0.82rem",
                          borderRadius: "var(--radius-xs)",
                        }}
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>{r.toUpperCase()}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <span className={`badge ${u.is_active !== false ? "badge-green" : "badge-red"}`}>
                        {u.is_active !== false ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      <button
                        className={`btn btn-sm ${u.is_active !== false ? "btn-danger" : "btn-success"}`}
                        onClick={() => handleToggleActive(u.id, u.is_active !== false)}
                      >
                        {u.is_active !== false ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && !usersLoading && (
                  <tr><td colSpan={5} style={{ textAlign: "center", color: "var(--text-muted)", padding: "2rem" }}>No users found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Audit Logs ── */}
      {tab === "logs" && (
        <div className="section-card">
          <div className="section-card-header">
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <h3 style={{ margin: 0 }}>Audit Trail</h3>
              <span className="badge badge-blue" style={{ marginLeft: 4 }}>{logs.length}</span>
            </div>
            <div className="search-bar">
              <HiOutlineSearch className="search-icon" />
              <input placeholder="Search logs…" value={searchLogs} onChange={(e) => setSearchLogs(e.target.value)} />
            </div>
          </div>
          {logsLoading && <Loader />}
          {logsError && <p className="error-text" style={{ padding: "1rem" }}>Failed to load audit logs.</p>}
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>User</th>
                  <th>Action</th>
                  <th>Record</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr key={log.id}>
                    <td style={{ color: "var(--text-secondary)", fontWeight: 600 }}>#{log.id}</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div className="avatar avatar-blue" style={{ width: 28, height: 28, fontSize: "0.68rem" }}>
                          {log.user_name?.charAt(0) || "U"}
                        </div>
                        <span>{log.user_name || `User ${log.user_id}`}</span>
                      </div>
                    </td>
                    <td><span className={`badge ${actionColor(log.action)}`}>{log.action}</span></td>
                    <td style={{ fontFamily: "monospace", fontSize: "0.78rem", color: "var(--text-secondary)" }}>
                      {log.record_type ? `${log.record_type}#${log.record_id}` : log.evidence_id ? `Evidence#${log.evidence_id}` : "—"}
                    </td>
                    <td style={{ color: "var(--text-secondary)", fontSize: "0.82rem" }}>
                      {log.timestamp ? new Date(log.timestamp).toLocaleString("en-IN") : log.created_at ? new Date(log.created_at).toLocaleString("en-IN") : "—"}
                    </td>
                  </tr>
                ))}
                {filteredLogs.length === 0 && !logsLoading && (
                  <tr><td colSpan={5} style={{ textAlign: "center", color: "var(--text-muted)", padding: "2rem" }}>No logs found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Quarantine ── */}
      {tab === "quarantine" && (
        <div className="section-card">
          <div className="section-card-header">
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <HiOutlineShieldExclamation style={{ color: "var(--danger)", fontSize: "1.1rem" }} />
              <h3 style={{ margin: 0 }}>Quarantine — Suspicious Evidence</h3>
              <span className="badge badge-red" style={{ marginLeft: 4 }}>{quarantine.length}</span>
            </div>
          </div>
          {qLoading && <Loader />}
          {!qLoading && quarantine.length === 0 && (
            <div className="empty-state" style={{ padding: "2.5rem" }}>
              <div className="empty-state-icon"><HiOutlineShieldCheck /></div>
              <p style={{ fontWeight: 600 }}>No items in quarantine</p>
              <p className="text-muted text-sm">All evidence has cleared AI analysis.</p>
            </div>
          )}
          {quarantine.length > 0 && (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>File</th>
                    <th>AI Score</th>
                    <th>Status</th>
                    <th>Quarantined At</th>
                  </tr>
                </thead>
                <tbody>
                  {quarantine.map((item) => (
                    <tr key={item.id}>
                      <td style={{ fontWeight: 600, color: "var(--text-secondary)" }}>#{item.id}</td>
                      <td>{item.original_filename || item.property_number || "—"}</td>
                      <td>
                        {item.ai_score != null && (
                          <span className="badge badge-red">{(item.ai_score * 100).toFixed(0)}% suspicious</span>
                        )}
                      </td>
                      <td><span className="badge badge-red">QUARANTINED</span></td>
                      <td style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                        {item.created_at ? new Date(item.created_at).toLocaleString("en-IN") : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

export default AdminPanel;
