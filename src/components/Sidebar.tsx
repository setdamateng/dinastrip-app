import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { Image as ExpoImage } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Animated, BackHandler, Dimensions, Easing, PanResponder, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/auth/AuthProvider';
import { roleKind, ROLE_TITLE } from '@/auth/roles';
import { resService, type MenuItem } from '@/services/res';
import { Avatar } from '@/components/Avatar';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const EDGE = 40; // lebar area geser di tepi kiri
const TOP = [0x00, 0x78, 0xd0]; // biru DinasTrip
const BOTTOM = [0x06, 0x1a, 0x35]; // biru gelap
const ALPHA = 0.72; // ~70% (latar belakang samar terlihat)
const BANDS = 36;

const mix = (t: number) => `rgb(${TOP.map((v, i) => Math.round(v + (BOTTOM[i] - v) * t)).join(',')})`;

/** Gradasi vertikal tanpa paket tambahan: tumpukan pita warna. */
function Gradient() {
  return (
    <View style={[StyleSheet.absoluteFill, { opacity: ALPHA }]} pointerEvents="none">
      {Array.from({ length: BANDS }).map((_, i) => (
        <View key={i} style={{ flex: 1, backgroundColor: mix(i / (BANDS - 1)) }} />
      ))}
    </View>
  );
}

/**
 * Membungkus layar tab. Sidebar tersembunyi di kiri, muncul bila layar digeser dari tepi kiri
 * (tanpa tombol). Tutup dengan menggeser ke kiri, mengetuk area gelap, atau tombol kembali.
 */
