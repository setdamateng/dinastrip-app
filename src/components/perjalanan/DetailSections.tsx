import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import type { HotelInfo, PelaksanaDetail, RincianItem, SptDetail, TiketInfo } from '@/services/types';
import { useTheme } from '@/theme/ThemeProvider';
import { daftarKota, jumlahHari, rupiah, tanggal, waktu } from '@/utils/format';
import { Block, Collapsible, Divider, ExpandText, KV, NumberedText } from './ui';

type IconName = React.ComponentProps<typeof Ionicons>['name'];
const pct = (f: number) => `${Math.round(f * 100)}%`;

// ------------------------------------------------------------ Data SPT
export function DataSurat({ d }: { d: SptDetail }) {
  const { c } = useTheme();
  const router = useRouter();
  const hari = jumlahHari(d.tgl_berangkat, d.tgl_kembali);
  const tujuan = d.tujuan_list?.length ? d.tujuan_list.map((k) => k.nama) : d.tujuan;

  return (
    <Collapsible title="Data Surat Tugas" icon="document-text-outline">
      <Block label={`Pelaksana (${d.pelaksana.length})`}>
        {d.pelaksana.length === 0 ? (
          <Text style={{ color: c.muted, fontSize: 13 }}>Tidak ada pelaksana</Text>
        ) : (
          d.pelaksana.map((p, i) => (
            <Pressable
              key={p.id}
              style={s.person}
              accessibilityRole="button"
              accessibilityLabel={`Buka SPD ${p.nama}`}
              onPress={() => router.push({ pathname: '/spd/[id]', params: { id: String(p.id) } } as never)}
            >
              <Text style={[s.num, { color: c.muted }]}>{i + 1}.</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ color: c.link, fontSize: 13, fontWeight: '700' }}>{p.nama}</Text>
                <Text style={{ color: c.muted, fontSize: 12, lineHeight: 17 }}>
                  {[p.jabatan, p.bidang].filter(Boolean).join(' • ') || '-'}
                </Text>
                {p.nip ? <Text style={{ color: c.muted, fontSize: 11 }}>NIP {p.nip}</Text> : null}
              </View>
              <Ionicons name="chevron-forward" size={18} color={c.muted} />
            </Pressable>
          ))
        )}
      </Block>
      <Divider />
      <KV label="Berangkat" value={tanggal(d.tgl_berangkat)} />
      <KV label="Kembali" value={tanggal(d.tgl_kembali)} />
      <KV label="Lama perjalanan" value={hari ? `${hari} hari` : null} />
      <KV label="Tempat asal" value={d.asal} />
      <KV label="Tempat tujuan" value={daftarKota(tujuan)} />
      <KV label="Alat angkut" value={d.alat_angkut} />
      <Divider />
      {d.untuk ? (
        <Collapsible nested title="Uraian surat tugas" meta={d.untuk.split(/\r?\n/)[0]} defaultOpen={false}>
          <NumberedText text={d.untuk} kind="untuk" />
        </Collapsible>
      ) : null}
      {d.dasar ? (
        <Collapsible nested title="Dasar" meta={d.dasar.split(/\r?\n/)[0]} defaultOpen={false}>
          <NumberedText text={d.dasar} kind="dasar" />
        </Collapsible>
      ) : null}
      {d.akun ? (
        <Block label="Beban MAK">
          <Text style={{ color: c.text, fontSize: 13, lineHeight: 19 }}>
            {[d.akun.mak, d.akun.uraian].filter(Boolean).join(' - ') || '-'}
          </Text>
          {d.akun.kegiatan ? <Text style={{ color: c.muted, fontSize: 12, lineHeight: 17 }}>{d.akun.kegiatan}</Text> : null}
          {d.akun.sub_kegiatan ? <Text style={{ color: c.muted, fontSize: 12, lineHeight: 17 }}>{d.akun.sub_kegiatan}</Text> : null}
        </Block>
      ) : null}
      {d.penandatangan || d.ppk ? <Divider /> : null}
      {d.penandatangan ? (
        <Block label="Penandatangan">
          <Text style={{ color: c.text, fontSize: 13, fontWeight: '600' }}>{d.penandatangan.nama}</Text>
          {d.penandatangan.jabatan ? <Text style={{ color: c.muted, fontSize: 12 }}>{d.penandatangan.jabatan}</Text> : null}
        </Block>
      ) : null}
      {d.ppk?.nama ? (
        <Block label="PPK">
          <Text style={{ color: c.text, fontSize: 13, fontWeight: '600' }}>{d.ppk.nama}</Text>
          {d.ppk.jabatan ? <Text style={{ color: c.muted, fontSize: 12 }}>{d.ppk.jabatan}</Text> : null}
        </Block>
      ) : null}
    </Collapsible>
  );
}

