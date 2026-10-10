export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/+$/, '');

if (!API_URL && __DEV__) {
  console.warn('EXPO_PUBLIC_API_URL belum diisi. Salin .env.example menjadi .env lalu restart expo (npx expo start -c).');
}
