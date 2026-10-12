import { Image } from 'expo-image';
import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';

export function initials(name?: string | null) {
  return (name ?? '?').split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join('') || '?';
}

/** Foto profil dari server; bila kosong/gagal dimuat tampil inisial (ringan). */
export function Avatar({ uri, name, size = 88 }: { uri?: string | null; name?: string | null; size?: number }) {
  const { c } = useTheme();
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [uri]);

  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: c.tint, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      {uri && !failed ? (
        <Image source={{ uri }} contentFit="cover" style={{ width: size, height: size }} onError={() => setFailed(true)} accessibilityLabel="Foto profil" />
      ) : (
        <Text style={{ color: c.link, fontSize: size * 0.32, fontWeight: '500' }}>{initials(name)}</Text>
      )}
    </View>
  );
}
