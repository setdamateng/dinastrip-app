import { useAuth } from '@/auth/AuthProvider';
import { roleKind } from '@/auth/roles';
import { AdminOpdHome } from '@/components/beranda/AdminOpdHome';
import { PegawaiHome } from '@/components/beranda/PegawaiHome';
import { SuperAdminHome } from '@/components/beranda/SuperAdminHome';

/** Satu route "/", tiga tampilan. Pemilihan murni dari role di data user (dari server). */
export default function Beranda() {
  const { user } = useAuth();

  switch (roleKind(user)) {
    case 'super_admin':
      return <SuperAdminHome />;
    case 'admin_opd':
      return <AdminOpdHome />;
    default:
      return <PegawaiHome />;
  }
}
