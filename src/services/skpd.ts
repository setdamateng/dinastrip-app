import { api } from './api';

export type SkpdRow = {
  id: number;
  nama_skpd: string;
  singkatan: string | null;
  tipe_kop: string;
  tipe_label: string;
  is_aktif: boolean;
  bidang_count: number;
};

export type SkpdDetail = SkpdRow & {
  nama_kop: string;
  alamat: string | null;
  website: string | null;
  email: string | null;
  tipe_logo: string;
  pegawai_count: number;
  bidang: { id: number; nama: string }[];
};

export type SkpdForm = {
  tipe_kop: { id: string; nama: string }[];
  tipe_logo: { id: string; nama: string }[];
};

export type SkpdPayload = {
  tipe_kop: string;
  tipe_logo: string;
  nama_skpd: string;
  singkatan?: string;
  nama_kop: string;
  alamat?: string;
  website?: string;
  email?: string;
  is_aktif: boolean;
};

export const skpdService = {
  async list(p: { q?: string; aktif?: 0 | 1; page?: number; per_page?: number }) {
    const res: any = await api.get<SkpdRow[]>('/skpd', p);
    return {
      items: res.data as SkpdRow[],
      meta: res.meta as { current_page: number; last_page: number; total: number } | undefined,
      summary: (res.summary ?? { total: 0, aktif: 0, nonaktif: 0 }) as { total: number; aktif: number; nonaktif: number },
    };
  },
  async form(): Promise<SkpdForm> {
    return (await api.get<SkpdForm>('/skpd/form')).data;
  },
  async detail(id: number | string): Promise<SkpdDetail> {
    return (await api.get<SkpdDetail>(`/skpd/${id}`)).data;
  },
  async create(b: SkpdPayload): Promise<SkpdDetail> {
    return (await api.post<SkpdDetail>('/skpd', b)).data;
  },
  async update(id: number | string, b: SkpdPayload): Promise<SkpdDetail> {
    return (await api.put<SkpdDetail>(`/skpd/${id}`, b)).data;
  },
  async setAktif(id: number, is_aktif: boolean) {
    await api.patch(`/skpd/${id}/aktif`, { is_aktif });
  },
};
