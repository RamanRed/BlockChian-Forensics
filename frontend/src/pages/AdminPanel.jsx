import { useEffect, useState } from "react";
import adminService from "../services/adminService";
import evidenceService from "../services/evidenceService";

function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [evidence, setEvidence] = useState([]);
  const [error, setError] = useState("");

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

  return (
    <section>
      <h2>Admin Panel</h2>
      {error ? <p className="error-text">{error}</p> : null}

      <div className="card table-wrap">
        <h3>Users</h3>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>
                  <select value={u.role} onChange={(e) => handleRoleChange(u.id, e.target.value)}>
                    <option value="admin">admin</option>
                    <option value="investigator">investigator</option>
                    <option value="auditor">auditor</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card table-wrap">
        <h3>Evidence Management</h3>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>File</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {evidence.map((item) => (
              <tr key={item.id}>
                <td>{item.id}</td>
                <td>{item.original_filename}</td>
                <td>{item.ai_status}</td>
                <td>
                  <button className="btn btn-danger" onClick={() => handleDeleteEvidence(item.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default AdminPanel;
