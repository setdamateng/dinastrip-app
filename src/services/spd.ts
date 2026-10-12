import { api } from './api';
import type { Opt, RiilItem, RincianItem, SptStatusCode } from './types';

export type Pejabat = { id: number; nama: string; nip: string | null } | null;
export type Dokumen = { key: string; label: string; path: string };

export type SpdFull = {
  id: number;
  spt_id: number;
  urutan: number | null;
  pegawai_id: number | null;
  nama: string;
  nip: string | null;
  jabatan: string | null;
  golongan: string | null;
  tingkat: string | null;
  bidang: string | null;
  no_spt: string | null;
  no_spd: string | null;
  bendahara: Pejabat;
  kpa: Pejabat;
  pptk: Pejabat;
  kwitansi: { total_rincian: number; total_riil: number; total: number; tgl_kwitansi: string | null } | null;
  status_kwitansi: 'Tersedia' | 'Kosong' | 'Belum Dibuat';
  spt: { id: number; status: SptStatusCode; tgl_berangkat: string | null; tgl_kembali: string | null; untuk: string | null; tujuan: string[] };
  dokumen: Dokumen[];
  rincian: RincianItem[];
  riil: RiilItem[];
  total_panjar: number;
  sisa_dibayar: number;
  has_laporan: boolean;
  abilities: { can_edit_biaya: boolean; can_access_laporan: boolean };
};

export type Summary = {
  kwitansi: SpdFull['kwitansi'];
  status_kwitansi: SpdFull['status_kwitansi'];
  total_panjar: number;
  sisa_dibayar: number;
};

export type RincianMeta = {
  jenis_rincian: { value: string; label: string }[];
  satuan: string[];
  potongan: { value: number; label: string }[];
};

export type RincianPayload = Record<string, string | number | null>;

export type Laporan = {
  tgl_laporan: string | null;
  maksud_perjalanan: string | null;
  instansi_dikunjungi: string | null;
  hasil_kegiatan: string | null;
  kesimpulan: string | null;
  rekomendasi: string | null;
};

export type LaporanState = { laporan: Laporan | null; defaults: { maksud_perjalanan: string | null; tgl_kembali: string | null } };

export type Bandara = { code: string; label: string };

type Raw = Record<string, any>;

export const spdService = {
  async detail(id: number | string): Promise<SpdFull> {
    return (await api.get<SpdFull>(`/spd/${id}`)).data;
  },
  async update(id: number | string, b: { no_spt: string; no_spd: string; bendahara_id: number; kpa_id: number; pptk_id: number }): Promise<SpdFull> {
    return (await api.put<SpdFull>(`/spd/${id}`, b)).data;
  },
  async pejabat(jenis: 'bendahara' | 'kpa' | 'pptk'): Promise<Opt[]> {
    const r = await api.get<Raw[]>(`/master/pejabat/${jenis}`);
    return r.data.map((p) => ({ id: p.id, nama: p.nama, sub: [p.nip, p.jabatan].filter(Boolean).join(' • ') }));
  },

  // ---- rincian ----
  async rincianMeta(): Promise<RincianMeta> {
    return (await api.get<RincianMeta>('/master/rincian-form')).data;
  },
  async rincianList(spd: number | string): Promise<RincianItem[]> {
    return (await api.get<RincianItem[]>(`/spd/${spd}/rincian`)).data;
  },
  async rincianCreate(spd: number | string, b: RincianPayload) {
    return (await api.post<{ rincian: RincianItem; summary: Summary }>(`/spd/${spd}/rincian`, b)).data;
  },
  async rincianUpdate(id: number, b: RincianPayload) {
    return (await api.put<{ rincian: RincianItem; summary: Summary }>(`/rincian/${id}`, b)).data;
  },
  async rincianDelete(id: number) {
    return (await api.del<{ summary: Summary }>(`/rincian/${id}`)).data;
  },
  async bandara(q?: string): Promise<Bandara[]> {
    return (await api.get<Bandara[]>('/master/bandara', { q })).data;
  },

  // ---- riil ----
  async riilCreate(spd: number | string, b: { uraian: string; nominal: number; keterangan?: string }) {
    return (await api.post<{ riil: RiilItem; summary: Summary }>(`/spd/${spd}/riil`, b)).data;
  },
  async riilUpdate(id: number, b: { uraian: string; nominal: number; keterangan?: string }) {
    return (await api.put<{ riil: RiilItem; summary: Summary }>(`/riil/${id}`, b)).data;
  },
  async riilDelete(id: number) {
    return (await api.del<{ summary: Summary }>(`/riil/${id}`)).data;
  },

  // ---- laporan perjadin (premium) ----
  async laporan(spd: number | string): Promise<LaporanState> {
    return (await api.get<LaporanState>(`/spd/${spd}/laporan`)).data;
  },
  async laporanSave(spd: number | string, b: Record<string, string>): Promise<Laporan> {
    return (await api.put<Laporan>(`/spd/${spd}/laporan`, b)).data;
  },
};
