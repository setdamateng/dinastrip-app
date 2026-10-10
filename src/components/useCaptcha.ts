import { useCallback, useEffect, useState } from 'react';
import { API_URL } from '@/config';
import { ApiError } from '@/services/api';
import { authService } from '@/services/auth';
import type { Captcha } from '@/services/types';

export function useCaptcha() {
  const [captcha, setCaptcha] = useState<Captcha | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      setCaptcha(await authService.captcha());
    } catch (e) {
      setCaptcha(null);
      const msg = e instanceof ApiError ? e.message : 'Gagal memuat kode.';
      // mode development: tampilkan alamat API yang dipakai supaya gampang cek .env
      setLoadError(__DEV__ ? `${msg}\n(${API_URL || 'EXPO_PUBLIC_API_URL kosong'})` : msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { captcha, loading, loadError, refresh };
}
