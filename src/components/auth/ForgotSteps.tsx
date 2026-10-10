import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AuthScaffold, ErrorNote, GhostButton, InfoCard } from '@/components/auth/AuthScaffold';
import { OtpInput } from '@/components/auth/OtpInput';
import { useSecondsLeft } from '@/components/auth/useSecondsLeft';
import { Button, TextField } from '@/components/kit';
import { useTheme } from '@/theme/ThemeProvider';
import { isEmail, maskEmail, PASSWORD_RULES, passwordValid } from '@/utils/password';

// ============================================================ 1. Email
export function EmailStep({
  initialEmail,
  busy,
  error,
  onBack,
  onSubmit,
  onLogin,
}: {
  initialEmail: string;
  busy: boolean;
  error: string | null;
  onBack: () => void;
  onSubmit: (email: string) => void;
  onLogin: () => void;
}) {
  const { c } = useTheme();
  const [email, setEmail] = useState(initialEmail);
  const [local, setLocal] = useState<string | undefined>();

  const submit = () => {
    if (busy) return;
    if (!isEmail(email)) {
      setLocal('Masukkan alamat email yang valid.');
      return;
    }
    setLocal(undefined);
    onSubmit(email.trim());
  };

  return (
    <AuthScaffold
      title="Lupa Kata Sandi"
      onBack={onBack}
      icon="key-outline"
      heading="Masukkan email Anda"
      subtitle="Masukkan email yang terdaftar. Kami akan mengirimkan kode OTP untuk melanjutkan pengaturan ulang kata sandi Anda."
    >
      <ErrorNote message={error} />
      <View style={{ gap: 6 }}>
        <TextField
          label="Email terdaftar"
          icon="mail-outline"
          placeholder="nama@instansi.go.id"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          textContentType="emailAddress"
          autoComplete="email"
          returnKeyType="send"
          onSubmitEditing={submit}
          error={local}
        />
        <Text style={{ color: c.muted, fontSize: 11 }}>Gunakan email yang terhubung dengan akun DinasTrip Anda.</Text>
      </View>

      <Button title="Kirim Kode OTP" icon="paper-plane-outline" onPress={submit} loading={busy} />

      <InfoCard title="Periksa email Anda">
        Kode OTP berlaku selama 15 menit. Jika email belum diterima, periksa folder spam atau hubungi admin instansi.
      </InfoCard>

      <GhostButton title="Kembali ke Login" onPress={onLogin} />
    </AuthScaffold>
  );
}

// ============================================================== 2. OTP
export function OtpStep({
  email,
  busy,
  error,
  info,
  resendAt,
  onBack,
  onVerify,
  onResend,
  onChangeEmail,
}: {
  email: string;
  busy: boolean;
  error: string | null;
  info: string | null;
  resendAt: number;
  onBack: () => void;
  onVerify: (code: string) => Promise<boolean>;
  onResend: () => void;
  onChangeEmail: () => void;
}) {
  const { c } = useTheme();
  const [code, setCode] = useState('');
  const left = useSecondsLeft(resendAt);

  const running = useRef(false);

  // Verifikasi (otomatis saat 6 digit terisi, atau lewat tombol). Gagal -> kotak dikosongkan.
  const run = async (v: string) => {
    if (running.current || busy) return;
    running.current = true;
    try {
      const ok = await onVerify(v);
      if (!ok) setCode('');
    } finally {
      running.current = false;
    }
  };

  const change = (v: string) => {
    setCode(v);
    if (v.length === 6) run(v);
  };

  return (
    <AuthScaffold
      title="Verifikasi OTP"
      onBack={onBack}
      icon="mail-open-outline"
      heading="Masukkan kode OTP"
      subtitle={
        <>
          Kami mengirim kode 6 digit ke <Text style={{ color: c.text, fontWeight: '700' }}>{maskEmail(email)}</Text>. Kode berlaku
          15 menit.
        </>
      }
    >
      <ErrorNote message={error} />
      {info && !error ? (
        <View style={[st.ok, { backgroundColor: c.status.terverifikasi.bg }]} accessibilityLiveRegion="polite">
          <Ionicons name="checkmark-circle-outline" size={18} color={c.status.terverifikasi.fg} />
          <Text style={{ color: c.status.terverifikasi.fg, flex: 1, fontSize: 12 }}>{info}</Text>
        </View>
      ) : null}

      <OtpInput value={code} onChange={change} error={!!error} editable={!busy} />

      <Button
        title="Verifikasi Kode"
        icon="shield-checkmark-outline"
        onPress={() => code.length === 6 && run(code)}
        loading={busy}
        disabled={code.length !== 6}
      />

      <View style={st.resendRow}>
        <Text style={{ color: c.muted, fontSize: 12 }}>Belum menerima kode?</Text>
        {left > 0 ? (
          <Text style={{ color: c.muted, fontSize: 12, fontWeight: '700' }}>Kirim ulang ({left} dtk)</Text>
        ) : (
          <Pressable onPress={onResend} disabled={busy} hitSlop={10} accessibilityRole="button">
            <Text style={{ color: c.link, fontSize: 12, fontWeight: '700' }}>Kirim ulang kode</Text>
          </Pressable>
        )}
      </View>

      <GhostButton title="Ganti email" onPress={onChangeEmail} />
    </AuthScaffold>
  );
}

