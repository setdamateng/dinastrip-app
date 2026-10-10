import React from 'react';
import { Text } from 'react-native';

import { useAuth } from '@/auth/AuthProvider';
import { BerandaShell, CtaButton, EmptyTrips, LoadState, SectionHeader, Stat, StatRow, SummaryCard, TripCard } from '@/components/beranda-ui';
import { useBeranda } from '@/components/useBeranda';
import { useTheme } from '@/theme/ThemeProvider';
import { angka } from '@/utils/format';

/**
 * Beranda Admin OPD: pengajuan dari OPD-nya saja (API sudah memfilter: hanya SPT yang
 * sudah diajukan dan se-bidang), jadi "Draft" memang tidak muncul di sini.
 */
export function AdminOpdHome() {
  const { c } = useTheme();
  const { user } = useAuth();
  const d = useBeranda();
  const r = d.ringkasan;

  const menunggu = r?.diajukan ?? 0;
  const total = (r?.terverifikasi ?? 0) + menunggu + (r?.ditolak ?? 0);

  return (
    <BerandaShell
      name={user?.name}
      refreshing={d.refreshing}
      onRefresh={d.refresh}
      subtitle={
        <>
          <Text style={{ color: c.link, fontSize: 12, fontWeight: '700' }}>Admin OPD</Text>
          <Text style={{ color: c.muted, fontSize: 12, marginTop: 1 }}>{user?.bidang?.nama ?? '-'}</Text>
        </>
      }
    >
      <LoadState loading={d.loading} error={d.error} onRetry={d.retry}>
        <SummaryCard title="Pengajuan OPD tahun ini" footnote={`${angka(total)} pengajuan • Draft tidak termasuk`}>
          <StatRow>
            <Stat value={angka(r?.terverifikasi)} label={'Sudah\nterverifikasi'} />
            <Stat value={angka(menunggu)} label={'Belum\nterverifikasi'} />
            <Stat value={angka(r?.ditolak)} label="Ditolak" danger />
          </StatRow>
        </SummaryCard>

        <CtaButton title={`Verifikasi Pengajuan (${menunggu})`} icon="clipboard-outline" toList />

        <SectionHeader title={`${d.items.length} Perjalanan terakhir`} toList />
        {d.items.length === 0 ? (
          <EmptyTrips />
        ) : (
          d.items.map((it) => (
            <TripCard key={it.id} item={it} showPerson showVerify />
          ))
        )}
      </LoadState>
    </BerandaShell>
  );
}
