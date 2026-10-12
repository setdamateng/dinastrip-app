import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/auth/AuthProvider';
import { roleKind } from '@/auth/roles';
import { Card } from '@/components/kit';
import { Sheet } from '@/components/perjalanan/sheets';
import { ApiError } from '@/services/api';
import { rekapService, type RekapItem, type RekapSummary } from '@/services/rekap';
import { useTheme } from '@/theme/ThemeProvider';
import { daftarKota, rupiah, tanggal } from '@/utils/format';
import { sptEvents } from '@/utils/events';
import { sptHref } from '@/utils/nav';

const PER_PAGE = 10;
const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const EMPTY: RekapSummary = { total: 0, terverifikasi: 0, belum_verifikasi: 0, nilai_total: 0, nilai_terverifikasi: 0, nilai_belum: 0 };

export default function RekapScreen() {
  const { c } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const kind = roleKind(user);
  const nowYear = new Date().getFullYear();

  const [bulan, setBulan] = useState(new Date().getMonth() + 1);
  const [tahun, setTahun] = useState(nowYear);
  const [pegawaiId, setPegawaiId] = useState<number | undefined>();
  const [pegawai, setPegawai] = useState<{ id: number; nama: string }[]>([]);
  const [pickPegawai, setPickPegawai] = useState(false);

  const [items, setItems] = useState<RekapItem[]>([]);
  const [summary, setSummary] = useState<RekapSummary>(EMPTY);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [more, setMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reqId = useRef(0);
  const monthRef = useRef<ScrollView>(null);

  const fetchPage = useCallback(
    async (p: number, mode: 'reset' | 'append') => {
      const id = ++reqId.current;
      try {
        const r = await rekapService.list({ bulan, tahun, pegawai_id: pegawaiId, page: p, per_page: PER_PAGE });
        if (id !== reqId.current) return;
        setItems((prev) => (mode === 'append' ? [...prev, ...r.items.filter((n) => !prev.some((o) => o.spd_id === n.spd_id))] : r.items));
        setPage(r.meta?.current_page ?? p);
        setLastPage(r.meta?.last_page ?? 1);
        setSummary(r.summary ?? EMPTY);
        setPegawai(r.pegawai);
        setError(null);
      } catch (e) {
        if (id !== reqId.current) return;
        setError(e instanceof ApiError ? e.message : 'Gagal memuat rekap.');
      }
    },
    [bulan, tahun, pegawaiId],
  );

  useEffect(() => {
    setLoading(true);
    fetchPage(1, 'reset').finally(() => setLoading(false));
  }, [fetchPage]);

  const fetchRef = useRef(fetchPage);
  fetchRef.current = fetchPage;
  useEffect(() => sptEvents.onChanged(() => fetchRef.current(1, 'reset')), []);

  // gulir bulan terpilih ke tengah saat layar dibuka
  useEffect(() => {
    const t = setTimeout(() => monthRef.current?.scrollTo({ x: Math.max(0, (bulan - 3) * 62), animated: false }), 50);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadMore = () => {
    if (loading || more || refreshing || error || page >= lastPage) return;
    setMore(true);
    fetchPage(page + 1, 'append').finally(() => setMore(false));
  };

  const refresh = async () => {
    setRefreshing(true);
    await fetchPage(1, 'reset');
    setRefreshing(false);
  };

  const changePeriod = (b: number, y: number) => {
    setPegawaiId(undefined); // daftar pegawai bergantung pada bulan
    setBulan(b);
    setTahun(y);
  };

  const scopeText =
    kind === 'super_admin' ? 'Seluruh perjalanan' : kind === 'admin_opd' ? 'Perjalanan pegawai OPD Anda' : 'Perjalanan yang Anda buat';
  const pegawaiNama = pegawai.find((p) => p.id === pegawaiId)?.nama;
  const tappable = kind !== 'admin_opd';

  const header = (
    <View style={{ gap: 14, paddingBottom: 6 }}>
      <View>
        <Text style={[s.title, { color: c.text }]}>Rekap Perjadin</Text>
        <Text style={{ color: c.muted, fontSize: 12, marginTop: 2 }}>{scopeText}</Text>
      </View>

      <View style={s.row}>
        <Pressable onPress={() => changePeriod(bulan, tahun - 1)} hitSlop={10} accessibilityLabel="Tahun sebelumnya">
          <Ionicons name="chevron-back" size={18} color={c.link} />
        </Pressable>
        <Text style={{ color: c.link, fontSize: 14, fontWeight: '800', minWidth: 44, textAlign: 'center' }}>{tahun}</Text>
        <Pressable
          disabled={tahun >= nowYear}
          onPress={() => changePeriod(bulan, tahun + 1)}
          hitSlop={10}
          accessibilityLabel="Tahun berikutnya"
          style={tahun >= nowYear && { opacity: 0.3 }}
        >
          <Ionicons name="chevron-forward" size={18} color={c.link} />
        </Pressable>
      </View>

      <ScrollView ref={monthRef} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {BULAN.map((b, i) => {
          const on = bulan === i + 1;
          return (
            <Pressable
              key={b}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              onPress={() => changePeriod(i + 1, tahun)}
              style={[s.chip, on ? { backgroundColor: c.primary, borderColor: c.primary } : { backgroundColor: c.card, borderColor: c.border }]}
            >
              <Text style={{ color: on ? c.onPrimary : c.text, fontSize: 12, fontWeight: '600' }}>{b}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {kind !== 'pegawai' || pegawai.length > 1 ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => setPickPegawai(true)}
          style={[s.picker, { backgroundColor: c.inputBg, borderColor: c.border }]}
        >
          <Ionicons name="person-outline" size={17} color={c.muted} />
          <Text style={{ flex: 1, color: pegawaiNama ? c.text : c.muted, fontSize: 14 }} numberOfLines={1}>
            {pegawaiNama ?? 'Semua pegawai'}
          </Text>
          <Ionicons name="chevron-down" size={17} color={c.muted} />
        </Pressable>
      ) : null}

      <View style={s.grid}>
        <Stat label="Total perjalanan" value={String(summary.total)} />
        <Stat label="Terverifikasi" value={String(summary.terverifikasi)} tone="ok" />
        <Stat label="Belum verifikasi" value={String(summary.belum_verifikasi)} tone="warn" />
      </View>
      <Card style={{ gap: 10 }}>
        <Money label="Nilai terverifikasi" value={summary.nilai_terverifikasi} tone="ok" />
        <View style={{ height: 1, backgroundColor: c.border }} />
        <Money label="Nilai belum verifikasi" value={summary.nilai_belum} tone="warn" />
      </Card>
    </View>
  );

  const empty = loading ? (
    <ActivityIndicator color={c.primary} style={{ marginTop: 36 }} />
  ) : error ? (
    <View style={[s.state, { backgroundColor: c.card, borderColor: c.border }]}>
      <Ionicons name="cloud-offline-outline" size={30} color={c.muted} />
      <Text style={{ color: c.text, fontSize: 13, textAlign: 'center' }}>{error}</Text>
      <Pressable
        onPress={() => {
          setLoading(true);
          fetchPage(1, 'reset').finally(() => setLoading(false));
        }}
        style={[s.retry, { borderColor: c.primary }]}
      >
        <Text style={{ color: c.link, fontSize: 13, fontWeight: '700' }}>Coba lagi</Text>
      </Pressable>
    </View>
  ) : (
    <View style={[s.state, { backgroundColor: c.card, borderColor: c.border }]}>
      <Ionicons name="stats-chart-outline" size={30} color={c.muted} />
      <Text style={{ color: c.muted, fontSize: 13, textAlign: 'center' }}>Tidak ada perjalanan pada {BULAN[bulan - 1]} {tahun}.</Text>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['top']}>
      <FlatList
        data={loading || error ? [] : items}
        keyExtractor={(it) => String(it.spd_id)}
        renderItem={({ item }) => (
          <RekapRow item={item} showPembuat={kind !== 'pegawai'} onPress={tappable ? () => router.push(sptHref(item.spt_id)) : undefined} />
        )}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
        ListFooterComponent={
          more ? (
            <ActivityIndicator color={c.primary} style={{ marginVertical: 16 }} />
          ) : items.length > 0 && page >= lastPage && !loading ? (
            <Text style={{ color: c.muted, fontSize: 11, textAlign: 'center', marginVertical: 16 }}>Semua data sudah ditampilkan</Text>
          ) : null
        }
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        contentContainerStyle={s.content}
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={c.primary} />}
        showsVerticalScrollIndicator={false}
      />

      <Sheet visible={pickPegawai} onClose={() => setPickPegawai(false)} title="Pilih pegawai">
        <View style={{ gap: 2 }}>
          {[{ id: undefined as number | undefined, nama: 'Semua pegawai' }, ...pegawai].map((p) => {
            const on = p.id === pegawaiId;
            return (
              <Pressable
                key={p.id ?? 'all'}
                onPress={() => {
                  setPegawaiId(p.id);
                  setPickPegawai(false);
                }}
                style={({ pressed }) => [s.opt, pressed && { backgroundColor: c.tint }]}
              >
                <Text style={{ flex: 1, color: c.text, fontSize: 14, fontWeight: on ? '800' : '500' }}>{p.nama}</Text>
                {on ? <Ionicons name="checkmark" size={18} color={c.link} /> : null}
              </Pressable>
            );
          })}
        </View>
      </Sheet>
    </SafeAreaView>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: 'ok' | 'warn' }) {
  const { c } = useTheme();
  const col = tone === 'ok' ? c.status.terverifikasi.fg : tone === 'warn' ? c.status.diajukan.fg : c.text;
  return (
    <View style={[s.stat, { backgroundColor: c.card, borderColor: c.border }]}>
      <Text style={{ color: col, fontSize: 20, fontWeight: '800' }}>{value}</Text>
      <Text style={{ color: c.muted, fontSize: 10.5, marginTop: 2 }} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

function Money({ label, value, tone }: { label: string; value: number; tone: 'ok' | 'warn' }) {
  const { c } = useTheme();
  const col = tone === 'ok' ? c.status.terverifikasi.fg : c.status.diajukan.fg;
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
      <Text style={{ color: c.muted, fontSize: 12 }}>{label}</Text>
      <Text style={{ color: col, fontSize: 15, fontWeight: '800' }}>{rupiah(value)}</Text>
    </View>
  );
}

function RekapRow({ item, showPembuat, onPress }: { item: RekapItem; showPembuat: boolean; onPress?: () => void }) {
  const { c } = useTheme();
  const st = item.terverifikasi ? c.status.terverifikasi : c.status.diajukan;
  return (
    <Pressable disabled={!onPress} onPress={onPress} accessibilityRole={onPress ? 'button' : undefined}>
      <Card style={{ gap: 7 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <Text style={{ color: c.muted, fontSize: 11.5, flex: 1 }} numberOfLines={1}>
            {tanggal(item.tgl_spt)} · {item.no_spt ? `No. ${item.no_spt}` : 'Nomor belum dimasukkan'}
          </Text>
          <View style={[s.badge, { backgroundColor: st.bg }]}>
            <Text style={{ color: st.fg, fontSize: 11, fontWeight: '700' }}>{item.terverifikasi ? 'Terverifikasi' : 'Belum'}</Text>
          </View>
        </View>
        <Text style={{ color: c.text, fontSize: 14.5, fontWeight: '700' }}>{item.nama}</Text>
        <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
          <Ionicons name="location-outline" size={14} color={c.muted} />
          <Text style={{ color: c.muted, fontSize: 12, flex: 1 }} numberOfLines={2}>
            {daftarKota(item.tujuan)}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          {showPembuat && item.pembuat ? (
            <Text style={{ color: c.muted, fontSize: 11, flex: 1 }} numberOfLines={1}>
              Dibuat: {item.pembuat}
            </Text>
          ) : (
            <View />
          )}
          <Text style={{ color: c.text, fontSize: 14, fontWeight: '800' }}>{rupiah(item.nilai)}</Text>
        </View>
      </Card>
    </Pressable>
  );
}

const s = StyleSheet.create({
  content: { width: '100%', maxWidth: 520, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 28 },
  title: { fontSize: 22, fontWeight: '800' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  chip: { borderWidth: 1, borderRadius: 18, paddingHorizontal: 14, minHeight: 34, alignItems: 'center', justifyContent: 'center' },
  picker: { flexDirection: 'row', alignItems: 'center', gap: 9, borderWidth: 1, borderRadius: 14, paddingHorizontal: 13, minHeight: 46 },
  grid: { flexDirection: 'row', gap: 8 },
  stat: { flex: 1, borderWidth: 1, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 12 },
  badge: { borderRadius: 10, paddingHorizontal: 9, paddingVertical: 3 },
  opt: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 8, borderRadius: 12 },
  state: { borderWidth: 1, borderRadius: 16, padding: 24, alignItems: 'center', gap: 10, marginTop: 8 },
  retry: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8 },
});
