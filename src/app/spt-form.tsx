import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, BackHandler, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/kit';
import { addDays, DateField, FieldBox, PickerField, TextArea, todayIso } from '@/components/perjalanan/fields';
import { Block, ExpandText, KV } from '@/components/perjalanan/ui';
import { ApiError } from '@/services/api';
import { masterService } from '@/services/master';
import { sptService } from '@/services/spt';
import type { Opt, SptDetail, SptFormMeta, SptPayload } from '@/services/types';
import { useTheme } from '@/theme/ThemeProvider';
import { daftarKota, tanggal } from '@/utils/format';
import { sptEvents } from '@/utils/events';
import { sptHref } from '@/utils/nav';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const STEPS: { title: string; sub: string; icon: IconName }[] = [
  { title: 'Pelaksana', sub: 'Siapa yang berangkat dan kapan surat tugas dibuat', icon: 'people-outline' },
  { title: 'Perjalanan', sub: 'Jadwal, rute, dan alat angkut', icon: 'airplane-outline' },
  { title: 'Anggaran', sub: 'PPK, mata anggaran, dan penandatangan', icon: 'wallet-outline' },
  { title: 'Uraian', sub: 'Dasar pelaksanaan dan uraian perjalanan', icon: 'document-text-outline' },
  { title: 'Tinjau', sub: 'Periksa kembali sebelum disimpan', icon: 'checkmark-done-outline' },
];

type Form = {
  pelaksana: Opt[];
  tglSpt: string;
  tglBerangkat: string;
  tglKembali: string;
  asal: Opt[];
  tujuan: Opt[];
  alat: Opt[];
  ppk: Opt[];
  akun: Opt[];
  ttdOn: boolean;
  ttd: Opt[];
  dasar: string;
  dasarTemplate: boolean;
  untuk: string;
};

// Field server -> langkah wizard
const STEP_OF: Record<string, number> = {
  pegawai_ids: 0, tgl_spt: 0,
  tgl_berangkat: 1, tgl_kembali: 1, asal: 1, tujuans: 1, alat_angkut: 1,
  ppk_id: 2, akun_id: 2, ttd_id: 2,
  dasar: 3, untuk: 3,
};