// ------------------------------------------------------ Rincian biaya
function KwitansiBadge({ status }: { status: PelaksanaDetail['status_kwitansi'] }) {
  const { c } = useTheme();
  const col = status === 'Tersedia' ? c.status.terverifikasi : status === 'Kosong' ? c.status.diajukan : c.status.ditolak;
  return (
    <View style={[s.badge, { backgroundColor: col.bg }]}>
      <Text style={{ color: col.fg, fontSize: 10, fontWeight: '700' }}>{status}</Text>
    </View>
  );
}

function RincianRow({ r }: { r: RincianItem }) {
  const { c } = useTheme();
  const detail = [
    `${r.kuantitas} ${r.satuan ?? ''} × ${rupiah(r.nominal)}`.replace('  ', ' '),
    r.potongan > 0 ? `dihitung ${pct(r.potongan)}` : null,
    r.panjar > 0 ? `panjar ${rupiah(r.panjar)}` : null,
  ]
    .filter(Boolean)
    .join(' • ');
  return (
    <View style={{ gap: 2 }}>
      <View style={s.between}>
        <Text style={{ color: c.text, fontSize: 13, fontWeight: '600', flex: 1 }}>{r.jenis_rincian}</Text>
        <Text style={{ color: c.text, fontSize: 13, fontWeight: '700' }}>{rupiah(r.jumlah)}</Text>
      </View>
      <Text style={{ color: c.muted, fontSize: 11, lineHeight: 16 }}>{detail}</Text>
      {r.keterangan ? <Text style={{ color: c.muted, fontSize: 11, fontStyle: 'italic', lineHeight: 16 }}>{r.keterangan}</Text> : null}
    </View>
  );
}

function TotalRow({ label, value, minus, big }: { label: string; value: number; minus?: boolean; big?: boolean }) {
  const { c } = useTheme();
  return (
    <View style={s.between}>
      <Text style={{ color: big ? c.text : c.muted, fontSize: big ? 13 : 12, fontWeight: big ? '700' : '400' }}>{label}</Text>
      <Text style={{ color: big ? c.link : minus ? c.danger : c.text, fontSize: big ? 15 : 12, fontWeight: big ? '800' : '600' }}>
        {minus ? '− ' : ''}
        {rupiah(value)}
      </Text>
    </View>
  );
}

function PelaksanaBiaya({ p, open }: { p: PelaksanaDetail; open: boolean }) {
  const { c } = useTheme();
  const k = p.kwitansi;
  const kosong = p.rincian.length === 0 && p.riil.length === 0;

  return (
    <Collapsible
      nested
      defaultOpen={open}
      title={p.nama}
      meta={p.no_spt ?? undefined}
      right={<KwitansiBadge status={p.status_kwitansi} />}
    >
      {kosong ? (
        <Text style={{ color: c.danger, fontSize: 12, lineHeight: 17 }}>Belum ada rincian biaya untuk pelaksana ini.</Text>
      ) : (
        <>
          {p.rincian.map((r) => (
            <RincianRow key={`r${r.id}`} r={r} />
          ))}
          {p.riil.map((r) => (
            <View key={`l${r.id}`} style={{ gap: 2 }}>
              <View style={s.between}>
                <Text style={{ color: c.text, fontSize: 13, fontWeight: '600', flex: 1 }}>{r.uraian}</Text>
                <Text style={{ color: c.text, fontSize: 13, fontWeight: '700' }}>{rupiah(r.nominal)}</Text>
              </View>
              <Text style={{ color: c.muted, fontSize: 11 }}>Pengeluaran riil{r.keterangan ? ` • ${r.keterangan}` : ''}</Text>
            </View>
          ))}
          {k ? (
            <>
              <Divider />
              {k.total_riil > 0 ? <TotalRow label="Rincian" value={k.total_rincian} /> : null}
              {k.total_riil > 0 ? <TotalRow label="Riil" value={k.total_riil} /> : null}
              <TotalRow label="Total" value={k.total} big={p.total_panjar <= 0} />
              {p.total_panjar > 0 ? <TotalRow label="Panjar" value={p.total_panjar} minus /> : null}
              {p.total_panjar > 0 ? <TotalRow label="Sisa dibayar" value={p.sisa_dibayar} big /> : null}
            </>
          ) : null}
        </>
      )}
    </Collapsible>
  );
}

