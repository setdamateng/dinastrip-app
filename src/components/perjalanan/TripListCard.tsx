import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { StatusChip } from '@/components/kit';
import type { SptListItem } from '@/services/types';
import { useTheme } from '@/theme/ThemeProvider';
import { daftarKota, jumlahHari, rentangPanjang, rupiah } from '@/utils/format';

/**
 * Kartu di daftar perjalanan. Judul = tujuan (uraian bisa sangat panjang, jadi tidak dipakai).
 * Pelaksana berupa "laci": ketuk chevron untuk melihat semua pelaksana sesuai urutan.
 * Mode pilih (admin OPD / super admin): checkbox di kiri, ketuk kartu = centang.
 */
export function TripListCard({
  item,
  showOpd,
  showPembuat,
  verifyHint,
  selectMode,
  selected,
  onPress,
  onToggle,
  onLongPress,
}: {
  item: SptListItem;
  showOpd?: boolean;
  /** Tampilkan nama pembuat/pengaju (untuk verifikator) */
  showPembuat?: boolean;
  /** Tampilkan ajakan "Periksa & verifikasi" pada SPT yang menunggu */
  verifyHint?: boolean;
  selectMode?: boolean;
  selected?: boolean;
  onPress: () => void;
  onToggle?: () => void;
  onLongPress?: () => void;
}) {
  const { c } = useTheme();
  const [open, setOpen] = useState(false);

  const first = item.pelaksana[0];
  const kode = first?.no_spt || 'Nomor belum diisi';
  const many = item.pelaksana.length > 1;
  const hari = jumlahHari(item.tgl_berangkat, item.tgl_kembali);
  const selectable = item.selectable !== false;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={selectMode ? { selected: !!selected, disabled: !selectable } : undefined}
      onPress={selectMode ? (selectable ? onToggle : undefined) : onPress}
      onLongPress={selectMode ? undefined : onLongPress}
      delayLongPress={350}
      style={({ pressed }) => [
        s.card,
        { backgroundColor: c.card, borderColor: selected ? c.primary : c.border, borderWidth: selected ? 2 : 1 },
        selectMode && !selectable && { opacity: 0.5 },
        pressed && { opacity: 0.8 },
      ]}
    >
      <View style={s.between}>
        {selectMode ? (
          <Ionicons
            name={selected ? 'checkbox' : 'square-outline'}
            size={22}
            color={selected ? c.primary : c.muted}
            style={{ marginRight: 8 }}
          />
        ) : null}
        <Text style={[s.code, { color: c.muted }]} numberOfLines={1}>
          {kode}
        </Text>
        <StatusChip code={item.status.code} label={item.status.label} />
      </View>

      <Text style={[s.title, { color: c.text }]} numberOfLines={2}>
        {daftarKota(item.tujuan)}
      </Text>

      {/* Laci pelaksana */}
      <View>
        <Pressable
          disabled={!many}
          onPress={() => setOpen((v) => !v)}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityState={{ expanded: open }}
          accessibilityLabel={many ? (open ? 'Sembunyikan pelaksana' : 'Tampilkan semua pelaksana') : undefined}
          style={s.row}
        >
          <Ionicons name="people-outline" size={15} color={c.muted} />
          <Text style={{ color: c.muted, fontSize: 12, flex: 1 }} numberOfLines={1}>
            {first ? first.nama : '-'}
            {many ? ` +${item.pelaksana.length - 1} lainnya` : ''}
          </Text>
          {many ? <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color={c.link} /> : null}
        </Pressable>
        {open ? (
          <View style={[s.drawer, { backgroundColor: c.bg, borderColor: c.border }]}>
            {item.pelaksana.map((p, i) => (
              <View key={p.spd_id} style={{ flexDirection: 'row', gap: 6 }}>
                <Text style={{ color: c.muted, fontSize: 12, width: 18 }}>{i + 1}.</Text>
                <Text style={{ color: c.text, fontSize: 12, flex: 1, lineHeight: 17 }}>{p.nama}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>

      <Row
        icon="calendar-outline"
        text={`${rentangPanjang(item.tgl_berangkat, item.tgl_kembali)}${hari ? ` • ${hari} hari` : ''}`}
      />
      {showPembuat && item.pembuat ? <Row icon="person-circle-outline" text={`Diajukan oleh ${item.pembuat.nama}`} /> : null}
      {showOpd && item.bidang ? <Row icon="business-outline" text={item.bidang} link /> : null}
      {item.kelompok ? <Row icon="folder-outline" text={`Kelompok ${item.kelompok}`} /> : null}

      {item.status.code === 'ditolak' && item.alasan ? (
        <Text style={[s.note, { color: c.danger }]} numberOfLines={2}>
          Alasan: {item.alasan}
        </Text>
      ) : null}

      {item.total_biaya > 0 ? (
        <View style={[s.foot, { borderTopColor: c.border }]}>
          <Text style={{ color: c.muted, fontSize: 11 }}>Total biaya</Text>
          <Text style={{ color: c.text, fontSize: 13, fontWeight: '800' }}>{rupiah(item.total_biaya)}</Text>
        </View>
      ) : null}

      {verifyHint && !selectMode && item.status.code === 'diajukan' ? (
        <View style={[s.foot, { borderTopColor: c.border }]}>
          <Text style={{ color: c.link, fontSize: 12, fontWeight: '700' }}>Periksa & verifikasi</Text>
          <Ionicons name="chevron-forward" size={16} color={c.link} />
        </View>
      ) : null}
    </Pressable>
  );
}

function Row({ icon, text, link }: { icon: React.ComponentProps<typeof Ionicons>['name']; text: string; link?: boolean }) {
  const { c } = useTheme();
  return (
    <View style={s.row}>
      <Ionicons name={icon} size={15} color={c.muted} />
      <Text style={{ color: link ? c.link : c.muted, fontSize: 12, flex: 1 }} numberOfLines={1}>
        {text}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  card: { borderRadius: 16, padding: 14, gap: 8 },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  code: { fontSize: 11, fontWeight: '600', flex: 1 },
  title: { fontSize: 16, fontWeight: '700', lineHeight: 22 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  drawer: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, gap: 4, marginTop: 6 },
  note: { fontSize: 12, lineHeight: 17 },
  foot: { borderTopWidth: 1, paddingTop: 9, marginTop: 2, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
