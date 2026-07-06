import { LANGUAGES } from '../languages';
import { Language } from '../types';

type Props = {
  value: Language;
  onChange: (lang: Language) => void;
  label: string;
  speaker: 'A' | 'B';
  disabled?: boolean;
};

export function LanguageSelector({ value, onChange, label, speaker, disabled }: Props) {
  const isA = speaker === 'A';

  return (
    <div className={`flex flex-col items-center gap-2 ${isA ? '' : ''}`}>
      <span className={`text-xs font-bold uppercase tracking-widest ${
        isA ? 'text-blue-400' : 'text-emerald-400'
      }`}>
        {label}
      </span>
      <div className="relative">
        <select
          value={value.code}
          onChange={e => {
            const found = LANGUAGES.find(l => l.code === e.target.value);
            if (found) onChange(found);
          }}
          disabled={disabled}
          className={`
            appearance-none bg-slate-800 border rounded-xl px-4 py-2 pr-8 text-sm font-medium
            focus:outline-none focus:ring-2 transition-all cursor-pointer
            disabled:opacity-50 disabled:cursor-not-allowed
            ${isA
              ? 'border-blue-500/40 text-blue-100 focus:ring-blue-500/50 focus:border-blue-500'
              : 'border-emerald-500/40 text-emerald-100 focus:ring-emerald-500/50 focus:border-emerald-500'
            }
          `}
        >
          {LANGUAGES.map(lang => (
            <option key={lang.code} value={lang.code}>
              {lang.flag} {lang.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2">
          <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  );
}