export function RincianBiaya({ d }: { d: SptDetail }) {
  return (
    <Collapsible title="Rincian Pembayaran" icon="wallet-outline" meta="Per pelaksana">
      {d.pelaksana.length === 0 ? (
        <Text style={{ fontSize: 13 }}>Belum ada data SPD.</Text>
      ) : (
        d.pelaksana.map((p) => <PelaksanaBiaya key={p.id} p={p} open={d.pelaksana.length === 1} />)
      )}
    </Collapsible>
  );
}

// ------------------------------------------------------ Hotel & tiket
function Line({ icon, label, value }: { icon?: IconName; label: string; value?: string | null }) {
  const { c } = useTheme();
  if (!value) return null;
  return (
    <View style={s.line}>
      <Text style={{ color: c.muted, fontSize: 11, width: 82 }}>{label}</Text>
      <Text style={{ color: c.text, fontSize: 12, flex: 1, lineHeight: 17 }}>{value}</Text>
    </View>
  );
}

function HotelBox({ h }: { h: HotelInfo }) {
  const { c } = useTheme();
  return (
    <View style={[s.mini, { borderColor: c.border, backgroundColor: c.bg }]}>
      <View style={s.miniHead}>
        <Ionicons name="bed-outline" size={15} color={c.link} />
        <Text style={{ color: c.text, fontSize: 13, fontWeight: '700', flex: 1 }}>{h.nama_hotel}</Text>
      </View>
      <Line label="No. bill" value={h.nomor_bill} />
      <Line label="Kamar" value={h.nomor_kamar} />
      <Line label="Check-in" value={h.tgl_masuk ? tanggal(h.tgl_masuk) : null} />
      <Line label="Check-out" value={h.tgl_keluar ? tanggal(h.tgl_keluar) : null} />
      <Line label="Alamat" value={h.alamat_hotel} />
      <Line label="Telepon" value={h.no_telp_hotel} />
      <Line label="Email" value={h.email_hotel} />
    </View>
  );
}

function TiketBox({ t }: { t: TiketInfo }) {
  const { c } = useTheme();
  const jam = [t.jam_berangkat, t.jam_sampai_tujuan].filter(Boolean).join(' – ');
  const rute = [t.asal_tiket, t.tujuan_tiket].filter(Boolean).join(' → ');
  return (
    <View style={[s.mini, { borderColor: c.border, backgroundColor: c.bg }]}>
      <View style={s.miniHead}>
        <Ionicons name="airplane-outline" size={15} color={c.link} />
        <Text style={{ color: c.text, fontSize: 13, fontWeight: '700', flex: 1 }}>{t.nama_maskapai}</Text>
      </View>
      <Line label="Rute" value={rute} />
      <Line label="Tanggal" value={t.tanggal_tiket ? tanggal(t.tanggal_tiket) : null} />
      <Line label="Jam" value={jam} />
      <Line label="Penerbangan" value={t.nomor_penerbangan} />
      <Line label="Kode booking" value={t.kode_booking} />
      <Line label="No. tiket" value={t.nomor_tiket} />
      <Line label="Kursi" value={t.tempat_duduk} />
    </View>
  );
}

export function HotelTiket({ d }: { d: SptDetail }) {
  const { c } = useTheme();
  const rows = d.pelaksana
    .map((p) => ({
      p,
      hotels: p.rincian.map((r) => r.hotel).filter((h): h is HotelInfo => !!h?.nama_hotel),
      tikets: p.rincian.map((r) => r.tiket).filter((t): t is TiketInfo => !!t?.nama_maskapai),
    }))
    .filter((x) => x.hotels.length || x.tikets.length);

  if (rows.length === 0) return null;

  return (
    <Collapsible title="Hotel & Tiket" icon="bed-outline" meta="Per pelaksana" defaultOpen={false}>
      {rows.map(({ p, hotels, tikets }) => (
        <View key={p.id} style={{ gap: 8 }}>
          <Text style={{ color: c.text, fontSize: 13, fontWeight: '700' }}>{p.nama}</Text>
          {hotels.map((h, i) => (
            <HotelBox key={`h${i}`} h={h} />
          ))}
          {tikets.map((t, i) => (
            <TiketBox key={`t${i}`} t={t} />
          ))}
        </View>
      ))}
    </Collapsible>
  );
}

// ------------------------------------------------------ Riwayat
type Step = { icon: IconName; title: string; sub?: string; tone: 'ok' | 'bad' | 'wait' | 'pending'; extra?: string };

