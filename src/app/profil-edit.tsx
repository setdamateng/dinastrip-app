import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/auth/AuthProvider';
import { ROLE_TITLE, roleKind } from '@/auth/roles';
import { Avatar } from '@/components/Avatar';
import { Button, TextField } from '@/components/kit';
import { ApiError } from '@/services/api';
import { authService } from '@/services/auth';
import { useTheme } from '@/theme/ThemeProvider';
import { isEmail } from '@/utils/password';

export default function ProfilEdit() {
  const { c } = useTheme();
  const router = useRouter();
  const { user, setUser } = useAuth();

  const [name, setName] = useState(user?.name ?? '');
  const [username, setUsername] = useState(user?.username ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const back = () => (router.canGoBack() ? router.back() : router.replace('/(app)/profil' as never));
  const changed = name.trim() !== user?.name || username.trim() !== (user?.username ?? '') || email.trim() !== user?.email;

  const save = async () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Nama lengkap wajib diisi.';
    if (!username.trim()) e.username = 'Username wajib diisi.';
    if (!isEmail(email)) e.email = 'Format email tidak valid.';
    setErrors(e);
    if (Object.keys(e).length) return;

    setBusy(true);
    try {
      const u = await authService.updateProfile({ name: name.trim(), username: username.trim(), email: email.trim() });
      setUser(u);
      Alert.alert('Berhasil', 'Profil berhasil diperbarui.', [{ text: 'OK', onPress: back }]);
    } catch (err) {
      if (err instanceof ApiError && err.errors) {
        const m: Record<string, string> = {};
        for (const k of Object.keys(err.errors)) m[k] = err.errors[k][0];
        setErrors(m);
      } else {
        Alert.alert('Gagal menyimpan', err instanceof ApiError ? err.message : 'Terjadi kesalahan.');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={s.header}>
        <Pressable onPress={back} hitSlop={12} accessibilityRole="button" accessibilityLabel="Kembali">
          <Ionicons name="arrow-back" size={24} color={c.text} />
        </Pressable>
        <Text style={{ color: c.text, fontSize: 17, fontWeight: '800' }}>Edit Profil</Text>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.body} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={{ alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <Avatar uri={user?.avatar_url} name={name || user?.name} size={84} />
            <Text style={{ color: c.muted, fontSize: 11 }}>Foto profil diubah melalui aplikasi web DinasTrip.</Text>
          </View>

          <TextField label="Nama lengkap" value={name} onChangeText={setName} placeholder="Nama lengkap" error={errors.name} />
          <TextField label="Username" value={username} onChangeText={setUsername} autoCapitalize="none" autoCorrect={false} placeholder="Username" error={errors.username} />
          <TextField label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" placeholder="nama@instansi.go.id" error={errors.email} />

          <View style={[s.ro, { backgroundColor: c.card, borderColor: c.border }]}>
            <RO label="Role" value={ROLE_TITLE[roleKind(user)]} />
            <RO label="Bidang / Unit kerja" value={user?.bidang?.nama ?? '-'} />
            <RO label="SKPD" value={user?.skpd?.nama ?? '-'} />
          </View>

          <Button title="Simpan Perubahan" onPress={save} loading={busy} disabled={!changed} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function RO({ label, value }: { label: string; value: string }) {
  const { c } = useTheme();
  return (
    <View style={{ gap: 2 }}>
      <Text style={{ color: c.muted, fontSize: 11.5 }}>{label}</Text>
      <Text style={{ color: c.text, fontSize: 14, fontWeight: '600' }}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, minHeight: 52 },
  body: { width: '100%', maxWidth: 520, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 32, gap: 14 },
  ro: { borderWidth: 1, borderRadius: 14, padding: 14, gap: 12 },
});
