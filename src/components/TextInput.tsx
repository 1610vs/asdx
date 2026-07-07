import { useState, useRef, useEffect } from 'react';
import { Language } from '../types';

type Props = {
  speaker: 'A' | 'B';
  language: Language;
  onSubmit: (text: string) => void;
  onCancel: () => void;
};

export function TextInput({ speaker, language, onSubmit, onCancel }: Props) {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSubmit = () => {
    if (text.trim()) {
      onSubmit(text);
      setText('');
    }
  };

  const isA = speaker === 'A';

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-slate-800 rounded-3xl border border-slate-700 w-full max-w-lg shadow-2xl">
        
        {/* Header */}
        <div className={`px-5 py-4 border-b border-slate-700/60 ${
          isA ? 'bg-blue-500/10' : 'bg-emerald-500/10'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                isA ? 'bg-blue-500/20 text-blue-400' : 'bg-emerald-500/20 text-emerald-400'
              }`}>
                {speaker}
              </span>
              <div>
                <h3 className="font-semibold text-white">Говорящий {speaker}</h3>
                <p className="text-xs text-slate-400">{language.flag} {language.label}</p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="p-2 rounded-xl hover:bg-slate-700 transition-colors"
            >
              <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Textarea */}
        <div className="p-5">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder="Введите текст для перевода..."
            className="w-full bg-slate-900/50 border border-slate-700 rounded-2xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 min-h-[120px] resize-none"
            autoFocus
          />
          <p className="text-xs text-slate-500 mt-2">
            Enter — отправить · Shift+Enter — новая строка
          </p>
        </div>

        {/* Buttons */}
        <div className="px-5 pb-5 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-medium transition-colors"
          >
            Отмена
          </button>
          <button
            onClick={handleSubmit}
            disabled={!text.trim()}
            className={`flex-1 py-3 rounded-xl font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
              isA
                ? 'bg-blue-600 hover:bg-blue-500 text-white'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            Перевести
          </button>
        </div>
      </div>
    </div>
  );
}
