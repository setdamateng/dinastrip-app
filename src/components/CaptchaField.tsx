import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { Captcha } from '@/services/types';
import { useTheme } from '@/theme/ThemeProvider';

/**
 * Kartu "Verifikasi keamanan": gambar captcha dari server + tombol Ganti + input 6 digit.
 * Kode TIDAK pernah dikirim sebagai teks, hanya gambar, jadi tidak bisa dibaca bot dari respons API.
 */
export function CaptchaField({
  captcha,
  loading,
  loadError,
  onRefresh,
  value,
  onChange,
  error,
  onSubmit,
}: {
  captcha: Captcha | null;
  loading: boolean;
  loadError: string | null;
  onRefresh: () => void;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  onSubmit?: () => void;
}) {
  const { c } = useTheme();

  return (
    <View style={{ gap: 10 }}>
      <Text style={{ color: c.text, fontSize: 13, fontWeight: '600' }}>Verifikasi keamanan</Text>

      <View style={[s.card, { backgroundColor: c.tint, borderColor: c.border }]}>
        <View style={s.head}>
          <Text style={{ color: c.muted, fontSize: 10, fontWeight: '700', letterSpacing: 1 }}>KODE VERIFIKASI</Text>
          <Pressable
            onPress={onRefresh}
            disabled={loading}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Ganti kode verifikasi"
            style={s.refresh}
          >
            <Ionicons name="refresh" size={16} color={c.primary} />
            <Text style={{ color: c.primary, fontSize: 12, fontWeight: '700' }}>Ganti</Text>
          </Pressable>
        </View>

        <View style={s.imgBox}>
          {loading ? (
            <ActivityIndicator color="#005DB4" />
          ) : captcha ? (
            <Image
              source={{ uri: captcha.image }}
              style={{ width: 200, height: 75 }}
              resizeMode="contain"
              accessibilityLabel="Gambar kode verifikasi 6 digit"
            />
          ) : (
            <Pressable onPress={onRefresh}>
              <Text style={{ color: '#B3261E', textAlign: 'center', fontSize: 12 }}>
                {loadError ?? 'Gagal memuat kode.'} Ketuk untuk coba lagi.
              </Text>
            </Pressable>
          )}
        </View>
      </View>

      <View style={{ gap: 6 }}>
        <Text style={{ color: c.text, fontSize: 13, fontWeight: '600' }}>Masukkan kode verifikasi</Text>
        <TextInput
          value={value}
          onChangeText={(t) => onChange(t.replace(/\D/g, '').slice(0, 6))}
          keyboardType="number-pad"
          maxLength={6}
          placeholder="Ketik 6 digit kode di atas"
          placeholderTextColor={c.muted}
          returnKeyType="go"
          onSubmitEditing={onSubmit}
          accessibilityLabel="Masukkan kode verifikasi"
          style={[
            s.input,
            {
              backgroundColor: c.inputBg,
              borderColor: error ? c.danger : c.border,
              color: c.text,
              letterSpacing: value ? 6 : 0,
            },
          ]}
        />
        {error ? <Text style={{ color: c.danger, fontSize: 12 }}>{error}</Text> : null}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 14, padding: 12, gap: 8 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  refresh: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 32 },
  imgBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    minHeight: 84,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: { minHeight: 50, borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14, fontSize: 18, fontWeight: '700' },
});
