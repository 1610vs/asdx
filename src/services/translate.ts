/**
 * Translation via MyMemory API (free, no key needed for low volume)
 * Fallback: LibreTranslate public instance
 */

const MYMEMORY_URL = 'https://api.mymemory.translated.net/get';

export async function translateText(
  text: string,
  from: string,
  to: string,
): Promise<string> {
  if (!text.trim()) return '';
  if (from === to) return text;

  try {
    const url = new URL(MYMEMORY_URL);
    url.searchParams.set('q', text);
    url.searchParams.set('langpair', `${from}|${to}`);

    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json() as {
      responseStatus: number;
      responseData: { translatedText: string };
    };

    if (data.responseStatus === 200 && data.responseData?.translatedText) {
      return data.responseData.translatedText;
    }
    throw new Error('Bad response from MyMemory');
  } catch (err) {
    console.error('Translation error:', err);
    throw err;
  }
}
