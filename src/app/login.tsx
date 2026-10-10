import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/auth/AuthProvider';
import { useCaptcha } from '@/components/useCaptcha';
import { ApiError } from '@/services/api';
import { useTheme } from '@/theme/ThemeProvider';

export default function LoginScreen() {
  const { c, isDark, toggle } = useTheme();
  const { signIn } = useAuth();
  const router = useRouter();
  const cap = useCaptcha();

  const passRef = useRef<TextInput>(null);
  const codeRef = useRef<TextInput>(null);

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [verification, setVerification] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState('');

  function refreshCaptcha() {
    setVerification('');
    cap.refresh();
  }

  async function handleLogin() {
    if (isSubmitting) return;
    setNotice('');

    if (!identifier.trim() || !password) {
      setNotice('Masukkan username/email dan kata sandi terlebih dahulu.');
      return;
    }
    if (!cap.captcha) {
      setNotice('CAPTCHA belum dimuat. Ketuk tombol refresh untuk memuat ulang.');
      return;
    }
    if (verification.length !== 6) {
      setNotice('Masukkan 6 digit kode CAPTCHA.');
      return;
    }

    setIsSubmitting(true);
    try {
      await signIn({
        login: identifier,
        password,
        captchaId: cap.captcha.captcha_id,
        captcha: verification,
      });
      // sukses -> gerbang di _layout otomatis memindahkan ke Beranda
    } catch (error) {
      setNotice(
        error instanceof ApiError
          ? error.field('captcha') ?? error.field('login') ?? error.field('password') ?? error.message
          : 'Terjadi kesalahan tak terduga.',
      );
      refreshCaptcha(); // captcha sekali pakai
    } finally {
      setIsSubmitting(false);
    }
  }

  const inputWrap = [styles.inputWrap, { backgroundColor: c.inputBg, borderColor: c.border }];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: c.bg }]}>
      <KeyboardAvoidingView style={styles.keyboardView} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.page, { backgroundColor: c.bg }]}>
            <View style={styles.topBar}>
              <Text style={[styles.timeHint, { color: c.muted }]}>DINASTRIP</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Ganti ke mode ${isDark ? 'terang' : 'gelap'}`}
                onPress={toggle}
                style={({ pressed }) => [
                  styles.themeButton,
                  { backgroundColor: c.card, borderColor: c.border },
                  pressed && styles.pressed,
                ]}
              >
                <Ionicons name={isDark ? 'sunny-outline' : 'moon-outline'} size={13} color={c.text} />
                <Text style={[styles.themeButtonText, { color: c.text }]}>{isDark ? 'Terang' : 'Gelap'}</Text>
              </Pressable>
            </View>

            <View style={styles.brandRow}>
              <ExpoImage
                accessibilityLabel="Logo DinasTrip"
                contentFit="contain"
                source={require('@/assets/images/logo-icon.png')}
                style={styles.brandLogo}
              />
            </View>

            <View style={styles.intro}>
              <Text style={[styles.title, { color: c.text }]}>Selamat datang.</Text>
              <Text style={[styles.subtitle, { color: c.muted }]}>
                Kelola perjalanan dinas Anda dengan lebih mudah, tertib, dan transparan.
              </Text>
            </View>

            <View style={styles.form}>
              <Text style={[styles.label, { color: c.text }]}>Nama Pengguna atau Email</Text>
              <View style={inputWrap}>
                <TextInput
                  accessibilityLabel="Nama pengguna atau email"
                  autoCapitalize="none"
                  autoComplete="username"
                  autoCorrect={false}
                  keyboardType="email-address"
                  onChangeText={setIdentifier}
                  onSubmitEditing={() => passRef.current?.focus()}
                  placeholder="Masukkan nama pengguna atau email"
                  placeholderTextColor={c.muted}
                  returnKeyType="next"
                  style={[styles.input, { color: c.text }]}
                  textContentType="username"
                  value={identifier}
                />
                <Ionicons name="person-outline" size={16} color={c.muted} />
              </View>

              <Text style={[styles.label, { color: c.text }]}>Kata sandi</Text>
              <View style={inputWrap}>
                <TextInput
                  ref={passRef}
                  accessibilityLabel="Kata sandi"
                  autoCapitalize="none"
                  onChangeText={setPassword}
                  onSubmitEditing={() => codeRef.current?.focus()}
                  placeholder="Masukkan kata sandi"
                  placeholderTextColor={c.muted}
                  returnKeyType="next"
                  secureTextEntry={!passwordVisible}
                  style={[styles.input, { color: c.text }]}
                  textContentType="password"
                  value={password}
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={passwordVisible ? 'Sembunyikan kata sandi' : 'Lihat kata sandi'}
                  hitSlop={10}
                  onPress={() => setPasswordVisible(!passwordVisible)}
                >
                  <Ionicons name={passwordVisible ? 'eye-outline' : 'eye-off-outline'} size={17} color={c.muted} />
                </Pressable>
              </View>

              <Text style={[styles.label, { color: c.text }]}>Kode CAPTCHA</Text>
              <View style={inputWrap}>
                <TextInput
                  ref={codeRef}
                  accessibilityLabel="Kode CAPTCHA"
                  autoCorrect={false}
                  keyboardType="number-pad"
                  maxLength={6}
                  onChangeText={(t) => setVerification(t.replace(/\D/g, '').slice(0, 6))}
                  onSubmitEditing={handleLogin}
                  placeholder="Masukkan Kode 6 digit"
                  placeholderTextColor={c.muted}
                  returnKeyType="go"
                  style={[styles.input, { color: c.text }]}
                  value={verification}
                />
                <View style={styles.captchaBox}>
                  {cap.loading ? (
                    <ActivityIndicator color="#005DB4" />
                  ) : cap.captcha ? (
                    <Image
                      accessibilityLabel="Gambar CAPTCHA 6 digit"
                      resizeMode="contain"
                      source={{ uri: cap.captcha.image }}
                      style={styles.captchaImg}
                    />
                  ) : (
                    <Text style={styles.captchaError} numberOfLines={2}>
                      {cap.loadError ?? 'Gagal memuat'}
                    </Text>
                  )}
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Muat ulang CAPTCHA"
                  disabled={cap.loading}
                  hitSlop={8}
                  onPress={refreshCaptcha}
                  style={styles.refreshButton}
                >
                  <Ionicons name="refresh" size={16} color={c.primary} />
                </Pressable>
              </View>

              {notice ? (
                <Text accessibilityLiveRegion="polite" style={[styles.notice, { color: c.danger }]}>
                  {notice}
                </Text>
              ) : null}

              <Pressable
                accessibilityRole="button"
                disabled={isSubmitting}
                onPress={handleLogin}
                style={({ pressed }) => [
                  styles.loginButton,
                  { backgroundColor: c.primary },
                  pressed && styles.pressed,
                  isSubmitting && styles.disabled,
                ]}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    {/* <Ionicons name="arrow-forward" size={15} color="#FFFFFF" /> */}
                    <Text style={styles.loginButtonText}>M a s u k</Text>
                  </View>
                )}
              </Pressable>

              <Pressable
                accessibilityRole="button"
                onPress={() =>
                  router.push({ pathname: '/lupa-sandi', params: identifier.includes('@') ? { email: identifier.trim() } : {} })
                }
                style={({ pressed }) => [styles.forgotButton, pressed && styles.pressed]}
              >
                <Text style={[styles.forgotText, { color: c.primary }]}>Lupa Kata Sandi?</Text>
              </Pressable>
            </View>

            <View style={styles.footer}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <Ionicons name="shield-checkmark-outline" size={11} color={c.muted} />
                <Text style={[styles.footerText, { color: c.muted }]}>Akses aman untuk perjalanan dinas Anda</Text>
              </View>
              <Text style={[styles.footerText, { color: c.muted }]}>DinasTrip • Dikembangkan oleh Safani Digital • 2026</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, alignItems: 'center' },
  page: { width: '100%', maxWidth: 480, minHeight: '100%', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 18 },
  topBar: { minHeight: 34, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  timeHint: { fontSize: 11, fontWeight: '700', letterSpacing: 1.1 },
  themeButton: {
    minHeight: 32,
    paddingHorizontal: 11,
    borderWidth: 1,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  themeButtonText: { fontSize: 12, fontWeight: '600' },
  brandRow: { marginTop: 16, marginBottom: 17 },
  brandLogo: { width: 58, height: 58, borderRadius: 12 },
  intro: { marginBottom: 18 },
  title: { fontSize: 25, lineHeight: 31, fontWeight: '700', letterSpacing: -0.35 },
  subtitle: { fontSize: 13, lineHeight: 19, marginTop: 6 },
  form: { gap: 7 },
  label: { fontSize: 12, lineHeight: 16, fontWeight: '600', marginTop: 2 },
  inputWrap: {
    minHeight: 42,
    borderRadius: 9,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 11,
    gap: 8,
  },
  input: { flex: 1, minHeight: 40, paddingVertical: 0, fontSize: 14 },
  captchaBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    width: 76,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  captchaImg: { width: 72, height: 30 },
  captchaError: { color: '#B3261E', fontSize: 9, lineHeight: 11, textAlign: 'center' },
  refreshButton: { width: 30, height: 34, alignItems: 'center', justifyContent: 'center' },
  notice: { fontSize: 12, lineHeight: 17 },
  loginButton: { minHeight: 44, borderRadius: 9, alignItems: 'center', justifyContent: 'center', marginTop: 3 },
  loginButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  forgotButton: { minHeight: 31, alignItems: 'center', justifyContent: 'center' },
  forgotText: { fontSize: 13, fontWeight: '600' },
  footer: { alignItems: 'center', gap: 7, marginTop: 'auto', paddingTop: 17 },
  footerText: { fontSize: 11, lineHeight: 15, textAlign: 'center' },
  pressed: { opacity: 0.78 },
  disabled: { opacity: 0.65 },
});
