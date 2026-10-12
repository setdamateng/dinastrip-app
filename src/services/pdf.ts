import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { API_URL } from '@/config';
import { getToken } from './api';

/**
 * Unduh PDF dari API (dengan token) lalu buka menu bagikan sistem (WhatsApp, Drive, cetak, dst).
 * `path` relatif terhadap /api/v1, contoh "spd/12/pdf/kwitansi".
 */
export async function bagikanPdf(path: string, nama: string): Promise<void> {
  const file = new File(Paths.cache, `${nama.replace(/[^a-zA-Z0-9_-]+/g, '_')}.pdf`);

  try {
    await File.downloadFileAsync(`${API_URL}/${path}`, file, {
      idempotent: true,
      headers: { Authorization: `Bearer ${getToken() ?? ''}`, Accept: 'application/pdf' },
    });
  } catch (e: any) {
    const m = String(e?.message ?? e);
    if (m.includes('403')) throw new Error('Anda tidak memiliki akses ke dokumen ini.');
    if (m.includes('404')) throw new Error('Data untuk dokumen ini belum lengkap.');
    if (m.includes('401')) throw new Error('Sesi berakhir. Silakan masuk kembali.');
    throw new Error('Gagal mengunduh dokumen. Periksa koneksi internet Anda.');
  }

  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('Fitur bagikan tidak tersedia di perangkat ini.');
  }
  await Sharing.shareAsync(file.uri, { mimeType: 'application/pdf', dialogTitle: 'Bagikan dokumen', UTI: 'com.adobe.pdf' });
}