export default function SptFormScreen() {
  const { c } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const edit = !!id;

  const [meta, setMeta] = useState<SptFormMeta | null>(null);
  const kotaCache = useRef<Opt[] | null>(null);
  const [form, setForm] = useState<Form | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const prevDasar = useRef('');
  const scroller = useRef<ScrollView>(null);

  const year = Number((form?.tglSpt || todayIso()).slice(0, 4));

  // ---------------------------------------------------------------- muat awal
  const init = useCallback(async () => {
    setLoadErr(null);
    try {
      const [m, kota, d] = await Promise.all([
        masterService.form(),
        masterService.kota(),
        edit ? sptService.detail(String(id)) : Promise.resolve(null as SptDetail | null),
      ]);
      kotaCache.current = kota;
      setMeta(m);

      if (d) {
        const akun = d.akun;
        setForm({
          pelaksana: d.pelaksana.filter((p) => p.pegawai_id).map((p) => ({ id: p.pegawai_id as number, nama: p.nama, sub: [p.nip, p.jabatan].filter(Boolean).join(' • ') })),
          tglSpt: d.tgl_spt ?? todayIso(),
          tglBerangkat: d.tgl_berangkat ?? todayIso(),
          tglKembali: d.tgl_kembali ?? todayIso(),
          asal: d.asal_id ? [{ id: d.asal_id, nama: d.asal ?? String(d.asal_id) }] : [],
          tujuan: (d.tujuan_list ?? []).map((k) => ({ id: k.id, nama: k.nama })),
          alat: d.alat_angkut ? [flatAlat(m).find((o) => o.nama === d.alat_angkut) ?? { id: 0, nama: d.alat_angkut }] : [],
          ppk: d.ppk ? [{ id: d.ppk.id, nama: d.ppk.nama ?? '-', sub: d.ppk.jabatan }] : [],
          akun: akun ? [{ id: akun.id, nama: [akun.mak, akun.uraian, akun.sub_kegiatan, akun.bidang].filter(Boolean).join(' - ') }] : [],
          ttdOn: !!d.penandatangan,
          ttd: d.penandatangan ? [{ id: d.penandatangan.id, nama: d.penandatangan.nama, sub: d.penandatangan.jabatan }] : [],
          dasar: d.dasar ?? '',
          dasarTemplate: (d.dasar ?? '').trim() === m.dasar_resmi.trim(),
          untuk: d.untuk ?? '',
        });
      } else {
        const today = todayIso();
        const asal = kota.find((k) => k.id === m.default_asal_id);
        setForm({
          pelaksana: [], tglSpt: today, tglBerangkat: today, tglKembali: today,
          asal: asal ? [asal] : [], tujuan: [], alat: [], ppk: [], akun: [],
          ttdOn: false, ttd: [], dasar: '', dasarTemplate: false, untuk: '',
        });
      }
    } catch (e) {
      setLoadErr(e instanceof ApiError ? e.message : 'Gagal memuat form.');
    }
  }, [edit, id]);

  useEffect(() => {
    init();
  }, [init]);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => {
    setDirty(true);
    setErrs((e) => {
      const n = { ...e };
      delete n[FIELD_OF[k as string] ?? (k as string)];
      return n;
    });
    setForm((f) => (f ? { ...f, [k]: v } : f));
  };

  // ---------------------------------------------------------------- navigasi
  const leave = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }, [router]);

  const askLeave = useCallback(() => {
    if (!dirty) return leave();
    Alert.alert('Keluar dari form?', 'Isian yang belum disimpan akan hilang.', [
      { text: 'Lanjut mengisi', style: 'cancel' },
      { text: 'Keluar', style: 'destructive', onPress: leave },
    ]);
  }, [dirty, leave]);

  const back = useCallback(() => {
    if (step > 0) setStep((s) => s - 1);
    else askLeave();
  }, [step, askLeave]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      back();
      return true;
    });
    return () => sub.remove();
  }, [back]);

  useEffect(() => {
    scroller.current?.scrollTo({ y: 0, animated: false });
  }, [step]);

  // ---------------------------------------------------------------- validasi
  const validate = (n: number): Record<string, string> => {
    if (!form || !meta) return {};
    const e: Record<string, string> = {};
    if (n === 0) {
      if (form.pelaksana.length < 1) e.pegawai_ids = 'Pelaksana wajib diisi.';
      if (form.pelaksana.length > meta.max_pelaksana) e.pegawai_ids = `Pelaksana maksimal ${meta.max_pelaksana} orang.`;
      if (!form.tglSpt) e.tgl_spt = 'Tanggal Surat Tugas wajib diisi.';
      else if (form.tglBerangkat && form.tglSpt > form.tglBerangkat) e.tgl_spt = 'Tanggal Surat Tugas harus sama atau sebelum Tanggal Berangkat.';
    }
    if (n === 1) {
      if (!form.tglBerangkat) e.tgl_berangkat = 'Tanggal Berangkat wajib diisi.';
      else if (form.tglBerangkat < form.tglSpt) e.tgl_berangkat = 'Tanggal Berangkat harus sama atau setelah Tanggal Surat Tugas.';
      if (!form.tglKembali) e.tgl_kembali = 'Tanggal Kembali wajib diisi.';
      else if (form.tglKembali < form.tglBerangkat) e.tgl_kembali = 'Tanggal Kembali harus sama atau setelah Tanggal Berangkat.';
      if (!form.asal.length) e.asal = 'Tempat Asal/Berangkat wajib diisi.';
      if (form.tujuan.length < 1) e.tujuans = `Tempat Tujuan wajib diisi, minimal 1 dan maksimal ${meta.max_tujuan}.`;
      if (form.tujuan.length > meta.max_tujuan) e.tujuans = `Tempat Tujuan maksimal ${meta.max_tujuan}.`;
      if (!form.alat.length) e.alat_angkut = 'Alat Angkut/Transportasi wajib diisi.';
    }
    if (n === 2) {
      if (!form.ppk.length) e.ppk_id = 'Pejabat Pembuat Komitmen (PPK) wajib diisi.';
      if (!form.akun.length) e.akun_id = 'Akun/Mata Anggaran wajib diisi.';
      if (form.ttdOn && !form.ttd.length) e.ttd_id = 'Pejabat Penandatangan wajib diisi.';
    }
    if (n === 3) {
      if (!form.dasar.trim()) e.dasar = 'Dasar Pelaksanaan wajib diisi.';
      if (!form.untuk.trim()) e.untuk = 'Uraian Perjalanan Dinas wajib diisi.';
      else if (form.untuk.length > meta.max_untuk) e.untuk = `Uraian maksimal ${meta.max_untuk} karakter.`;
    }
    return e;
  };

  const next = () => {
    const e = validate(step);
    setErrs(e);
    if (Object.keys(e).length) return;
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  };

  // ---------------------------------------------------------------- simpan
  const save = async () => {
    if (!form) return;
    for (let i = 0; i < 4; i++) {
      const e = validate(i);
      if (Object.keys(e).length) {
        setErrs(e);
        setStep(i);
        return;
      }
    }

    const body: SptPayload = {
      pegawai_ids: form.pelaksana.map((p) => p.id),
      tgl_spt: form.tglSpt,
      tgl_berangkat: form.tglBerangkat,
      tgl_kembali: form.tglKembali,
      asal: form.asal[0].id,
      tujuans: form.tujuan.map((k) => k.id),
      alat_angkut: form.alat[0].nama,
      ppk_id: form.ppk[0].id,
      akun_id: form.akun[0].id,
      ttd_id: form.ttdOn ? form.ttd[0]?.id ?? null : null,
      dasar: form.dasar.trim(),
      untuk: form.untuk.trim(),
    };

    setSaving(true);
    try {
      const r = edit ? await sptService.update(String(id), body) : await sptService.create(body);
      sptEvents.changed();
      setDirty(false);
      if (edit) {
        Alert.alert('Berhasil disimpan', 'Perubahan Surat Tugas sudah disimpan.');
        leave();
      } else {
        Alert.alert(
          'Surat Tugas tersimpan',
          'Tersimpan sebagai draft. Lengkapi rincian biaya semua pelaksana, lalu ajukan ke verifikator.',
          [{ text: 'Lihat detail', onPress: () => router.replace(sptHref(r.id)) }],
          { cancelable: false },
        );
      }
    } catch (e) {
      if (e instanceof ApiError && e.errors) {
        const map: Record<string, string> = {};
        for (const [k, v] of Object.entries(e.errors)) {
          const key = k.replace(/\.\d+$/, '');
          if (!map[key]) map[key] = v[0];
        }
        setErrs(map);
        const first = Math.min(...Object.keys(map).map((k) => STEP_OF[k] ?? 4));
        setStep(first >= 0 && first < 4 ? first : 4);
        Alert.alert('Periksa kembali isian', Object.values(map)[0]);
      } else {
        Alert.alert('Tidak dapat menyimpan', e instanceof ApiError ? e.message : 'Terjadi kesalahan tak terduga.');
      }
    } finally {
      setSaving(false);
    }
  };

  // ---------------------------------------------------------------- opsi
  const alatOpts = useMemo(() => (meta ? flatAlat(meta) : []), [meta]);
  const loadKota = useCallback(async () => kotaCache.current ?? [], []);

  if (!form || !meta) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
        <Header title={edit ? 'Ubah Perjalanan' : 'Pengajuan Perjalanan'} onBack={leave} />
        {loadErr ? (
          <View style={[s.state, { backgroundColor: c.card, borderColor: c.border }]}>
            <Ionicons name="cloud-offline-outline" size={30} color={c.muted} />
            <Text style={{ color: c.text, fontSize: 13, textAlign: 'center' }}>{loadErr}</Text>
            <Button title="Coba lagi" variant="outline" onPress={init} />
          </View>
        ) : (
          <ActivityIndicator color={c.primary} style={{ marginTop: 48 }} />
        )}
      </SafeAreaView>
    );
  }

  const last = step === STEPS.length - 1;
  const st = STEPS[step];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <Header title={edit ? 'Ubah Perjalanan' : 'Pengajuan Perjalanan'} onBack={back} right={`${step + 1}/${STEPS.length}`} />

      <View style={s.progress}>
        {STEPS.map((x, i) => (
          <View key={x.title} style={{ flex: 1, gap: 5 }}>
            <View style={[s.seg, { backgroundColor: i <= step ? c.primary : c.border }]} />
            <Text style={{ color: i === step ? c.link : c.muted, fontSize: 10, fontWeight: i === step ? '800' : '500' }} numberOfLines={1}>
              {x.title}
            </Text>
          </View>
        ))}
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView ref={scroller} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={s.stepHead}>
            <View style={[s.stepIcon, { backgroundColor: c.tint }]}>
              <Ionicons name={st.icon} size={20} color={c.link} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: c.text, fontSize: 18, fontWeight: '800' }}>{st.title}</Text>
              <Text style={{ color: c.muted, fontSize: 12, lineHeight: 17 }}>{st.sub}</Text>
            </View>
          </View>

          {step === 0 ? (
            <>
              {!edit ? (
                <View style={[s.info, { backgroundColor: c.tint, borderColor: c.border }]}>
                  <Ionicons name="information-circle-outline" size={18} color={c.link} />
                  <Text style={{ color: c.text, fontSize: 12, lineHeight: 18, flex: 1 }}>
                    Surat Tugas disimpan sebagai draft. Setelah itu isi rincian biaya, lalu ajukan ke verifikator.
                  </Text>
                </View>
              ) : null}
              <PickerField
                label={`Pelaksana perjalanan dinas (maks. ${meta.max_pelaksana})`}
                placeholder="Pilih pegawai"
                required
                multi
                numbered
                max={meta.max_pelaksana}
                value={form.pelaksana}
                onChange={(v) => set('pelaksana', v)}
                load={(q) => masterService.pegawai(q)}
                hint="Urutan pilihan menjadi urutan pelaksana di surat. Ketik nama atau NIP untuk mencari."
                error={errs.pegawai_ids}
              />
              <DateField
                label="Tanggal surat tugas"
                required
                value={form.tglSpt}
                min={`${year}-01-01`}
                max={`${year}-12-31`}
                onChange={(v) => {
                  set('tglSpt', v);
                  if (form.tglBerangkat < v) set('tglBerangkat', v);
                  if (form.tglKembali < v) set('tglKembali', v);
                }}
                error={errs.tgl_spt}
              />
            </>
          ) : null}

          {step === 1 ? (
            <>
              <View style={s.two}>
                <View style={{ flex: 1 }}>
                  <DateField
                    label="Tanggal berangkat"
                    required
                    value={form.tglBerangkat}
                    min={form.tglSpt}
                    onChange={(v) => {
                      set('tglBerangkat', v);
                      if (form.tglKembali < v) set('tglKembali', v);
                    }}
                    error={errs.tgl_berangkat}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <DateField label="Tanggal kembali" required value={form.tglKembali} min={form.tglBerangkat} onChange={(v) => set('tglKembali', v)} error={errs.tgl_kembali} />
                </View>
              </View>
              <PickerField label="Tempat asal/berangkat" placeholder="Pilih kota asal" required local value={form.asal} onChange={(v) => set('asal', v)} load={loadKota} error={errs.asal} />
              <PickerField
                label={`Tempat tujuan (pilih maks. ${meta.max_tujuan})`}
                placeholder="Pilih kota tujuan"
                required
                multi
                local
                max={meta.max_tujuan}
                value={form.tujuan}
                onChange={(v) => set('tujuan', v)}
                load={loadKota}
                error={errs.tujuans}
              />
              <PickerField
                label="Alat angkut / transportasi"
                placeholder="Pilih alat angkut"
                required
                local
                value={form.alat}
                onChange={(v) => set('alat', v)}
                load={async () => alatOpts}
                error={errs.alat_angkut}
              />
            </>
          ) : null}

          {step === 2 ? (
            <>
              <PickerField label="Pejabat Pembuat Komitmen (PPK)" placeholder="Pilih PPK" required local value={form.ppk} onChange={(v) => set('ppk', v)} load={() => masterService.ppk()} error={errs.ppk_id} />
              <PickerField
                label="Akun / Mata Anggaran (MAK)"
                placeholder="Pilih MAK"
                required
                value={form.akun}
                onChange={(v) => set('akun', v)}
                load={(q) => masterService.akun(year, q)}
                hint={`Tahun anggaran ${year}. Ketik kode atau uraian untuk mencari.`}
                error={errs.akun_id}
              />
              <View style={[s.switchRow, { backgroundColor: c.card, borderColor: c.border }]}>
                <Text style={{ color: c.text, fontSize: 12, lineHeight: 18, flex: 1 }}>
                  Ubah penandatangan selain atasan langsung, atau pelaksana pertama dan berikutnya berbeda unit kerja/SKPD
                </Text>
                <Switch
                  value={form.ttdOn}
                  onValueChange={(v) => {
                    set('ttdOn', v);
                    if (!v) set('ttd', []);
                  }}
                  trackColor={{ true: c.primary, false: c.border }}
                />
              </View>
              {form.ttdOn ? (
                <PickerField label="Pejabat penandatangan" placeholder="Pilih penandatangan" required local value={form.ttd} onChange={(v) => set('ttd', v)} load={() => masterService.penandatangan()} error={errs.ttd_id} />
              ) : null}
            </>
          ) : null}

          {step === 3 ? (
            <>
              <View style={[s.switchRow, { backgroundColor: c.card, borderColor: c.border }]}>
                <Text style={{ color: c.text, fontSize: 12, fontWeight: '600', flex: 1 }}>Tambah dasar resmi (template)</Text>
                <Switch
                  value={form.dasarTemplate}
                  onValueChange={(v) => {
                    if (v) prevDasar.current = form.dasar;
                    set('dasarTemplate', v);
                    set('dasar', v ? meta.dasar_resmi : prevDasar.current);
                  }}
                  trackColor={{ true: c.primary, false: c.border }}
                />
              </View>
              <FieldBox label="Dasar pelaksanaan" required hint="Penomoran tidak perlu diketik, cukup Enter saja." error={errs.dasar}>
                <TextArea value={form.dasar} onChangeText={(t) => set('dasar', t)} rows={7} placeholder="Tulis dasar pelaksanaan" />
              </FieldBox>
              <FieldBox label="Uraian perjalanan dinas" required hint="Penomoran tidak perlu diketik, cukup Enter saja." error={errs.untuk}>
                <TextArea value={form.untuk} onChangeText={(t) => set('untuk', t)} rows={7} max={meta.max_untuk} placeholder="Tulis uraian perjalanan dinas" />
              </FieldBox>
            </>
          ) : null}

          {last ? <Review form={form} onJump={setStep} errs={errs} /> : null}
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={[s.bottom, { backgroundColor: c.card, borderTopColor: c.border }]}>
        {step > 0 ? <Button title="Kembali" variant="outline" onPress={back} style={{ flex: 1 }} /> : null}
        {last ? (
          <Button title={edit ? 'Simpan Perubahan' : 'Simpan Surat Tugas'} icon="save-outline" loading={saving} onPress={save} style={{ flex: 2 }} />
        ) : (
          <Button title="Lanjut" onPress={next} style={{ flex: step > 0 ? 2 : 1 }} />
        )}
      </View>
    </SafeAreaView>
  );
}

