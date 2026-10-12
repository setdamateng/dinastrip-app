import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, TextField } from '@/components/kit';
import { DateField, FieldBox, todayIso } from '@/components/perjalanan/fields';
import { ApiError } from '@/services/api';
import { spdService } from '@/services/spd';
import { useTheme } from '@/theme/ThemeProvider';
import { RichTextArea } from '@/components/RichTextArea';
import { sptEvents } from '@/utils/events';
import { htmlToMd, mdToHtml } from '@/utils/richtext';

export default function LaporanForm() {
  const { c } = useTheme();
  const router = useRouter();
  const { spd } = useLocalSearchParams<{ spd: string }>();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [minTgl, setMinTgl] = useState<string | undefined>();
  const [edit, setEdit] = useState(false);

  const [tgl, setTgl] = useState('');
  const [maksud, setMaksud] = useState('');
  const [instansi, setInstansi] = useState('');
  const [hasil, setHasil] = useState('');
  const [kesimpulan, setKesimpulan] = useState('');
  const [rekomendasi, setRekomendasi] = useState('');

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const st = await spdService.laporan(String(spd));
        if (!alive) return;
        const l = st.laporan;
        setEdit(!!l);
        setMinTgl(st.defaults.tgl_kembali ?? undefined);
        setTgl(l?.tgl_laporan ?? todayIso());
        setMaksud(htmlToMd(l?.maksud_perjalanan ?? st.defaults.maksud_perjalanan));
        setInstansi(l?.instansi_dikunjungi ?? '');
        setHasil(htmlToMd(l?.hasil_kegiatan));
        setKesimpulan(htmlToMd(l?.kesimpulan));
        setRekomendasi(htmlToMd(l?.rekomendasi));
      } catch (err) {
        if (alive) setLoadError(err instanceof ApiError ? err.message : 'Gagal memuat laporan.');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [spd]);

  const back = () => (router.canGoBack() ? router.back() : router.replace('/'));

  const save = async () => {
    const e: Record<string, string> = {};
    if (!tgl) e.tgl_laporan = 'Tanggal laporan wajib diisi.';
    else if (minTgl && tgl < minTgl) e.tgl_laporan = 'Tanggal laporan harus setelah tanggal kembali.';
    if (!hasil.trim()) e.hasil_kegiatan = 'Hasil kegiatan wajib diisi.';
    setErrors(e);
    if (Object.keys(e).length) return;

    setBusy(true);
    try {
      await spdService.laporanSave(String(spd), {
        tgl_laporan: tgl,
        maksud_perjalanan: mdToHtml(maksud),
        instansi_dikunjungi: instansi.trim(),
        hasil_kegiatan: mdToHtml(hasil),
        kesimpulan: mdToHtml(kesimpulan),
        rekomendasi: mdToHtml(rekomendasi),
      });
      sptEvents.changed();
      Alert.alert('Tersimpan', 'Laporan perjalanan dinas tersimpan.', [{ text: 'OK', onPress: back }]);
    } catch (err) {
      if (err instanceof ApiError && err.errors) {
        const m: Record<string, string> = {};
        for (const k of Object.keys(err.errors)) m[k] = err.errors[k][0];
        setErrors(m);
        Alert.alert('Periksa isian', err.message);
      } else {
        Alert.alert('Gagal menyimpan', err instanceof ApiError ? err.message : 'Terjadi kesalahan.');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={s.bar}>
        <Pressable onPress={back} hitSlop={12} accessibilityRole="button" accessibilityLabel="Kembali">
          <Ionicons name="arrow-back" size={22} color={c.text} />
        </Pressable>
        <Text style={{ color: c.text, fontSize: 17, fontWeight: '800' }}>{edit ? 'Ubah Laporan Perjadin' : 'Laporan Perjadin'}</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={c.primary} style={{ marginTop: 40 }} />
      ) : loadError ? (
        <Text style={{ color: c.danger, textAlign: 'center', margin: 24 }}>{loadError}</Text>
      ) : (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <DateField label="Tanggal laporan" required value={tgl} onChange={setTgl} min={minTgl} error={errors.tgl_laporan} hint="Tidak boleh sebelum tanggal kembali." />

            <FieldBox label="Maksud perjalanan" error={errors.maksud_perjalanan}>
              <RichTextArea value={maksud} onChangeText={setMaksud} minHeight={80} placeholder="Maksud perjalanan dinas" />
            </FieldBox>

            <TextField label="Instansi yang dikunjungi" value={instansi} onChangeText={setInstansi} placeholder="Nama instansi / lokasi" error={errors.instansi_dikunjungi} />

            <FieldBox label="Hasil kegiatan" required error={errors.hasil_kegiatan}>
              <RichTextArea value={hasil} onChangeText={setHasil} minHeight={220} placeholder="Uraikan hasil kegiatan" error={!!errors.hasil_kegiatan} />
            </FieldBox>

            <FieldBox label="Kesimpulan" error={errors.kesimpulan}>
              <RichTextArea value={kesimpulan} onChangeText={setKesimpulan} minHeight={110} placeholder="Kesimpulan" />
            </FieldBox>

            <FieldBox label="Rekomendasi" error={errors.rekomendasi}>
              <RichTextArea value={rekomendasi} onChangeText={setRekomendasi} minHeight={110} placeholder="Rekomendasi" />
            </FieldBox>

            <Button title={edit ? 'Simpan Perubahan' : 'Simpan Laporan'} onPress={save} loading={busy} />
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4, minHeight: 44 },
  content: { width: '100%', maxWidth: 520, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 40, gap: 14 },
});
