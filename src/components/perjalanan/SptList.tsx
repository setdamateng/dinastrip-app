import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/auth/AuthProvider';
import { roleKind } from '@/auth/roles';
import { BulkBar } from '@/components/perjalanan/BulkBar';
import { TripListCard } from '@/components/perjalanan/TripListCard';
import { ApiError } from '@/services/api';
import { sptService } from '@/services/spt';
import type { SptListItem, SptStatusCode } from '@/services/types';
import { useTheme } from '@/theme/ThemeProvider';
import { sptEvents } from '@/utils/events';
import { sptHref } from '@/utils/nav';

const PER_PAGE = 10; // tampil 10 dulu, bertambah 10 setiap digulir ke bawah

type Filter = { key: '' | SptStatusCode; label: string };

const FILTERS_PERJALANAN: Filter[] = [
  { key: '', label: 'Semua' },
  { key: 'draft', label: 'Draft' },
  { key: 'diajukan', label: 'Diajukan' },
  { key: 'terverifikasi', label: 'Terverifikasi' },
  { key: 'ditolak', label: 'Ditolak' },
];

// Admin OPD hanya melihat SPT yang sudah diajukan, jadi tidak ada "Draft"
const FILTERS_VERIFIKASI: Filter[] = [
  { key: 'diajukan', label: 'Menunggu' },
  { key: 'terverifikasi', label: 'Terverifikasi' },
  { key: 'ditolak', label: 'Ditolak' },
  { key: '', label: 'Semua' },
];

/**
 * Daftar SPT yang dipakai dua layar:
 * - mode "perjalanan": Pegawai & Super Admin (dengan tombol + Ajukan)
 * - mode "verifikasi": Admin OPD (default "Menunggu", tanpa + Ajukan, fokus ke verifikasi)
 */

