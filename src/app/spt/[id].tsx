import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LoadState } from '@/components/beranda-ui';
import { StatusChip } from '@/components/kit';
import { DetailActions } from '@/components/perjalanan/DetailActions';
import { DataSurat, Dokumen, HotelTiket, RincianBiaya, Riwayat } from '@/components/perjalanan/DetailSections';
import { ApiError } from '@/services/api';
import { sptService } from '@/services/spt';
import type { SptDetail } from '@/services/types';
import { useTheme } from '@/theme/ThemeProvider';
import { daftarKota, jumlahHari, rentangPanjang, rupiah } from '@/utils/format';

export default function DetailPerjalanan() {
  const { c } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [d, setD] = useState<SptDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setD(await sptService.detail(String(id)));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Gagal memuat detail perjalanan.');
    }
  }, [id]);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  // Muat ulang diam-diam saat kembali dari layar Ubah
  const loaded = useRef(false);
  useEffect(() => {
    if (d) loaded.current = true;
  }, [d]);
  useFocusEffect(
    useCallback(() => {
      if (loaded.current) load();
    }, [load]),
  );

  const back = () => (router.canGoBack() ? router.back() : router.replace('/'));

  const tujuan = d ? (d.tujuan_list?.length ? d.tujuan_list.map((k) => k.nama) : d.tujuan) : [];
  const hari = d ? jumlahHari(d.tgl_berangkat, d.tgl_kembali) : 0;
  const kode = d?.pelaksana.find((p) => p.no_spt)?.no_spt;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={s.bar}>
        <Pressable onPress={back} hitSlop={12} accessibilityRole="button" accessibilityLabel="Kembali">
          <Ionicons name="arrow-back" size={22} color={c.text} />
        </Pressable>
        <Text style={[s.barTitle, { color: c.text }]}>Detail Perjalanan</Text>
      </View>

      <ScrollView
        contentContainerStyle={s.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await load();
              setRefreshing(false);
            }}
            tintColor={c.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <LoadState loading={loading} error={d ? null : error} onRetry={() => { setLoading(true); load().finally(() => setLoading(false)); }}>
          {d ? (
            <>
              <View style={{ gap: 8 }}>
                <View style={s.between}>
                  <Text style={{ color: c.muted, fontSize: 12, flex: 1 }} numberOfLines={1}>
                    {kode ?? 'Perjalanan Dinas'}
                    {d.pelaksana.filter((p) => p.no_spt).length > 1 ? ` +${d.pelaksana.filter((p) => p.no_spt).length - 1} nomor` : ''}
                  </Text>
                  <StatusChip code={d.status.code} label={d.status.label} />
                </View>
                <Text style={[s.heading, { color: c.text }]}>{daftarKota(tujuan)}</Text>
                {d.asal ? (
                  <View style={s.meta}>
                    <Ionicons name="location-outline" size={15} color={c.muted} />
                    <Text style={{ color: c.muted, fontSize: 12, flex: 1 }}>Dari {d.asal}</Text>
                  </View>
                ) : null}
                <View style={s.meta}>
                  <Ionicons name="calendar-outline" size={15} color={c.muted} />
                  <Text style={{ color: c.muted, fontSize: 12, flex: 1 }}>
                    {rentangPanjang(d.tgl_berangkat, d.tgl_kembali)}
                    {hari ? ` • ${hari} hari` : ''}
                  </Text>
                </View>
              </View>

              {d.status.code === 'ditolak' && d.alasan ? (
                <View style={[s.alert, { backgroundColor: c.dangerBg }]}>
                  <Ionicons name="alert-circle-outline" size={18} color={c.danger} />
                  <Text style={{ color: c.danger, fontSize: 12, lineHeight: 18, flex: 1 }}>Ditolak: {d.alasan}</Text>
                </View>
              ) : null}

              <View style={[s.total, { backgroundColor: c.card, borderColor: c.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: c.muted, fontSize: 12 }}>Total biaya</Text>
                  <Text style={{ color: c.muted, fontSize: 11, marginTop: 2 }}>{d.pelaksana.length} pelaksana</Text>
                </View>
                <Text style={{ color: c.link, fontSize: 22, fontWeight: '800' }}>{rupiah(d.total_biaya)}</Text>
              </View>

              <DataSurat d={d} />
              <RincianBiaya d={d} />
              <HotelTiket d={d} />
              <Riwayat d={d} />
              <Dokumen d={d} />
            </>
          ) : null}
        </LoadState>
      </ScrollView>

      {d ? <DetailActions d={d} onChanged={setD} onDeleted={() => back()} /> : null}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4, minHeight: 44 },
  barTitle: { fontSize: 17, fontWeight: '800' },
  content: { width: '100%', maxWidth: 520, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 34, gap: 14 },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  heading: { fontSize: 22, fontWeight: '800', lineHeight: 29, letterSpacing: -0.2 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  alert: { flexDirection: 'row', gap: 9, padding: 12, borderRadius: 12, alignItems: 'flex-start' },
  total: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14 },
});
