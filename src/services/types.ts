export type Envelope<T> = {
  success: boolean;
  message: string;
  data: T;
  meta?: { current_page: number; last_page: number; per_page: number; total: number };
  errors?: Record<string, string[]>;
  warnings?: string[];
};

export type Role = 'super_admin' | 'admin_opd' | 'pegawai' | string;

export type User = {
  id: number;
  name: string;
  username: string | null;
  email: string;
  avatar_url: string | null;
  bidang: { id: number; nama: string } | null;
  skpd?: { id: number; nama: string } | null;
  roles: Role[];
  can_access_laporan: boolean;
  is_premium?: boolean;
};

export type SptStatusCode = 'draft' | 'diajukan' | 'terverifikasi' | 'ditolak';

export type SptListItem = {
  id: string;
  status: { code: SptStatusCode; label: string };
  alasan: string | null;
  tgl_berangkat: string | null;
  tgl_kembali: string | null;
  asal: string | null;
  tujuan: string[];
  untuk: string;
  pelaksana: { spd_id: number; nama: string; nip: string; no_spt: string | null }[];
  total_biaya: number;
  /** Nama OPD/bidang pembuat SPT */
  bidang: string | null;
  tgl_spt?: string | null;
  pembuat?: { id: number; nama: string } | null;
  /** GU 1, TU 2, dst; null bila belum dikelompokkan */
  kelompok?: string | null;
  /** Boleh dicentang untuk aksi massal (aturan checkbox tabel web) */
  selectable?: boolean;
  abilities?: SptAbilities;
};

export type SptAbilities = {
  can_edit: boolean;
  can_delete: boolean;
  can_ajukan: boolean;
  can_batal_ajukan: boolean;
  can_verifikasi: boolean;
  can_batal_verifikasi: boolean;
  can_tolak: boolean;
  can_pindah: boolean;
  can_edit_biaya: boolean;
  can_access_laporan: boolean;
};

export type BulkAction = 'verifikasi' | 'tolak' | 'kelompokkan' | 'batal_kelompok' | 'hapus';

export type BulkResult = {
  berhasil: number;
  dilewati: number;
  gagal: { id: string; pesan: string }[];
};

export type Opt = { id: number; nama: string; sub?: string | null };

export type SptFormMeta = {
  alat_angkut: Record<string, string[]>;
  default_asal_id: number;
  max_pelaksana: number;
  max_tujuan: number;
  max_untuk: number;
  kelompok: string[];
  dasar_resmi: string;
};

/** Isi form Surat Tugas (dikirim ke POST/PUT /spt) */
export type SptPayload = {
  pegawai_ids: number[];
  tgl_spt: string;
  tgl_berangkat: string;
  tgl_kembali: string;
  asal: number;
  tujuans: number[];
  alat_angkut: string;
  ppk_id: number;
  akun_id: number;
  ttd_id: number | null;
  dasar: string;
  untuk: string;
};

export type HotelInfo = {
  nomor_bill: string | null; nama_hotel: string | null; tgl_masuk: string | null; tgl_keluar: string | null;
  nomor_kamar: string | null; alamat_hotel: string | null; no_telp_hotel: string | null; email_hotel: string | null;
};

export type TiketInfo = {
  nama_maskapai: string | null; kode_booking: string | null; nomor_tiket: string | null; nomor_penerbangan: string | null;
  jam_berangkat: string | null; jam_sampai_tujuan: string | null; tempat_duduk: string | null; tanggal_tiket: string | null;
  asal_tiket: string | null; tujuan_tiket: string | null;
};

export type RincianItem = {
  id: number; jenis_rincian: string; kuantitas: number; satuan: string | null; nominal: number;
  potongan: number; panjar: number; jumlah: number; keterangan: string | null;
  hotel: HotelInfo | null; tiket: TiketInfo | null;
};

export type RiilItem = { id: number; uraian: string; nominal: number; keterangan: string | null };

export type PelaksanaDetail = {
  id: number; pegawai_id: number | null; urutan: number | null; nama: string; nip: string | null; jabatan: string | null;
  golongan: string | null; bidang: string | null; no_spt: string | null; no_spd: string | null;
  kwitansi: { total_rincian: number; total_riil: number; total: number; tgl_kwitansi: string | null } | null;
  status_kwitansi: 'Tersedia' | 'Kosong' | 'Belum Dibuat';
  rincian: RincianItem[]; riil: RiilItem[]; total_panjar: number; sisa_dibayar: number;
};

export type SptDetail = Omit<SptListItem, 'pelaksana'> & {
  dasar: string | null;
  asal_id: number | null;
  alat_angkut: string | null;
  tujuan_list: { id: number; nama: string }[];
  akun: { id: number; mak: string | null; uraian: string | null; kegiatan: string | null; sub_kegiatan: string | null; bidang: string | null } | null;
  ppk: { id: number; nama: string | null; nip: string | null; jabatan: string | null } | null;
  penandatangan: { id: number; nama: string; nip: string | null; jabatan: string | null } | null;
  file_spt_url: string | null;
  file_spd_urls: string[];
  diajukan_at: string | null;
  diverifikasi_at: string | null;
  pelaksana: PelaksanaDetail[];
};

export type Ringkasan = {
  tahun: number;
  total: number;
  draft: number;
  diajukan: number;
  terverifikasi: number;
  ditolak: number;
  /** Hanya dikirim untuk super_admin */
  total_opd?: number;
  total_pegawai?: number;
};

export type Captcha = {
  captcha_id: string;
  image: string; // data:image/png;base64,...
  length: number;
  expires_in: number;
};

export type LoginResult = {
  token: string;
  token_type: 'Bearer';
  expires_at: string | null;
  user: User;
};
