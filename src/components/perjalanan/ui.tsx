import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

/** Kartu yang bisa dilipat. `nested` = versi lebih ringan untuk sub-bagian di dalam kartu. */
export function Collapsible({
  title,
  icon,
  meta,
  right,
  defaultOpen = true,
  nested,
  children,
}: {
  title: string;
  icon?: IconName;
  meta?: string;
  right?: React.ReactNode;
  defaultOpen?: boolean;
  nested?: boolean;
  children: React.ReactNode;
}) {
  const { c } = useTheme();
  const [open, setOpen] = useState(defaultOpen);

  return (
    <View
      style={[
        s.box,
        { backgroundColor: nested ? c.bg : c.card, borderColor: c.border },
        nested && { borderRadius: 12 },
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen((v) => !v)}
        style={({ pressed }) => [s.head, pressed && { opacity: 0.75 }]}
      >
        {icon && !nested ? (
          <View style={[s.icon, { backgroundColor: c.tint }]}>
            <Ionicons name={icon} size={16} color={c.link} />
          </View>
        ) : null}
        <View style={{ flex: 1 }}>
          <Text style={[nested ? s.nestedTitle : s.title, { color: c.text }]} numberOfLines={2}>
            {title}
          </Text>
          {meta ? (
            <Text style={[s.meta, { color: c.muted }]} numberOfLines={1}>
              {meta}
            </Text>
          ) : null}
        </View>
        {right}
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={c.muted} />
      </Pressable>
      {open ? <View style={[s.body, { borderTopColor: c.border }]}>{children}</View> : null}
    </View>
  );
}

/** Baris label (kiri) – nilai (kanan). */
export function KV({ label, value, strong }: { label: string; value?: string | null; strong?: boolean }) {
  const { c } = useTheme();
  if (!value) return null;
  return (
    <View style={s.kv}>
      <Text style={[s.kvLabel, { color: c.muted }]}>{label}</Text>
      <Text style={[s.kvValue, { color: c.text }, strong && { fontWeight: '800' }]}>{value}</Text>
    </View>
  );
}

/** Label di atas, isi di bawah (untuk teks panjang). */
export function Block({ label, children }: { label: string; children: React.ReactNode }) {
  const { c } = useTheme();
  return (
    <View style={{ gap: 4 }}>
      <Text style={[s.kvLabel, { color: c.muted }]}>{label}</Text>
      {children}
    </View>
  );
}

/** Teks panjang dengan tombol "Selengkapnya". */
export function ExpandText({ text, lines = 5 }: { text: string; lines?: number }) {
  const { c } = useTheme();
  const [open, setOpen] = useState(false);
  const long = text.length > 220;
  return (
    <View>
      <Text style={[s.body13, { color: c.text }]} numberOfLines={open || !long ? undefined : lines}>
        {text}
      </Text>
      {long ? (
        <Pressable onPress={() => setOpen((v) => !v)} hitSlop={8}>
          <Text style={{ color: c.link, fontSize: 12, fontWeight: '700', marginTop: 4 }}>
            {open ? 'Ringkas' : 'Selengkapnya'}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export const Divider = () => {
  const { c } = useTheme();
  return <View style={{ height: 1, backgroundColor: c.border }} />;
};

const s = StyleSheet.create({
  box: { borderWidth: 1, borderRadius: 16, overflow: 'hidden' },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 13 },
  icon: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 15, fontWeight: '700' },
  nestedTitle: { fontSize: 13, fontWeight: '700' },
  meta: { fontSize: 11, marginTop: 1 },
  body: { borderTopWidth: 1, paddingHorizontal: 14, paddingVertical: 12, gap: 11 },
  kv: { flexDirection: 'row', justifyContent: 'space-between', gap: 14 },
  kvLabel: { fontSize: 12 },
  kvValue: { fontSize: 13, fontWeight: '600', flex: 1, textAlign: 'right' },
  body13: { fontSize: 13, lineHeight: 19 },
});
