import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, BackHandler } from 'react-native';

import { DoneStep, EmailStep, OtpStep, PasswordStep } from '@/components/auth/ForgotSteps';
import { ApiError } from '@/services/api';
import { authService } from '@/services/auth';

type Step = 'email' | 'otp' | 'password' | 'done';

/**
 * Alur lupa kata sandi dalam satu route: email -> OTP -> kata sandi baru -> selesai.
 * Email & reset_token hanya disimpan di memori layar ini (tidak lewat URL/parameter).
 */
export default function LupaSandi() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState(typeof params.email === 'string' ? params.email : '');
  const [resetToken, setResetToken] = useState('');
  const [resendAt, setResendAt] = useState(0);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [pwError, setPwError] = useState<string | undefined>();

  const toLogin = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/login');
  }, [router]);

  const msg = (e: unknown) => {
    if (e instanceof ApiError) return e.message;
    if (__DEV__) console.warn('[lupa-sandi]', e);
    return __DEV__ ? `Terjadi kesalahan tak terduga. (${String(e)})` : 'Terjadi kesalahan tak terduga.';
  };

  // ---- tombol kembali (panah & tombol back Android) ----
  const goBack = useCallback(() => {
    setError(null);
    setInfo(null);
    if (step === 'email' || step === 'done') {
      toLogin();
    } else if (step === 'otp') {
      setStep('email');
    } else {
      // OTP sudah terpakai, jadi tidak bisa kembali ke langkah OTP: konfirmasi batal
      Alert.alert('Batalkan pengaturan ulang?', 'Anda harus meminta kode OTP baru jika ingin mengulang.', [
        { text: 'Lanjutkan', style: 'cancel' },
        {
          text: 'Batalkan',
          style: 'destructive',
          onPress: () => {
            setResetToken('');
            setStep('email');
          },
        },
      ]);
    }
  }, [step, toLogin]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (step === 'email') return false; // biarkan router kembali ke Login
      goBack();
      return true;
    });
    return () => sub.remove();
  }, [step, goBack]);

  // ---- langkah 1: kirim OTP ----
  const sendOtp = async (target: string, resend = false) => {
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      const r = await authService.forgotPassword(target);
      setEmail(target);
      setResendAt(Date.now() + (r?.resend_in ?? 60) * 1000);
      if (resend) setInfo('Kode OTP baru telah dikirim. Periksa email Anda.');
      setStep('otp');
    } catch (e) {
      setError(msg(e));
    } finally {
      setBusy(false);
    }
  };

  // ---- langkah 2: verifikasi OTP ----
  const verify = async (code: string): Promise<boolean> => {
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      const r = await authService.verifyOtp(email, code);
      setResetToken(r.reset_token);
      setStep('password');
      return true;
    } catch (e) {
      setError(msg(e));
      return false;
    } finally {
      setBusy(false);
    }
  };

  // ---- langkah 3: kata sandi baru ----
  const save = async (password: string, confirm: string) => {
    setBusy(true);
    setError(null);
    setPwError(undefined);
    try {
      await authService.resetPassword({ email, resetToken, password, confirm });
      setResetToken('');
      setStep('done');
    } catch (e) {
      if (e instanceof ApiError && e.field('reset_token')) {
        // sesi 10 menit habis -> ulangi dari awal
        setResetToken('');
        setStep('email');
        setError('Sesi pengaturan ulang berakhir. Silakan minta kode OTP baru.');
      } else if (e instanceof ApiError && e.field('password')) {
        setPwError(e.field('password'));
      } else {
        setError(msg(e));
      }
    } finally {
      setBusy(false);
    }
  };

  if (step === 'otp') {
    return (
      <OtpStep
        email={email}
        busy={busy}
        error={error}
        info={info}
        resendAt={resendAt}
        onBack={goBack}
        onVerify={verify}
        onResend={() => sendOtp(email, true)}
        onChangeEmail={() => {
          setError(null);
          setInfo(null);
          setStep('email');
        }}
      />
    );
  }

  if (step === 'password') {
    return <PasswordStep busy={busy} error={error} fieldError={pwError} onBack={goBack} onSubmit={save} />;
  }

  if (step === 'done') {
    return <DoneStep onLogin={() => router.replace('/login')} />;
  }

  return (
    <EmailStep
      initialEmail={email}
      busy={busy}
      error={error}
      onBack={goBack}
      onSubmit={(v) => sendOtp(v)}
      onLogin={toLogin}
    />
  );
}
