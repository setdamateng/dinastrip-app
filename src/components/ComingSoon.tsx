import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/theme/ThemeProvider';

/** Layar sementara untuk tab yang belum dibuat. */
export function ComingSoon({ title, icon }: { title: string; icon: React.ComponentProps<typeof Ionicons>['name'] }) {
  const { c } = useTheme();
  return (
    <SafeAreaView edges={['top']} style={[s.safe, { backgroundColor: c.bg }]}>
      <Text style={[s.title, { color: c.text }]}>{title}</Text>
      <View style={s.center}>
        <Ionicons name={icon} size={40} color={c.muted} />
        <Text style={{ color: c.text, fontSize: 14, fontWeight: '700' }}>Segera hadir</Text>
        <Text style={{ color: c.muted, fontSize: 12 }}>Halaman ini akan dibuat berikutnya.</Text>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, paddingHorizontal: 20, paddingTop: 12 },
  title: { fontSize: 22, fontWeight: '800' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6 },
});
