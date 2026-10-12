import { api } from './api';

export type MenuItem = { key: string; label: string; group: string; icon: string; kind: 'resource' | 'screen'; route?: string };

export type FieldDef = {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'money' | 'select' | 'toggle' | 'password';
  required?: boolean;
  source?: string | null;
  options?: { id: string | number; nama: string }[] | null;
  only?: 'edit' | null;
  hint?: string;
  default?: unknown;
};

export type ResMeta = {
  key: string;
  label: string;
  plural: string;
  fields: FieldDef[];
  abilities: { create: boolean; update: boolean; delete: boolean };
  filter_tahun: boolean;
};

export type SelVal = { id: string | number; nama: string; sub?: string | null } | null;

export type ResRow = {
  id: number;
  title: string;
  subtitle?: string | null;
  lines: string[];
  badges: { text: string; tone: 'ok' | 'off' | 'info' | 'premium' }[];
  amounts?: Record<string, number>;
  children_label?: string;
  children?: { id: number; title: string }[];
  values: Record<string, unknown>;
};

export const resService = {
  async menu(): Promise<MenuItem[]> {
    return (await api.get<MenuItem[]>('/menu')).data;
  },
  async meta(key: string): Promise<ResMeta> {
    return (await api.get<ResMeta>(`/res/${key}/meta`)).data;
  },
  async list(key: string, p: { q?: string; page?: number; tahun?: number }) {
    const res: any = await api.get<ResRow[]>(`/res/${key}`, { ...p, per_page: 15 });
    return {
      items: res.data as ResRow[],
      meta: res.meta as { current_page: number; last_page: number; total: number } | undefined,
      abilities: (res.abilities ?? { create: false, update: false, delete: false }) as ResMeta['abilities'],
    };
  },
  async options(key: string, field: string, q: string): Promise<{ id: string | number; nama: string; sub?: string | null }[]> {
    return (await api.get<any[]>(`/res/${key}/options/${field}`, { q })).data;
  },
  async create(key: string, body: Record<string, unknown>) {
    return (await api.post<ResRow>(`/res/${key}`, body)).data;
  },
  async update(key: string, id: number | string, body: Record<string, unknown>) {
    return (await api.put<ResRow>(`/res/${key}/${id}`, body)).data;
  },
  async remove(key: string, id: number | string) {
    await api.del(`/res/${key}/${id}`);
  },
};

/** Baris yang sedang diubah (dibawa dari daftar ke form tanpa panggilan ulang). */
let editing: ResRow | null = null;
export const editStore = {
  set: (r: ResRow | null) => {
    editing = r;
  },
  get: () => editing,
};
