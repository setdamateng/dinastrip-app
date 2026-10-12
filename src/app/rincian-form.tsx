import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Card, TextField } from '@/components/kit';
import { DateField, FieldBox, PickerField } from '@/components/perjalanan/fields';
import { Sheet } from '@/components/perjalanan/sheets';
import { ApiError } from '@/services/api';
import { spdService, type Bandara, type RincianMeta } from '@/services/spd';
import type { Opt } from '@/services/types';
import { useTheme } from '@/theme/ThemeProvider';
import { sptEvents } from '@/utils/events';
import { angka, rupiah } from '@/utils/format';

const digits = (t: string) => t.replace(/\D/g, '');
const decimal = (t: string) => t.replace(',', '.').replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
const clock = (t: string) => {
  const d = digits(t).slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}:${d.slice(2)}` : d;
};
const nz = (v: string) => (v.trim() === '' ? null : v.trim());

type F = Record<
  | 'kuantitas' | 'nominal' | 'keterangan' | 'panjar'
  | 'nomor_bill' | 'nama_hotel' | 'tgl_masuk' | 'tgl_keluar' | 'nomor_kamar' | 'alamat_hotel' | 'no_telp_hotel' | 'email_hotel'
  | 'nama_maskapai' | 'kode_booking' | 'nomor_tiket' | 'nomor_penerbangan' | 'jam_berangkat' | 'jam_sampai_tujuan'
  | 'tempat_duduk' | 'tanggal_tiket' | 'asal_tiket' | 'tujuan_tiket',
  string
>;

const EMPTY: F = {
  kuantitas: '', nominal: '', keterangan: '', panjar: '',
  nomor_bill: '', nama_hotel: '', tgl_masuk: '', tgl_keluar: '', nomor_kamar: '', alamat_hotel: '', no_telp_hotel: '', email_hotel: '',
  nama_maskapai: '', kode_booking: '', nomor_tiket: '', nomor_penerbangan: '', jam_berangkat: '', jam_sampai_tujuan: '',
  tempat_duduk: '', tanggal_tiket: '', asal_tiket: '', tujuan_tiket: '',
};

export default function RincianForm() {
  const { c } = useTheme();
  const router = useRouter();
  const { spd, id } = useLocalSearchParams<{ spd: string; id?: string }>();
  const edit = !!id;

  const [meta, setMeta] = useState<RincianMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [jenis, setJenis] = useState<Opt[]>([]);
  const [satuan, setSatuan] = useState<Opt[]>([]);
  const [potongan, setPotongan] = useState(0);
  const [f, setF] = useState<F>(EMPTY);
  const set = (k: keyof F) => (v: string) => setF((p) => ({ ...p, [k]: v }));

  const jenisVal = jenis[0] && meta ? meta.jenis_rincian[jenis[0].id - 1]?.value : undefined;
  const penginapan = jenisVal === 'Biaya Penginapan';
  const transport = jenisVal === 'Biaya Transportasi';
  const hotelWajib = penginapan && potongan === 0;

  const jenisOpts = (m: RincianMeta): Opt[] => m.jenis_rincian.map((j, i) => ({ id: i + 1, nama: j.label }));
  const satuanOpts = (m: RincianMeta): Opt[] => m.satuan.map((x, i) => ({ id: i + 1, nama: x }));

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const m = await spdService.rincianMeta();
        if (!alive) return;
        setMeta(m);
        if (edit) {
          const list = await spdService.rincianList(String(spd));
          const r = list.find((x) => String(x.id) === String(id));
          if (!r) throw new ApiError('Rincian tidak ditemukan.', 404);
          if (!alive) return;
          setJenis(jenisOpts(m).filter((_, i) => m.jenis_rincian[i].value === r.jenis_rincian));
          setSatuan(satuanOpts(m).filter((o) => o.nama === r.satuan));
          setPotongan(r.potongan > 0 ? 0.3 : 0);
          const h = r.hotel;
          const t = r.tiket;
          setF({
            ...EMPTY,
            kuantitas: String(r.kuantitas).replace('.', ','),
            nominal: String(Math.round(r.nominal)),
            keterangan: r.keterangan ?? '',
            panjar: r.panjar ? String(Math.round(r.panjar)) : '',
            nomor_bill: h?.nomor_bill ?? '', nama_hotel: h?.nama_hotel ?? '', tgl_masuk: h?.tgl_masuk ?? '', tgl_keluar: h?.tgl_keluar ?? '',
            nomor_kamar: h?.nomor_kamar ?? '', alamat_hotel: h?.alamat_hotel ?? '', no_telp_hotel: h?.no_telp_hotel ?? '', email_hotel: h?.email_hotel ?? '',
            nama_maskapai: t?.nama_maskapai ?? '', kode_booking: t?.kode_booking ?? '', nomor_tiket: t?.nomor_tiket ?? '',
            nomor_penerbangan: t?.nomor_penerbangan ?? '', jam_berangkat: (t?.jam_berangkat ?? '').slice(0, 5),
            jam_sampai_tujuan: (t?.jam_sampai_tujuan ?? '').slice(0, 5), tempat_duduk: t?.tempat_duduk ?? '',
            tanggal_tiket: t?.tanggal_tiket ?? '', asal_tiket: t?.asal_tiket ?? '', tujuan_tiket: t?.tujuan_tiket ?? '',
          });
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
  }, [spd, id, edit]);

  const qty = Number(decimal(f.kuantitas)) || 0;
  const nominal = Number(f.nominal) || 0;
  const awal = qty * nominal;
  const jumlah = potongan > 0 ? awal * potongan : awal;
  const maxPanjar = Math.round(awal * (1 - potongan) * 100) / 100;

  const back = () => (router.canGoBack() ? router.back() : router.replace('/'));

  const save = async () => {
    const e: Record<string, string> = {};
    if (!jenisVal) e.jenis_rincian = 'Pilih jenis rincian.';
    if (!qty || qty < 1) e.kuantitas = 'Qty minimal 1.';
    if (!satuan[0]) e.satuan = 'Pilih satuan.';
    if (!nominal || nominal < 1) e.nominal = 'Nominal minimal 1.';
    if (!f.keterangan.trim()) e.keterangan = 'Keterangan wajib diisi.';
    if (Number(f.panjar) > maxPanjar) e.panjar = `Panjar tidak boleh melebihi ${rupiah(maxPanjar)}.`;
    if (hotelWajib) {
      (['nomor_bill', 'nama_hotel', 'tgl_masuk', 'tgl_keluar', 'nomor_kamar'] as const).forEach((k) => {
        if (!f[k].trim()) e[k] = 'Wajib diisi.';
      });
    }
    if (penginapan && f.tgl_masuk && f.tgl_keluar && f.tgl_keluar < f.tgl_masuk) e.tgl_keluar = 'Tanggal keluar tidak boleh sebelum tanggal masuk.';
    const jamOk = (v: string) => v === '' || /^([01]\d|2[0-3]):[0-5]\d$/.test(v);
    if (!jamOk(f.jam_berangkat)) e.jam_berangkat = 'Format jam HH:MM.';
    if (!jamOk(f.jam_sampai_tujuan)) e.jam_sampai_tujuan = 'Format jam HH:MM.';
    setErrors(e);
    if (Object.keys(e).length) return;

    const body: Record<string, string | number | null> = {
      jenis_rincian: jenisVal!,
      kuantitas: qty,
      satuan: satuan[0].nama,
      nominal,
      potongan,
      keterangan: f.keterangan.trim(),
      panjar: Number(f.panjar) || 0,
    };
    if (penginapan) {
      (['nomor_bill', 'nama_hotel', 'tgl_masuk', 'tgl_keluar', 'nomor_kamar', 'alamat_hotel', 'no_telp_hotel', 'email_hotel'] as const).forEach((k) => (body[k] = nz(f[k])));
    }
    if (transport) {
      (['nama_maskapai', 'kode_booking', 'nomor_tiket', 'nomor_penerbangan', 'jam_berangkat', 'jam_sampai_tujuan', 'tempat_duduk', 'tanggal_tiket', 'asal_tiket', 'tujuan_tiket'] as const).forEach((k) => (body[k] = nz(f[k])));
    }

    setBusy(true);
    try {
      if (edit) await spdService.rincianUpdate(Number(id), body);
      else await spdService.rincianCreate(String(spd), body);
      sptEvents.changed();
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
      <View style={s.bar}>
        <Pressable onPress={back} hitSlop={12} accessibilityRole="button" accessibilityLabel="Kembali">
          <Ionicons name="arrow-back" size={22} color={c.text} />
        </Pressable>
        <Text style={{ color: c.text, fontSize: 17, fontWeight: '800' }}>{edit ? 'Ubah Rincian' : 'Tambah Rincian'}</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={c.primary} style={{ marginTop: 40 }} />
      ) : loadError || !meta ? (
        <Text style={{ color: c.danger, textAlign: 'center', margin: 24 }}>{loadError ?? 'Formulir tidak tersedia.'}</Text>
      ) : (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <PickerField label="Jenis rincian" placeholder="Pilih jenis" required local value={jenis} onChange={setJenis} load={async () => jenisOpts(meta)} error={errors.jenis_rincian} />

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <TextField label="Qty" value={f.kuantitas} onChangeText={(t) => set('kuantitas')(decimal(t))} keyboardType="decimal-pad" placeholder="0" error={errors.kuantitas} />
              </View>
              <View style={{ flex: 1.4 }}>
                <PickerField label="Satuan" placeholder="Pilih" required local value={satuan} onChange={setSatuan} load={async () => satuanOpts(meta)} error={errors.satuan} />
              </View>
            </View>

            <TextField label="Nominal (per satuan)" value={f.nominal ? angka(Number(f.nominal)) : ''} onChangeText={(t) => set('nominal')(digits(t))} keyboardType="number-pad" placeholder="0" error={errors.nominal} />

            <FieldBox label="Potongan" required error={errors.potongan} hint="30% berarti hanya 30% dari total yang dibayarkan (mis. penginapan tanpa bukti).">
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {meta.potongan.map((p) => {
                  const on = potongan === p.value;
                  return (
                    <Pressable
                      key={p.value}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: on }}
                      onPress={() => setPotongan(p.value)}
                      style={[s.chip, { borderColor: on ? c.primary : c.border, backgroundColor: on ? c.tint : 'transparent' }]}
                    >
                      <Text style={{ color: on ? c.link : c.text, fontSize: 13, fontWeight: on ? '800' : '500' }}>{p.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </FieldBox>

            <TextField label="Keterangan" value={f.keterangan} onChangeText={set('keterangan')} placeholder="Contoh: Uang harian 2 hari" error={errors.keterangan} />
            <TextField
              label="Nominal panjar (jika ada)"
              value={f.panjar ? angka(Number(f.panjar)) : ''}
              onChangeText={(t) => set('panjar')(digits(t))}
              keyboardType="number-pad"
              placeholder="0"
              error={errors.panjar}
            />
            {maxPanjar > 0 ? <Text style={{ color: c.muted, fontSize: 11, marginTop: -8 }}>Maksimal panjar {rupiah(maxPanjar)}</Text> : null}

            <Card style={{ gap: 4 }}>
              <Text style={{ color: c.muted, fontSize: 12 }}>Jumlah yang dibayarkan</Text>
              <Text style={{ color: c.link, fontSize: 20, fontWeight: '800' }}>{rupiah(jumlah)}</Text>
              <Text style={{ color: c.muted, fontSize: 11 }}>
                {qty || 0} × {rupiah(nominal)}{potongan > 0 ? ` × ${Math.round(potongan * 100)}%` : ''}
              </Text>
            </Card>

            {penginapan ? (
              <>
                <Text style={[s.section, { color: c.text }]}>Data Hotel</Text>
                {hotelWajib ? null : <Text style={{ color: c.muted, fontSize: 11.5 }}>Dengan potongan 30%, data hotel tidak wajib diisi.</Text>}
                <TextField label="Nomor bill / kwitansi / invoice" value={f.nomor_bill} onChangeText={set('nomor_bill')} error={errors.nomor_bill} />
                <TextField label="Nama hotel" value={f.nama_hotel} onChangeText={set('nama_hotel')} error={errors.nama_hotel} />
                <DateField label="Tanggal masuk" value={f.tgl_masuk} onChange={set('tgl_masuk')} error={errors.tgl_masuk} />
                <DateField label="Tanggal keluar" value={f.tgl_keluar} onChange={set('tgl_keluar')} min={f.tgl_masuk || undefined} error={errors.tgl_keluar} />
                <TextField label="Nomor kamar" value={f.nomor_kamar} onChangeText={set('nomor_kamar')} error={errors.nomor_kamar} />
                <TextField label="Alamat hotel" value={f.alamat_hotel} onChangeText={set('alamat_hotel')} multiline style={{ minHeight: 52, textAlignVertical: 'top', paddingVertical: 6 }} error={errors.alamat_hotel} />
                <TextField label="No. telp / HP" value={f.no_telp_hotel} onChangeText={set('no_telp_hotel')} keyboardType="phone-pad" error={errors.no_telp_hotel} />
                <TextField label="Email" value={f.email_hotel} onChangeText={set('email_hotel')} autoCapitalize="none" keyboardType="email-address" error={errors.email_hotel} />
              </>
            ) : null}

            {transport ? (
              <>
                <Text style={[s.section, { color: c.text }]}>Data Penerbangan</Text>
                <Text style={{ color: c.muted, fontSize: 11.5, lineHeight: 16 }}>Jika lebih dari satu tiket, gabungkan nama, nomor tiket, dan data lain dalam satu kolom.</Text>
                <TextField label="Nama maskapai" value={f.nama_maskapai} onChangeText={set('nama_maskapai')} error={errors.nama_maskapai} />
                <TextField label="Kode booking" value={f.kode_booking} onChangeText={set('kode_booking')} autoCapitalize="characters" error={errors.kode_booking} />
                <TextField label="Nomor tiket" value={f.nomor_tiket} onChangeText={set('nomor_tiket')} error={errors.nomor_tiket} />
                <TextField label="Nomor penerbangan" value={f.nomor_penerbangan} onChangeText={set('nomor_penerbangan')} autoCapitalize="characters" error={errors.nomor_penerbangan} />
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <TextField label="Jam berangkat" value={f.jam_berangkat} onChangeText={(t) => set('jam_berangkat')(clock(t))} keyboardType="number-pad" placeholder="HH:MM" maxLength={5} error={errors.jam_berangkat} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <TextField label="Jam tiba" value={f.jam_sampai_tujuan} onChangeText={(t) => set('jam_sampai_tujuan')(clock(t))} keyboardType="number-pad" placeholder="HH:MM" maxLength={5} error={errors.jam_sampai_tujuan} />
                  </View>
                </View>
                <TextField label="Tempat duduk" value={f.tempat_duduk} onChangeText={set('tempat_duduk')} error={errors.tempat_duduk} />
                <DateField label="Tanggal tiket" value={f.tanggal_tiket} onChange={set('tanggal_tiket')} error={errors.tanggal_tiket} />
                <AirportField label="Bandara asal" value={f.asal_tiket} onChange={set('asal_tiket')} error={errors.asal_tiket} />
                <AirportField label="Bandara tujuan" value={f.tujuan_tiket} onChange={set('tujuan_tiket')} error={errors.tujuan_tiket} />
              </>
            ) : null}

            <Button title={edit ? 'Simpan Perubahan' : 'Simpan Rincian'} onPress={save} loading={busy} />
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

/** Pilih bandara (cari nama / kode IATA). Nilai yang disimpan = kode IATA, sama seperti di web. */
function AirportField({ label, value, onChange, error }: { label: string; value: string; onChange: (v: string) => void; error?: string }) {
  const { c } = useTheme();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [rows, setRows] = useState<Bandara[]>([]);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [picked, setPicked] = useState<Bandara | null>(null);
  const seq = useRef(0);

  useEffect(() => {
    if (!open) return;
    const my = ++seq.current;
    const t = setTimeout(async () => {
      setBusy(true);
      setFailed(false);
      try {
        const r = await spdService.bandara(q.trim() || undefined);
        if (my === seq.current) setRows(r);
      } catch {
        if (my === seq.current) setFailed(true);
      } finally {
        if (my === seq.current) setBusy(false);
      }
    }, q ? 350 : 0);
    return () => clearTimeout(t);
  }, [open, q]);

  const shown = picked && picked.code === value ? picked.label : value;

  return (
    <FieldBox label={label} error={error}>
      <Pressable
        accessibilityRole="button"
        onPress={() => setOpen(true)}
        style={[s.pick, { backgroundColor: c.inputBg, borderColor: error ? c.danger : c.border }]}
      >
        <Text style={{ flex: 1, color: value ? c.text : c.muted, fontSize: 14 }} numberOfLines={1}>
          {shown || 'Pilih bandara'}
        </Text>
        {value ? (
          <Pressable hitSlop={10} onPress={() => { onChange(''); setPicked(null); }} accessibilityLabel="Hapus pilihan">
            <Ionicons name="close-circle" size={18} color={c.muted} />
          </Pressable>
        ) : (
          <Ionicons name="chevron-down" size={18} color={c.muted} />
        )}
      </Pressable>
      <Sheet visible={open} onClose={() => setOpen(false)} title={label}>
        <View style={[s.search, { backgroundColor: c.inputBg, borderColor: c.border }]}>
          <Ionicons name="search-outline" size={18} color={c.muted} />
          <TextInput
            value={q}
            onChangeText={setQ}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="Cari nama bandara atau kode"
            placeholderTextColor={c.muted}
            style={{ flex: 1, color: c.text, fontSize: 14, paddingVertical: 0, minHeight: 42 }}
          />
        </View>
        {busy ? <ActivityIndicator color={c.primary} /> : null}
        {failed ? <Text style={{ color: c.danger, fontSize: 12 }}>Gagal memuat daftar bandara.</Text> : null}
        {!busy && !failed && rows.length === 0 ? <Text style={{ color: c.muted, fontSize: 12 }}>Tidak ada bandara yang cocok.</Text> : null}
        {rows.map((b) => (
          <Pressable
            key={b.code}
            onPress={() => {
              onChange(b.code);
              setPicked(b);
              setOpen(false);
            }}
            style={({ pressed }) => [s.row, pressed && { backgroundColor: c.tint }]}
          >
            <Text style={{ color: c.text, fontSize: 14, flex: 1 }}>{b.label}</Text>
            {b.code === value ? <Ionicons name="checkmark" size={18} color={c.link} /> : null}
          </Pressable>
        ))}
      </Sheet>
    </FieldBox>
  );
}

const s = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4, minHeight: 44 },
  content: { width: '100%', maxWidth: 520, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 40, gap: 14 },
  chip: { flex: 1, minHeight: 44, borderWidth: 1.5, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  section: { fontSize: 15, fontWeight: '800', marginTop: 8 },
  pick: { minHeight: 48, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 8 },
  search: { flexDirection: 'row', alignItems: 'center', gap: 9, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, paddingHorizontal: 8, borderRadius: 10 },
});
