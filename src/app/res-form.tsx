import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, TextField } from '@/components/kit';
import { FieldBox, PickerField, TextArea } from '@/components/perjalanan/fields';
import { ApiError } from '@/services/api';
import { editStore, resService, type FieldDef, type ResMeta } from '@/services/res';
import type { Opt } from '@/services/types';
import { useTheme } from '@/theme/ThemeProvider';
import { masterEvents } from '@/utils/events';
import { angka } from '@/utils/format';

const digits = (t: string) => t.replace(/\D/g, '');

export default function ResForm() {
  const { c } = useTheme();
  const router = useRouter();
  const { key, id } = useLocalSearchParams<{ key: string; id?: string }>();
  const edit = !!id;

  const [meta, setMeta] = useState<ResMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [v, setV] = useState<Record<string, any>>({});

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const m = await resService.meta(String(key));
        if (!alive) return;
        setMeta(m);
        const row = edit ? editStore.get() : null;
        const init: Record<string, any> = {};
        for (const f of m.fields) {
          if (f.type === 'select') init[f.key] = row?.values[f.key] ? [row.values[f.key]] : [];
          else if (f.type === 'toggle') init[f.key] = row ? !!row.values[f.key] : (f.default ?? false);
          else if (f.type === 'money') init[f.key] = row?.values[f.key] != null ? String(row.values[f.key]) : '';
          else init[f.key] = row ? String(row.values[f.key] ?? '') : '';
        }
        setV(init);
      } catch (e) {
        if (alive) setLoadError(e instanceof ApiError ? e.message : 'Gagal memuat formulir.');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [key, edit]);

  const back = () => (router.canGoBack() ? router.back() : router.replace('/'));
  const set = (k: string) => (val: any) => setV((p) => ({ ...p, [k]: val }));
  const fields = (meta?.fields ?? []).filter((f) => !f.only || (f.only === 'edit') === edit);

  const save = async () => {
    const e: Record<string, string> = {};
    const body: Record<string, unknown> = {};
    for (const f of fields) {
      const val = v[f.key];
      if (f.type === 'select') {
        const o = (val as Opt[])[0];
        if (f.required && !o) e[f.key] = `${f.label} wajib dipilih.`;
        body[f.key] = o ? o.id : null;
      } else if (f.type === 'toggle') body[f.key] = !!val;
      else {
        const t = String(val ?? '').trim();
        if (f.required && !t && !(f.type === 'password' && edit)) e[f.key] = `${f.label} wajib diisi.`;
        if (f.type === 'money') body[f.key] = t === '' ? null : Number(t);
        else body[f.key] = t === '' ? null : t;
      }
    }
    setErrors(e);
    if (Object.keys(e).length) return;

    setBusy(true);
    try {
      if (edit) await resService.update(String(key), String(id), body);
      else await resService.create(String(key), body);
      masterEvents.changed();
      back();
    } catch (err) {
      if (err instanceof ApiError && err.errors) {
        const m: Record<string, string> = {};
        for (const k of Object.keys(err.errors)) m[k] = err.errors[k][0];
        setErrors(m);
        Alert.alert('Periksa isian', err.message);
      } else {
        Alert.alert('Gagal menyimpan', err instanceof ApiError ? err.message : 'Terjadi kesalahan.');
      }
    } finally {
      setBusy(false);
    }
  };

  const render = (f: FieldDef) => {
    const err = errors[f.key];
    switch (f.type) {
      case 'select':
        return (
          <PickerField
            key={f.key}
            label={f.label}
            placeholder="Pilih…"
            required={f.required}
            local={f.source === 'static' || f.source === 'role'}
            value={v[f.key] as Opt[]}
            onChange={set(f.key)}
            load={async (q) => (await resService.options(String(key), f.key, q)) as unknown as Opt[]}
            error={err}
            hint={f.hint}
          />
        );
      case 'toggle':
        return (
          <View key={f.key} style={s.toggle}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: c.text, fontSize: 13, fontWeight: '600' }}>{f.label}</Text>
              {f.hint ? <Text style={{ color: c.muted, fontSize: 11, marginTop: 2 }}>{f.hint}</Text> : null}
            </View>
            <Switch value={!!v[f.key]} onValueChange={set(f.key)} trackColor={{ true: c.primary }} />
          </View>
        );
      case 'textarea':
        return (
          <FieldBox key={f.key} label={f.label} required={f.required} error={err}>
            <TextArea value={v[f.key]} onChangeText={set(f.key)} rows={3} error={err} />
          </FieldBox>
        );
      case 'money':
        return (
          <TextField
            key={f.key}
            label={f.label + (f.required ? ' *' : '')}
            value={v[f.key] ? `Rp ${angka(Number(v[f.key]))}` : ''}
            onChangeText={(t) => set(f.key)(digits(t))}
            keyboardType="number-pad"
            placeholder="Rp 0"
            error={err}
          />
        );
      case 'password':
        return (
          <View key={f.key} style={{ gap: 4 }}>
            <TextField label={f.label + (f.required && !edit ? ' *' : '')} value={v[f.key]} onChangeText={set(f.key)} secure autoCapitalize="none" error={err} />
            {f.hint && !err ? <Text style={{ color: c.muted, fontSize: 11, lineHeight: 15 }}>{f.hint}</Text> : null}
          </View>
        );
      default:
        return (
          <TextField
            key={f.key}
            label={f.label + (f.required ? ' *' : '')}
            value={v[f.key]}
            onChangeText={set(f.key)}
            autoCapitalize={f.key === 'email' || f.key === 'username' || f.key === 'website' ? 'none' : 'sentences'}
            keyboardType={f.key === 'email' ? 'email-address' : 'default'}
            error={err}
          />
        );
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={s.bar}>
        <Pressable onPress={back} hitSlop={12} accessibilityRole="button" accessibilityLabel="Kembali">
          <Ionicons name="arrow-back" size={22} color={c.text} />
        </Pressable>
        <Text style={{ color: c.text, fontSize: 17, fontWeight: '800' }}>
          {edit ? 'Ubah' : 'Tambah'} {meta?.label ?? ''}
        </Text>
      </View>
      {loading ? (
        <ActivityIndicator color={c.primary} style={{ marginTop: 40 }} />
      ) : loadError || !meta ? (
        <Text style={{ color: c.danger, textAlign: 'center', margin: 24 }}>{loadError ?? 'Formulir tidak tersedia.'}</Text>
      ) : (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {fields.map(render)}
            <Button title={edit ? 'Simpan Perubahan' : 'Simpan'} onPress={save} loading={busy} />
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4, minHeight: 44 },
  content: { width: '100%', maxWidth: 520, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 40, gap: 14 },
  toggle: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 },
});
