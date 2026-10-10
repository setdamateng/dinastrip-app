import React from 'react';
import { Text, View } from 'react-native';

import { useAuth } from '@/auth/AuthProvider';
import {
  BerandaShell,
  CtaButton,
  EmptyTrips,
  LoadState,
  MiniCard,
  SectionHeader,
  soon,
  Stat,
  StatRow,
  SummaryCard,
  TripCard,
} from '@/components/beranda-ui';
import { useBeranda } from '@/components/useBeranda';
import { useTheme } from '@/theme/ThemeProvider';
import { angka } from '@/utils/format';

/** Beranda Super Admin: seluruh OPD, total OPD & pegawai (dari API khusus super_admin). */
export function SuperAdminHome() {
  const { c } = useTheme();
  const { user } = useAuth();
  const d = useBeranda();
  const r = d.ringkasan;

  return (
    <BerandaShell
      name={user?.name}
      refreshing={d.refreshing}
      onRefresh={d.refresh}
      subtitle={
        <>
          <Text style={{ color: c.link, fontSize: 12, fontWeight: '700' }}>Super Admin</Text>
          <Text style={{ color: c.muted, fontSize: 12, marginTop: 1 }}>Seluruh OPD • Akses sistem</Text>
        </>
      }
    >
      <LoadState loading={d.loading} error={d.error} onRetry={d.retry}>
        <SummaryCard title="Perjalanan seluruh OPD">
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
            <Text style={{ color: c.text, fontSize: 34, fontWeight: '800' }}>{angka(r?.total)}</Text>
            <Text style={{ color: c.muted, fontSize: 12 }}>perjalanan • Tahun {r?.tahun}</Text>
          </View>
          <StatRow>
            <Stat value={angka(r?.draft)} label="Draft" />
            <Stat value={angka(r?.diajukan)} label="Diajukan" />
            <Stat value={angka(r?.terverifikasi)} label="Terverifikasi" />
            <Stat value={angka(r?.ditolak)} label="Ditolak" danger />
          </StatRow>
        </SummaryCard>

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <MiniCard label="Total OPD" value={angka(r?.total_opd)} icon="business-outline" />
          <MiniCard label="Pegawai" value={angka(r?.total_pegawai)} icon="people-outline" />
        </View>

        <CtaButton title="Pantau Semua Perjalanan" icon="briefcase-outline" toList />

        <SectionHeader title={`${d.items.length} Perjalanan terakhir`} toList />
        {d.items.length === 0 ? (
          <EmptyTrips />
        ) : (
          d.items.map((it) => (
            <TripCard key={it.id} item={it} showPerson showOpd />
          ))
        )}
      </LoadState>
    </BerandaShell>
  );
}
