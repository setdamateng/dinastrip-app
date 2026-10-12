import { useRouter } from 'expo-router';
import React from 'react';
import { Text } from 'react-native';

import { useAuth } from '@/auth/AuthProvider';
import { BerandaShell, CtaButton, EmptyTrips, LoadState, SectionHeader, Stat, StatRow, SummaryCard, TripCard } from '@/components/beranda-ui';
import { useBeranda } from '@/components/useBeranda';
import { useTheme } from '@/theme/ThemeProvider';
import { angka } from '@/utils/format';

/** Beranda Pegawai: ringkasan perjalanan milik sendiri + tombol ajukan. */
export function PegawaiHome() {
  const { c } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const d = useBeranda();
  const r = d.ringkasan;

  return (
    <BerandaShell
      name={user?.name}
      refreshing={d.refreshing}
      onRefresh={d.refresh}
      subtitle={
        <Text style={{ color: c.muted, fontSize: 12 }}>
          {user?.bidang?.nama ?? '-'} • Pegawai
        </Text>
      }
    >
      <LoadState loading={d.loading} error={d.error} onRetry={d.retry}>
        <SummaryCard title="Perjalanan Anda tahun ini">
          <StatRow>
            <Stat value={angka(r?.draft)} label="Draft" />
            <Stat value={angka(r?.diajukan)} label="Diajukan" />
            <Stat value={angka(r?.terverifikasi)} label="Terverifikasi" />
            <Stat value={angka(r?.ditolak)} label="Ditolak" danger />
          </StatRow>
        </SummaryCard>

        <CtaButton title="Ajukan Perjalanan" icon="add" onPress={() => router.push('/spt-form')} />

        <SectionHeader title={`${d.items.length} Perjalanan terakhir`} toList />
        {d.items.length === 0 ? (
          <EmptyTrips />
        ) : (
          d.items.map((it) => <TripCard key={it.id} item={it} />)
        )}
      </LoadState>
    </BerandaShell>
  );
}
