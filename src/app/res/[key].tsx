import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '@/components/kit';
import { ActionSheet } from '@/components/perjalanan/sheets';
import { ApiError } from '@/services/api';
import { editStore, resService, type ResMeta, type ResRow } from '@/services/res';
import { useTheme } from '@/theme/ThemeProvider';
import { masterEvents } from '@/utils/events';
import { rupiah } from '@/utils/format';

export default function ResList() {
  const { c } = useTheme();
  const router = useRouter();
  const { key } = useLocalSearchParams<{ key: string }>();

  const [meta, setMeta] = useState<ResMeta | null>(null);
  const [input, setInput] = useState('');
  const [q, setQ] = useState('');
  const thisYear = new Date().getFullYear();
  const [tahun, setTahun] = useState(thisYear);

  const [items, setItems] = useState<ResRow[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [more, setMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [menu, setMenu] = useState<ResRow | null>(null);
  const reqId = useRef(0);

  useEffect(() => {
    const t = setTimeout(() => setQ(input.trim()), 450);
    return () => clearTimeout(t);
  }, [input]);

  const fetchPage = useCallback(
    async (p: number, mode: 'reset' | 'append') => {
      const id = ++reqId.current;
      try {
        const [m, r] = await Promise.all([meta ? Promise.resolve(meta) : resService.meta(String(key)), resService.list(String(key), { q: q || undefined, page: p, tahun })]);
        if (id !== reqId.current) return;
        setMeta({ ...m, abilities: r.abilities });
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key, q, tahun, meta?.key],
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

  const back = () => (router.canGoBack() ? router.back() : router.replace('/'));
  const openForm = (row?: ResRow) => {
    editStore.set(row ?? null);
    router.push({ pathname: '/res-form', params: { key: String(key), ...(row ? { id: String(row.id) } : {}) } } as never);
  };

  const confirmDelete = (r: ResRow) =>
    Alert.alert(`Hapus ${meta?.label ?? 'data'}?`, `${r.title} akan dihapus permanen.`, [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: async () => {
          try {
            await resService.remove(String(key), r.id);
            masterEvents.changed();
          } catch (e) {
            Alert.alert('Tidak dapat dihapus', e instanceof ApiError ? e.message : 'Terjadi kesalahan.');
          }
        },
      },
    ]);

  const ab = meta?.abilities;
  const actions = menu
    ? [
        ...(ab?.update ? [{ key: 'edit', label: 'Ubah', icon: 'create-outline' as const, onPress: () => openForm(menu) }] : []),
        ...(ab?.delete ? [{ key: 'del', label: 'Hapus', icon: 'trash-outline' as const, danger: true, onPress: () => confirmDelete(menu) }] : []),
      ]
    : [];

  const header = (
    <View style={{ gap: 14, paddingBottom: 6 }}>
      <View style={s.titleRow}>
        <Pressable onPress={back} hitSlop={12} accessibilityRole="button" accessibilityLabel="Kembali">
          <Ionicons name="arrow-back" size={22} color={c.text} />
        </Pressable>
        <Text style={[s.title, { color: c.text }]} numberOfLines={1}>
          {meta?.plural ?? ''}
        </Text>
        {ab?.create ? (
          <Pressable onPress={() => openForm()} hitSlop={10} accessibilityRole="button">
            <Text style={{ color: c.link, fontSize: 13, fontWeight: '700' }}>+ Tambah</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={[s.search, { backgroundColor: c.inputBg, borderColor: c.border }]}>
        <Ionicons name="search-outline" size={18} color={c.muted} />
        <TextInput
          accessibilityLabel="Cari"
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={setInput}
          placeholder="Cari…"
          placeholderTextColor={c.muted}
          returnKeyType="search"
          style={{ flex: 1, color: c.text, fontSize: 14, paddingVertical: 0, minHeight: 42 }}
          value={input}
        />
        {input ? (
          <Pressable onPress={() => setInput('')} hitSlop={10}>
            <Ionicons name="close-circle" size={18} color={c.muted} />
          </Pressable>
        ) : null}
      </View>

      {meta?.filter_tahun ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {[thisYear, thisYear - 1, thisYear - 2].map((y) => {
            const on = tahun === y;
            return (
              <Pressable
                key={y}
                onPress={() => setTahun(y)}
                style={[s.chip, on ? { backgroundColor: c.primary, borderColor: c.primary } : { backgroundColor: c.card, borderColor: c.border }]}
              >
                <Text style={{ color: on ? c.onPrimary : c.text, fontSize: 12, fontWeight: '600' }}>TA {y}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : null}

      <Text style={{ color: c.muted, fontSize: 12 }}>{loading ? 'Memuat…' : `${total} data`}</Text>
    </View>
  );

  const empty = loading ? (
    <ActivityIndicator color={c.primary} style={{ marginTop: 36 }} />
  ) : error ? (
    <View style={[s.state, { backgroundColor: c.card, borderColor: c.border }]}>
      <Ionicons name="cloud-offline-outline" size={30} color={c.muted} />
      <Text style={{ color: c.text, fontSize: 13, textAlign: 'center' }}>{error}</Text>
    </View>
  ) : (
    <View style={[s.state, { backgroundColor: c.card, borderColor: c.border }]}>
      <Ionicons name="file-tray-outline" size={30} color={c.muted} />
      <Text style={{ color: c.muted, fontSize: 13, textAlign: 'center' }}>{q ? `Tidak ada data yang cocok dengan “${q}”.` : 'Belum ada data.'}</Text>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['top']}>
      <FlatList
        data={loading || error ? [] : items}
        keyExtractor={(it) => String(it.id)}
        renderItem={({ item }) => <Row item={item} onPress={ab?.update || ab?.delete ? () => setMenu(item) : undefined} />}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
        ListFooterComponent={more ? <ActivityIndicator color={c.primary} style={{ marginVertical: 16 }} /> : null}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        contentContainerStyle={s.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={c.primary} />}
        showsVerticalScrollIndicator={false}
      />
      <ActionSheet visible={!!menu && actions.length > 0} onClose={() => setMenu(null)} title={menu?.title ?? 'Aksi'} actions={actions} />
    </SafeAreaView>
  );
}

function Row({ item, onPress }: { item: ResRow; onPress?: () => void }) {
  const { c } = useTheme();
  const [open, setOpen] = useState(false);
  const tone = (t: string) =>
    t === 'ok'
      ? { bg: c.status.terverifikasi.bg, fg: c.status.terverifikasi.fg }
      : t === 'off'
        ? { bg: c.dangerBg, fg: c.danger }
        : { bg: c.tint, fg: c.link };

  return (
    <Card>
      <Pressable onPress={onPress} disabled={!onPress} accessibilityRole="button" style={{ gap: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={{ color: c.text, fontSize: 14, fontWeight: '700', lineHeight: 19 }}>{item.title}</Text>
            {item.subtitle ? <Text style={{ color: c.muted, fontSize: 12, lineHeight: 17 }}>{item.subtitle}</Text> : null}
            {item.lines.map((l, i) => (
              <Text key={i} style={{ color: c.muted, fontSize: 12, lineHeight: 17 }}>
                {l}
              </Text>
            ))}
          </View>
          {onPress ? <Ionicons name="ellipsis-vertical" size={18} color={c.muted} /> : null}
        </View>

        {item.badges.length ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
            {item.badges.map((b, i) => (
              <View key={i} style={{ backgroundColor: tone(b.tone).bg, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3 }}>
                <Text style={{ color: tone(b.tone).fg, fontSize: 11, fontWeight: '700' }}>{b.text}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {item.amounts ? (
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
            {Object.entries(item.amounts).map(([k, v]) => (
              <View key={k} style={{ flex: 1 }}>
                <Text style={{ color: c.muted, fontSize: 10.5 }}>{k}</Text>
                <Text style={{ color: k === 'Sisa' && v < 0 ? c.danger : c.text, fontSize: 12, fontWeight: '700' }}>{rupiah(v)}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </Pressable>

      {item.children ? (
        <View style={{ marginTop: 8 }}>
          <Pressable onPress={() => setOpen((v) => !v)} style={s.drawer} accessibilityRole="button" accessibilityState={{ expanded: open }}>
            <Text style={{ color: c.link, fontSize: 12, fontWeight: '700', flex: 1 }}>
              {item.children_label ?? 'Daftar'} ({item.children.length})
            </Text>
            <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={c.muted} />
          </Pressable>
          {open ? (
            <View style={{ gap: 4, paddingTop: 4 }}>
              {item.children.length === 0 ? <Text style={{ color: c.muted, fontSize: 12 }}>Belum ada.</Text> : null}
              {item.children.map((ch, i) => (
                <Text key={ch.id} style={{ color: c.text, fontSize: 12.5, lineHeight: 18 }}>
                  {i + 1}. {ch.title}
                </Text>
              ))}
            </View>
          ) : null}
        </View>
      ) : null}
    </Card>
  );
}

const s = StyleSheet.create({
  content: { width: '100%', maxWidth: 560, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: { flex: 1, fontSize: 20, fontWeight: '800' },
  search: { flexDirection: 'row', alignItems: 'center', gap: 9, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12 },
  chip: { minHeight: 34, borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center' },
  state: { borderWidth: 1, borderRadius: 16, padding: 24, alignItems: 'center', gap: 10, marginTop: 20 },
  drawer: { flexDirection: 'row', alignItems: 'center', minHeight: 36 },
});
