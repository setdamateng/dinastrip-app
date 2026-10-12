import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { bagikanPdf } from '@/services/pdf';
import { Button } from '@/components/kit';
import { ApiError } from '@/services/api';
import { masterService } from '@/services/master';
import { sptService } from '@/services/spt';
import type { Opt, SptDetail } from '@/services/types';
import { useTheme } from '@/theme/ThemeProvider';
import { sptEvents } from '@/utils/events';
import { addDays, DateField, FieldBox, PickerField, TextArea } from './fields';
import { ActionSheet, Sheet, SheetAction } from './sheets';

type Mode = null | 'verifikasi' | 'tolak' | 'pindah' | 'lainnya';

const errText = (e: unknown) =>
  e instanceof ApiError
    ? (e.field('spt') ?? e.field('tgl_kwitansi') ?? e.field('alasan') ?? e.field('user_id') ?? e.message)
    : 'Terjadi kesalahan tak terduga.';

/**
 * Tombol aksi di layar detail. Yang tampil dibaca dari `abilities` yang dikirim server,
 * jadi aturannya sama persis dengan menu "Aksi" di tabel SPT web.
 */
export function DetailActions({
  d,
  onChanged,
  onDeleted,
}: {
  d: SptDetail;
  onChanged: (d: SptDetail) => void;
  onDeleted: () => void;
}) {
  const { c } = useTheme();
  const router = useRouter();
  const a = d.abilities;

  const [mode, setMode] = useState<Mode>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | undefined>();
  const [tgl, setTgl] = useState('');
  const [alasan, setAlasan] = useState('');
  const [user, setUser] = useState<Opt[]>([]);

  if (!a) return null;

  const minTgl = d.tgl_kembali ? addDays(d.tgl_kembali, 1) : undefined;
  const id = String(d.id);

  /** Jalankan aksi; sukses -> perbarui detail + beri tahu daftar. */
  const exec = async (fn: () => Promise<SptDetail | void>, okTitle: string, okText: string, close = true) => {
    setBusy(true);
    setErr(undefined);
    try {
      const r = await fn();
      if (close) setMode(null);
      sptEvents.changed();
      if (r) onChanged(r);
      Alert.alert(okTitle, okText);
    } catch (e) {
      const msg = errText(e);
      setErr(msg);
      if (!close || mode === null) Alert.alert('Tidak dapat diproses', msg);
    } finally {
      setBusy(false);
    }
  };

  const ask = (title: string, text: string, yes: string, run: () => void, danger?: boolean) =>
    Alert.alert(title, text, [
      { text: 'Batal', style: 'cancel' },
      { text: yes, style: danger ? 'destructive' : 'default', onPress: run },
    ]);

  const ajukan = () =>
    ask('Ajukan ke verifikator?', 'Surat Tugas akan dikirim ke verifikator. Pastikan rincian biaya semua pelaksana sudah diisi.', 'Ajukan', () =>
      exec(() => sptService.ajukan(id), 'Berhasil diajukan', 'Surat Tugas berhasil dikirim ke verifikator.'),
    );

  const batalAjukan = () =>
    ask('Batalkan pengajuan?', 'Surat Tugas dikembalikan ke status draft.', 'Batalkan', () =>
      exec(() => sptService.batalAjukan(id), 'Pengajuan dibatalkan', 'Surat Tugas dikembalikan ke draft.'),
    );

  const batalVerifikasi = () =>
    ask('Batalkan verifikasi?', 'Verifikasi dibatalkan dan realisasi akun diperbarui.', 'Batalkan', () =>
      exec(() => sptService.batalVerifikasi(id), 'Berhasil', 'Verifikasi dibatalkan dan realisasi akun telah diperbarui.'),
    );

  const hapus = () =>
    ask('Hapus Surat Tugas?', 'Surat Tugas ini akan dihapus.', 'Hapus', async () => {
      setBusy(true);
      try {
        await sptService.remove(id);
        sptEvents.changed();
        onDeleted();
      } catch (e) {
        Alert.alert('Tidak dapat dihapus', errText(e));
      } finally {
        setBusy(false);
      }
    }, true);

  const open = (m: Mode) => {
    setErr(undefined);
    if (m === 'verifikasi') setTgl(minTgl ?? '');
    if (m === 'tolak') setAlasan('');
    if (m === 'pindah') setUser([]);
    setMode(m);
  };

  // ---- susun tombol ----
  const more: SheetAction[] = [];
  if (a.can_edit) more.push({ key: 'edit', label: 'Ubah', icon: 'create-outline', onPress: () => router.push({ pathname: '/spt-form', params: { id } }) });
  const cetak = async (path: string, nama: string) => {
    try {
      await bagikanPdf(path, nama);
    } catch (e) {
      Alert.alert('Tidak dapat membuka dokumen', e instanceof Error ? e.message : 'Terjadi kesalahan.');
    }
  };
  more.push({ key: 'c1', label: 'Cetak / Bagikan Surat Tugas', icon: 'print-outline', onPress: () => cetak(`spt/${id}/pdf/spt`, `Surat-Tugas-${id}`) });
  more.push({ key: 'c2', label: 'Cetak / Bagikan Surat Tugas (Lampiran)', icon: 'print-outline', onPress: () => cetak(`spt/${id}/pdf/spt?versi=2`, `Surat-Tugas-Lampiran-${id}`) });
  more.push({ key: 'c3', label: 'Cetak / Bagikan Rekap Biaya', icon: 'print-outline', onPress: () => cetak(`spt/${id}/pdf/rekap-biaya`, `Rekap-Biaya-${id}`) });
  if (a.can_pindah) more.push({ key: 'pindah', label: 'Pindahkan Surat Tugas', icon: 'arrow-redo-outline', onPress: () => open('pindah') });
  if (a.can_delete) more.push({ key: 'hapus', label: 'Hapus', icon: 'trash-outline', danger: true, onPress: hapus });

  const hasPrimary = a.can_ajukan || a.can_batal_ajukan || a.can_verifikasi || a.can_batal_verifikasi;
  if (!hasPrimary && more.length === 0) return null;

  return (
    <View style={[s.bar, { backgroundColor: c.card, borderTopColor: c.border }]}>
      <View style={s.row}>
        {a.can_ajukan ? <Button style={s.flex} icon="paper-plane-outline" title="Ajukan ke Verifikator" loading={busy} onPress={ajukan} /> : null}
        {a.can_batal_ajukan ? <Button style={s.flex} variant="outline" icon="arrow-undo-outline" title="Batalkan Pengajuan" loading={busy} onPress={batalAjukan} /> : null}
        {a.can_verifikasi ? <Button style={s.flex} icon="checkmark-circle-outline" title="Verifikasi" loading={busy} onPress={() => open('verifikasi')} /> : null}
        {a.can_tolak ? (
          <Pressable disabled={busy} onPress={() => open('tolak')} style={[s.tolak, { backgroundColor: c.dangerBg }]}>
            <Ionicons name="close-circle-outline" size={18} color={c.danger} />
            <Text style={{ color: c.danger, fontSize: 14, fontWeight: '700' }}>Tolak</Text>
          </Pressable>
        ) : null}
        {a.can_batal_verifikasi ? <Button style={s.flex} variant="outline" icon="close-circle-outline" title="Batalkan Verifikasi" loading={busy} onPress={batalVerifikasi} /> : null}
        {more.length > 0 ? (
          <Pressable
            disabled={busy}
            onPress={() => open('lainnya')}
            accessibilityLabel="Aksi lainnya"
            style={[s.more, { borderColor: c.border }, !hasPrimary && s.flex]}
          >
            <Ionicons name="ellipsis-horizontal" size={20} color={c.text} />
            {!hasPrimary ? <Text style={{ color: c.text, fontSize: 14, fontWeight: '700', marginLeft: 8 }}>Aksi</Text> : null}
          </Pressable>
        ) : null}
      </View>

      <ActionSheet visible={mode === 'lainnya'} onClose={() => setMode(null)} actions={more} />

      <Sheet visible={mode === 'verifikasi'} onClose={() => setMode(null)} title="Verifikasi Surat Tugas">
        <Text style={{ color: c.muted, fontSize: 12, lineHeight: 18 }}>
          Tanggal kwitansi diterapkan ke semua pelaksana. Minimal sehari setelah tanggal kembali.
        </Text>
        <DateField label="Tanggal kwitansi" required value={tgl} onChange={setTgl} min={minTgl} error={err} />
        <Button title="Verifikasi" loading={busy} disabled={!tgl} onPress={() => exec(() => sptService.verifikasi(id, tgl), 'Verifikasi berhasil', 'Surat Tugas berhasil diverifikasi.')} />
      </Sheet>

      <Sheet visible={mode === 'tolak'} onClose={() => setMode(null)} title="Tolak Surat Tugas">
        <Text style={{ color: c.muted, fontSize: 12, lineHeight: 18 }}>Jika sudah ditolak tidak dapat diubah. Isi alasan penolakan di bawah.</Text>
        <FieldBox label="Alasan penolakan" required error={err}>
          <TextArea value={alasan} onChangeText={setAlasan} rows={4} max={255} placeholder="Tulis alasan penolakan" />
        </FieldBox>
        <Button
          title="Tolak Surat Tugas"
          loading={busy}
          disabled={!alasan.trim()}
          style={{ backgroundColor: c.danger }}
          onPress={() => exec(() => sptService.tolak(id, alasan.trim()), 'Surat Tugas ditolak', 'Alasan penolakan sudah dikirim.')}
        />
      </Sheet>

      <Sheet visible={mode === 'pindah'} onClose={() => setMode(null)} title="Pindahkan Surat Tugas">
        <Text style={{ color: c.muted, fontSize: 12, lineHeight: 18 }}>
          Surat Tugas hanya dapat dipindahkan selama belum diajukan dan belum diverifikasi.
        </Text>
        <PickerField
          label="Pindahkan kepada"
          placeholder="Pilih user tujuan"
          required
          value={user}
          onChange={setUser}
          load={(q) => masterService.users(q)}
          error={err}
        />
        <Button
          title="Pindahkan"
          loading={busy}
          disabled={!user.length}
          onPress={() => exec(() => sptService.pindah(id, user[0].id), 'Berhasil dipindahkan', `Surat Tugas dipindahkan kepada ${user[0].nama}.`)}
        />
      </Sheet>
    </View>
  );
}

const s = StyleSheet.create({
  bar: { borderTopWidth: 1, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 12 },
  row: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  flex: { flex: 1 },
  tolak: { minHeight: 50, borderRadius: 14, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 6 },
  more: { minHeight: 50, width: 52, borderWidth: 1.5, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
});
