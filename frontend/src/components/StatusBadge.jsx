function StatusBadge({ status }) {
  const key = String(status || "PENDING").toUpperCase();
  return <span className={`badge badge-${key.toLowerCase()}`}>{key}</span>;
}

export default StatusBadge;
