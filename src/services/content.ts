import { api } from './api';

export type InfoSlug = 'kebijakan-privasi' | 'bantuan-panduan';
export type InfoDoc = { slug: InfoSlug; title: string; text: string; updated_at: string };

export const contentService = {
  async get(slug: InfoSlug): Promise<InfoDoc> {
    return (await api.get<InfoDoc>(`/content/${slug}`, undefined, { auth: false })).data;
  },
};
