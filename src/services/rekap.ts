import { api } from './api';

export type RekapItem = {
  spd_id: number;
  spt_id: number;
  tgl_spt: string;
  no_spt: string | null;
  nama: string;
  nip: string | null;
  tujuan: string[];
  nilai: number;
  terverifikasi: boolean;
  pembuat: string | null;
};

export type RekapSummary = {
  total: number;
  terverifikasi: number;
  belum_verifikasi: number;
  nilai_total: number;
  nilai_terverifikasi: number;
  nilai_belum: number;
};

export type RekapPage = {
  items: RekapItem[];
  meta?: { current_page: number; last_page: number; per_page: number; total: number };
  summary: RekapSummary;
  pegawai: { id: number; nama: string }[];
};

export const rekapService = {
  async list(p: { bulan: number; tahun: number; pegawai_id?: number; page?: number; per_page?: number }): Promise<RekapPage> {
    const res: any = await api.get<RekapItem[]>('/rekap', p);
    return { items: res.data, meta: res.meta, summary: res.summary, pegawai: res.filter?.pegawai ?? [] };
  },
};
