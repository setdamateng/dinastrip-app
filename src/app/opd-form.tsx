import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Card, TextField } from '@/components/kit';
import { PickerField } from '@/components/perjalanan/fields';
import { ApiError } from '@/services/api';
import { skpdService, type SkpdDetail, type SkpdForm } from '@/services/skpd';
import type { Opt } from '@/services/types';
import { useTheme } from '@/theme/ThemeProvider';
import { masterEvents } from '@/utils/events';

const toOpts = (a: { id: string; nama: string }[]): Opt[] => a.map((o, i) => ({ id: i + 1, nama: o.nama }));

export default function OpdFormScreen() {
  const { c } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const edit = !!id;

  const [meta, setMeta] = useState<SkpdForm | null>(null);
  const [detail, setDetail] = useState<SkpdDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [tipe, setTipe] = useState<Opt[]>([]);
  const [logo, setLogo] = useState<Opt[]>([]);
  const [nama, setNama] = useState('');
  const [singkatan, setSingkatan] = useState('');
  const [namaKop, setNamaKop] = useState('');
  const [alamat, setAlamat] = useState('');
  const [website, setWebsite] = useState('');
  const [email, setEmail] = useState('');
  const [aktif, setAktif] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const m = await skpdService.form();
        if (!alive) return;
        setMeta(m);
        const t = toOpts(m.tipe_kop);
        const l = toOpts(m.tipe_logo);
        if (edit) {
          const d = await skpdService.detail(id!);
          if (!alive) return;
          setDetail(d);
          setTipe(t.filter((_, i) => m.tipe_kop[i].id === d.tipe_kop));
          setLogo(l.filter((_, i) => m.tipe_logo[i].id === d.tipe_logo));
          setNama(d.nama_skpd);
          setSingkatan(d.singkatan ?? '');
          setNamaKop(d.nama_kop ?? '');
          setAlamat(d.alamat ?? '');
          setWebsite(d.website ?? '');
          setEmail(d.email ?? '');
          setAktif(d.is_aktif);
        } else {
          setLogo(l.slice(0, 1));
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

  const back = () => (router.canGoBack() ? router.back() : router.replace('/(app)/opd' as never));

  const save = async () => {
    if (!meta) return;
    const e: Record<string, string> = {};
    if (!tipe[0]) e.tipe_kop = 'Pilih tipe OPD.';
    if (!logo[0]) e.tipe_logo = 'Pilih tipe logo.';
    if (!nama.trim()) e.nama_skpd = 'Nama OPD wajib diisi.';
    if (!namaKop.trim()) e.nama_kop = 'Nama untuk kop wajib diisi.';
    setErrors(e);
    if (Object.keys(e).length) return;

    setBusy(true);
    const body = {
      tipe_kop: meta.tipe_kop[tipe[0].id - 1].id,
      tipe_logo: meta.tipe_logo[logo[0].id - 1].id,
      nama_skpd: nama.trim(),
      singkatan: singkatan.trim(),
      nama_kop: namaKop.trim(),
      alamat: alamat.trim(),
      website: website.trim(),
      email: email.trim(),
      is_aktif: aktif,
    };
    try {
      if (edit) await skpdService.update(id!, body);
      else await skpdService.create(body);
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
        <Text style={{ color: c.text, fontSize: 17, fontWeight: '800' }}>{edit ? 'Ubah OPD' : 'Tambah OPD'}</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={c.primary} style={{ marginTop: 40 }} />
      ) : loadError || !meta ? (
        <Text style={{ color: c.danger, textAlign: 'center', margin: 24 }}>{loadError ?? 'Formulir tidak tersedia.'}</Text>
      ) : (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={s.body} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {detail ? (
              <Card style={{ gap: 6 }}>
                <Text style={{ color: c.muted, fontSize: 12 }}>
                  {detail.bidang_count} bidang · {detail.pegawai_count} pegawai
                </Text>
                {detail.bidang.length > 0 ? (
                  <Text style={{ color: c.text, fontSize: 12, lineHeight: 18 }}>{detail.bidang.map((b) => b.nama).join(' • ')}</Text>
                ) : null}
              </Card>
            ) : null}

            <PickerField label="Tipe OPD" placeholder="Pilih" required local value={tipe} onChange={setTipe} load={async () => toOpts(meta.tipe_kop)} error={errors.tipe_kop} />
            <PickerField label="Tipe logo" placeholder="Pilih" required local value={logo} onChange={setLogo} load={async () => toOpts(meta.tipe_logo)} error={errors.tipe_logo} />
            <TextField label="Nama OPD" value={nama} onChangeText={setNama} placeholder="Nama OPD" error={errors.nama_skpd} />
            <TextField label="Singkatan (akronim)" value={singkatan} onChangeText={setSingkatan} placeholder="Contoh: DISKOMINFO" autoCapitalize="characters" error={errors.singkatan} />
            <TextField label="Nama untuk kop surat" value={namaKop} onChangeText={setNamaKop} multiline placeholder="Nama pada kop surat" style={s.multi} error={errors.nama_kop} />
            <TextField label="Alamat" value={alamat} onChangeText={setAlamat} multiline placeholder="Alamat kantor" style={s.multi} error={errors.alamat} />
            <TextField label="Website" value={website} onChangeText={setWebsite} autoCapitalize="none" keyboardType="url" placeholder="https://" error={errors.website} />
            <TextField label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="nama@instansi.go.id" error={errors.email} />

            <View style={s.toggle}>
              <Text style={{ flex: 1, color: c.text, fontSize: 13 }}>OPD aktif</Text>
              <Switch value={aktif} onValueChange={setAktif} trackColor={{ true: c.primary, false: c.border }} accessibilityLabel="OPD aktif" />
            </View>

            <Button title={edit ? 'Simpan Perubahan' : 'Simpan OPD'} onPress={save} loading={busy} />
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, minHeight: 52 },
  body: { width: '100%', maxWidth: 520, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 32, gap: 14 },
  multi: { minHeight: 64, paddingVertical: 8, textAlignVertical: 'top' },
  toggle: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44 },
});
