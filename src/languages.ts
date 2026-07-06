import { Language } from './types';

export const LANGUAGES: Language[] = [
  { code: 'ru-RU', translateCode: 'ru', label: 'Русский',    flag: '⚪' },
  { code: 'en-US', translateCode: 'en', label: 'English',    flag: '🇺🇸' },
  { code: 'en-GB', translateCode: 'en', label: 'English UK', flag: '🇬🇧' },
  { code: 'de-DE', translateCode: 'de', label: 'Deutsch',    flag: '🇩🇪' },
  { code: 'fr-FR', translateCode: 'fr', label: 'Français',   flag: '🇫🇷' },
  { code: 'es-ES', translateCode: 'es', label: 'Español',    flag: '🇪🇸' },
  { code: 'it-IT', translateCode: 'it', label: 'Italiano',   flag: '🇮🇹' },
  { code: 'pt-BR', translateCode: 'pt', label: 'Português',  flag: '🇧🇷' },
  { code: 'zh-CN', translateCode: 'zh', label: '中文',        flag: '🇨🇳' },
  { code: 'ja-JP', translateCode: 'ja', label: '日本語',      flag: '🇯🇵' },
  { code: 'ko-KR', translateCode: 'ko', label: '한국어',      flag: '🇰🇷' },
  { code: 'ar-SA', translateCode: 'ar', label: 'العربية',    flag: '🇸🇦' },
  { code: 'tr-TR', translateCode: 'tr', label: 'Türkçe',     flag: '🇹🇷' },
  { code: 'pl-PL', translateCode: 'pl', label: 'Polski',     flag: '🇵🇱' },
  { code: 'uk-UA', translateCode: 'uk', label: 'Українська', flag: '🇺🇦' },
  { code: 'nl-NL', translateCode: 'nl', label: 'Nederlands', flag: '🇳🇱' },
  { code: 'sv-SE', translateCode: 'sv', label: 'Svenska',    flag: '🇸🇪' },
  { code: 'fi-FI', translateCode: 'fi', label: 'Suomi',      flag: '🇫🇮' },
  { code: 'hi-IN', translateCode: 'hi', label: 'हिन्दी',      flag: '🇮🇳' },
  { code: 'he-IL', translateCode: 'he', label: 'עברית',      flag: '🇮🇱' },
  { code: 'ro-RO', translateCode: 'ro', label: 'Română',     flag: '🇷🇴' },
  { code: 'lt-LT', translateCode: 'lt', label: 'Lietuvių',   flag: '🇱🇹' },
  { code: 'hu-HU', translateCode: 'hu', label: 'Magyar',     flag: '🇭🇺' },
  { code: 'el-GR', translateCode: 'el', label: 'Ελληνικά',   flag: '🇬🇷' },
];

export function getLang(code: string): Language {
  return LANGUAGES.find(l => l.code === code) ?? LANGUAGES[0];
}