// ======================================================= 3. Sandi baru
export function PasswordStep({
  busy,
  error,
  fieldError,
  onBack,
  onSubmit,
}: {
  busy: boolean;
  error: string | null;
  fieldError?: string;
  onBack: () => void;
  onSubmit: (password: string, confirm: string) => void;
}) {
  const { c } = useTheme();
  const [pw, setPw] = useState('');
  const [confirm, setConfirm] = useState('');

  const match = confirm.length > 0 && pw === confirm;
  const ready = passwordValid(pw) && match;

  const Check = ({ ok, label }: { ok: boolean; label: string }) => (
    <View style={st.check}>
      <Ionicons name={ok ? 'checkmark-circle' : 'ellipse-outline'} size={16} color={ok ? c.status.terverifikasi.fg : c.muted} />
      <Text style={{ color: ok ? c.status.terverifikasi.fg : c.muted, fontSize: 11 }}>{label}</Text>
    </View>
  );

  return (
    <AuthScaffold
      title="Kata Sandi Baru"
      onBack={onBack}
      icon="lock-closed-outline"
      logo
      heading="Buat kata sandi baru"
      subtitle="Email Anda telah terverifikasi. Buat kata sandi baru untuk mengamankan akun Anda."
    >
      <ErrorNote message={error} />

      <View style={{ gap: 8 }}>
        <TextField
          label="Kata sandi baru"
          secure
          placeholder="Masukkan kata sandi baru"
          value={pw}
          onChangeText={setPw}
          autoCapitalize="none"
          textContentType="newPassword"
          returnKeyType="next"
          error={fieldError}
        />
        <View style={{ gap: 4 }}>
          {PASSWORD_RULES.map((r) => (
            <Check key={r.key} ok={r.test(pw)} label={r.label} />
          ))}
        </View>
      </View>

      <View style={{ gap: 8 }}>
        <TextField
          label="Konfirmasi kata sandi baru"
          secure
          placeholder="Ulangi kata sandi baru"
          value={confirm}
          onChangeText={setConfirm}
          autoCapitalize="none"
          textContentType="newPassword"
          returnKeyType="go"
          onSubmitEditing={() => ready && !busy && onSubmit(pw, confirm)}
        />
        {confirm.length > 0 ? (
          <Check ok={match} label={match ? 'Kata sandi cocok.' : 'Kata sandi belum cocok.'} />
        ) : null}
      </View>

      <Button
        title="Simpan Kata Sandi Baru"
        icon="shield-checkmark-outline"
        onPress={() => onSubmit(pw, confirm)}
        loading={busy}
        disabled={!ready}
      />

      <InfoCard title="Jaga keamanan akun">
        Gunakan kata sandi yang berbeda dari akun lain. Jangan bagikan kata sandi kepada siapa pun.
      </InfoCard>
    </AuthScaffold>
  );
}

// ============================================================ 4. Selesai
export function DoneStep({ onLogin }: { onLogin: () => void }) {
  const { c } = useTheme();
  return (
    <AuthScaffold
      title="Selesai"
      onBack={onLogin}
      icon="checkmark-done-outline"
      heading="Kata sandi berhasil diubah"
      subtitle="Silakan login dengan kata sandi baru Anda. Demi keamanan, semua perangkat yang sedang login telah dikeluarkan."
    >
      <Button title="Kembali ke Login" icon="log-in-outline" onPress={onLogin} />
      <Text style={{ color: c.muted, fontSize: 11, textAlign: 'center' }}>DinasTrip • Sistem perjalanan dinas</Text>
    </AuthScaffold>
  );
}

const st = StyleSheet.create({
  ok: { flexDirection: 'row', gap: 8, padding: 12, borderRadius: 12, alignItems: 'center' },
  resendRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  check: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
