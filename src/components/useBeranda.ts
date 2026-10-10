import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '@/services/api';
import { sptService } from '@/services/spt';
import type { Ringkasan, SptListItem } from '@/services/types';

/** Data Beranda: ringkasan + 5 perjalanan terakhir. Dipakai ketiga Beranda. */
export function useBeranda() {
  const [ringkasan, setRingkasan] = useState<Ringkasan | null>(null);
  const [items, setItems] = useState<SptListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [r, l] = await Promise.all([sptService.ringkasan(), sptService.list({ per_page: 5 })]);
      setRingkasan(r);
      setItems(l.items);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Gagal memuat data.');
    }
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const retry = useCallback(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  return { ringkasan, items, loading, refreshing, error, refresh, retry };
}
