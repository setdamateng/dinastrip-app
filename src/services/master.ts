import { api } from './api';
import type { Opt, SptFormMeta } from './types';

type Raw = Record<string, any>;

const kota = (r: Raw): Opt => ({ id: r.id, nama: r.nama });

export const masterService = {
  async form(): Promise<SptFormMeta> {
    return (await api.get<SptFormMeta>('/master/spt-form')).data;
  },

  async kota(q?: string): Promise<Opt[]> {
    return (await api.get<Raw[]>('/master/kota', { q })).data.map(kota);
  },

  /** Pencarian pegawai aktif (server-side, 30 data per permintaan) */
  async pegawai(q?: string): Promise<Opt[]> {
    const r = await api.get<Raw[]>('/master/pegawai', { q, per_page: 30 });
    return r.data.map((p) => ({ id: p.id, nama: p.nama, sub: [p.nip, p.jabatan].filter(Boolean).join(' • ') }));
  },

  async akun(tahun: number, q?: string): Promise<Opt[]> {
    const r = await api.get<Raw[]>('/master/akun', { tahun, q });
    return r.data.map((a) => ({ id: a.id, nama: a.label ?? `${a.mak} - ${a.uraian}`, sub: a.bidang }));
  },

  async ppk(): Promise<Opt[]> {
    const r = await api.get<Raw[]>('/master/ppk');
    return r.data.map((p) => ({ id: p.id, nama: p.nama ?? '-', sub: p.jabatan }));
  },

  async penandatangan(): Promise<Opt[]> {
    const r = await api.get<Raw[]>('/master/penandatangan');
    return r.data.map((p) => ({ id: p.id, nama: p.nama, sub: p.jabatan }));
  },

  /** Hanya super_admin: tujuan "Pindahkan Surat Tugas" */
  async users(q?: string): Promise<Opt[]> {
    const r = await api.get<Raw[]>('/master/users', { q });
    return r.data.map((u) => ({ id: u.id, nama: u.nama, sub: u.bidang }));
  },
};
