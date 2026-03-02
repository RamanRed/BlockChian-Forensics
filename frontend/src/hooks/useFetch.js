import { useEffect, useState } from "react";

export function useFetch(fetcher, deps = [], enabled = true) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(Boolean(enabled));
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    if (!enabled) {
      setLoading(false);
      return () => {
        cancelled = true;
      };
    }

    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetcher();
        if (!cancelled) setData(res);
      } catch (err) {
        if (!cancelled) setError(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, deps);

  return { data, loading, error, setData };
}
