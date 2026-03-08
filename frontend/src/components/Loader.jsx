function Loader({ label = "Loading..." }) {
  return (
    <div className="loader">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{ animation: "spin 1s linear infinite", marginRight: 8 }}>
        <circle cx="12" cy="12" r="10" stroke="var(--line)" strokeWidth="3" />
        <path d="M12 2a10 10 0 0 1 10 10" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" />
      </svg>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      {label}
    </div>
  );
}

export default Loader;