export function SptList({ mode }: { mode: 'perjalanan' | 'verifikasi' }) {
  const verif = mode === 'verifikasi';
  const FILTERS = verif ? FILTERS_VERIFIKASI : FILTERS_PERJALANAN;
  const { c } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const kind = roleKind(user);
  const canBulk = kind === 'admin_opd' || kind === 'super_admin';
  const canCreate = kind === 'pegawai' || kind === 'super_admin';

  const nowYear = new Date().getFullYear();
  const [tahun, setTahun] = useState(nowYear);
  const [status, setStatus] = useState<'' | SptStatusCode>(verif ? 'diajukan' : '');
  const [input, setInput] = useState('');
  const [q, setQ] = useState('');

  const [items, setItems] = useState<SptListItem[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [more, setMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ---- mode pilih (aksi massal) ----
  const [selectMode, setSelectMode] = useState(false);
  const [sel, setSel] = useState<Record<string, SptListItem>>({});
  const selected = Object.values(sel);

  const toggle = (it: SptListItem) =>
    setSel((prev) => {
      const next = { ...prev };
      if (next[it.id]) delete next[it.id];
      else next[it.id] = it;
      return next;
    });
  const exitSelect = () => {
    setSelectMode(false);
    setSel({});
  };
  const startSelect = (it?: SptListItem) => {
    if (!canBulk) return;
    setSelectMode(true);
    if (it && it.selectable !== false) setSel({ [it.id]: it });
  };
  const selectAllLoaded = () => setSel(Object.fromEntries(items.filter((x) => x.selectable !== false).map((x) => [x.id, x])));

  const reqId = useRef(0); // abaikan respons lama bila filter/pencarian sudah berganti

  // Pencarian ke server (bukan filter lokal) -> data di halaman yang belum dimuat tetap ketemu.
  useEffect(() => {
    const t = setTimeout(() => setQ(input.trim()), 450);
    return () => clearTimeout(t);
  }, [input]);

  const fetchPage = useCallback(
    async (p: number, mode: 'reset' | 'append') => {
      const id = ++reqId.current;
      try {
        const r = await sptService.list({ tahun, status: status || undefined, q: q || undefined, page: p, per_page: PER_PAGE });
        if (id !== reqId.current) return;
        setItems((prev) => (mode === 'append' ? [...prev, ...r.items.filter((n) => !prev.some((o) => o.id === n.id))] : r.items));
        setPage(r.meta?.current_page ?? p);
        setLastPage(r.meta?.last_page ?? 1);
        setTotal(r.meta?.total ?? r.items.length);
        setError(null);
      } catch (e) {
        if (id !== reqId.current) return;
        setError(e instanceof ApiError ? e.message : 'Gagal memuat data.');
      }
    },
    [tahun, status, q],
  );

  // Muat ulang dari halaman 1 setiap tahun / status / kata kunci berubah
  useEffect(() => {
    setLoading(true);
    fetchPage(1, 'reset').finally(() => setLoading(false));
  }, [fetchPage]);

  // Ada perubahan dari layar lain (ajukan, hapus, ubah, dst) -> muat ulang diam-diam
  const fetchRef = useRef(fetchPage);
  fetchRef.current = fetchPage;
  useEffect(() => sptEvents.onChanged(() => fetchRef.current(1, 'reset')), []);

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

  const header = (
    <View style={{ gap: 14, paddingBottom: 6 }}>
      <View style={s.titleRow}>
        <Text style={[s.title, { color: c.text }]}>{selectMode ? (verif ? 'Pilih Perjalanan' : 'Pilih Perjalanan') : verif ? 'Verifikasi Perjalanan' : 'Daftar Perjalanan'}</Text>
        {selectMode ? (
          <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
            <Pressable onPress={selectAllLoaded} hitSlop={10}>
              <Text style={{ color: c.link, fontSize: 13, fontWeight: '700' }}>Pilih semua</Text>
            </Pressable>
            <Pressable onPress={exitSelect} hitSlop={10}>
              <Text style={{ color: c.link, fontSize: 13, fontWeight: '700' }}>Selesai</Text>
            </Pressable>
          </View>
        ) : (
          <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
            {canBulk ? (
              <Pressable onPress={() => startSelect()} hitSlop={10} accessibilityRole="button">
                <Text style={{ color: c.link, fontSize: 13, fontWeight: '700' }}>Pilih</Text>
              </Pressable>
            ) : null}
            {canCreate ? (
              <Pressable onPress={() => router.push('/spt-form')} hitSlop={10} accessibilityRole="button">
                <Text style={{ color: c.link, fontSize: 13, fontWeight: '700' }}>+ Ajukan</Text>
              </Pressable>
            ) : null}
          </View>
        )}
      </View>

      <View style={[s.search, { backgroundColor: c.inputBg, borderColor: c.border }]}>
        <Ionicons name="search-outline" size={18} color={c.muted} />
        <TextInput
          accessibilityLabel="Cari perjalanan"
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={setInput}
          placeholder="Cari tujuan, nama, atau nomor"
          placeholderTextColor={c.muted}
          returnKeyType="search"
          style={{ flex: 1, color: c.text, fontSize: 14, paddingVertical: 0, minHeight: 42 }}
          value={input}
        />
        {input ? (
          <Pressable onPress={() => setInput('')} hitSlop={10} accessibilityLabel="Hapus pencarian">
            <Ionicons name="close-circle" size={18} color={c.muted} />
          </Pressable>
        ) : null}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }} keyboardShouldPersistTaps="handled">
        {FILTERS.map((f) => {
          const on = status === f.key;
          return (
            <Pressable
              key={f.key || 'all'}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              onPress={() => setStatus(f.key)}
              style={[s.chip, on ? { backgroundColor: c.primary, borderColor: c.primary } : { backgroundColor: c.card, borderColor: c.border }]}
            >
              <Text style={{ color: on ? c.onPrimary : c.text, fontSize: 12, fontWeight: '600' }}>{f.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={s.titleRow}>
        <Text style={{ color: c.muted, fontSize: 12 }}>{loading ? 'Memuat…' : verif && status === 'diajukan' ? `${total} menunggu verifikasi` : `${total} ${verif ? 'pengajuan' : 'perjalanan'}`}</Text>
        <View style={s.year}>
          <Pressable onPress={() => setTahun((y) => y - 1)} hitSlop={10} accessibilityLabel="Tahun sebelumnya">
            <Ionicons name="chevron-back" size={16} color={c.link} />
          </Pressable>
          <Text style={{ color: c.link, fontSize: 12, fontWeight: '700', minWidth: 34, textAlign: 'center' }}>{tahun}</Text>
          <Pressable
            disabled={tahun >= nowYear}
            onPress={() => setTahun((y) => y + 1)}
            hitSlop={10}
            accessibilityLabel="Tahun berikutnya"
            style={tahun >= nowYear && { opacity: 0.3 }}
          >
            <Ionicons name="chevron-forward" size={16} color={c.link} />
          </Pressable>
        </View>
      </View>
    </View>
  );

  const empty = loading ? (
    <ActivityIndicator color={c.primary} style={{ marginTop: 36 }} />
  ) : error ? (
    <View style={[s.state, { backgroundColor: c.card, borderColor: c.border }]}>
      <Ionicons name="cloud-offline-outline" size={30} color={c.muted} />
      <Text style={{ color: c.text, fontSize: 13, textAlign: 'center' }}>{error}</Text>
      <Pressable onPress={() => { setLoading(true); fetchPage(1, 'reset').finally(() => setLoading(false)); }} style={[s.retry, { borderColor: c.primary }]}>
        <Text style={{ color: c.link, fontSize: 13, fontWeight: '700' }}>Coba lagi</Text>
      </Pressable>
    </View>
  ) : (
    <View style={[s.state, { backgroundColor: c.card, borderColor: c.border }]}>
      <Ionicons name="document-text-outline" size={30} color={c.muted} />
      <Text style={{ color: c.muted, fontSize: 13, textAlign: 'center' }}>
        {q
          ? `Tidak ada data yang cocok dengan “${q}”.`
          : verif && status === 'diajukan'
            ? 'Tidak ada pengajuan yang menunggu verifikasi.'
            : `Belum ada ${verif ? 'pengajuan' : 'perjalanan'} di tahun ${tahun}.`}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['top']}>
      <FlatList
        data={loading || error ? [] : items}
        keyExtractor={(it) => String(it.id)}
        renderItem={({ item }) => (
          <TripListCard
            item={item}
            showOpd={kind === 'super_admin'}
            showPembuat={verif}
            verifyHint={verif}
            selectMode={selectMode}
            selected={!!sel[item.id]}
            onPress={() => router.push(sptHref(item.id))}
            onToggle={() => toggle(item)}
            onLongPress={() => startSelect(item)}
          />
        )}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
        ListFooterComponent={
          more ? (
            <ActivityIndicator color={c.primary} style={{ marginVertical: 16 }} />
          ) : items.length > 0 && page >= lastPage && !loading ? (
            <Text style={{ color: c.muted, fontSize: 11, textAlign: 'center', marginVertical: 16 }}>Semua perjalanan sudah ditampilkan</Text>
          ) : null
        }
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        contentContainerStyle={s.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={c.primary} />}
        showsVerticalScrollIndicator={false}
      />
      {selectMode && selected.length > 0 ? (
        <BulkBar
          selected={selected}
          isSuper={kind === 'super_admin'}
          onClear={() => setSel({})}
          onDone={() => {
            exitSelect();
            setLoading(true);
            fetchPage(1, 'reset').finally(() => setLoading(false));
          }}
        />
      ) : null}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  content: { width: '100%', maxWidth: 520, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 28 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 28 },
  title: { fontSize: 22, fontWeight: '800' },
  search: { flexDirection: 'row', alignItems: 'center', gap: 9, borderWidth: 1, borderRadius: 14, paddingHorizontal: 13 },
  chip: { borderWidth: 1, borderRadius: 18, paddingHorizontal: 14, minHeight: 34, alignItems: 'center', justifyContent: 'center' },
  year: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  state: { borderWidth: 1, borderRadius: 16, padding: 24, alignItems: 'center', gap: 10, marginTop: 8 },
  retry: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8 },
});
