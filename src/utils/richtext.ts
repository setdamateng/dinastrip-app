/**
 * Konversi ringan antara HTML (kolom laporan di web, hasil RichEditor) dan teks bertanda
 * yang mudah diketik di ponsel:  **tebal**  _miring_  ++garis bawah++,  "- " butir,  "1. " nomor.
 */
const decode = (s: string) =>
  s
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&amp;/g, '&');

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function htmlToMd(html?: string | null): string {
  let t = html ?? '';
  if (!t.trim()) return '';
  if (t === t.replace(/<[^>]+>/g, '')) return decode(t).trim();

  const items = (inner: string, num: boolean) => {
    let n = 0;
    return (
      '\n' +
      inner.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_m, x: string) => `${num ? `${++n}.` : '-'} ${x.replace(/<\/?p[^>]*>/gi, '').trim()}\n`) +
      '\n'
    );
  };
  t = t.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (_m, i: string) => items(i, true));
  t = t.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, (_m, i: string) => items(i, false));
  t = t
    .replace(/<(strong|b)(\s[^>]*)?>([\s\S]*?)<\/\1>/gi, '**$3**')
    .replace(/<(em|i)(\s[^>]*)?>([\s\S]*?)<\/\1>/gi, '_$3_')
    .replace(/<u(\s[^>]*)?>([\s\S]*?)<\/u>/gi, '++$2++')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h\d|blockquote)>/gi, '\n')
    .replace(/<[^>]+>/g, '');
  return decode(t).replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}

const inline = (s: string) =>
  esc(s)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\+\+(.+?)\+\+/g, '<u>$1</u>')
    .replace(/(^|[\s(])_([^_\n]+?)_(?=[\s.,;:)!?]|$)/g, '$1<em>$2</em>');

export function mdToHtml(text: string): string {
  const lines = text.replace(/\r/g, '').split('\n');
  const out: string[] = [];
  let list: { tag: 'ul' | 'ol'; items: string[] } | null = null;
  const flush = () => {
    if (list) {
      out.push(`<${list.tag}>${list.items.map((i) => `<li>${i}</li>`).join('')}</${list.tag}>`);
      list = null;
    }
  };
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      flush();
      continue;
    }
    const num = line.match(/^\d+[.)]\s+(.*)$/);
    const bul = line.match(/^[-•*]\s+(.*)$/);
    if (num || bul) {
      const tag = num ? 'ol' : 'ul';
      if (!list || list.tag !== tag) {
        flush();
        list = { tag, items: [] };
      }
      list.items.push(inline((num ?? bul)![1]));
    } else {
      flush();
      out.push(`<p>${inline(line)}</p>`);
    }
  }
  flush();
  return out.join('');
}
