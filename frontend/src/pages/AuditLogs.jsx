import Loader from "../components/Loader";
import adminService from "../services/adminService";
import { useFetch } from "../hooks/useFetch";
import { formatDate } from "../utils/formatDate";

function AuditLogs() {
  const { data, loading, error } = useFetch(() => adminService.getAuditLogs(), []);

  return (
    <section>
      <h2>Audit Logs</h2>
      {loading ? <Loader /> : null}
      {error ? <p className="error-text">Unable to load audit logs.</p> : null}
      <div className="card table-wrap">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>User</th>
              <th>Action</th>
              <th>Evidence</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {(data || []).map((log) => (
              <tr key={log.id}>
                <td>{log.id}</td>
                <td>{log.user_id}</td>
                <td>{log.action}</td>
                <td>{log.evidence_id || "-"}</td>
                <td>{formatDate(log.timestamp)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default AuditLogs;
