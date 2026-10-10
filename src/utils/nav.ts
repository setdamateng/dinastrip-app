/** Tujuan navigasi ke layar detail perjalanan (SPT). */
export const sptHref = (id: string | number) => ({ pathname: '/spt/[id]', params: { id: String(id) } }) as never;