// key state -> key error server (agar kesalahan hilang saat field diubah)
const FIELD_OF: Record<string, string> = {
  pelaksana: 'pegawai_ids', tglSpt: 'tgl_spt', tglBerangkat: 'tgl_berangkat', tglKembali: 'tgl_kembali',
  asal: 'asal', tujuan: 'tujuans', alat: 'alat_angkut', ppk: 'ppk_id', akun: 'akun_id', ttd: 'ttd_id',
  dasar: 'dasar', untuk: 'untuk',
};

function flatAlat(m: SptFormMeta): Opt[] {
  let i = 0;
  return Object.entries(m.alat_angkut).flatMap(([grup, list]) => list.map((nama) => ({ id: ++i, nama, sub: grup })));
}

function Header({ title, onBack, right }: { title: string; onBack: () => void; right?: string }) {
  const { c } = useTheme();
  return (
    <View style={s.bar}>
      <Pressable onPress={onBack} hitSlop={12} accessibilityRole="button" accessibilityLabel="Kembali">
        <Ionicons name="arrow-back" size={22} color={c.text} />
      </Pressable>
      <Text style={{ color: c.text, fontSize: 17, fontWeight: '800', flex: 1 }}>{title}</Text>
      {right ? <Text style={{ color: c.muted, fontSize: 12, fontWeight: '700' }}>Langkah {right}</Text> : null}
    </View>
  );
}

