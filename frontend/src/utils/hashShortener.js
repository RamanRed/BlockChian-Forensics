export function hashShortener(hash, start = 10, end = 8) {
  if (!hash || hash.length <= start + end) return hash || "-";
  return `${hash.slice(0, start)}...${hash.slice(-end)}`;
}
