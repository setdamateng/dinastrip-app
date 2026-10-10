import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
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

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <Pressable style={s.backdrop} onPress={onClose} accessibilityLabel="Tutup" />
        <View style={[s.sheet, { backgroundColor: c.card, paddingBottom: Math.max(insets.bottom, 12) + 4 }]}>
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
