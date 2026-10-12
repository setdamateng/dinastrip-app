import { Platform } from 'react-native';
import { api } from './api';
import type { Captcha, LoginResult, User } from './types';

export const authService = {
  async captcha(): Promise<Captcha> {
    return (await api.get<Captcha>('/auth/captcha', undefined, { auth: false })).data;
  },

  async login(p: { login: string; password: string; captchaId: string; captcha: string }): Promise<LoginResult> {
    const res = await api.post<LoginResult>(
      '/auth/login',
      {
        login: p.login.trim(),
        password: p.password,
        captcha_id: p.captchaId,
        captcha: p.captcha,
        device_name: `${Platform.OS}-app`,
      },
      { auth: false }
    );
    return res.data;
  },

  /** Langkah 1: kirim OTP 6 digit ke email. `resend_in` = detik jeda sebelum boleh kirim ulang. */
  async forgotPassword(email: string): Promise<{ resend_in: number }> {
    return (await api.post<{ resend_in: number }>('/auth/forgot-password', { email: email.trim() }, { auth: false })).data ?? { resend_in: 60 };
  },

  /** Langkah 2: cek OTP. Benar -> server memberi reset_token sekali pakai (10 menit). */
  async verifyOtp(email: string, otp: string): Promise<{ reset_token: string; expires_in: number }> {
    return (
      await api.post<{ reset_token: string; expires_in: number }>(
        '/auth/verify-otp',
        { email: email.trim(), otp },
        { auth: false }
      )
    ).data;
  },

  /** Langkah 3: set kata sandi baru memakai reset_token. */
  async resetPassword(p: { email: string; resetToken: string; password: string; confirm: string }): Promise<void> {
    await api.post(
      '/auth/reset-password',
      {
        email: p.email.trim(),
        reset_token: p.resetToken,
        password: p.password,
        password_confirmation: p.confirm,
      },
      { auth: false }
    );
  },

  async me(): Promise<User> {
    return (await api.get<User>('/auth/me')).data;
  },

  async updateProfile(p: { name: string; username: string; email: string }): Promise<User> {
    return (await api.put<User>('/auth/profile', p)).data;
  },

  async changePassword(p: { current: string; password: string; confirm: string }): Promise<void> {
    await api.post('/auth/change-password', {
      current_password: p.current,
      password: p.password,
      password_confirmation: p.confirm,
    });
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout');
  },
};
