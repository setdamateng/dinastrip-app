import { Redirect } from 'expo-router';

import { useAuth } from '@/auth/AuthProvider';
import { roleKind } from '@/auth/roles';
import { SptList } from '@/components/perjalanan/SptList';

export default function Perjalanan() {
  const { user } = useAuth();
  // Admin OPD tidak punya daftar perjalanan; tugasnya di layar Verifikasi
  if (roleKind(user) === 'admin_opd') return <Redirect href="/verifikasi" />;
  return <SptList mode="perjalanan" />;
}
