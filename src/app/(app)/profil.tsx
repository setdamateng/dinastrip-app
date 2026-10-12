import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/auth/AuthProvider';
import { roleKind, ROLE_TITLE } from '@/auth/roles';
import { Avatar } from '@/components/Avatar';
import { ThemeMode, useTheme } from '@/theme/ThemeProvider';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const MODES: { key: ThemeMode; label: string; icon: IconName }[] = [
  { key: 'system', label: 'Sistem', icon: 'phone-portrait-outline' },
  { key: 'light', label: 'Terang', icon: 'sunny-outline' },
  { key: 'dark', label: 'Gelap', icon: 'moon-outline' },
];

export default function Profil() {
  const { c, mode, setMode } = useTheme();
  const { user, signOut } = useAuth();
  const router = useRouter();
  const version = Constants.expoConfig?.version ?? '-';

  const logout = () =>
    Alert.alert('Keluar', 'Anda yakin ingin keluar dari akun ini?', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Keluar', style: 'destructive', onPress: signOut },
    ]);

  const go = (path: string, params?: Record<string, string>) => router.push({ pathname: path, params } as never);

  return (
    <SafeAreaView edges={['top']} style={[s.safe, { backgroundColor: c.bg }]}>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={s.head}>
          <Text style={[s.title, { color: c.text }]}>Profil</Text>
          <Pressable onPress={() => go('/profil-edit')} hitSlop={10} accessibilityRole="button">
            <Text style={{ color: c.link, fontSize: 13, fontWeight: '700' }}>Edit profil</Text>
          </Pressable>
        </View>

        <View style={s.hero}>
          <Avatar uri={user?.avatar_url} name={user?.name} size={92} />
          <Text style={{ color: c.text, fontSize: 20, fontWeight: '800', textAlign: 'center', marginTop: 12 }}>{user?.name}</Text>
          <Text style={{ color: c.muted, fontSize: 12.5, marginTop: 3, textAlign: 'center' }}>{[user?.bidang?.nama, user?.skpd?.nama].filter(Boolean).join(' • ') || '-'}</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 10, alignItems: 'center' }}>
            <View style={[s.chip, { backgroundColor: c.status.terverifikasi.bg, marginTop: 0 }]}>
              <Text style={{ color: c.status.terverifikasi.fg, fontSize: 11.5, fontWeight: '700' }}>{ROLE_TITLE[roleKind(user)]}</Text>
            </View>
            {user?.is_premium ? (
              <View style={[s.chip, { backgroundColor: c.status.diajukan.bg, marginTop: 0, flexDirection: 'row', alignItems: 'center', gap: 4 }]}>
                <Ionicons name="star" size={12} color={c.status.diajukan.fg} />
                <Text style={{ color: c.status.diajukan.fg, fontSize: 11.5, fontWeight: '800' }}>Premium</Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={[s.card, { backgroundColor: c.card, borderColor: c.border, gap: 14 }]}>
          <Info label="Username" value={user?.username ?? '-'} />
          <Info label="Email" value={user?.email ?? '-'} />
        </View>

        <Text style={[s.section, { color: c.text }]}>Preferensi & keamanan</Text>
        <View style={[s.card, { backgroundColor: c.card, borderColor: c.border, padding: 0 }]}>
          <View style={s.row}>
            <Ionicons name="contrast-outline" size={20} color={c.link} />
            <Text style={{ color: c.text, fontSize: 14, fontWeight: '600', flex: 1 }}>Tampilan</Text>
          </View>
          <View style={s.seg}>
            {MODES.map((m) => {
              const on = mode === m.key;
              return (
                <Pressable
                  key={m.key}
                  onPress={() => setMode(m.key)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: on }}
                  style={[s.segItem, { borderColor: on ? c.primary : c.border, backgroundColor: on ? c.tint : 'transparent' }]}
                >
                  <Ionicons name={m.icon} size={15} color={on ? c.link : c.muted} />
                  <Text style={{ color: on ? c.link : c.text, fontSize: 12, fontWeight: on ? '800' : '500' }}>{m.label}</Text>
                </Pressable>
              );
            })}
          </View>
          <Divider />
          <Item icon="lock-closed-outline" label="Ubah kata sandi" onPress={() => go('/ubah-sandi')} />
        </View>

        <View style={[s.card, { backgroundColor: c.card, borderColor: c.border, padding: 0 }]}>
          <Item icon="help-circle-outline" label="Bantuan & panduan" onPress={() => go('/info', { slug: 'bantuan-panduan' })} />
          <Divider />
          <Item icon="shield-checkmark-outline" label="Kebijakan privasi" onPress={() => go('/info', { slug: 'kebijakan-privasi' })} />
        </View>

        <Pressable
          onPress={logout}
          accessibilityRole="button"
          style={({ pressed }) => [s.logout, { backgroundColor: c.dangerBg, borderColor: c.dangerBg }, pressed && { opacity: 0.78 }]}
        >
          <Ionicons name="log-out-outline" size={18} color={c.danger} />
          <Text style={{ color: c.danger, fontSize: 14, fontWeight: '700' }}>Keluar dari Akun</Text>
        </Pressable>

        <Text style={{ color: c.muted, fontSize: 11, textAlign: 'center' }}>DinasTrip • Versi {version}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  const { c } = useTheme();
  return (
    <View style={{ gap: 3 }}>
      <Text style={{ color: c.muted, fontSize: 11.5 }}>{label}</Text>
      <Text style={{ color: c.text, fontSize: 14.5, fontWeight: '600' }}>{value}</Text>
    </View>
  );
}

function Item({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  const { c } = useTheme();
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => [s.row, pressed && { backgroundColor: c.tint }]}>
      <Ionicons name={icon} size={20} color={c.link} />
      <Text style={{ color: c.text, fontSize: 14, fontWeight: '600', flex: 1 }}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={c.muted} />
    </Pressable>
  );
}

const Divider = () => {
  const { c } = useTheme();
  return <View style={{ height: 1, backgroundColor: c.border, marginHorizontal: 14 }} />;
};

const s = StyleSheet.create({
  safe: { flex: 1 },
  content: { width: '100%', maxWidth: 520, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 28, gap: 14 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 32 },
  title: { fontSize: 22, fontWeight: '800' },
  hero: { alignItems: 'center', paddingVertical: 8 },
  chip: { marginTop: 10, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 4 },
  section: { fontSize: 15, fontWeight: '700', marginTop: 6 },
  card: { borderWidth: 1, borderRadius: 16, padding: 16, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, minHeight: 52 },
  seg: { flexDirection: 'row', gap: 8, paddingHorizontal: 14, paddingBottom: 12 },
  segItem: { flex: 1, minHeight: 40, borderWidth: 1.5, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  logout: { minHeight: 50, borderWidth: 1, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
});
