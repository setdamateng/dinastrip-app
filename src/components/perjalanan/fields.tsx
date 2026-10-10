import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/kit';
import type { Opt } from '@/services/types';
import { useTheme } from '@/theme/ThemeProvider';
import { tanggal } from '@/utils/format';
import { Sheet } from './sheets';

// ------------------------------------------------------------ pembungkus
export function FieldBox({
  label,
  required,
  hint,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  const { c } = useTheme();
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ color: c.text, fontSize: 12, fontWeight: '600' }}>
        {label}
        {required ? <Text style={{ color: c.danger }}> *</Text> : null}
      </Text>
      {children}
      {hint && !error ? <Text style={{ color: c.muted, fontSize: 11, lineHeight: 15 }}>{hint}</Text> : null}
      {error ? (
        <Text style={{ color: c.danger, fontSize: 11, lineHeight: 15 }} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const useBox = (error?: string) => {
  const { c } = useTheme();
  return [s.box, { backgroundColor: c.inputBg, borderColor: error ? c.danger : c.border }];
};

export function TextArea({
  value,
  onChangeText,
  placeholder,
  rows = 6,
  max,
  error,
}: {
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  rows?: number;
  max?: number;
  error?: string;
}) {
  const { c } = useTheme();
  const box = useBox(error);
  return (
    <View>
      <View style={[box, { alignItems: 'flex-start', paddingVertical: 10 }]}>
        <TextInput
          multiline
          maxLength={max}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={c.muted}
          style={{ flex: 1, color: c.text, fontSize: 14, lineHeight: 20, minHeight: rows * 20, textAlignVertical: 'top', padding: 0, width: '100%' }}
          value={value}
        />
      </View>
      {max ? (
        <Text style={{ color: c.muted, fontSize: 11, textAlign: 'right', marginTop: 3 }}>
          {value.length}/{max}
        </Text>
      ) : null}
    </View>
  );
}

// ------------------------------------------------------------- tanggal
const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const HARI = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
const pad = (n: number) => String(n).padStart(2, '0');
const iso = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;

export const todayIso = () => {
  const d = new Date();
  return iso(d.getFullYear(), d.getMonth(), d.getDate());
};

export function addDays(date: string, n: number) {
  const [y, m, d] = date.split('-').map(Number);
  const x = new Date(Date.UTC(y, m - 1, d + n));
  return iso(x.getUTCFullYear(), x.getUTCMonth(), x.getUTCDate());
}

function Calendar({ value, min, max, onPick }: { value: string; min?: string; max?: string; onPick: (d: string) => void }) {
  const { c } = useTheme();
  const base = value || min || todayIso();
  const [y0, m0] = base.split('-').map(Number);
  const [ym, setYm] = useState({ y: y0, m: m0 - 1 });

  const cells = useMemo(() => {
    const first = new Date(ym.y, ym.m, 1);
    const lead = (first.getDay() + 6) % 7; // Senin = 0
    const days = new Date(ym.y, ym.m + 1, 0).getDate();
    return [...Array(lead).fill(0), ...Array.from({ length: days }, (_, i) => i + 1)];
  }, [ym]);

  const go = (delta: number) =>
    setYm(({ y, m }) => {
      const t = new Date(y, m + delta, 1);
      return { y: t.getFullYear(), m: t.getMonth() };
    });

  const today = todayIso();

  return (
    <View style={{ gap: 10 }}>
      <View style={s.calHead}>
        <Pressable onPress={() => go(-1)} hitSlop={10} accessibilityLabel="Bulan sebelumnya">
          <Ionicons name="chevron-back" size={20} color={c.link} />
        </Pressable>
        <Text style={{ color: c.text, fontSize: 14, fontWeight: '700' }}>
          {BULAN[ym.m]} {ym.y}
        </Text>
        <Pressable onPress={() => go(1)} hitSlop={10} accessibilityLabel="Bulan berikutnya">
          <Ionicons name="chevron-forward" size={20} color={c.link} />
        </Pressable>
      </View>
      <View style={s.grid}>
        {HARI.map((h) => (
          <Text key={h} style={[s.cell, { color: c.muted, fontSize: 11, fontWeight: '700' }]}>
            {h}
          </Text>
        ))}
        {cells.map((d, i) => {
          if (!d) return <View key={`e${i}`} style={s.cell} />;
          const v = iso(ym.y, ym.m, d);
          const off = (!!min && v < min) || (!!max && v > max);
          const on = v === value;
          return (
            <Pressable
              key={v}
              disabled={off}
              onPress={() => onPick(v)}
              style={[s.cell, s.day, on && { backgroundColor: c.primary }, !on && v === today && { borderWidth: 1, borderColor: c.primary }]}
            >
              <Text style={{ color: on ? c.onPrimary : off ? c.border : c.text, fontSize: 13, fontWeight: on ? '800' : '500' }}>{d}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function DateField({
  label,
  value,
  onChange,
  min,
  max,
  error,
  required,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  min?: string;
  max?: string;
  error?: string;
  required?: boolean;
  hint?: string;
}) {
  const { c } = useTheme();
  const [open, setOpen] = useState(false);
  const box = useBox(error);
  return (
    <FieldBox label={label} required={required} error={error} hint={hint}>
      <Pressable accessibilityRole="button" onPress={() => setOpen(true)} style={box}>
        <Text style={{ flex: 1, color: value ? c.text : c.muted, fontSize: 14 }}>{value ? tanggal(value) : 'Pilih tanggal'}</Text>
        <Ionicons name="calendar-outline" size={18} color={c.muted} />
      </Pressable>
      <Sheet visible={open} onClose={() => setOpen(false)} title={label}>
        <Calendar
          value={value}
          min={min}
          max={max}
          onPick={(d) => {
            onChange(d);
            setOpen(false);
          }}
        />
      </Sheet>
    </FieldBox>
  );
}

// ------------------------------------------------------------- pemilih
type PickerProps = {
  label: string;
  placeholder: string;
  value: Opt[];
  onChange: (v: Opt[]) => void;
  /** Ambil opsi. `q` kosong = daftar awal. */
  load: (q: string) => Promise<Opt[]>;
  /** true = muat sekali lalu cari di perangkat (daftar pendek); false = cari ke server */
  local?: boolean;
  multi?: boolean;
  max?: number;
  required?: boolean;
  hint?: string;
  error?: string;
  /** Tampilkan nomor urut (untuk pelaksana) */
  numbered?: boolean;
};

export function PickerField({ label, placeholder, value, onChange, load, local, multi, max, required, hint, error, numbered }: PickerProps) {
  const { c } = useTheme();
  const [open, setOpen] = useState(false);
  const box = useBox(error);

  return (
    <FieldBox label={label} required={required} error={error} hint={hint}>
      <Pressable accessibilityRole="button" onPress={() => setOpen(true)} style={[box, { minHeight: 48 }]}>
        <View style={{ flex: 1 }}>
          {value.length === 0 ? (
            <Text style={{ color: c.muted, fontSize: 14 }}>{placeholder}</Text>
          ) : multi ? (
            <Text style={{ color: c.text, fontSize: 14 }}>{value.length} dipilih{max ? ` (maks. ${max})` : ''}</Text>
          ) : (
            <>
              <Text style={{ color: c.text, fontSize: 14, lineHeight: 19 }}>{value[0].nama}</Text>
              {value[0].sub ? <Text style={{ color: c.muted, fontSize: 11, marginTop: 1 }}>{value[0].sub}</Text> : null}
            </>
          )}
        </View>
        <Ionicons name="chevron-down" size={18} color={c.muted} />
      </Pressable>

      {multi && value.length > 0 ? (
        <View style={{ gap: 6 }}>
          {value.map((o, i) => (
            <View key={o.id} style={[s.chosen, { backgroundColor: c.tint, borderColor: c.border }]}>
              {numbered ? <Text style={{ color: c.muted, fontSize: 12, width: 20 }}>{i + 1}.</Text> : null}
              <View style={{ flex: 1 }}>
                <Text style={{ color: c.text, fontSize: 13, fontWeight: '600' }}>{o.nama}</Text>
                {o.sub ? <Text style={{ color: c.muted, fontSize: 11 }} numberOfLines={1}>{o.sub}</Text> : null}
              </View>
              <Pressable hitSlop={10} onPress={() => onChange(value.filter((x) => x.id !== o.id))} accessibilityLabel={`Hapus ${o.nama}`}>
                <Ionicons name="close-circle" size={18} color={c.muted} />
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}

      <PickerSheet
        visible={open}
        onClose={() => setOpen(false)}
        title={label}
        value={value}
        onChange={onChange}
        load={load}
        local={local}
        multi={multi}
        max={max}
      />
    </FieldBox>
  );
}

function PickerSheet({
  visible,
  onClose,
  title,
  value,
  onChange,
  load,
  local,
  multi,
  max,
}: Pick<PickerProps, 'value' | 'onChange' | 'load' | 'local' | 'multi' | 'max'> & { visible: boolean; onClose: () => void; title: string }) {
  const { c } = useTheme();
  const [q, setQ] = useState('');
  const [all, setAll] = useState<Opt[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const req = useRef(0);

  const fetchNow = async (term: string) => {
    const id = ++req.current;
    setLoading(true);
    setErr(null);
    try {
      const r = await load(term);
      if (id === req.current) setAll(r);
    } catch (e) {
      if (id === req.current) setErr(e instanceof Error ? e.message : 'Gagal memuat pilihan.');
    } finally {
      if (id === req.current) setLoading(false);
    }
  };

  // Muat saat dibuka; cari ke server (ditunda) bila bukan mode lokal
  useEffect(() => {
    if (!visible) return;
    setQ('');
    fetchNow('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  useEffect(() => {
    if (!visible || local) return;
    const t = setTimeout(() => fetchNow(q.trim()), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const data = useMemo(() => {
    if (!local || !q.trim()) return all;
    const t = q.trim().toLowerCase();
    return all.filter((o) => o.nama.toLowerCase().includes(t) || (o.sub ?? '').toLowerCase().includes(t));
  }, [all, q, local]);

  const picked = (o: Opt) => value.some((x) => x.id === o.id);
  const full = !!multi && !!max && value.length >= max;

  const toggle = (o: Opt) => {
    if (!multi) {
      onChange([o]);
      onClose();
      return;
    }
    if (picked(o)) onChange(value.filter((x) => x.id !== o.id));
    else if (!full) onChange([...value, o]);
  };

  return (
    <Sheet visible={visible} onClose={onClose} title={title} scroll={false}>
      <View style={[s.search, { backgroundColor: c.inputBg, borderColor: c.border }]}>
        <Ionicons name="search-outline" size={18} color={c.muted} />
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={setQ}
          placeholder="Cari…"
          placeholderTextColor={c.muted}
          style={{ flex: 1, color: c.text, fontSize: 14, paddingVertical: 0, minHeight: 42 }}
          value={q}
        />
      </View>

      <View style={{ height: 360, marginTop: 10 }}>
        {loading && all.length === 0 ? (
          <ActivityIndicator color={c.primary} style={{ marginTop: 30 }} />
        ) : err ? (
          <Text style={{ color: c.danger, fontSize: 13, textAlign: 'center', marginTop: 30 }}>{err}</Text>
        ) : (
          <FlatList
            data={data}
            keyExtractor={(o) => String(o.id)}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={<Text style={{ color: c.muted, fontSize: 13, textAlign: 'center', marginTop: 30 }}>Tidak ada hasil.</Text>}
            renderItem={({ item }) => {
              const on = picked(item);
              const dis = !on && full;
              return (
                <Pressable
                  onPress={() => toggle(item)}
                  disabled={dis}
                  style={({ pressed }) => [s.row, { borderBottomColor: c.border, opacity: dis ? 0.4 : 1 }, pressed && { backgroundColor: c.tint }]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: c.text, fontSize: 14, lineHeight: 19, fontWeight: on ? '700' : '500' }}>{item.nama}</Text>
                    {item.sub ? <Text style={{ color: c.muted, fontSize: 11, marginTop: 1 }}>{item.sub}</Text> : null}
                  </View>
                  {multi ? (
                    <Ionicons name={on ? 'checkbox' : 'square-outline'} size={22} color={on ? c.primary : c.muted} />
                  ) : on ? (
                    <Ionicons name="checkmark" size={20} color={c.primary} />
                  ) : null}
                </Pressable>
              );
            }}
          />
        )}
      </View>

      {multi ? (
        <View style={{ marginTop: 10, gap: 6 }}>
          {max ? (
            <Text style={{ color: full ? c.danger : c.muted, fontSize: 11, textAlign: 'center' }}>
              {value.length} dari maks. {max} dipilih
            </Text>
          ) : null}
          <Button title="Selesai" onPress={onClose} />
        </View>
      ) : null}
    </Sheet>
  );
}

const s = StyleSheet.create({
  box: { minHeight: 48, borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 8 },
  chosen: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8 },
  search: { flexDirection: 'row', alignItems: 'center', gap: 9, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 4, borderBottomWidth: StyleSheet.hairlineWidth },
  calHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, height: 40, textAlign: 'center', alignItems: 'center', justifyContent: 'center' },
  day: { borderRadius: 20 },
});
