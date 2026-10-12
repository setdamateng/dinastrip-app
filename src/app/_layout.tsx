import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '@/auth/AuthProvider';
import { ThemeProvider, useTheme } from '@/theme/ThemeProvider';

SplashScreen.preventAutoHideAsync();

function Gate() {
  const { user, loading } = useAuth();
  const { c, isDark } = useTheme();

  useEffect(() => {
    if (!loading) SplashScreen.hideAsync();
  }, [loading]);

  if (loading) return null;

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.bg } }}>
        <Stack.Protected guard={!!user}>
          <Stack.Screen name="(app)" />
          <Stack.Screen name="spt/[id]" />
          <Stack.Screen name="spt-form" />
          <Stack.Screen name="spd/[id]" />
          <Stack.Screen name="spd-edit/[id]" />
          <Stack.Screen name="rincian-form" />
          <Stack.Screen name="laporan-form" />
          <Stack.Screen name="res/[key]" />
          <Stack.Screen name="res-form" />
          <Stack.Screen name="pegawai-form" />
          <Stack.Screen name="opd-form" />
          <Stack.Screen name="profil-edit" />
          <Stack.Screen name="ubah-sandi" />
          <Stack.Screen name="info" />
        </Stack.Protected>
        <Stack.Protected guard={!user}>
          <Stack.Screen name="login" />
          <Stack.Screen name="lupa-sandi" />
        </Stack.Protected>
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <Gate />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
