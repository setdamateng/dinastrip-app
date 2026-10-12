import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, TextField } from '@/components/kit';
import { PickerField } from '@/components/perjalanan/fields';
import { ApiError } from '@/services/api';
import { pegawaiService, type PegawaiForm } from '@/services/pegawai';
import type { Opt } from '@/services/types';
import { useTheme } from '@/theme/ThemeProvider';
import { masterEvents } from '@/utils/events';

const strOpts = (a: string[]): Opt[] => a.map((n, i) => ({ id: i + 1, nama: n }));
const pick = (list: Opt[], id?: number | null): Opt[] => list.filter((o) => o.id === id);

const TOGGLES: { key: 'is_bendahara' | 'is_kpa' | 'is_pptk' | 'is_ttd'; label: string }[] = [
  { key: 'is_bendahara', label: 'Juga sebagai Bendahara' },
  { key: 'is_kpa', label: 'Juga sebagai PA/KPA' },
  { key: 'is_pptk', label: 'Juga sebagai PPTK' },
  { key: 'is_ttd', label: 'Juga sebagai Penandatangan Surat Tugas' },
];

export default function PegawaiFormScreen() {
  const { c } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const edit = !!id;

  const [meta, setMeta] = useState<PegawaiForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [jenisNip, setJenisNip] = useState<Opt[]>([]);
  const [nip, setNip] = useState('');
  const [nama, setNama] = useState('');
  const [jabatan, setJabatan] = useState('');
  const [jenisPeg, setJenisPeg] = useState<Opt[]>([]);
  const [gol, setGol] = useState<Opt[]>([]);
  const [bidang, setBidang] = useState<Opt[]>([]);
  const [tingkat, setTingkat] = useState<Opt[]>([]);
  const [flags, setFlags] = useState({ is_bendahara: false, is_kpa: false, is_pptk: false, is_ttd: false });

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const m = await pegawaiService.form();
        if (!alive) return;
        setMeta(m);
        if (edit) {
          const d = await pegawaiService.detail(id!);
          if (!alive) return;
          setJenisNip(pick(strOpts(m.jenis_nip), strOpts(m.jenis_nip).find((o) => o.nama === d.jenis_nip)?.id));
          setNip(d.nip);
          setNama(d.nama);
          setJabatan(d.jabatan);
          setJenisPeg(pick(strOpts(m.jenis_peg), strOpts(m.jenis_peg).find((o) => o.nama === d.jenis_peg)?.id));
          setGol(pick(m.golongan, d.gol_id));
          setBidang(pick(m.bidang, d.bidang_id));
          setTingkat(pick(m.tingkat, d.tingkat_id));
          setFlags({ is_bendahara: d.is_bendahara, is_kpa: d.is_kpa, is_pptk: d.is_pptk, is_ttd: d.is_ttd });
        } else {
          setJenisNip(strOpts(m.jenis_nip).slice(0, 1));
        }
      } catch (e) {
        if (alive) setLoadError(e instanceof ApiError ? e.message : 'Gagal memuat formulir.');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id, edit]);

  const back = () => (router.canGoBack() ? router.back() : router.replace('/(app)/pegawai' as never));

  const save = async () => {
    if (!meta) return;
    const e: Record<string, string> = {};
    if (!jenisNip[0]) e.jenis_nip = 'Pilih jenis identitas.';
    if (!nip.trim()) e.nip = 'Nomor identitas wajib diisi.';
    if (!nama.trim()) e.nama = 'Nama wajib diisi.';
    if (!jabatan.trim()) e.jabatan = 'Jabatan wajib diisi.';
    if (!jenisPeg[0]) e.jenis_peg = 'Pilih jenis pegawai.';
    if (!gol[0]) e.gol_id = 'Pilih pangkat/golongan.';
    if (!bidang[0]) e.bidang_id = 'Pilih bidang/unit kerja.';
    if (!tingkat[0]) e.tingkat_id = 'Pilih tingkat perjalanan dinas.';
    setErrors(e);
    if (Object.keys(e).length) return;

    setBusy(true);
    const body = {
      jenis_nip: jenisNip[0].nama,
      nip: nip.trim(),
      nama: nama.trim(),
      jabatan: jabatan.trim(),
      jenis_peg: jenisPeg[0].nama,
      gol_id: gol[0].id,
      bidang_id: bidang[0].id,
      tingkat_id: tingkat[0].id,
      ...flags,
    };
    try {
      if (edit) await pegawaiService.update(id!, body);
      else await pegawaiService.create(body);
      masterEvents.changed();
      back();
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
      <View style={s.header}>
        <Pressable onPress={back} hitSlop={12} accessibilityRole="button" accessibilityLabel="Kembali">
          <Ionicons name="arrow-back" size={24} color={c.text} />
        </Pressable>
        <Text style={{ color: c.text, fontSize: 17, fontWeight: '800' }}>{edit ? 'Ubah Pegawai' : 'Tambah Pegawai'}</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={c.primary} style={{ marginTop: 40 }} />
      ) : loadError || !meta ? (
        <Text style={{ color: c.danger, textAlign: 'center', margin: 24 }}>{loadError ?? 'Formulir tidak tersedia.'}</Text>
      ) : (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={s.body} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <PickerField label="Jenis identitas" placeholder="Pilih" required local value={jenisNip} onChange={setJenisNip} load={async () => strOpts(meta.jenis_nip)} error={errors.jenis_nip} />
            <TextField label="Nomor identitas" value={nip} onChangeText={setNip} maxLength={18} keyboardType="number-pad" placeholder="NIP / NRP / NIR" error={errors.nip} />
            <TextField label="Nama pegawai" value={nama} onChangeText={setNama} placeholder="Nama lengkap beserta gelar" error={errors.nama} />
            <TextField label="Jabatan" value={jabatan} onChangeText={setJabatan} placeholder="Jabatan" error={errors.jabatan} />
            <PickerField label="Jenis pegawai" placeholder="Pilih" required local value={jenisPeg} onChange={setJenisPeg} load={async () => strOpts(meta.jenis_peg)} error={errors.jenis_peg} />
            <PickerField label="Pangkat/Gol. Ruang" placeholder="Pilih" required local value={gol} onChange={setGol} load={async () => meta.golongan} error={errors.gol_id} />
            <PickerField label="Bidang/Unit Kerja" placeholder="Pilih" required local value={bidang} onChange={setBidang} load={async () => meta.bidang} error={errors.bidang_id} />
            <PickerField label="Tingkat perjalanan dinas" placeholder="Pilih" required local value={tingkat} onChange={setTingkat} load={async () => meta.tingkat} error={errors.tingkat_id} />

            <View style={{ gap: 4, marginTop: 4 }}>
              {TOGGLES.map((t) => (
                <View key={t.key} style={s.toggle}>
                  <Text style={{ flex: 1, color: c.text, fontSize: 13 }}>{t.label}</Text>
                  <Switch
                    value={flags[t.key]}
                    onValueChange={(v) => setFlags((f) => ({ ...f, [t.key]: v }))}
                    trackColor={{ true: c.primary, false: c.border }}
                    accessibilityLabel={t.label}
                  />
                </View>
              ))}
            </View>

            <Button title={edit ? 'Simpan Perubahan' : 'Simpan Pegawai'} onPress={save} loading={busy} />
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, minHeight: 52 },
  body: { width: '100%', maxWidth: 520, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 32, gap: 14 },
  toggle: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44 },
});
