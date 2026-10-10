// Warna diambil dari desain Figma Beranda (terang & gelap) + logo DinasTrip.
const light = {
  bg: '#F5F8FC',
  card: '#FFFFFF',
  border: '#DCE6F0',
  text: '#10243A',
  muted: '#5F7186',
  primary: '#0068B8',
  onPrimary: '#FFFFFF',
  accent: '#14A0FF',
  link: '#0068B8',
  inputBg: '#FFFFFF',
  tint: '#EAF4FC',
  danger: '#B3261E',
  dangerBg: '#FDECEA',
  status: {
    draft: { bg: '#EDF1F5', fg: '#5A6B80' },
    diajukan: { bg: '#FFF4DC', fg: '#8A5A00' },
    terverifikasi: { bg: '#E3F4EC', fg: '#197955' },
    ditolak: { bg: '#FDE8E6', fg: '#B3382E' },
  },
};

export type Palette = typeof light;

const dark: Palette = {
  bg: '#0C1622',
  card: '#142332',
  border: '#22364A',
  text: '#EAF2FB',
  muted: '#9DA9B6',
  primary: '#0068B8',
  onPrimary: '#FFFFFF',
  accent: '#4CB8FF',
  link: '#4DB0F5',
  inputBg: '#0F1C2B',
  tint: '#19364C',
  danger: '#FF8A80',
  dangerBg: '#3A1A1C',
  status: {
    draft: { bg: '#22344B', fg: '#C3D1E0' },
    diajukan: { bg: '#3B2E14', fg: '#F2C265' },
    terverifikasi: { bg: '#12342A', fg: '#7ADCB0' },
    ditolak: { bg: '#3D1C1E', fg: '#F08A82' },
  },
};

export const palettes = { light, dark };
