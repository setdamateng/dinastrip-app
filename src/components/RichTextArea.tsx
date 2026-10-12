import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';

type Sel = { start: number; end: number };

/**
 * Editor teks ringan (tanpa WebView): toolbar tebal / miring / garis bawah / butir / nomor.
 * Isinya disimpan sebagai teks bertanda; `utils/richtext` mengubahnya ke HTML saat simpan.
 */
export function RichTextArea({
  value,
  onChangeText,
  placeholder,
  minHeight = 160,
  error,
}: {
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  minHeight?: number;
  error?: boolean;
}) {
  const { c } = useTheme();
  const [sel, setSel] = useState<Sel>({ start: 0, end: 0 });
  const [force, setForce] = useState<Sel | undefined>();
  const ref = useRef<TextInput>(null);

  const apply = (text: string, s: Sel) => {
    onChangeText(text);
    setForce(s);
    setSel(s);
    setTimeout(() => setForce(undefined), 0);
  };

  const wrap = (mark: string) => {
    const { start, end } = sel;
    const a = value.slice(0, start);
    const m = value.slice(start, end);
    const b = value.slice(end);
    if (m.startsWith(mark) && m.endsWith(mark) && m.length >= mark.length * 2) {
      const inner = m.slice(mark.length, m.length - mark.length);
      apply(a + inner + b, { start, end: start + inner.length });
    } else {
      apply(`${a}${mark}${m}${mark}${b}`, m ? { start, end: end + mark.length * 2 } : { start: start + mark.length, end: start + mark.length });
    }
  };

  const lineStart = (pos: number) => value.lastIndexOf('\n', pos - 1) + 1;

  const list = (kind: 'ul' | 'ol') => {
    const from = lineStart(sel.start);
    let to = value.indexOf('\n', sel.end);
    if (to < 0) to = value.length;
    const block = value.slice(from, to).split('\n');
    const has = (l: string) => (kind === 'ul' ? /^[-•*]\s/.test(l) : /^\d+[.)]\s/.test(l));
    const all = block.every((l) => !l.trim() || has(l));
    let n = 0;
    const next = block.map((l) => {
      const bare = l.replace(/^([-•*]|\d+[.)])\s+/, '');
      if (all) return bare;
      if (!l.trim()) return l;
      return kind === 'ul' ? `- ${bare}` : `${++n}. ${bare}`;
    });
    const joined = next.join('\n');
    apply(value.slice(0, from) + joined + value.slice(to), { start: from, end: from + joined.length });
  };

  const Btn = ({ icon, label, onPress }: { icon?: React.ComponentProps<typeof Ionicons>['name']; label?: string; onPress: () => void }) => (
    <Pressable
      onPress={onPress}
      hitSlop={4}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [s.btn, { backgroundColor: pressed ? c.tint : 'transparent' }]}
    >
      {icon ? <Ionicons name={icon} size={19} color={c.text} /> : null}
    </Pressable>
  );

  return (
    <View style={[s.box, { borderColor: error ? c.danger : c.border, backgroundColor: c.inputBg }]}>
      <View style={[s.bar, { borderBottomColor: c.border }]}>
        <Pressable onPress={() => wrap('**')} style={s.btn} accessibilityLabel="Tebal">
          <Text style={{ color: c.text, fontWeight: '900', fontSize: 16 }}>B</Text>
        </Pressable>
        <Pressable onPress={() => wrap('_')} style={s.btn} accessibilityLabel="Miring">
          <Text style={{ color: c.text, fontStyle: 'italic', fontSize: 16, fontWeight: '600' }}>I</Text>
        </Pressable>
        <Pressable onPress={() => wrap('++')} style={s.btn} accessibilityLabel="Garis bawah">
          <Text style={{ color: c.text, textDecorationLine: 'underline', fontSize: 16, fontWeight: '600' }}>U</Text>
        </Pressable>
        <View style={[s.sep, { backgroundColor: c.border }]} />
        <Btn icon="list" label="Daftar butir" onPress={() => list('ul')} />
        <Btn icon="reorder-four-outline" label="Daftar bernomor" onPress={() => list('ol')} />
      </View>
      <TextInput
        ref={ref}
        multiline
        value={value}
        onChangeText={onChangeText}
        onSelectionChange={(e) => setSel(e.nativeEvent.selection)}
        selection={force}
        placeholder={placeholder}
        placeholderTextColor={c.muted}
        textAlignVertical="top"
        style={[s.input, { color: c.text, minHeight }]}
      />
    </View>
  );
}

const s = StyleSheet.create({
  box: { borderWidth: 1.5, borderRadius: 12, overflow: 'hidden' },
  bar: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingHorizontal: 6, paddingVertical: 4, borderBottomWidth: StyleSheet.hairlineWidth },
  btn: { width: 38, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  sep: { width: 1, height: 20, marginHorizontal: 4 },
  input: { fontSize: 14, lineHeight: 21, paddingHorizontal: 12, paddingVertical: 10 },
});
