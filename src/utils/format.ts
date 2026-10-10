const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

export function rupiah(n: number): string {
  const v = Math.round(Number(n) || 0);
  return 'Rp ' + String(Math.abs(v)).replace(/\B(?=(\d{3})+(?!\d))/g, '.') ;
}

/** "2026-10-12" -> "12 Okt 2026" */
export function tanggal(d?: string | null): string {
  if (!d) return '-';
  const [y, m, day] = d.slice(0, 10).split('-').map(Number);
  if (!y || !m || !day) return '-';
  return `${day} ${BULAN[m - 1]} ${y}`;
}

/** "12–14 Okt 2026" bila satu bulan, selain itu ditulis lengkap */
export function rentang(a?: string | null, b?: string | null): string {
  if (!a || !b) return tanggal(a ?? b);
  if (a === b) return tanggal(a);
  const [y1, m1, d1] = a.split('-').map(Number);
  const [y2, m2] = b.split('-').map(Number);
  return y1 === y2 && m1 === m2 ? `${d1}–${tanggal(b)}` : `${tanggal(a)} – ${tanggal(b)}`;
}

export function salam(): string {
  const h = new Date().getHours();
  if (h < 11) return 'Selamat pagi';
  if (h < 15) return 'Selamat siang';
  if (h < 18) return 'Selamat sore';
  return 'Selamat malam';
}

export const ROLE_LABEL: Record<string, string> = {
  super_admin: 'Super Admin',
  admin_opd: 'Admin OPD',
  pegawai: 'Pegawai',
};

const BULAN_PANJANG = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

/** "12–14 Oktober 2026" (bulan beda -> tulis kedua tanggal lengkap) */
export function rentangPanjang(a?: string | null, b?: string | null): string {
  if (!a || !b) return '-';
  const [y1, m1, d1] = a.slice(0, 10).split('-').map(Number);
  const [y2, m2, d2] = b.slice(0, 10).split('-').map(Number);
  if (!y1 || !y2) return '-';
  const t = (d: number, m: number, y: number) => `${d} ${BULAN_PANJANG[m - 1]} ${y}`;
  if (a.slice(0, 10) === b.slice(0, 10)) return t(d1, m1, y1);
  return y1 === y2 && m1 === m2 ? `${d1}–${t(d2, m2, y2)}` : `${t(d1, m1, y1)} – ${t(d2, m2, y2)}`;
}

/** Jumlah hari perjalanan (tanggal berangkat s/d kembali, inklusif) */
export function jumlahHari(a?: string | null, b?: string | null): number {
  const utc = (d: string) => {
    const [y, m, day] = d.slice(0, 10).split('-').map(Number);
    return Date.UTC(y, (m || 1) - 1, day || 1);
  };
  if (!a || !b) return 0;
  return Math.max(1, Math.round((utc(b) - utc(a)) / 86400000) + 1);
}

/** "7 Okt 2026" untuk pojok kanan atas Beranda */
export function hariIni(): string {
  const d = new Date();
  return `${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`;
}

export function angka(n?: number | null): string {
  return String(Math.round(Number(n) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/** ["A"] -> "A", ["A","B"] -> "A dan B", ["A","B","C"] -> "A, B, dan C" */
export function daftarKota(list?: string[] | null): string {
  const k = (list ?? []).filter(Boolean);
  if (k.length === 0) return '-';
  if (k.length === 1) return k[0];
  if (k.length === 2) return `${k[0]} dan ${k[1]}`;
  return `${k.slice(0, -1).join(', ')}, dan ${k[k.length - 1]}`;
}

/** "2026-10-05T08:30:00Z" -> "5 Okt 2026, 08.30" (zona waktu perangkat) */
export function waktu(v?: string | null): string {
  if (!v) return '-';
  const d = new Date(String(v).includes(' ') && !String(v).includes('T') ? String(v).replace(' ', 'T') : String(v));
  if (isNaN(d.getTime())) return tanggal(v);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}, ${p(d.getHours())}.${p(d.getMinutes())}`;
}
