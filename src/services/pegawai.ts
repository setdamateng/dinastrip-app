import { api } from './api';
import type { Opt } from './types';

export type PegawaiRow = {
  id: number;
  jenis_nip: string | null;
  nip: string;
  nama: string;
  jabatan: string;
  jenis_peg: string;
  golongan: string | null;
  tingkat: string | null;
  bidang: string | null;
  is_aktif: boolean;
};

export type PegawaiDetail = PegawaiRow & {
  gol_id: number;
  bidang_id: number;
  tingkat_id: number;
  is_bendahara: boolean;
  is_kpa: boolean;
  is_pptk: boolean;
  is_ttd: boolean;
};

export type PegawaiForm = {
  jenis_nip: string[];
  jenis_peg: string[];
  golongan: Opt[];
  tingkat: Opt[];
  bidang: Opt[];
};

export type PegawaiPayload = {
  jenis_nip: string;
  nip: string;
  nama: string;
  jabatan: string;
  jenis_peg: string;
  gol_id: number;
  bidang_id: number;
  tingkat_id: number;
  is_bendahara: boolean;
  is_kpa: boolean;
  is_pptk: boolean;
  is_ttd: boolean;
  is_aktif?: boolean;
};

export const pegawaiService = {
  async list(p: { q?: string; jenis?: string; aktif?: 0 | 1; page?: number; per_page?: number }) {
    const res: any = await api.get<PegawaiRow[]>('/pegawai', p);
    return {
      items: res.data as PegawaiRow[],
      meta: res.meta as { current_page: number; last_page: number; total: number } | undefined,
      summary: (res.summary ?? { total: 0, aktif: 0, nonaktif: 0 }) as { total: number; aktif: number; nonaktif: number },
    };
  },
  async form(): Promise<PegawaiForm> {
    return (await api.get<PegawaiForm>('/pegawai/form')).data;
  },
  async detail(id: number | string): Promise<PegawaiDetail> {
    return (await api.get<PegawaiDetail>(`/pegawai/${id}`)).data;
  },
  async create(b: PegawaiPayload): Promise<PegawaiDetail> {
    return (await api.post<PegawaiDetail>('/pegawai', b)).data;
  },
  async update(id: number | string, b: PegawaiPayload): Promise<PegawaiDetail> {
    return (await api.put<PegawaiDetail>(`/pegawai/${id}`, b)).data;
  },
  async setAktif(id: number, is_aktif: boolean) {
    await api.patch(`/pegawai/${id}/aktif`, { is_aktif });
  },
  async remove(id: number) {
    await api.del(`/pegawai/${id}`);
  },
};
