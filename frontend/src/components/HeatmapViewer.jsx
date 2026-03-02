function HeatmapViewer({ heatmapPath }) {
  if (!heatmapPath) return null;

  return (
    <section className="card">
      <h3>Explainability Heatmap</h3>
      <img src={heatmapPath} alt="AI heatmap" className="responsive-image" />
    </section>
  );
}

export default HeatmapViewer;
