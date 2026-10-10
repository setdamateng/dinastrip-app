import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import React from 'react';
import { ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StatusChip } from '@/components/kit';
import type { SptListItem } from '@/services/types';
import { useTheme } from '@/theme/ThemeProvider';
import { hariIni, jumlahHari, rentangPanjang, salam } from '@/utils/format';
import { useAuth } from '@/auth/AuthProvider';
import { roleKind } from '@/auth/roles';
import { sptHref } from '@/utils/nav';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

export const soon = (what: string) => Alert.alert('Segera hadir', `${what} akan dibuat berikutnya.`);

// ------------------------------------------------------------------ Shell
/** Kerangka bersama: judul "Beranda" + tanggal, sapaan + logo, lalu isi. */
export function BerandaShell({
  name,
  subtitle,
  refreshing,
  onRefresh,
  children,
}: {
  name?: string;
  /** Baris di bawah nama (berbeda per role) */
  subtitle: React.ReactNode;
  refreshing: boolean;
  onRefresh: () => void;
  children: React.ReactNode;
}) {
  const { c } = useTheme();

  return (
    <SafeAreaView edges={['top']} style={[s.safe, { backgroundColor: c.bg }]}>
      <ScrollView
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.primary} colors={[c.primary]} />}
      >
        <View style={s.titleRow}>
          <Text style={[s.title, { color: c.text }]}>Beranda</Text>
          <Text style={[s.date, { color: c.link }]}>{hariIni()}</Text>
        </View>

        <View style={s.hello}>
          <View style={{ flex: 1 }}>
            <Text style={[s.helloSmall, { color: c.muted }]}>{salam()},</Text>
            <Text style={[s.helloName, { color: c.text }]} numberOfLines={2}>
              {name}
            </Text>
            <View style={{ marginTop: 3 }}>{subtitle}</View>
          </View>
          <ExpoImage source={require('@/assets/images/logo-icon.png')} contentFit="contain" style={s.logo} accessibilityLabel="Logo DinasTrip" />
        </View>

        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

// -------------------------------------------------------------- Ringkasan
export function SummaryCard({ title, children, footnote }: { title: string; children: React.ReactNode; footnote?: string }) {
  const { c } = useTheme();
  return (
    <View style={[s.summary, { backgroundColor: c.tint }]}>
      <View style={s.rowBetween}>
        <Text style={[s.summaryTitle, { color: c.link }]}>{title}</Text>
        <Ionicons name="briefcase-outline" size={20} color={c.link} />
      </View>
      {children}
      {footnote ? <Text style={[s.footnote, { color: c.muted }]}>{footnote}</Text> : null}
    </View>
  );
}

/** Satu kolom angka + label. `danger` = angka merah (Ditolak). */
export function Stat({ value, label, danger }: { value: string; label: string; danger?: boolean }) {
  const { c } = useTheme();
  return (
    <View style={{ flex: 1, gap: 2 }}>
      <Text style={[s.statValue, { color: danger ? c.status.ditolak.fg : c.text }]}>{value}</Text>
      <Text style={[s.statLabel, { color: c.muted }]}>{label}</Text>
    </View>
  );
}

export const StatRow = ({ children }: { children: React.ReactNode }) => <View style={s.statRow}>{children}</View>;

/** Kartu putih kecil: label + angka + ikon (Total OPD / Pegawai) */
export function MiniCard({ label, value, icon }: { label: string; value: string; icon: IconName }) {
  const { c } = useTheme();
  return (
    <View style={[s.mini, { backgroundColor: c.card, borderColor: c.border }]}>
      <View style={s.rowBetween}>
        <Text style={[s.statLabel, { color: c.muted, fontSize: 12 }]}>{label}</Text>
        <Ionicons name={icon} size={18} color={c.link} />
      </View>
      <Text style={[s.miniValue, { color: c.text }]}>{value}</Text>
    </View>
  );
}

export function CtaButton({ title, icon, onPress, toList }: { title: string; icon: IconName; onPress?: () => void; toList?: boolean }) {
  const { c } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const listHref = roleKind(user) === 'admin_opd' ? '/verifikasi' : '/perjalanan';
  return (
    <Pressable
      accessibilityRole="button"
      onPress={toList ? () => router.push(listHref) : onPress}
      style={({ pressed }) => [s.cta, { backgroundColor: c.primary }, pressed && s.pressed]}
    >
      <Ionicons name={icon} size={18} color="#FFFFFF" />
      <Text style={s.ctaText}>{title}</Text>
    </Pressable>
  );
}

