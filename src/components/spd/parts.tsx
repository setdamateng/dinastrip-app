import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/kit';
import type { Summary } from '@/services/spd';
import type { RiilItem, RincianItem } from '@/services/types';
import { useTheme } from '@/theme/ThemeProvider';
import { rupiah, tanggal } from '@/utils/format';

const num = (n: number) => (Number.isInteger(n) ? String(n) : String(Number(n.toFixed(2))).replace('.', ','));

/** Ringkasan kwitansi: rincian + riil = total, dikurangi panjar = sisa dibayar. */
export function KwitansiSummary({ s }: { s: Summary }) {
  const { c } = useTheme();
  const k = s.kwitansi;
  const st = s.status_kwitansi;
  const col = st === 'Tersedia' ? c.status.terverifikasi : st === 'Kosong' ? c.status.diajukan : c.status.draft;

  return (
    <Card style={{ gap: 9 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ color: c.text, fontSize: 14, fontWeight: '800' }}>Kwitansi</Text>
        <View style={{ backgroundColor: col.bg, borderRadius: 10, paddingHorizontal: 9, paddingVertical: 3 }}>
          <Text style={{ color: col.fg, fontSize: 11, fontWeight: '700' }}>{st}</Text>
        </View>
      </View>
      <Line label="Total rincian" value={rupiah(k?.total_rincian ?? 0)} />
      <Line label="Total pengeluaran riil" value={rupiah(k?.total_riil ?? 0)} />
      <Line label="Total" value={rupiah(k?.total ?? 0)} bold />
      <Line label="Panjar" value={`- ${rupiah(s.total_panjar)}`} />
      <View style={{ height: 1, backgroundColor: c.border }} />
      <Line label="Sisa dibayar" value={rupiah(s.sisa_dibayar)} bold accent />
    </Card>
  );
}

function Line({ label, value, bold, accent }: { label: string; value: string; bold?: boolean; accent?: boolean }) {
  const { c } = useTheme();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}>
      <Text style={{ color: c.muted, fontSize: 12.5 }}>{label}</Text>
      <Text style={{ color: accent ? c.link : c.text, fontSize: bold ? 14.5 : 13, fontWeight: bold ? '800' : '600' }}>{value}</Text>
    </View>
  );
}

/** Satu baris rincian biaya. `onEdit`/`onDelete` hanya diberikan saat boleh diubah. */
export function RincianCard({ r, onEdit, onDelete }: { r: RincianItem; onEdit?: () => void; onDelete?: () => void }) {
  const { c } = useTheme();
  return (
    <Card style={{ gap: 6 }}>
      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: c.text, fontSize: 14, fontWeight: '700' }}>{r.jenis_rincian}</Text>
          {r.keterangan ? <Text style={{ color: c.muted, fontSize: 12, marginTop: 1 }}>{r.keterangan}</Text> : null}
        </View>
        <Text style={{ color: c.link, fontSize: 14, fontWeight: '800' }}>{rupiah(r.jumlah)}</Text>
      </View>
      <Text style={{ color: c.muted, fontSize: 12 }}>
        {num(r.kuantitas)} {r.satuan ?? ''} × {rupiah(r.nominal)}
        {r.potongan > 0 ? ` • dibayar ${Math.round(r.potongan * 100)}%` : ''}
      </Text>
      {r.panjar > 0 ? <Text style={{ color: c.muted, fontSize: 12 }}>Panjar {rupiah(r.panjar)}</Text> : null}
      {r.hotel?.nama_hotel ? (
        <Text style={{ color: c.muted, fontSize: 11.5 }}>
          {r.hotel.nama_hotel}
          {r.hotel.tgl_masuk ? ` • ${tanggal(r.hotel.tgl_masuk)} – ${tanggal(r.hotel.tgl_keluar)}` : ''}
        </Text>
      ) : null}
      {r.tiket?.nama_maskapai || r.tiket?.asal_tiket ? (
        <Text style={{ color: c.muted, fontSize: 11.5 }}>
          {[r.tiket?.nama_maskapai, r.tiket?.nomor_penerbangan, r.tiket?.asal_tiket && r.tiket?.tujuan_tiket ? `${r.tiket.asal_tiket} → ${r.tiket.tujuan_tiket}` : null]
            .filter(Boolean)
            .join(' • ')}
        </Text>
      ) : null}
      {onEdit || onDelete ? (
        <Actions onEdit={onEdit} onDelete={onDelete} />
      ) : null}
    </Card>
  );
}

export function RiilCard({ r, onEdit, onDelete }: { r: RiilItem; onEdit?: () => void; onDelete?: () => void }) {
  const { c } = useTheme();
  return (
    <Card style={{ gap: 6 }}>
      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: c.text, fontSize: 14, fontWeight: '700' }}>{r.uraian}</Text>
          {r.keterangan ? <Text style={{ color: c.muted, fontSize: 12, marginTop: 1 }}>{r.keterangan}</Text> : null}
        </View>
        <Text style={{ color: c.link, fontSize: 14, fontWeight: '800' }}>{rupiah(r.nominal)}</Text>
      </View>
      {onEdit || onDelete ? <Actions onEdit={onEdit} onDelete={onDelete} /> : null}
    </Card>
  );
}

function Actions({ onEdit, onDelete }: { onEdit?: () => void; onDelete?: () => void }) {
  const { c } = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: 18, marginTop: 4 }}>
      {onEdit ? (
        <Pressable onPress={onEdit} hitSlop={8} style={s.act} accessibilityRole="button">
          <Ionicons name="create-outline" size={16} color={c.link} />
          <Text style={{ color: c.link, fontSize: 12.5, fontWeight: '700' }}>Ubah</Text>
        </Pressable>
      ) : null}
      {onDelete ? (
        <Pressable onPress={onDelete} hitSlop={8} style={s.act} accessibilityRole="button">
          <Ionicons name="trash-outline" size={16} color={c.danger} />
          <Text style={{ color: c.danger, fontSize: 12.5, fontWeight: '700' }}>Hapus</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function SectionTitle({ title, right }: { title: string; right?: React.ReactNode }) {
  const { c } = useTheme();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
      <Text style={{ color: c.text, fontSize: 15, fontWeight: '800' }}>{title}</Text>
      {right}
    </View>
  );
}

export function Empty({ text }: { text: string }) {
  const { c } = useTheme();
  return (
    <View style={[s.empty, { backgroundColor: c.card, borderColor: c.border }]}>
      <Text style={{ color: c.muted, fontSize: 12.5, textAlign: 'center' }}>{text}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  act: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  empty: { borderWidth: 1, borderStyle: 'dashed', borderRadius: 14, padding: 18 },
});
