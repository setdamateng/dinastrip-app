import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/auth/AuthProvider';
import { roleKind, ROLE_TITLE } from '@/auth/roles';
import { ThemeMode, useTheme } from '@/theme/ThemeProvider';

const MODES: { key: ThemeMode; label: string; icon: React.ComponentProps<typeof Ionicons>['name'] }[] = [
  { key: 'system', label: 'Ikuti sistem', icon: 'phone-portrait-outline' },
  { key: 'light', label: 'Terang', icon: 'sunny-outline' },
  { key: 'dark', label: 'Gelap', icon: 'moon-outline' },
];

function initials(name?: string) {
  return (name ?? '?').split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join('');
}

export default function Profil() {
  const { c, mode, setMode } = useTheme();
  const { user, signOut } = useAuth();

  const logout = () =>
    Alert.alert('Keluar', 'Anda yakin ingin keluar dari akun ini?', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Keluar', style: 'destructive', onPress: signOut },
    ]);

  return (
    <SafeAreaView edges={['top']} style={[s.safe, { backgroundColor: c.bg }]}>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <Text style={[s.title, { color: c.text }]}>Profil</Text>

        <View style={[s.card, { backgroundColor: c.card, borderColor: c.border, flexDirection: 'row', alignItems: 'center', gap: 14 }]}>
          <View style={[s.avatar, { backgroundColor: c.primary }]}>
            <Text style={s.avatarText}>{initials(user?.name)}</Text>
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={{ color: c.text, fontSize: 16, fontWeight: '800' }} numberOfLines={2}>
              {user?.name}
            </Text>
            <Text style={{ color: c.link, fontSize: 12, fontWeight: '700' }}>{ROLE_TITLE[roleKind(user)]}</Text>
            <Text style={{ color: c.muted, fontSize: 12 }} numberOfLines={1}>
              {user?.bidang?.nama ?? '-'}
            </Text>
            <Text style={{ color: c.muted, fontSize: 12 }} numberOfLines={1}>
              {user?.email}
            </Text>
          </View>
        </View>

        <Text style={[s.section, { color: c.text }]}>Tampilan</Text>
        <View style={[s.card, { backgroundColor: c.card, borderColor: c.border, gap: 8 }]}>
          {MODES.map((m) => {
            const on = mode === m.key;
            return (
              <Pressable
                key={m.key}
                onPress={() => setMode(m.key)}
                accessibilityRole="radio"
                accessibilityState={{ selected: on }}
                style={[s.option, { borderColor: on ? c.primary : c.border, backgroundColor: on ? c.tint : 'transparent' }]}
              >
                <Ionicons name={m.icon} size={18} color={on ? c.link : c.muted} />
                <Text style={{ flex: 1, color: c.text, fontSize: 13, fontWeight: on ? '700' : '500' }}>{m.label}</Text>
                {on ? <Ionicons name="checkmark-circle" size={18} color={c.link} /> : null}
              </Pressable>
            );
          })}
        </View>

        <Pressable
          onPress={logout}
          accessibilityRole="button"
          style={({ pressed }) => [s.logout, { borderColor: c.status.ditolak.fg }, pressed && { opacity: 0.78 }]}
        >
          <Ionicons name="log-out-outline" size={18} color={c.status.ditolak.fg} />
          <Text style={{ color: c.status.ditolak.fg, fontSize: 14, fontWeight: '700' }}>Keluar</Text>
        </Pressable>

        <Text style={{ color: c.muted, fontSize: 10, textAlign: 'center' }}>DinasTrip • Sistem perjalanan dinas</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  content: { width: '100%', maxWidth: 520, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 28, gap: 14 },
  title: { fontSize: 22, fontWeight: '800' },
  section: { fontSize: 14, fontWeight: '700', marginTop: 4 },
  card: { borderWidth: 1, borderRadius: 16, padding: 14 },
  avatar: { width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
  option: { minHeight: 46, borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  logout: { minHeight: 48, borderWidth: 1.5, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
});
