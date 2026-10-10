import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/kit';
import { ApiError } from '@/services/api';
import { masterService } from '@/services/master';
import { sptService } from '@/services/spt';
import type { BulkAction, BulkResult, Opt, SptListItem } from '@/services/types';
import { useTheme } from '@/theme/ThemeProvider';
import { daftarKota } from '@/utils/format';
import { addDays, DateField, FieldBox, PickerField, TextArea } from './fields';
import { ActionSheet, Sheet } from './sheets';

type Mode = null | 'verifikasi' | 'tolak' | 'kelompokkan' | 'lainnya';

/** Bilah aksi massal di bawah daftar (mirip BulkAction tabel SPT di Filament). */
export function BulkBar({
  selected,
  isSuper,
  onClear,
  onDone,
}: {
  selected: SptListItem[];
  isSuper: boolean;
  onClear: () => void;
  onDone: () => void;
}) {
  const { c } = useTheme();
  const [mode, setMode] = useState<Mode>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [tgl, setTgl] = useState('');
  const [alasan, setAlasan] = useState('');
  const [kel, setKel] = useState<Opt[]>([]);

  // Default tanggal kwitansi = tanggal kembali terakhir + 1 hari (seperti form web)
  const minTgl = useMemo(() => {
    const t = selected.filter((x) => x.status.code !== 'terverifikasi').map((x) => x.tgl_kembali).filter(Boolean) as string[];
    return t.length ? addDays(t.sort().slice(-1)[0], 1) : '';
  }, [selected]);

  const ids = selected.map((x) => String(x.id));
  const labelOf = (id: string) => {
    const it = selected.find((x) => String(x.id) === id);
    return it ? `${daftarKota(it.tujuan)} (${it.pelaksana[0]?.nama ?? '-'})` : id;
  };

  const run = async (action: BulkAction, extra: { tgl_kwitansi?: string; alasan?: string; kelompok?: string } = {}) => {
    setBusy(true);
    setErr(null);
    try {
      const { message, result } = await sptService.bulk(action, ids, extra);
      setMode(null);
      report(message, result);
      onDone();
    } catch (e) {
      const msg = e instanceof ApiError ? (e.field('tgl_kwitansi') ?? e.field('alasan') ?? e.field('kelompok') ?? e.message) : 'Terjadi kesalahan tak terduga.';
      setErr(msg);
      if (mode === null) Alert.alert('Gagal', msg);
    } finally {
      setBusy(false);
    }
  };

  const report = (message: string, r: BulkResult) => {
    const lines = r.gagal.slice(0, 6).map((g) => `• ${labelOf(g.id)}: ${g.pesan}`);
    if (r.gagal.length > 6) lines.push(`… dan ${r.gagal.length - 6} lainnya`);
    const extra = r.dilewati ? `\n${r.dilewati} sudah terverifikasi (dilewati).` : '';
    Alert.alert(r.gagal.length ? 'Sebagian gagal' : 'Berhasil', `${message}${extra}${lines.length ? `\n\n${lines.join('\n')}` : ''}`);
  };

  const confirm = (title: string, text: string, action: BulkAction, danger?: boolean) =>
    Alert.alert(title, text, [
      { text: 'Batal', style: 'cancel' },
      { text: 'Ya, lanjutkan', style: danger ? 'destructive' : 'default', onPress: () => run(action) },
    ]);

  const open = (m: Mode) => {
    setErr(null);
    if (m === 'verifikasi') setTgl(minTgl);
    if (m === 'tolak') setAlasan('');
    if (m === 'kelompokkan') setKel([]);
    setMode(m);
  };

  const n = selected.length;

  return (
    <View style={[s.bar, { backgroundColor: c.card, borderTopColor: c.border }]}>
      <View style={s.top}>
        <Text style={{ color: c.text, fontSize: 13, fontWeight: '700', flex: 1 }}>{n} dipilih</Text>
        <Pressable onPress={onClear} hitSlop={10}>
          <Text style={{ color: c.link, fontSize: 12, fontWeight: '700' }}>Kosongkan</Text>
        </Pressable>
      </View>

      <View style={s.btns}>
        <Pressable disabled={busy} onPress={() => open('verifikasi')} style={[s.btn, { backgroundColor: c.primary }]}>
          {busy ? <ActivityIndicator color={c.onPrimary} /> : <Ionicons name="checkmark-circle-outline" size={17} color={c.onPrimary} />}
          <Text style={[s.btnText, { color: c.onPrimary }]}>Verifikasi</Text>
        </Pressable>
        <Pressable disabled={busy} onPress={() => open('tolak')} style={[s.btn, { backgroundColor: c.dangerBg }]}>
          <Ionicons name="close-circle-outline" size={17} color={c.danger} />
          <Text style={[s.btnText, { color: c.danger }]}>Tolak</Text>
        </Pressable>
        <Pressable disabled={busy} onPress={() => open('lainnya')} style={[s.btn, s.more, { borderColor: c.border }]} accessibilityLabel="Aksi lainnya">
          <Ionicons name="ellipsis-horizontal" size={18} color={c.text} />
        </Pressable>
      </View>

      <ActionSheet
        visible={mode === 'lainnya'}
        onClose={() => setMode(null)}
        title={`Aksi untuk ${n} Surat Tugas`}
        actions={[
          { key: 'kel', label: 'Kelompokkan (GU / TU)', icon: 'folder-open-outline', onPress: () => open('kelompokkan') },
          {
            key: 'unkel',
            label: 'Batalkan Kelompok',
            icon: 'folder-outline',
            onPress: () => confirm('Batalkan kelompok?', `${n} Surat Tugas akan dikeluarkan dari kelompoknya.`, 'batal_kelompok'),
          },
          ...(isSuper
            ? [
                {
                  key: 'hapus',
                  label: 'Hapus',
                  icon: 'trash-outline' as const,
                  danger: true,
                  onPress: () => confirm('Hapus Surat Tugas?', `${n} Surat Tugas akan dihapus. Yang tidak boleh dihapus pada status saat ini akan dilewati.`, 'hapus', true),
                },
              ]
            : []),
        ]}
      />

      <Sheet visible={mode === 'verifikasi'} onClose={() => setMode(null)} title="Verifikasi Surat Tugas Terpilih">
        <Text style={{ color: c.muted, fontSize: 12, lineHeight: 18 }}>
          Tanggal kwitansi akan diterapkan ke semua Surat Tugas yang dipilih. Surat Tugas yang kwitansinya belum lengkap akan dilewati.
        </Text>
        <DateField label="Tanggal kwitansi" required value={tgl} onChange={setTgl} min={minTgl || undefined} error={err ?? undefined} />
        <Button title={`Verifikasi ${n} Surat Tugas`} loading={busy} disabled={!tgl} onPress={() => run('verifikasi', { tgl_kwitansi: tgl })} />
      </Sheet>

      <Sheet visible={mode === 'tolak'} onClose={() => setMode(null)} title="Tolak Surat Tugas Terpilih">
        <Text style={{ color: c.muted, fontSize: 12, lineHeight: 18 }}>
          Yakin menolak {n} Surat Tugas? Jika sudah ditolak tidak dapat diubah. Isi alasan penolakan di bawah.
        </Text>
        <FieldBox label="Alasan penolakan" required error={err ?? undefined}>
          <TextArea value={alasan} onChangeText={setAlasan} rows={4} max={255} placeholder="Tulis alasan penolakan" />
        </FieldBox>
        <Button
          title={`Tolak ${n} Surat Tugas`}
          loading={busy}
          disabled={!alasan.trim()}
          style={{ backgroundColor: c.danger }}
          onPress={() => run('tolak', { alasan: alasan.trim() })}
        />
      </Sheet>

      <Sheet visible={mode === 'kelompokkan'} onClose={() => setMode(null)} title="Kelompokkan Surat Tugas">
        <PickerField
          label="Pilih kelompok"
          placeholder="GU 1, TU 1, …"
          required
          local
          value={kel}
          onChange={setKel}
          error={err ?? undefined}
          load={async () => (await masterService.form()).kelompok.map((k, i) => ({ id: i + 1, nama: k }))}
        />
        <Button title={`Kelompokkan ${n} Surat Tugas`} loading={busy} disabled={!kel.length} onPress={() => run('kelompokkan', { kelompok: kel[0].nama })} />
      </Sheet>
    </View>
  );
}

const s = StyleSheet.create({
  bar: { borderTopWidth: 1, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 12, gap: 10 },
  top: { flexDirection: 'row', alignItems: 'center' },
  btns: { flexDirection: 'row', gap: 8 },
  btn: { flex: 1, minHeight: 44, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  more: { flex: 0, width: 48, borderWidth: 1 },
  btnText: { fontSize: 13, fontWeight: '700' },
});
