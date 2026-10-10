import type { Role, User } from '@/services/types';

/** Tiga "wajah" aplikasi. Satu akun bisa punya beberapa role -> dipakai yang tertinggi. */
export type RoleKind = 'super_admin' | 'admin_opd' | 'pegawai';

export function roleKindOf(roles: Role[] | undefined | null): RoleKind {
  if (roles?.includes('super_admin')) return 'super_admin';
  if (roles?.includes('admin_opd')) return 'admin_opd';
  return 'pegawai';
}

export const roleKind = (user: User | null) => roleKindOf(user?.roles);

export const ROLE_TITLE: Record<RoleKind, string> = {
  super_admin: 'Super Admin',
  admin_opd: 'Admin OPD',
  pegawai: 'Pegawai',
};

/** Menu tab bawah per role (sesuai desain Figma). `index` = Beranda. */
export const TABS: Record<RoleKind, string[]> = {
  pegawai: ['index', 'perjalanan', 'notifikasi', 'profil'],
  admin_opd: ['index', 'verifikasi', 'pegawai', 'profil'],
  super_admin: ['index', 'perjalanan', 'opd', 'pegawai', 'profil'],
};
