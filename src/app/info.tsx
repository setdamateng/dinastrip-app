import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ApiError } from '@/services/api';
import { contentService, type InfoDoc, type InfoSlug } from '@/services/content';
import { useTheme } from '@/theme/ThemeProvider';

const FALLBACK: Record<InfoSlug, string> = {
  'kebijakan-privasi': 'Kebijakan Privasi',
  'bantuan-panduan': 'Bantuan & Panduan',
};

/** Menampilkan teks biasa dari server (file .txt): Kebijakan Privasi / Bantuan & Panduan. */
export default function Info() {
  const { c } = useTheme();
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug?: string }>();
  const key: InfoSlug = slug === 'kebijakan-privasi' ? 'kebijakan-privasi' : 'bantuan-panduan';

  const [doc, setDoc] = useState<InfoDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setDoc(await contentService.get(key));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Gagal memuat.');
    } finally {
      setLoading(false);
    }
  }, [key]);

  useEffect(() => {
    load();
  }, [load]);

  const back = () => (router.canGoBack() ? router.back() : router.replace('/(app)/profil' as never));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={s.header}>
        <Pressable onPress={back} hitSlop={12} accessibilityRole="button" accessibilityLabel="Kembali">
          <Ionicons name="arrow-back" size={24} color={c.text} />
        </Pressable>
        <Text style={{ color: c.text, fontSize: 17, fontWeight: '800' }}>{doc?.title || FALLBACK[key]}</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={c.primary} style={{ marginTop: 40 }} />
      ) : error ? (
        <View style={{ alignItems: 'center', gap: 12, margin: 24 }}>
          <Ionicons name="cloud-offline-outline" size={30} color={c.muted} />
          <Text style={{ color: c.text, fontSize: 13, textAlign: 'center' }}>{error}</Text>
          <Pressable onPress={load} style={[s.retry, { borderColor: c.primary }]}>
            <Text style={{ color: c.link, fontSize: 13, fontWeight: '700' }}>Coba lagi</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>
          <Text style={{ color: c.text, fontSize: 14, lineHeight: 22 }} selectable>
            {doc?.text}
          </Text>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, minHeight: 52 },
  body: { width: '100%', maxWidth: 520, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40 },
  retry: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8 },
});
