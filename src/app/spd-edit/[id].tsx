import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LoadState } from '@/components/beranda-ui';
import { Button, TextField } from '@/components/kit';
import { PickerField } from '@/components/perjalanan/fields';
import { Sheet } from '@/components/perjalanan/sheets';
import { Empty, KwitansiSummary, RiilCard, RincianCard, SectionTitle } from '@/components/spd/parts';
import { ApiError } from '@/services/api';
import { spdService, type SpdFull } from '@/services/spd';
import type { Opt, RiilItem } from '@/services/types';
import { useTheme } from '@/theme/ThemeProvider';
import { sptEvents } from '@/utils/events';
import { angka } from '@/utils/format';

const digits = (t: string) => t.replace(/\D/g, '');
const fromPejabat = (p: { id: number; nama: string; nip: string | null } | null): Opt[] => (p ? [{ id: p.id, nama: p.nama, sub: p.nip }] : []);

export default function UbahSpd() {
  const { c } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [d, setD] = useState<SpdFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [noSpt, setNoSpt] = useState('');
  const [noSpd, setNoSpd] = useState('');
  const [bendahara, setBendahara] = useState<Opt[]>([]);
  const [kpa, setKpa] = useState<Opt[]>([]);
  const [pptk, setPptk] = useState<Opt[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const filled = useRef(false);

  // riil (sheet)
  const [riilOpen, setRiilOpen] = useState(false);
  const [riilId, setRiilId] = useState<number | null>(null);
  const [uraian, setUraian] = useState('');
  const [nominal, setNominal] = useState('');
  const [ket, setKet] = useState('');
  const [riilErr, setRiilErr] = useState<Record<string, string>>({});
  const [riilBusy, setRiilBusy] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const x = await spdService.detail(String(id));
      setD(x);
      if (!filled.current) {
        filled.current = true;
        setNoSpt(x.no_spt ?? '');
        setNoSpd(x.no_spd ?? '');
        setBendahara(fromPejabat(x.bendahara));
        setKpa(fromPejabat(x.kpa));
        setPptk(fromPejabat(x.pptk));
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Gagal memuat data SPD.');
    }
  }, [id]);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  // kembali dari form rincian -> muat ulang (tanpa menimpa isian nomor yang sedang diketik)
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

  const saveSpd = async () => {
    const e: Record<string, string> = {};
    if (!noSpt.trim()) e.no_spt = 'Nomor Surat Tugas wajib diisi.';
    if (!noSpd.trim()) e.no_spd = 'Nomor SPD wajib diisi.';
    if (!bendahara[0]) e.bendahara_id = 'Bendahara wajib diisi.';
    if (!kpa[0]) e.kpa_id = 'PA/KPA wajib diisi.';
    if (!pptk[0]) e.pptk_id = 'PPTK wajib diisi.';
    setErrors(e);
    if (Object.keys(e).length) return;

    setSaving(true);
    try {
      const x = await spdService.update(String(id), {
        no_spt: noSpt.trim(),
        no_spd: noSpd.trim(),
        bendahara_id: bendahara[0].id,
        kpa_id: kpa[0].id,
        pptk_id: pptk[0].id,
      });
      setD(x);
      sptEvents.changed();
      Alert.alert('Tersimpan', 'Nomor dan pejabat SPD berhasil disimpan.');
    } catch (err) {
      if (err instanceof ApiError && err.errors) {
        const m: Record<string, string> = {};
        for (const k of Object.keys(err.errors)) m[k] = err.errors[k][0];
        setErrors(m);
      } else {
        Alert.alert('Gagal menyimpan', err instanceof ApiError ? err.message : 'Terjadi kesalahan.');
      }
    } finally {
      setSaving(false);
    }
  };

  const delRincian = (rid: number, nama: string) =>
    Alert.alert('Hapus rincian?', `${nama} akan dihapus.`, [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: async () => {
          try {
            await spdService.rincianDelete(rid);
            sptEvents.changed();
            await load();
          } catch (e) {
            Alert.alert('Gagal', e instanceof ApiError ? e.message : 'Terjadi kesalahan.');
          }
        },
      },
    ]);

  const openRiil = (r?: RiilItem) => {
    setRiilId(r?.id ?? null);
    setUraian(r?.uraian ?? '');
    setNominal(r ? String(Math.round(r.nominal)) : '');
    setKet(r?.keterangan ?? '');
    setRiilErr({});
    setRiilOpen(true);
  };

  const saveRiil = async () => {
    const e: Record<string, string> = {};
    if (!uraian.trim()) e.uraian = 'Uraian wajib diisi.';
    if (!nominal || Number(nominal) < 1) e.nominal = 'Nominal minimal 1.';
    setRiilErr(e);
    if (Object.keys(e).length) return;

    setRiilBusy(true);
    const body = { uraian: uraian.trim(), nominal: Number(nominal), keterangan: ket.trim() || undefined };
    try {
      if (riilId) await spdService.riilUpdate(riilId, body);
      else await spdService.riilCreate(String(id), body);
      setRiilOpen(false);
      sptEvents.changed();
      await load();
    } catch (err) {
      if (err instanceof ApiError && err.errors) {
        const m: Record<string, string> = {};
        for (const k of Object.keys(err.errors)) m[k] = err.errors[k][0];
        setRiilErr(m);
      } else {
        Alert.alert('Gagal menyimpan', err instanceof ApiError ? err.message : 'Terjadi kesalahan.');
      }
    } finally {
      setRiilBusy(false);
    }
  };

  const delRiil = (r: RiilItem) =>
    Alert.alert('Hapus pengeluaran riil?', `${r.uraian} akan dihapus.`, [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: async () => {
          try {
            await spdService.riilDelete(r.id);
            sptEvents.changed();
            await load();
          } catch (e) {
            Alert.alert('Gagal', e instanceof ApiError ? e.message : 'Terjadi kesalahan.');
          }
        },
      },
    ]);

  const goRincian = (rid?: number) =>
    router.push({ pathname: '/rincian-form', params: rid ? { spd: String(id), id: String(rid) } : { spd: String(id) } } as never);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={s.bar}>
        <Pressable onPress={back} hitSlop={12} accessibilityRole="button" accessibilityLabel="Kembali">
          <Ionicons name="arrow-back" size={22} color={c.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={{ color: c.text, fontSize: 17, fontWeight: '800' }}>Ubah SPD</Text>
          {d ? <Text style={{ color: c.muted, fontSize: 12 }} numberOfLines={1}>{d.nama}</Text> : null}
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <LoadState loading={loading} error={d ? null : error} onRetry={() => { setLoading(true); load().finally(() => setLoading(false)); }}>
            {d ? (
              <>
                <SectionTitle title="Nomor & Pejabat" />
                <TextField label="Nomor Surat Tugas" value={noSpt} onChangeText={setNoSpt} placeholder="Nomor surat tugas yang sudah ditandatangani" error={errors.no_spt} />
                <TextField label="Nomor SPD" value={noSpd} onChangeText={setNoSpd} placeholder="Nomor SPD yang sudah ditandatangani" error={errors.no_spd} />
                <PickerField label="Bendahara" placeholder="Pilih bendahara" required local value={bendahara} onChange={setBendahara} load={() => spdService.pejabat('bendahara')} error={errors.bendahara_id} />
                <PickerField label="PA/KPA" placeholder="Pilih PA/KPA" required local value={kpa} onChange={setKpa} load={() => spdService.pejabat('kpa')} error={errors.kpa_id} />
                <PickerField label="PPTK" placeholder="Pilih PPTK" required local value={pptk} onChange={setPptk} load={() => spdService.pejabat('pptk')} error={errors.pptk_id} />
                <Button title="Simpan Nomor & Pejabat" onPress={saveSpd} loading={saving} />

                <KwitansiSummary s={{ kwitansi: d.kwitansi, status_kwitansi: d.status_kwitansi, total_panjar: d.total_panjar, sisa_dibayar: d.sisa_dibayar }} />

                <SectionTitle
                  title={`Rincian (${d.rincian.length})`}
                  right={
                    <Pressable onPress={() => goRincian()} hitSlop={10} accessibilityRole="button">
                      <Text style={{ color: c.link, fontSize: 13, fontWeight: '700' }}>+ Tambah</Text>
                    </Pressable>
                  }
                />
                {d.rincian.length === 0 ? (
                  <Empty text="Belum ada rincian. Ketuk + Tambah untuk mengisi uang harian, penginapan, transport, dan lainnya." />
                ) : (
                  d.rincian.map((r) => <RincianCard key={r.id} r={r} onEdit={() => goRincian(r.id)} onDelete={() => delRincian(r.id, r.jenis_rincian)} />)
                )}

                <SectionTitle
                  title={`Pengeluaran Riil (${d.riil.length})`}
                  right={
                    <Pressable onPress={() => openRiil()} hitSlop={10} accessibilityRole="button">
                      <Text style={{ color: c.link, fontSize: 13, fontWeight: '700' }}>+ Tambah</Text>
                    </Pressable>
                  }
                />
                {d.riil.length === 0 ? (
                  <Empty text="Belum ada pengeluaran riil." />
                ) : (
                  d.riil.map((r) => <RiilCard key={r.id} r={r} onEdit={() => openRiil(r)} onDelete={() => delRiil(r)} />)
                )}
              </>
            ) : null}
          </LoadState>
        </ScrollView>
      </KeyboardAvoidingView>

      <Sheet visible={riilOpen} onClose={() => setRiilOpen(false)} title={riilId ? 'Ubah Pengeluaran Riil' : 'Tambah Pengeluaran Riil'}>
        <TextField label="Uraian" value={uraian} onChangeText={setUraian} placeholder="Contoh: Taksi bandara" error={riilErr.uraian} />
        <TextField
          label="Nominal"
          value={nominal ? angka(Number(nominal)) : ''}
          onChangeText={(t) => setNominal(digits(t))}
          keyboardType="number-pad"
          placeholder="0"
          error={riilErr.nominal}
        />
        <TextField label="Keterangan (opsional)" value={ket} onChangeText={setKet} placeholder="Keterangan" error={riilErr.keterangan} />
        <Button title="Simpan" onPress={saveRiil} loading={riilBusy} />
      </Sheet>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4, minHeight: 44 },
  content: { width: '100%', maxWidth: 520, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 34, gap: 12 },
});
