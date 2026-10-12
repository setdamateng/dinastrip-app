import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '@/components/kit';
import { ApiError } from '@/services/api';
import { skpdService, type SkpdRow } from '@/services/skpd';
import { useTheme } from '@/theme/ThemeProvider';
import { masterEvents } from '@/utils/events';

const PER_PAGE = 15;
type Aktif = '' | '1' | '0';
const FILTERS: { key: Aktif; label: string }[] = [
  { key: '', label: 'Semua' },
  { key: '1', label: 'Aktif' },
  { key: '0', label: 'Nonaktif' },
];

export default function OpdScreen() {
  const { c } = useTheme();
  const router = useRouter();

  const [aktif, setAktif] = useState<Aktif>('');
  const [input, setInput] = useState('');
  const [q, setQ] = useState('');

  const [items, setItems] = useState<SkpdRow[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [sum, setSum] = useState({ total: 0, aktif: 0, nonaktif: 0 });
  const [loading, setLoading] = useState(true);
  const [more, setMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reqId = useRef(0);

  useEffect(() => {
    const t = setTimeout(() => setQ(input.trim()), 450);
    return () => clearTimeout(t);
  }, [input]);

  const fetchPage = useCallback(
    async (p: number, mode: 'reset' | 'append') => {
      const id = ++reqId.current;
      try {
        const r = await skpdService.list({ q: q || undefined, aktif: aktif === '' ? undefined : (Number(aktif) as 0 | 1), page: p, per_page: PER_PAGE });
        if (id !== reqId.current) return;
        setItems((prev) => (mode === 'append' ? [...prev, ...r.items.filter((n) => !prev.some((o) => o.id === n.id))] : r.items));
        setPage(r.meta?.current_page ?? p);
        setLastPage(r.meta?.last_page ?? 1);
        setTotal(r.meta?.total ?? r.items.length);
        setSum(r.summary);
        setError(null);
      } catch (e) {
        if (id !== reqId.current) return;
        setError(e instanceof ApiError ? e.message : 'Gagal memuat data OPD.');
      }
    },
    [q, aktif],
  );

  useEffect(() => {
    setLoading(true);
    fetchPage(1, 'reset').finally(() => setLoading(false));
  }, [fetchPage]);

  const fetchRef = useRef(fetchPage);
  fetchRef.current = fetchPage;
  useEffect(() => masterEvents.onChanged(() => fetchRef.current(1, 'reset')), []);

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

  const toggleAktif = async (p: SkpdRow, value: boolean) => {
    setItems((prev) => prev.map((x) => (x.id === p.id ? { ...x, is_aktif: value } : x)));
    try {
      await skpdService.setAktif(p.id, value);
      fetchPage(1, 'reset'); // perbarui ringkasan & filter
    } catch (e) {
      setItems((prev) => prev.map((x) => (x.id === p.id ? { ...x, is_aktif: !value } : x)));
      Alert.alert('Gagal', e instanceof ApiError ? e.message : 'Tidak dapat mengubah status.');
    }
  };

  const header = (
    <View style={{ gap: 14, paddingBottom: 6 }}>
      <View style={s.titleRow}>
        <View>
          <Text style={[s.title, { color: c.text }]}>Data OPD</Text>
          <Text style={{ color: c.muted, fontSize: 12, marginTop: 2 }}>Instansi pengguna DinasTrip</Text>
        </View>
        <Pressable onPress={() => router.push('/opd-form' as never)} hitSlop={10} accessibilityRole="button">
          <Text style={{ color: c.link, fontSize: 13, fontWeight: '700' }}>+ Tambah</Text>
        </Pressable>
      </View>

      <View style={[s.search, { backgroundColor: c.inputBg, borderColor: c.border }]}>
        <Ionicons name="search-outline" size={18} color={c.muted} />
        <TextInput
          accessibilityLabel="Cari OPD"
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={setInput}
          placeholder="Cari nama atau singkatan OPD"
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
          const on = aktif === f.key;
          const n = f.key === '' ? sum.total : f.key === '1' ? sum.aktif : sum.nonaktif;
          return (
            <Pressable
              key={f.label}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              onPress={() => setAktif(f.key)}
              style={[s.chip, on ? { backgroundColor: c.primary, borderColor: c.primary } : { backgroundColor: c.card, borderColor: c.border }]}
            >
              <Text style={{ color: on ? c.onPrimary : c.text, fontSize: 12, fontWeight: '600' }}>
                {f.label} ({n})
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Text style={{ color: c.muted, fontSize: 12 }}>{loading ? 'Memuat…' : `${total} OPD`}</Text>
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
      <Ionicons name="business-outline" size={30} color={c.muted} />
      <Text style={{ color: c.muted, fontSize: 13, textAlign: 'center' }}>{q ? `Tidak ada OPD yang cocok dengan “${q}”.` : 'Belum ada data OPD.'}</Text>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['top']}>
      <FlatList
        data={loading || error ? [] : items}
        keyExtractor={(it) => String(it.id)}
        renderItem={({ item }) => <Row item={item} onPress={() => router.push({ pathname: '/opd-form', params: { id: String(item.id) } } as never)} onToggle={(v) => toggleAktif(item, v)} />}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
        ListFooterComponent={
          more ? (
            <ActivityIndicator color={c.primary} style={{ marginVertical: 16 }} />
          ) : items.length > 0 && page >= lastPage && !loading ? (
            <Text style={{ color: c.muted, fontSize: 11, textAlign: 'center', marginVertical: 16 }}>Semua OPD sudah ditampilkan</Text>
          ) : null
        }
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        contentContainerStyle={s.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={c.primary} />}
        showsVerticalScrollIndicator={false}
      />

    </SafeAreaView>
  );
}

function Row({ item, onPress, onToggle }: { item: SkpdRow; onPress: () => void; onToggle: (v: boolean) => void }) {
  const { c } = useTheme();
  return (
    <Pressable onPress={onPress} accessibilityRole="button">
      <Card style={{ gap: 6, opacity: item.is_aktif ? 1 : 0.7 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={{ color: c.text, fontSize: 14.5, fontWeight: '700' }}>{item.nama_skpd}</Text>
            {item.singkatan ? <Text style={{ color: c.muted, fontSize: 11.5 }}>{item.singkatan}</Text> : null}
          </View>
          <Switch
            value={item.is_aktif}
            onValueChange={onToggle}
            trackColor={{ true: c.primary, false: c.border }}
            accessibilityLabel={`Aktif ${item.nama_skpd}`}
          />
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 2 }}>
          <Tag text={item.tipe_label} />
          <Tag text={`${item.bidang_count} bidang`} />
        </View>
      </Card>
    </Pressable>
  );
}

function Tag({ text }: { text: string }) {
  const { c } = useTheme();
  return (
    <View style={{ backgroundColor: c.tint, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
      <Text style={{ color: c.link, fontSize: 10.5, fontWeight: '700' }}>{text}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  content: { width: '100%', maxWidth: 520, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 28 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 32 },
  title: { fontSize: 22, fontWeight: '800' },
  search: { flexDirection: 'row', alignItems: 'center', gap: 9, borderWidth: 1, borderRadius: 14, paddingHorizontal: 13 },
  chip: { borderWidth: 1, borderRadius: 18, paddingHorizontal: 14, minHeight: 34, alignItems: 'center', justifyContent: 'center' },
  state: { borderWidth: 1, borderRadius: 16, padding: 24, alignItems: 'center', gap: 10, marginTop: 8 },
  retry: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8 },
});
