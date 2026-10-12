import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, TextField } from '@/components/kit';
import { ApiError } from '@/services/api';
import { authService } from '@/services/auth';
import { useTheme } from '@/theme/ThemeProvider';
import { PASSWORD_RULES, passwordValid } from '@/utils/password';

export default function UbahSandi() {
  const { c } = useTheme();
  const router = useRouter();

  const [cur, setCur] = useState('');
  const [pw, setPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const match = confirm.length > 0 && pw === confirm;
  const ready = cur.length > 0 && passwordValid(pw) && match;
  const back = () => (router.canGoBack() ? router.back() : router.replace('/(app)/profil' as never));

  const Check = ({ ok, label }: { ok: boolean; label: string }) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
      <Ionicons name={ok ? 'checkmark-circle' : 'ellipse-outline'} size={16} color={ok ? c.status.terverifikasi.fg : c.muted} />
      <Text style={{ color: ok ? c.status.terverifikasi.fg : c.muted, fontSize: 11 }}>{label}</Text>
    </View>
  );

  const save = async () => {
    setErrors({});
    setBusy(true);
    try {
      await authService.changePassword({ current: cur, password: pw, confirm });
      Alert.alert('Berhasil', 'Kata sandi berhasil diubah. Perangkat lain akan keluar otomatis.', [{ text: 'OK', onPress: back }]);
    } catch (err) {
      if (err instanceof ApiError && err.errors) {
        const m: Record<string, string> = {};
        for (const k of Object.keys(err.errors)) m[k] = err.errors[k][0];
        setErrors(m);
      } else {
        Alert.alert('Gagal', err instanceof ApiError ? err.message : 'Terjadi kesalahan.');
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
        <Text style={{ color: c.text, fontSize: 17, fontWeight: '800' }}>Ubah Kata Sandi</Text>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.body} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <TextField label="Kata sandi saat ini" secure value={cur} onChangeText={setCur} autoCapitalize="none" placeholder="Masukkan kata sandi saat ini" textContentType="password" error={errors.current_password} />

          <View style={{ gap: 8 }}>
            <TextField label="Kata sandi baru" secure value={pw} onChangeText={setPw} autoCapitalize="none" placeholder="Masukkan kata sandi baru" textContentType="newPassword" error={errors.password} />
            <View style={{ gap: 4 }}>
              {PASSWORD_RULES.map((r) => (
                <Check key={r.key} ok={r.test(pw)} label={r.label} />
              ))}
            </View>
          </View>

          <View style={{ gap: 8 }}>
            <TextField label="Konfirmasi kata sandi baru" secure value={confirm} onChangeText={setConfirm} autoCapitalize="none" placeholder="Ulangi kata sandi baru" textContentType="newPassword" />
            {confirm.length > 0 ? <Check ok={match} label={match ? 'Kata sandi cocok.' : 'Kata sandi belum cocok.'} /> : null}
          </View>

          <Button title="Simpan Kata Sandi" onPress={save} loading={busy} disabled={!ready} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, minHeight: 52 },
  body: { width: '100%', maxWidth: 520, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 32, gap: 16 },
});