export function SidebarHost({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const kind = roleKind(user);
  const W = Math.min(310, Math.round(Dimensions.get('window').width * 0.8));

  const p = useRef(new Animated.Value(0)).current; // 0 tertutup, 1 terbuka
  const [shown, setShown] = useState(false);
  const openRef = useRef(false);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const loadMenu = useCallback(() => {
    resService.menu().then(setMenu).catch(() => {});
  }, []);
  useEffect(() => {
    if (user) loadMenu();
    else setMenu([]);
  }, [user?.id, loadMenu]);
  const startP = useRef(0);

  const animate = useCallback(
    (to: 0 | 1) => {
      openRef.current = to === 1;
      if (to === 1) {
        setShown(true);
        loadMenu();
      }
      Animated.timing(p, {
        toValue: to,
        duration: to === 1 ? 240 : 200,
        easing: to === 1 ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished && to === 0) setShown(false);
      });
    },
    [p, loadMenu],
  );

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (openRef.current) {
        animate(0);
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [animate]);

  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 6 && Math.abs(g.dx) > Math.abs(g.dy) * 1.2,
        onPanResponderGrant: () => {
          startP.current = openRef.current ? 1 : 0;
          setShown(true);
        },
        onPanResponderMove: (_, g) => p.setValue(Math.max(0, Math.min(1, startP.current + g.dx / W))),
        onPanResponderRelease: (_, g) => {
          const cur = Math.max(0, Math.min(1, startP.current + g.dx / W));
          animate(g.vx > 0.4 ? 1 : g.vx < -0.4 ? 0 : cur > 0.4 ? 1 : 0);
        },
        onPanResponderTerminate: () => animate(openRef.current ? 1 : 0),
      }),
    [W, animate, p],
  );

  const go = (path: string, params?: Record<string, string>) => {
    animate(0);
    setTimeout(() => router.navigate({ pathname: path, params } as never), 120);
  };

  const logout = () => {
    animate(0);
    setTimeout(
      () =>
        Alert.alert('Keluar', 'Anda yakin ingin keluar dari akun ini?', [
          { text: 'Batal', style: 'cancel' },
          { text: 'Keluar', style: 'destructive', onPress: signOut },
        ]),
      220,
    );
  };

  const version = Constants.expoConfig?.version ?? '-';
  const go2 = (m: MenuItem) =>
    m.kind === 'screen' && m.route ? go(m.route) : go('/res/[key]', { key: m.key });
  const groups = menu.reduce<Record<string, MenuItem[]>>((acc, m) => {
    (acc[m.group] ??= []).push(m);
    return acc;
  }, {});
  const items: { key: string; label: string; icon: IconName; onPress: () => void }[] = [];
  const common: typeof items = [
    { key: 'bantuan', label: 'Bantuan & panduan', icon: 'help-circle-outline', onPress: () => go('/info', { slug: 'bantuan-panduan' }) },
    { key: 'privasi', label: 'Kebijakan privasi', icon: 'shield-checkmark-outline', onPress: () => go('/info', { slug: 'kebijakan-privasi' }) },
  ];

  const Row = ({ it }: { it: (typeof items)[number] }) => (
    <Pressable
      key={it.key}
      accessibilityRole="button"
      onPress={it.onPress}
      style={({ pressed }) => [s.item, pressed && { backgroundColor: 'rgba(255,255,255,0.14)' }]}
    >
      <Ionicons name={it.icon} size={21} color="#FFFFFF" />
      <Text style={s.itemText}>{it.label}</Text>
    </Pressable>
  );

  return (
    <View style={{ flex: 1 }}>
      {children}

      {/* area geser di tepi kiri (seluruh tinggi layar) */}
      <View style={s.edge} {...pan.panHandlers} />

      {shown ? (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.45)', opacity: p }]}>
            <Pressable style={{ flex: 1 }} onPress={() => animate(0)} accessibilityLabel="Tutup menu" />
          </Animated.View>

          <Animated.View
            {...pan.panHandlers}
            style={[
              s.drawer,
              { width: W, paddingTop: insets.top + 18, paddingBottom: Math.max(insets.bottom, 12) + 10 },
              { transform: [{ translateX: p.interpolate({ inputRange: [0, 1], outputRange: [-W, 0] }) }] },
            ]}
          >
            <Gradient />

            <View style={s.profile}>
              <Avatar uri={user?.avatar_url} name={user?.name} size={54} />
              <View style={{ flex: 1 }}>
                <Text style={s.name} numberOfLines={2}>
                  {user?.name}
                </Text>
                <Text style={s.sub} numberOfLines={1}>
                  {ROLE_TITLE[kind]}
                  {user?.bidang?.nama ? ` • ${user.bidang.nama}` : ''}
                </Text>
              </View>
            </View>

            <View style={s.divider} />

            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: 2 }} showsVerticalScrollIndicator={false}>
              {Object.entries(groups).map(([g, list]) => (
                <View key={g} style={{ gap: 2 }}>
                  <Text style={s.group}>{g}</Text>
                  {list.map((m) => (
                    <Row key={m.key} it={{ key: m.key, label: m.label, icon: m.icon as IconName, onPress: () => go2(m) }} />
                  ))}
                </View>
              ))}
              {menu.length > 0 ? <View style={[s.divider, { marginVertical: 8 }]} /> : null}
              {common.map((it) => (
                <Row key={it.key} it={it} />
              ))}
            </ScrollView>

            <View style={s.divider} />
            <Pressable accessibilityRole="button" onPress={logout} style={({ pressed }) => [s.item, pressed && { backgroundColor: 'rgba(255,255,255,0.14)' }]}>
              <Ionicons name="log-out-outline" size={21} color="#FFB4AB" />
              <Text style={[s.itemText, { color: '#FFB4AB' }]}>Keluar dari akun</Text>
            </Pressable>

            <View style={s.footer}>
              <ExpoImage source={require('@/assets/images/logo-icon.png')} contentFit="contain" style={{ width: 22, height: 22, borderRadius: 5 }} />
              <Text style={s.footerText}>DinasTrip • Versi {version}</Text>
            </View>
          </Animated.View>
        </View>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  edge: { position: 'absolute', left: 0, top: 0, bottom: 0, width: EDGE },
  drawer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    paddingHorizontal: 14,
    overflow: 'hidden',
    borderTopRightRadius: 22,
    borderBottomRightRadius: 22,
  },
  profile: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 4, paddingBottom: 14 },
  name: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  sub: { color: 'rgba(255,255,255,0.78)', fontSize: 11.5, marginTop: 2 },
  group: { color: 'rgba(255,255,255,0.62)', fontSize: 11, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase', paddingHorizontal: 10, paddingTop: 10, paddingBottom: 2 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.18)', marginVertical: 6 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 50, paddingHorizontal: 10, borderRadius: 12 },
  itemText: { color: '#FFFFFF', fontSize: 14.5, fontWeight: '600', flex: 1 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingTop: 14 },
  footerText: { color: 'rgba(255,255,255,0.78)', fontSize: 11 },
});
