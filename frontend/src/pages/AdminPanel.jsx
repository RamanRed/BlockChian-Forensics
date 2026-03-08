import { useEffect, useState } from "react";
import adminService from "../services/adminService";
import evidenceService from "../services/evidenceService";
import StatusBadge from "../components/StatusBadge";
import { HiOutlineUsers, HiOutlineCollection, HiOutlineTrash, HiOutlineSearch } from "react-icons/hi";

function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [evidence, setEvidence] = useState([]);
  const [error, setError] = useState("");
  const [searchUsers, setSearchUsers] = useState("");
  const [searchEvidence, setSearchEvidence] = useState("");

  const loadData = async () => {
    setError("");
    try {
      const [usersData, evidenceData] = await Promise.all([
        adminService.getUsers(),
        evidenceService.getAllEvidence({ limit: 200 })
      ]);
      setUsers(usersData);
      setEvidence(evidenceData);
    } catch (err) {
      setError("Failed to load admin data.");
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRoleChange = async (userId, role) => {
    await adminService.updateUserRole(userId, role);
    await loadData();
  };

  const handleDeleteEvidence = async (id) => {
    await adminService.deleteEvidence(id);
    await loadData();
  };

  const filteredUsers = users.filter((u) =>
    !searchUsers || u.name?.toLowerCase().includes(searchUsers.toLowerCase()) || u.email?.toLowerCase().includes(searchUsers.toLowerCase())
  );

  const filteredEvidence = evidence.filter((e) =>
    !searchEvidence || e.original_filename?.toLowerCase().includes(searchEvidence.toLowerCase())
  );

  const roleColors = { admin: "avatar-purple", investigator: "avatar-blue", auditor: "avatar-green" };

  return (
    <section>
      <div className="page-header">
        <div>
          <h2>Admin Panel</h2>
          <p className="page-subtitle">Manage users and evidence records</p>
        </div>
      </div>

      {error && <p className="error-text">{error}</p>}

      {/* Users Table */}
      <div className="section-card mb-2">
        <div className="section-card-header">
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <HiOutlineUsers style={{ color: "var(--primary)", fontSize: "1.1rem" }} />
            <h3 style={{ margin: 0 }}>Users</h3>
            <span className="badge badge-verified" style={{ marginLeft: "0.25rem" }}>{users.length}</span>
          </div>
          <div className="search-bar">
            <HiOutlineSearch className="search-icon" />
            <input placeholder="Search users..." value={searchUsers} onChange={(e) => setSearchUsers(e.target.value)} />
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
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
                        <div style={{ fontWeight: 600 }}>{u.name || "Unknown"}</div>
                        <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>ID: {u.id}</div>
                      </div>
                    </div>
                  </td>
                  <td>{u.email}</td>
                  <td>
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      style={{ width: "auto", margin: 0, padding: "0.35rem 0.5rem", fontSize: "0.82rem", borderRadius: "var(--radius-xs)" }}
                    >
                      <option value="admin">Admin</option>
                      <option value="investigator">Investigator</option>
                      <option value="auditor">Auditor</option>
                    </select>
                  </td>
                  <td><span className="badge badge-authentic">Active</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Evidence Table */}
      <div className="section-card">
        <div className="section-card-header">
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <HiOutlineCollection style={{ color: "var(--primary)", fontSize: "1.1rem" }} />
            <h3 style={{ margin: 0 }}>Evidence Management</h3>
            <span className="badge badge-verified" style={{ marginLeft: "0.25rem" }}>{evidence.length}</span>
          </div>
          <div className="search-bar">
            <HiOutlineSearch className="search-icon" />
            <input placeholder="Search evidence..." value={searchEvidence} onChange={(e) => setSearchEvidence(e.target.value)} />
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Filename</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvidence.map((item) => (
                <tr key={item.id}>
                  <td style={{ fontWeight: 600, color: "var(--text-secondary)" }}>#{item.id}</td>
                  <td style={{ fontWeight: 500 }}>{item.original_filename}</td>
                  <td><StatusBadge status={item.ai_status} /></td>
                  <td>
                    <button className="btn btn-sm btn-danger" onClick={() => handleDeleteEvidence(item.id)}>
                      <HiOutlineTrash /> Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

export default AdminPanel;
