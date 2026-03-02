function AIResultCard({ evidence }) {
  if (!evidence) return null;

  return (
    <section className="card">
      <h3>AI Analysis</h3>
      <p>Status: {evidence.ai_status}</p>
      <p>Score: {evidence.ai_score ?? "-"}</p>
      <p>Model: {evidence.model_version || "-"}</p>
      <p>Manipulation Type: {evidence.manipulation_type || "Not detected"}</p>
    </section>
  );
}

export default AIResultCard;