export function Riwayat({ d }: { d: SptDetail }) {
  const { c } = useTheme();
  const code = d.status.code;
  const pembuat = d.pembuat?.nama;

  const steps: Step[] = [
    { icon: 'create-outline', title: 'Surat tugas dibuat', sub: [pembuat, tanggal(d.tgl_spt)].filter((x) => x && x !== '-').join(' • '), tone: 'ok' },
  ];
  if (code === 'draft') {
    steps.push({ icon: 'time-outline', title: 'Belum diajukan', sub: 'Menunggu pengajuan ke verifikator', tone: 'pending' });
  } else {
    steps.push({
      icon: 'paper-plane-outline',
      title: 'Diajukan ke verifikator',
      sub: [pembuat, d.diajukan_at ? waktu(d.diajukan_at) : null].filter(Boolean).join(' • ') || undefined,
      tone: 'ok',
    });
    if (code === 'diajukan') steps.push({ icon: 'time-outline', title: 'Menunggu verifikasi', tone: 'wait' });
    if (code === 'terverifikasi')
      steps.push({ icon: 'checkmark', title: 'Diverifikasi', sub: d.diverifikasi_at ? waktu(d.diverifikasi_at) : undefined, tone: 'ok' });
    if (code === 'ditolak')
      steps.push({ icon: 'close', title: 'Ditolak', sub: d.diverifikasi_at ? waktu(d.diverifikasi_at) : undefined, tone: 'bad', extra: d.alasan ?? undefined });
  }

  const tone = (t: Step['tone']) =>
    t === 'ok' ? c.status.terverifikasi : t === 'bad' ? c.status.ditolak : t === 'wait' ? c.status.diajukan : c.status.draft;

  return (
    <Collapsible title="Riwayat Persetujuan" icon="git-commit-outline">
      {steps.map((st, i) => {
        const col = tone(st.tone);
        return (
          <View key={i} style={s.step}>
            <View style={[s.dot, { backgroundColor: col.bg }]}>
              <Ionicons name={st.tone === 'ok' && i > 1 ? 'checkmark' : st.icon} size={15} color={col.fg} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: c.text, fontSize: 13, fontWeight: '700' }}>{st.title}</Text>
              {st.sub ? <Text style={{ color: c.muted, fontSize: 11, marginTop: 1 }}>{st.sub}</Text> : null}
              {st.extra ? (
                <Text style={{ color: c.danger, fontSize: 12, lineHeight: 17, marginTop: 4 }}>Alasan: {st.extra}</Text>
              ) : null}
            </View>
          </View>
        );
      })}
    </Collapsible>
  );
}

// ------------------------------------------------------ Dokumen
function fileName(url: string, fallback: string) {
  try {
    const n = decodeURIComponent(url.split('?')[0].split('/').pop() || '');
    return n || fallback;
  } catch {
    return fallback;
  }
}

export function Dokumen({ d }: { d: SptDetail }) {
  const { c } = useTheme();
  const docs: { title: string; url: string }[] = [];
  if (d.file_spt_url) docs.push({ title: 'Surat Tugas', url: d.file_spt_url });
  (d.file_spd_urls ?? []).forEach((u, i) =>
    docs.push({ title: (d.file_spd_urls.length > 1 ? `SPD ${i + 1}` : 'Surat Perjalanan Dinas'), url: u }),
  );

  const open = (url: string) =>
    Linking.openURL(url).catch(() => Alert.alert('Tidak dapat membuka', 'Berkas tidak dapat dibuka dari perangkat ini.'));

  return (
    <Collapsible title="Dokumen Perjalanan" icon="folder-open-outline">
      {docs.length === 0 ? (
        <Text style={{ color: c.muted, fontSize: 13 }}>Belum ada dokumen yang diunggah.</Text>
      ) : (
        docs.map((f, i) => (
          <View key={f.url}>
            {i > 0 ? <View style={{ height: 11 }} /> : null}
            <Pressable accessibilityRole="button" onPress={() => open(f.url)} style={({ pressed }) => [s.doc, pressed && { opacity: 0.7 }]}>
              <Ionicons name="document-text-outline" size={22} color={c.link} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: c.text, fontSize: 13, fontWeight: '700' }}>{f.title}</Text>
                <Text style={{ color: c.muted, fontSize: 11 }} numberOfLines={1}>
                  {fileName(f.url, 'berkas.pdf')}
                </Text>
              </View>
              <Ionicons name="download-outline" size={20} color={c.link} />
            </Pressable>
          </View>
        ))
      )}
    </Collapsible>
  );
}

const s = StyleSheet.create({
  person: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6 },
  num: { fontSize: 13, width: 18 },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  badge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  mini: { borderWidth: 1, borderRadius: 12, padding: 11, gap: 5 },
  miniHead: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 3 },
  line: { flexDirection: 'row', gap: 8 },
  step: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  dot: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  doc: { flexDirection: 'row', alignItems: 'center', gap: 12 },
});
