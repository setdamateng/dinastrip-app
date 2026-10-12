import { API_URL } from '@/config';
import type { Envelope } from './types';

export class ApiError extends Error {
  status: number;
  errors?: Record<string, string[]>;
  maintenance: boolean;

  constructor(message: string, status: number, errors?: Record<string, string[]>, maintenance = false) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
    this.maintenance = maintenance;
  }

  /** Pesan error pertama untuk satu field (422) */
  field(name: string): string | undefined {
    return this.errors?.[name]?.[0];
  }
}

let token: string | null = null;
let onUnauthorized: (() => void) | null = null;

export const setToken = (t: string | null) => {
  token = t;
};
export const getToken = () => token;
export const setUnauthorizedHandler = (fn: (() => void) | null) => {
  onUnauthorized = fn;
};

type Query = Record<string, string | number | undefined | null>;
type Options = { query?: Query; body?: unknown; auth?: boolean; timeoutMs?: number };

function buildUrl(path: string, query?: Query) {
  const qs = query
    ? Object.entries(query)
        .filter(([, v]) => v !== undefined && v !== null && v !== '')
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
        .join('&')
    : '';
  return `${API_URL}${path}${qs ? `?${qs}` : ''}`;
}

async function request<T>(method: string, path: string, opts: Options = {}): Promise<Envelope<T>> {
  const { query, body, auth = true, timeoutMs = 20000 } = opts;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let res: Response;
  try {
    res = await fetch(buildUrl(path, query), {
      method,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(auth && token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (e: any) {
    throw new ApiError(
      e?.name === 'AbortError'
        ? 'Server terlalu lama merespons. Coba lagi.'
        : 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.',
      0
    );
  } finally {
    clearTimeout(timer);
  }

  let json: any = null;
  try {
    json = await res.json();
  } catch {}

  if (res.status === 401 && auth && token) {
    onUnauthorized?.();
  }

  if (!res.ok || json?.success === false) {
    throw new ApiError(
      json?.message ?? `Terjadi kesalahan (${res.status}).`,
      res.status,
      json?.errors,
      json?.maintenance === true
    );
  }

  return json as Envelope<T>;
}

export const api = {
  get: <T>(path: string, query?: Query, opts?: Options) => request<T>('GET', path, { ...opts, query }),
  post: <T>(path: string, body?: unknown, opts?: Options) => request<T>('POST', path, { ...opts, body: body ?? {} }),
  put: <T>(path: string, body?: unknown, opts?: Options) => request<T>('PUT', path, { ...opts, body: body ?? {} }),
  patch: <T>(path: string, body?: unknown, opts?: Options) => request<T>('PATCH', path, { ...opts, body: body ?? {} }),
  del: <T>(path: string, body?: unknown, opts?: Options) => request<T>('DELETE', path, { ...opts, body }),
};