// ------------------------------------------------------------------ tinjau
function Review({ form, onJump, errs }: { form: Form; onJump: (n: number) => void; errs: Record<string, string> }) {
  const { c } = useTheme();
  const Sec = ({ title, step, children }: { title: string; step: number; children: React.ReactNode }) => (
    <View style={[s.rev, { backgroundColor: c.card, borderColor: c.border }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text style={{ color: c.text, fontSize: 14, fontWeight: '700', flex: 1 }}>{title}</Text>
        <Pressable onPress={() => onJump(step)} hitSlop={10}>
          <Text style={{ color: c.link, fontSize: 12, fontWeight: '700' }}>Ubah</Text>
        </Pressable>
      </View>
      {children}
    </View>
  );

  return (
    <>
      <Sec title="Pelaksana" step={0}>
        {form.pelaksana.map((p, i) => (
          <Text key={p.id} style={{ color: c.text, fontSize: 13, lineHeight: 19 }}>
            {i + 1}. {p.nama}
          </Text>
        ))}
        <KV label="Tanggal surat tugas" value={tanggal(form.tglSpt)} />
      </Sec>
      <Sec title="Perjalanan" step={1}>
        <KV label="Berangkat" value={tanggal(form.tglBerangkat)} />
        <KV label="Kembali" value={tanggal(form.tglKembali)} />
        <KV label="Asal" value={form.asal[0]?.nama} />
        <KV label="Tujuan" value={daftarKota(form.tujuan.map((k) => k.nama))} />
        <KV label="Alat angkut" value={form.alat[0]?.nama} />
      </Sec>
      <Sec title="Anggaran" step={2}>
        <KV label="PPK" value={form.ppk[0]?.nama} />
        <Block label="Mata anggaran (MAK)">
          <Text style={{ color: c.text, fontSize: 13, lineHeight: 19 }}>{form.akun[0]?.nama ?? '-'}</Text>
        </Block>
        <KV label="Penandatangan" value={form.ttdOn ? form.ttd[0]?.nama : 'Atasan langsung'} />
      </Sec>
      <Sec title="Uraian" step={3}>
        <Block label="Dasar pelaksanaan">
          <ExpandText text={form.dasar} lines={3} />
        </Block>
        <Block label="Uraian perjalanan">
          <ExpandText text={form.untuk} lines={4} />
        </Block>
      </Sec>
      {Object.keys(errs).length ? (
        <Text style={{ color: c.danger, fontSize: 12 }}>Ada isian yang perlu diperbaiki. Ketuk "Ubah" pada bagian terkait.</Text>
      ) : null}
    </>
  );
}

const s = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 6, minHeight: 44 },
  progress: { flexDirection: 'row', gap: 6, paddingHorizontal: 20, paddingBottom: 8 },
  seg: { height: 4, borderRadius: 2 },
  content: { width: '100%', maxWidth: 520, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 28, gap: 16 },
  stepHead: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 2 },
  stepIcon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  info: { flexDirection: 'row', gap: 10, borderWidth: 1, borderRadius: 14, padding: 12, alignItems: 'flex-start' },
  two: { flexDirection: 'row', gap: 10 },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10 },
  bottom: { flexDirection: 'row', gap: 10, borderTopWidth: 1, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 12 },
  rev: { borderWidth: 1, borderRadius: 16, padding: 14, gap: 10 },
  state: { margin: 20, borderWidth: 1, borderRadius: 16, padding: 24, alignItems: 'center', gap: 12 },
});
