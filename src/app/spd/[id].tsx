import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LoadState } from '@/components/beranda-ui';
import { Button, Card, StatusChip } from '@/components/kit';
import { Block, Collapsible, KV } from '@/components/perjalanan/ui';
import { Sheet } from '@/components/perjalanan/sheets';
import { Empty, KwitansiSummary, RiilCard, RincianCard, SectionTitle } from '@/components/spd/parts';
import { ApiError } from '@/services/api';
import { bagikanPdf } from '@/services/pdf';
import { spdService, type Dokumen, type SpdFull } from '@/services/spd';
import { useTheme } from '@/theme/ThemeProvider';
import { daftarKota, rentangPanjang } from '@/utils/format';

export default function DetailSpd() {
  const { c } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [d, setD] = useState<SpdFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [docs, setDocs] = useState(false);
  const [busyDoc, setBusyDoc] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setD(await spdService.detail(String(id)));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Gagal memuat data SPD.');
    }
  }, [id]);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  // muat ulang diam-diam saat kembali dari layar Ubah / Laporan
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

  const share = async (doc: Dokumen) => {
    if (busyDoc) return;
    setBusyDoc(doc.key);
    try {
      await bagikanPdf(doc.path, `${doc.key}-${d?.nama ?? id}`);
    } catch (e) {
      Alert.alert('Tidak dapat membuka dokumen', e instanceof Error ? e.message : 'Terjadi kesalahan.');
    } finally {
      setBusyDoc(null);
    }
  };

  const canLaporan = !!d && d.abilities.can_access_laporan && d.kwitansi !== null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={s.bar}>
        <Pressable onPress={back} hitSlop={12} accessibilityRole="button" accessibilityLabel="Kembali">
          <Ionicons name="arrow-back" size={22} color={c.text} />
        </Pressable>
        <Text style={{ color: c.text, fontSize: 17, fontWeight: '800', flex: 1 }}>Detail SPD</Text>
        {d ? <StatusChip code={d.spt.status} label={{ draft: 'Draft', diajukan: 'Diajukan', terverifikasi: 'Terverifikasi', ditolak: 'Ditolak' }[d.spt.status]} /> : null}
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
              <Card style={{ gap: 4 }}>
                <Text style={{ color: c.text, fontSize: 18, fontWeight: '800' }}>{d.nama}</Text>
                <Text style={{ color: c.muted, fontSize: 12.5, lineHeight: 18 }}>{[d.jabatan, d.bidang].filter(Boolean).join(' • ') || '-'}</Text>
                {d.nip ? <Text style={{ color: c.muted, fontSize: 12 }}>NIP {d.nip}</Text> : null}
                <Text style={{ color: c.muted, fontSize: 12 }}>{[d.golongan, d.tingkat].filter(Boolean).join(' • ')}</Text>
                <View style={{ height: 1, backgroundColor: c.border, marginVertical: 8 }} />
                <Text style={{ color: c.text, fontSize: 13.5, fontWeight: '700' }}>{daftarKota(d.spt.tujuan)}</Text>
                <Text style={{ color: c.muted, fontSize: 12 }}>{rentangPanjang(d.spt.tgl_berangkat, d.spt.tgl_kembali)}</Text>
              </Card>

              <Collapsible title="Nomor & Pejabat" icon="ribbon-outline">
                <KV label="Nomor Surat Tugas" value={d.no_spt ?? '-'} />
                <KV label="Nomor SPD" value={d.no_spd ?? '-'} />
                <Block label="Bendahara">
                  <Text style={{ color: c.text, fontSize: 13 }}>{d.bendahara?.nama ?? '-'}</Text>
                </Block>
                <Block label="PA/KPA">
                  <Text style={{ color: c.text, fontSize: 13 }}>{d.kpa?.nama ?? '-'}</Text>
                </Block>
                <Block label="PPTK">
                  <Text style={{ color: c.text, fontSize: 13 }}>{d.pptk?.nama ?? '-'}</Text>
                </Block>
                {!d.no_spd || !d.bendahara ? (
                  <Text style={{ color: c.danger, fontSize: 12, lineHeight: 17 }}>Nomor SPD dan pejabat belum lengkap. Ketuk Ubah untuk mengisi.</Text>
                ) : null}
              </Collapsible>

              <KwitansiSummary s={{ kwitansi: d.kwitansi, status_kwitansi: d.status_kwitansi, total_panjar: d.total_panjar, sisa_dibayar: d.sisa_dibayar }} />

              <SectionTitle title={`Rincian (${d.rincian.length})`} />
              {d.rincian.length === 0 ? <Empty text="Belum ada rincian biaya." /> : d.rincian.map((r) => <RincianCard key={r.id} r={r} />)}

              <SectionTitle title={`Pengeluaran Riil (${d.riil.length})`} />
              {d.riil.length === 0 ? <Empty text="Belum ada pengeluaran riil." /> : d.riil.map((r) => <RiilCard key={r.id} r={r} />)}

              {d.abilities.can_access_laporan ? (
                <Card style={{ gap: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Ionicons name="document-text-outline" size={18} color={c.link} />
                    <Text style={{ color: c.text, fontSize: 14, fontWeight: '800', flex: 1 }}>Laporan Perjalanan Dinas</Text>
                    <Text style={{ color: d.has_laporan ? c.status.terverifikasi.fg : c.muted, fontSize: 11.5, fontWeight: '700' }}>
                      {d.has_laporan ? 'Sudah dibuat' : 'Belum dibuat'}
                    </Text>
                  </View>
                  {canLaporan ? (
                    <Button
                      variant="outline"
                      title={d.has_laporan ? 'Ubah Laporan Perjadin' : 'Buat Laporan Perjadin'}
                      icon={d.has_laporan ? 'create-outline' : 'add'}
                      onPress={() => router.push({ pathname: '/laporan-form', params: { spd: String(d.id) } } as never)}
                    />
                  ) : (
                    <Text style={{ color: c.muted, fontSize: 12 }}>Laporan dapat dibuat setelah kwitansi tersedia (isi rincian atau pengeluaran riil).</Text>
                  )}
                </Card>
              ) : null}
            </>
          ) : null}
        </LoadState>
      </ScrollView>

      {d ? (
        <View style={[s.footer, { backgroundColor: c.card, borderTopColor: c.border }]}>
          <Button title="Cetak / Bagikan" icon="share-social-outline" variant="outline" onPress={() => setDocs(true)} style={{ flex: 1 }} />
          {d.abilities.can_edit_biaya ? (
            <Button title="Ubah" icon="create-outline" onPress={() => router.push({ pathname: '/spd-edit/[id]', params: { id: String(d.id) } } as never)} style={{ flex: 1 }} />
          ) : null}
        </View>
      ) : null}

      <Sheet visible={docs} onClose={() => setDocs(false)} title="Cetak / Bagikan dokumen">
        <Text style={{ color: c.muted, fontSize: 12, lineHeight: 17 }}>Pilih dokumen. PDF akan diunduh lalu dapat dibagikan ke WhatsApp, Drive, atau dicetak.</Text>
        <View style={{ gap: 2 }}>
          {d?.dokumen.map((doc) => (
            <Pressable
              key={doc.key}
              disabled={!!busyDoc}
              onPress={() => share(doc)}
              style={({ pressed }) => [s.doc, pressed && { backgroundColor: c.tint }, !!busyDoc && busyDoc !== doc.key && { opacity: 0.5 }]}
              accessibilityRole="button"
            >
              <Ionicons name="document-outline" size={20} color={c.link} />
              <Text style={{ flex: 1, color: c.text, fontSize: 14, fontWeight: '600' }}>{doc.label}</Text>
              {busyDoc === doc.key ? <ActivityIndicator color={c.primary} /> : <Ionicons name="share-outline" size={18} color={c.muted} />}
            </Pressable>
          ))}
        </View>
      </Sheet>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4, minHeight: 44 },
  content: { width: '100%', maxWidth: 520, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 24, gap: 12 },
  footer: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingVertical: 12, borderTopWidth: 1 },
  doc: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, paddingHorizontal: 8, borderRadius: 12 },
});