// -------------------------------------------------------------- Daftar
export function SectionHeader({ title, onAll, toList }: { title: string; onAll?: () => void; toList?: boolean }) {
  const { c } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  // Admin OPD tidak punya daftar perjalanan: tujuannya layar Verifikasi
  const listHref = roleKind(user) === 'admin_opd' ? '/verifikasi' : '/perjalanan';
  const goAll = toList ? () => router.push(listHref) : onAll;
  return (
    <View style={[s.rowBetween, { marginTop: 4 }]}>
      <Text style={[s.section, { color: c.text }]}>{title}</Text>
      {goAll ? (
        <Pressable onPress={goAll} hitSlop={10} accessibilityRole="link">
          <Text style={[s.all, { color: c.link }]}>Lihat semua</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/**
 * Kartu perjalanan. Satu komponen, tampilannya menyesuaikan role:
 * - pegawai: kode, judul, lokasi, tanggal
 * - admin_opd: + nama pelaksana, dan tautan "Verifikasi pengajuan" bila status Diajukan
 * - super_admin: + nama pelaksana dan nama OPD
 */
export function TripCard({
  item,
  showPerson,
  showOpd,
  showVerify,
  onPress,
}: {
  item: SptListItem;
  showPerson?: boolean;
  showOpd?: boolean;
  showVerify?: boolean;
  onPress?: () => void;
}) {
  const { c } = useTheme();
  const router = useRouter();

  const first = item.pelaksana[0];
  const kode = first?.no_spt || 'Nomor belum diisi';
  const orang = first ? (item.pelaksana.length > 1 ? `${first.nama} +${item.pelaksana.length - 1}` : first.nama) : '-';
  const hari = jumlahHari(item.tgl_berangkat, item.tgl_kembali);
  const verify = showVerify && item.status.code === 'diajukan';

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress ?? (() => router.push(sptHref(item.id)))}
      style={({ pressed }) => [s.trip, { backgroundColor: c.card, borderColor: c.border }, pressed && s.pressed]}
    >
      <View style={s.rowBetween}>
        <Text style={[s.code, { color: c.muted }]} numberOfLines={1}>
          {kode}
        </Text>
        <StatusChip code={item.status.code} label={item.status.label} />
      </View>

      {showPerson ? (
        <View>
          <Text style={[s.person, { color: c.text }]} numberOfLines={1}>
            {orang}
          </Text>
          {showOpd && item.bidang ? (
            <Text style={[s.opd, { color: c.link }]} numberOfLines={1}>
              {item.bidang}
            </Text>
          ) : null}
        </View>
      ) : null}

      <Text style={[s.tripTitle, { color: c.text }]} numberOfLines={2}>
        {item.untuk}
      </Text>

      <View style={s.metaRow}>
        <Ionicons name="location-outline" size={15} color={c.muted} />
        <Text style={[s.meta, { color: c.muted }]} numberOfLines={1}>
          {item.tujuan.join(', ') || '-'}
        </Text>
      </View>
      <View style={s.metaRow}>
        <Ionicons name="calendar-outline" size={15} color={c.muted} />
        <Text style={[s.meta, { color: c.muted }]}>
          {rentangPanjang(item.tgl_berangkat, item.tgl_kembali)}
          {hari ? ` • ${hari} hari` : ''}
        </Text>
      </View>

      {verify ? (
        <View style={[s.verify, { borderTopColor: c.border }]}>
          <Text style={[s.verifyText, { color: c.link }]}>Verifikasi pengajuan</Text>
          <Ionicons name="chevron-forward" size={16} color={c.link} />
        </View>
      ) : null}
    </Pressable>
  );
}

// ------------------------------------------------------- Loading / error
export function LoadState({
  loading,
  error,
  onRetry,
  children,
}: {
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  children: React.ReactNode;
}) {
  const { c } = useTheme();
  if (loading) return <ActivityIndicator color={c.primary} style={{ marginTop: 36 }} />;
  if (error) {
    return (
      <View style={[s.state, { backgroundColor: c.card, borderColor: c.border }]}>
        <Ionicons name="cloud-offline-outline" size={30} color={c.muted} />
        <Text style={[s.meta, { color: c.text, textAlign: 'center', fontSize: 13 }]}>{error}</Text>
        <Pressable onPress={onRetry} style={[s.retry, { borderColor: c.primary }]} accessibilityRole="button">
          <Text style={{ color: c.link, fontSize: 13, fontWeight: '700' }}>Coba lagi</Text>
        </Pressable>
      </View>
    );
  }
  return <>{children}</>;
}

export function EmptyTrips() {
  const { c } = useTheme();
  return (
    <View style={[s.state, { backgroundColor: c.card, borderColor: c.border }]}>
      <Ionicons name="document-text-outline" size={30} color={c.muted} />
      <Text style={[s.meta, { color: c.muted, fontSize: 13 }]}>Belum ada perjalanan tahun ini.</Text>
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  content: { width: '100%', maxWidth: 520, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 28, gap: 14 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 32 },
  title: { fontSize: 22, fontWeight: '800' },
  date: { fontSize: 12, fontWeight: '700' },
  hello: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginTop: 4 },
  helloSmall: { fontSize: 12 },
  helloName: { fontSize: 24, fontWeight: '800', marginTop: 2 },
  logo: { width: 48, height: 48, borderRadius: 9 },
  summary: { borderRadius: 18, padding: 16, gap: 12 },
  summaryTitle: { fontSize: 14, fontWeight: '700' },
  statRow: { flexDirection: 'row', gap: 8 },
  statValue: { fontSize: 24, fontWeight: '800' },
  statLabel: { fontSize: 11, lineHeight: 15 },
  footnote: { fontSize: 11 },
  mini: { flex: 1, borderWidth: 1, borderRadius: 16, padding: 14, gap: 6 },
  miniValue: { fontSize: 26, fontWeight: '800' },
  cta: { minHeight: 50, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  ctaText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  section: { fontSize: 16, fontWeight: '500' },
  all: { fontSize: 12, fontWeight: '700' },
  trip: { borderWidth: 1, borderRadius: 16, padding: 14, gap: 8 },
  code: { fontSize: 11, flex: 1 },
  person: { fontSize: 13, fontWeight: '700' },
  opd: { fontSize: 12, marginTop: 1 },
  tripTitle: { fontSize: 15, lineHeight: 21 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  meta: { fontSize: 12, flex: 1 },
  verify: { borderTopWidth: StyleSheet.hairlineWidth, marginTop: 4, paddingTop: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  verifyText: { fontSize: 12, fontWeight: '700' },
  state: { borderWidth: 1, borderRadius: 16, padding: 16, alignItems: 'center', gap: 8 },
  retry: { borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 18, minHeight: 38, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.78 },
});
