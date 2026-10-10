import React, { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';

/**
 * Input OTP: 6 kotak, satu TextInput tak terlihat di atasnya (mendukung paste & isi otomatis).
 */
export function OtpInput({
  value,
  onChange,
  length = 6,
  error,
  editable = true,
}: {
  value: string;
  onChange: (v: string) => void;
  length?: number;
  error?: boolean;
  editable?: boolean;
}) {
  const { c } = useTheme();
  const ref = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);
  const cursor = Math.min(value.length, length - 1);

  return (
    <Pressable onPress={() => ref.current?.focus()} style={s.wrap}>
      <View style={s.row} pointerEvents="none">
        {Array.from({ length }).map((_, i) => {
          const active = focused && i === cursor;
          return (
            <View
              key={i}
              style={[
                s.box,
                {
                  backgroundColor: c.inputBg,
                  borderColor: error ? c.danger : active ? c.primary : c.border,
                  borderWidth: active || error ? 2 : 1.5,
                },
              ]}
            >
              <Text style={[s.digit, { color: c.text }]}>{value[i] ?? ''}</Text>
            </View>
          );
        })}
      </View>
      <TextInput
        ref={ref}
        value={value}
        onChangeText={(t) => onChange(t.replace(/\D/g, '').slice(0, length))}
        keyboardType="number-pad"
        maxLength={length}
        editable={editable}
        autoFocus
        caretHidden
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        accessibilityLabel={`Kode OTP ${length} digit`}
        style={s.hidden}
      />
    </Pressable>
  );
}

const s = StyleSheet.create({
  wrap: { position: 'relative' },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  box: { flex: 1, height: 56, maxWidth: 58, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  digit: { fontSize: 21, fontWeight: '800' },
  hidden: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.02 },
});
