import { useCallback, useEffect, useState } from "react";

export function useFetch(fetcher, deps = [], enabled = true) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(Boolean(enabled));
  const [error, setError] = useState(null);
  const [tick, setTick] = useState(0);

  const run = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetcher();
      setData(res);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [...deps, enabled, tick]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    let cancelled = false;
    if (!enabled) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    fetcher()
      .then((res) => { if (!cancelled) setData(res); })
      .catch((err) => { if (!cancelled) setError(err); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [...deps, tick]); // eslint-disable-line react-hooks/exhaustive-deps

  const refetch = () => setTick((t) => t + 1);

  return { data, loading, error, setData, refetch };
}
