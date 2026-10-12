import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Easing, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme/ThemeProvider';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

/** Lembar dari bawah (bottom sheet) bertema. */
export function Sheet({
  visible,
  onClose,
  title,
  children,
  scroll = true,
}: {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  scroll?: boolean;
}) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();

  // Latar gelap memudar (fade) di tempat, hanya lembar yang naik dari bawah.
  const [mounted, setMounted] = useState(visible);
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(0)).current; // 0 = tersembunyi, 1 = tampil
  const H = Dimensions.get('window').height;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.parallel([
        Animated.timing(fade, { toValue: 1, duration: 220, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(slide, { toValue: 1, duration: 260, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]).start();
    } else if (mounted) {
      Animated.parallel([
        Animated.timing(fade, { toValue: 0, duration: 180, easing: Easing.in(Easing.quad), useNativeDriver: true }),
        Animated.timing(slide, { toValue: 0, duration: 200, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
      ]).start(({ finished }) => {
        if (finished) setMounted(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  return (
    <Modal visible={mounted} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)', opacity: fade }]}>
          <Pressable style={{ flex: 1 }} onPress={onClose} accessibilityLabel="Tutup" />
        </Animated.View>
        <View style={{ flex: 1 }} pointerEvents="box-none">
          <Pressable style={{ flex: 1 }} onPress={onClose} />
          <Animated.View
            style={[
              s.sheet,
              { backgroundColor: c.card, paddingBottom: Math.max(insets.bottom, 12) + 4 },
              { transform: [{ translateY: slide.interpolate({ inputRange: [0, 1], outputRange: [H, 0] }) }] },
            ]}
          >
            <View style={[s.grab, { backgroundColor: c.border }]} />
            {title ? (
              <View style={s.head}>
                <Text style={{ color: c.text, fontSize: 16, fontWeight: '800', flex: 1 }}>{title}</Text>
                <Pressable onPress={onClose} hitSlop={12} accessibilityLabel="Tutup">
                  <Ionicons name="close" size={22} color={c.muted} />
                </Pressable>
              </View>
            ) : null}
            {scroll ? (
              <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 14, paddingBottom: 4 }}>
                {children}
              </ScrollView>
            ) : (
              children
            )}
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export type SheetAction = {
  key: string;
  label: string;
  icon: IconName;
  danger?: boolean;
  onPress: () => void;
};

/** Daftar aksi (menu "Aksi" seperti di tabel web). */
export function ActionSheet({
  visible,
  onClose,
  title = 'Aksi',
  actions,
}: {
  visible: boolean;
  onClose: () => void;
  title?: string;
  actions: SheetAction[];
}) {
  const { c } = useTheme();
  return (
    <Sheet visible={visible} onClose={onClose} title={title}>
      <View style={{ gap: 2 }}>
        {actions.map((a) => (
          <Pressable
            key={a.key}
            accessibilityRole="button"
            onPress={() => {
              onClose();
              // beri waktu sheet menutup sebelum dialog/sheet berikutnya muncul
              setTimeout(a.onPress, 250);
            }}
            style={({ pressed }) => [s.item, pressed && { backgroundColor: c.tint }]}
          >
            <Ionicons name={a.icon} size={20} color={a.danger ? c.danger : c.link} />
            <Text style={{ color: a.danger ? c.danger : c.text, fontSize: 14, fontWeight: '600' }}>{a.label}</Text>
          </Pressable>
        ))}
      </View>
    </Sheet>
  );
}

const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: { borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingHorizontal: 20, paddingTop: 10, maxHeight: '88%' },
  grab: { alignSelf: 'center', width: 38, height: 4, borderRadius: 2, marginBottom: 12 },
  head: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, paddingHorizontal: 8, borderRadius: 12 },
});
