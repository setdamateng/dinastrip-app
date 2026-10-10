import { Ionicons } from '@expo/vector-icons';
import React, { forwardRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import type { SptStatusCode } from '@/services/types';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

// ---------------------------------------------------------------- Button
export function Button({
  title,
  onPress,
  icon,
  variant = 'primary',
  loading,
  disabled,
  style,
}: {
  title: string;
  onPress: () => void;
  icon?: IconName;
  variant?: 'primary' | 'outline';
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { c } = useTheme();
  const primary = variant === 'primary';
  const off = disabled || loading;
  const fg = primary ? c.onPrimary : c.primary;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!off, busy: !!loading }}
      onPress={onPress}
      disabled={off}
      style={({ pressed }) => [
        s.btn,
        primary ? { backgroundColor: c.primary } : { borderWidth: 1.5, borderColor: c.primary },
        { opacity: off ? 0.6 : pressed ? 0.85 : 1 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          {icon ? <Ionicons name={icon} size={18} color={fg} style={{ marginRight: 8 }} /> : null}
          <Text style={[s.btnText, { color: fg }]}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}

// ------------------------------------------------------------- TextField
type FieldProps = TextInputProps & {
  label: string;
  icon?: IconName;
  error?: string;
  secure?: boolean; // tampilkan tombol mata
};

export const TextField = forwardRef<TextInput, FieldProps>(function TextField(
  { label, icon, error, secure, style, ...rest },
  ref
) {
  const { c } = useTheme();
  const [hidden, setHidden] = useState(!!secure);
  const [focus, setFocus] = useState(false);

  return (
    <View style={{ gap: 6 }}>
      <Text style={[s.label, { color: c.text }]}>{label}</Text>
      <View
        style={[
          s.field,
          { backgroundColor: c.inputBg, borderColor: error ? c.danger : focus ? c.primary : c.border },
        ]}
      >
        <TextInput
          ref={ref}
          {...rest}
          secureTextEntry={secure ? hidden : rest.secureTextEntry}
          onFocus={(e) => {
            setFocus(true);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocus(false);
            rest.onBlur?.(e);
          }}
          placeholderTextColor={c.muted}
          accessibilityLabel={label}
          style={[{ flex: 1, color: c.text, fontSize: 14, paddingVertical: 0 }, style]}
        />
        {secure ? (
          <Pressable
            onPress={() => setHidden((h) => !h)}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Tampilkan kata sandi' : 'Sembunyikan kata sandi'}
          >
            <Ionicons name={hidden ? 'eye-off-outline' : 'eye-outline'} size={20} color={c.muted} />
          </Pressable>
        ) : icon ? (
          <Ionicons name={icon} size={20} color={c.muted} />
        ) : null}
      </View>
      {error ? (
        <Text style={{ color: c.danger, fontSize: 11 }} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
    </View>
  );
});

// ------------------------------------------------------------ Card, Chip
export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const { c } = useTheme();
  return <View style={[s.card, { backgroundColor: c.card, borderColor: c.border }, style]}>{children}</View>;
}

export function StatusChip({ code, label }: { code: SptStatusCode; label: string }) {
  const { c } = useTheme();
  const col = c.status[code] ?? c.status.draft;
  return (
    <View style={[s.chip, { backgroundColor: col.bg }]}>
      <Text style={{ color: col.fg, fontSize: 11, fontWeight: '700' }}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  btn: {
    minHeight: 50,
    borderRadius: 14,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  btnText: { fontSize: 14, fontWeight: '700' },
  label: { fontSize: 12, fontWeight: '600' },
  field: {
    minHeight: 50,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  card: { borderWidth: 1, borderRadius: 16, padding: 14 },
  chip: { borderRadius: 99, paddingHorizontal: 10, paddingVertical: 3, alignSelf: 'flex-start' },
});
