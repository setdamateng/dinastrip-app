import { api } from './api';
import type { BulkAction, BulkResult, Ringkasan, SptDetail, SptListItem, SptPayload, SptStatusCode } from './types';

export const sptService = {
  async ringkasan(tahun?: number): Promise<Ringkasan> {
    return (await api.get<Ringkasan>('/spt/ringkasan', { tahun })).data;
  },

  async list(p: { tahun?: number; status?: SptStatusCode; q?: string; page?: number; per_page?: number } = {}) {
    const res = await api.get<SptListItem[]>('/spt', p);
    return { items: res.data, meta: res.meta };
  },

  async detail(id: string): Promise<SptDetail> {
    return (await api.get<SptDetail>(`/spt/${id}`)).data;
  },

  // ---- tulis ----
  async create(body: SptPayload): Promise<SptDetail> {
    return (await api.post<SptDetail>('/spt', body)).data;
  },
  async update(id: string, body: SptPayload): Promise<SptDetail> {
    return (await api.put<SptDetail>(`/spt/${id}`, body)).data;
  },
  async remove(id: string): Promise<void> {
    await api.del(`/spt/${id}`);
  },

  // ---- alur status (balasan = detail terbaru) ----
  async ajukan(id: string) {
    return (await api.post<SptDetail>(`/spt/${id}/ajukan`)).data;
  },
  async batalAjukan(id: string) {
    return (await api.post<SptDetail>(`/spt/${id}/batal-ajukan`)).data;
  },
  async verifikasi(id: string, tglKwitansi: string) {
    return (await api.post<SptDetail>(`/spt/${id}/verifikasi`, { tgl_kwitansi: tglKwitansi })).data;
  },
  async batalVerifikasi(id: string) {
    return (await api.post<SptDetail>(`/spt/${id}/batal-verifikasi`)).data;
  },
  async tolak(id: string, alasan: string) {
    return (await api.post<SptDetail>(`/spt/${id}/tolak`, { alasan })).data;
  },
  async pindah(id: string, userId: number) {
    return (await api.post<SptDetail>(`/spt/${id}/pindah`, { user_id: userId })).data;
  },

  /** Aksi massal. Balasan memuat jumlah berhasil + daftar yang gagal beserta alasannya. */
  async bulk(
    action: BulkAction,
    ids: string[],
    extra: { tgl_kwitansi?: string; alasan?: string; kelompok?: string } = {},
  ): Promise<{ message: string; result: BulkResult }> {
    const res = await api.post<BulkResult>('/spt/bulk', { action, ids, ...extra });
    return { message: res.message, result: res.data };
  },
};
