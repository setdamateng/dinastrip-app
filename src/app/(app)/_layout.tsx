import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';

import { useAuth } from '@/auth/AuthProvider';
import { roleKind, TABS } from '@/auth/roles';
import { SidebarHost } from '@/components/Sidebar';
import { useTheme } from '@/theme/ThemeProvider';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

// Semua kemungkinan tab. Yang tidak ada di TABS[role] disembunyikan (href: null).
const ALL: { name: string; title: string; icon: IconName }[] = [
  { name: 'index', title: 'Beranda', icon: 'home-outline' },
  { name: 'perjalanan', title: 'Perjalanan', icon: 'briefcase-outline' },
  { name: 'verifikasi', title: 'Verifikasi', icon: 'clipboard-outline' },
  { name: 'rekap', title: 'Rekap', icon: 'stats-chart-outline' },
  { name: 'notifikasi', title: 'Notifikasi', icon: 'notifications-outline' },
  { name: 'opd', title: 'OPD', icon: 'business-outline' },
  { name: 'pegawai', title: 'Pegawai', icon: 'people-outline' },
  { name: 'profil', title: 'Profil', icon: 'person-outline' },
];

export default function AppLayout() {
  const { c } = useTheme();
  const { user } = useAuth();
  const visible = TABS[roleKind(user)];

  return (
    <SidebarHost>
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: c.link,
        tabBarInactiveTintColor: c.muted,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
        tabBarStyle: { backgroundColor: c.card, borderTopColor: c.border },
        sceneStyle: { backgroundColor: c.bg },
      }}
    >
      {ALL.map((t) => (
        <Tabs.Screen
          key={t.name}
          name={t.name}
          options={{
            title: t.title,
            href: visible.includes(t.name) ? undefined : null,
            tabBarIcon: ({ color, size }) => <Ionicons name={t.icon} size={size} color={color} />,
          }}
        />
      ))}
    </Tabs>
    </SidebarHost>
  );
}
