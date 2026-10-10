import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import React from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeProvider';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

/** Kerangka layar alur akun: header berpanah kembali, ikon, judul, isi, dan footer bantuan. */
export function AuthScaffold({
  title,
  onBack,
  icon,
  heading,
  subtitle,
  logo,
  children,
}: {
  title: string;
  onBack: () => void;
  icon: IconName;
  heading: string;
  subtitle: React.ReactNode;
  logo?: boolean;
  children: React.ReactNode;
}) {
  const { c } = useTheme();

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: c.bg }]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={s.page}>
            <View style={s.header}>
              <Pressable
                onPress={onBack}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel="Kembali"
                style={s.back}
              >
                <Ionicons name="arrow-back" size={24} color={c.text} />
              </Pressable>
              <Text style={[s.headerTitle, { color: c.text }]}>{title}</Text>
            </View>

            <View style={s.iconRow}>
              <View style={[s.iconTile, { backgroundColor: c.tint }]}>
                <Ionicons name={icon} size={28} color={c.link} />
              </View>
              {logo ? (
                <ExpoImage
                  source={require('@/assets/images/logo-icon.png')}
                  contentFit="contain"
                  style={s.logo}
                  accessibilityLabel="Logo DinasTrip"
                />
              ) : null}
            </View>

            <Text style={[s.heading, { color: c.text }]}>{heading}</Text>
            <Text style={[s.subtitle, { color: c.muted }]}>{subtitle}</Text>

            <View style={s.body}>{children}</View>

            <View style={s.footer}>
              <Text style={{ color: c.muted, fontSize: 11 }}>Masih mengalami kendala?</Text>
              <Pressable
                hitSlop={10}
                accessibilityRole="link"
                onPress={() =>
                  Alert.alert('Hubungi admin instansi', 'Silakan hubungi admin DinasTrip di instansi Anda untuk bantuan akun.')
                }
              >
                <Text style={{ color: c.link, fontSize: 12, fontWeight: '700' }}>Hubungi admin instansi</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/** Kartu info (ikon + judul + isi) */
export function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  const { c } = useTheme();
  return (
    <View style={[s.info, { backgroundColor: c.card, borderColor: c.border }]}>
      <View style={s.infoHead}>
        <Ionicons name="information-circle-outline" size={20} color={c.link} />
        <Text style={{ color: c.text, fontSize: 13, fontWeight: '700' }}>{title}</Text>
      </View>
      <Text style={{ color: c.muted, fontSize: 12, lineHeight: 18 }}>{children}</Text>
    </View>
  );
}

/** Tombol netral berbingkai ("Kembali ke Login") */
export function GhostButton({ title, onPress, disabled }: { title: string; onPress: () => void; disabled?: boolean }) {
  const { c } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        s.ghost,
        { backgroundColor: c.card, borderColor: c.border, opacity: disabled ? 0.6 : pressed ? 0.8 : 1 },
      ]}
    >
      <Text style={{ color: c.text, fontSize: 14, fontWeight: '700' }}>{title}</Text>
    </Pressable>
  );
}

export function ErrorNote({ message }: { message?: string | null }) {
  const { c } = useTheme();
  if (!message) return null;
  return (
    <View style={[s.err, { backgroundColor: c.dangerBg }]} accessibilityLiveRegion="polite">
      <Ionicons name="alert-circle-outline" size={18} color={c.danger} />
      <Text style={{ color: c.danger, flex: 1, fontSize: 12 }}>{message}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flexGrow: 1, alignItems: 'center' },
  page: { width: '100%', maxWidth: 480, minHeight: '100%', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 20 },
  header: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 12 },
  back: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', marginLeft: -6 },
  headerTitle: { fontSize: 17, fontWeight: '800' },
  iconRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24 },
  iconTile: { width: 70, height: 70, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  logo: { width: 48, height: 48, borderRadius: 9 },
  heading: { fontSize: 25, fontWeight: '800', marginTop: 22, letterSpacing: -0.3 },
  subtitle: { fontSize: 13, lineHeight: 20, marginTop: 10 },
  body: { marginTop: 24, gap: 14 },
  footer: { marginTop: 'auto', paddingTop: 28, alignItems: 'center', gap: 4 },
  info: { borderWidth: 1, borderRadius: 14, padding: 14, gap: 8 },
  infoHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ghost: { minHeight: 50, borderWidth: 1, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  err: { flexDirection: 'row', gap: 8, padding: 12, borderRadius: 12, alignItems: 'center' },
});
