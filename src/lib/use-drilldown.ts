"use client";

import { useCallback, useState } from "react";

/**
 * Inline expandable-row state: tracks which parent row is expanded, lazily
 * fetches its children once (caching the result), and exposes a loading flag.
 */
export function useDrilldown<T>(fetcher: (id: number) => Promise<T[]>) {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [cache, setCache] = useState<Map<number, T[]>>(new Map());
  const [loadingId, setLoadingId] = useState<number | null>(null);

  const toggle = useCallback(
    async (id: number) => {
      const willOpen = expandedId !== id;
      setExpandedId(willOpen ? id : null);
      if (willOpen && !cache.has(id)) {
        setLoadingId(id);
        try {
          const data = await fetcher(id);
          setCache((prev) => new Map(prev).set(id, data));
        } catch {
          setCache((prev) => new Map(prev).set(id, []));
        } finally {
          setLoadingId((cur) => (cur === id ? null : cur));
        }
      }
    },
    [expandedId, cache, fetcher],
  );

  return { expandedId, cache, loadingId, toggle };
}
