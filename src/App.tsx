import { useState, useCallback, useRef, useEffect } from 'react';
import { AppState, Turn, Language } from './types';
import { getLang } from './languages';
import { translateText } from './services/translate';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';
import { useTTS } from './hooks/useTTS';
import { WaveformAnimation } from './components/WaveformAnimation';
import { LanguageSelector } from './components/LanguageSelector';
import { TurnCard } from './components/TurnCard';
import { TextInput } from './components/TextInput';

const DEFAULT_LANG_A = getLang('ru-RU');
const DEFAULT_LANG_B = getLang('en-US');

export default function App() {
  const [langA, setLangA] = useState<Language>(DEFAULT_LANG_A);
  const [langB, setLangB] = useState<Language>(DEFAULT_LANG_B);
  const [appState, setAppState] = useState<AppState>('idle');
  const [turns, setTurns] = useState<Turn[]>([]);
  const [interimText, setInterimText] = useState('');
  const [statusMsg, setStatusMsg] = useState('Нажмите кнопку говорящего');
  const [errorMsg, setErrorMsg] = useState('');
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [ttsRate, setTtsRate] = useState(0.95);
  const [showSettings, setShowSettings] = useState(false);
  const [inputMode, setInputMode] = useState<'voice' | 'text'>('voice');
  const [showTextInput, setShowTextInput] = useState(false);
  const [pendingSpeaker, setPendingSpeaker] = useState<'A' | 'B' | null>(null);

  const currentSpeakerRef = useRef<'A' | 'B'>('A');
  const transcriptRef = useRef('');
  const historyRef = useRef<HTMLDivElement>(null);

  const { isSupported: asrSupported, isListening, startListening, stopListening } = useSpeechRecognition();
  const { isSupported: ttsSupported, speak, stop: stopTTS } = useTTS();

  const isSecure = typeof window !== 'undefined' && (
    window.location.protocol === 'https:' || window.location.hostname === 'localhost'
  );

  useEffect(() => {
    if (historyRef.current) {
      historyRef.current.scrollTop = historyRef.current.scrollHeight;
    }
  }, [turns, interimText]);

  useEffect(() => {
    if (!asrSupported && inputMode === 'voice') {
      setInputMode('text');
      setStatusMsg('Голосовой ввод недоступен. Используйте текстовый ввод.');
    }
  }, [asrSupported, inputMode]);

  const processTranscript = useCallback(async (
    text: string,
    speaker: 'A' | 'B',
  ) => {
    if (!text.trim()) {
      setAppState('idle');
      setStatusMsg('Нажмите кнопку говорящего');
      return;
    }

    setAppState('processing');
    setStatusMsg('Перевожу...');
    setErrorMsg('');

    const fromLang = speaker === 'A' ? langA : langB;
    const toLang = speaker === 'A' ? langB : langA;

    try {
      const translated = await translateText(
        text,
        fromLang.translateCode,
        toLang.translateCode,
      );

      const newTurn: Turn = {
        id: crypto.randomUUID(),
        speaker,
        original: text,
        translated,
        langFrom: fromLang.code,
        langTo: toLang.code,
        timestamp: new Date(),
      };

      setTurns(prev => [...prev, newTurn]);
      setInterimText('');

      if (autoSpeak && ttsSupported) {
        setAppState('speaking');
        setStatusMsg(`Говорю: ${toLang.flag} ${toLang.label}`);
        speak(translated, toLang.code, () => {
          setAppState('idle');
          setStatusMsg('Нажмите кнопку говорящего');
        }, ttsRate);
      } else {
        setAppState('idle');
        setStatusMsg('Нажмите кнопку говорящего');
      }
    } catch (err) {
      console.error('Translation error:', err);
      setErrorMsg('Ошибка перевода. Проверьте интернет.');
      setAppState('idle');
      setStatusMsg('Нажмите кнопку говорящего');
    }
  }, [langA, langB, autoSpeak, ttsSupported, speak, ttsRate]);

  const startSpeaking = useCallback((speaker: 'A' | 'B') => {
    if (appState !== 'idle') return;

    if (inputMode === 'text' || !asrSupported) {
      setPendingSpeaker(speaker);
      setShowTextInput(true);
      return;
    }

    currentSpeakerRef.current = speaker;
    transcriptRef.current = '';
    setInterimText('');
    setErrorMsg('');

    const lang = speaker === 'A' ? langA : langB;
    setAppState(speaker === 'A' ? 'listening_a' : 'listening_b');
    setStatusMsg(`Слушаю ${lang.flag} ${lang.label}...`);

    startListening({
      lang: lang.code,
      continuous: false,
      onResult: ({ transcript, isFinal }) => {
        if (isFinal) {
          transcriptRef.current = transcript;
          setInterimText('');
        } else {
          setInterimText(transcript);
        }
      },
      onEnd: () => {
        const text = transcriptRef.current;
        processTranscript(text, currentSpeakerRef.current);
      },
      onError: (err) => {
        setErrorMsg(
          err === 'not-allowed'
            ? '🔒 Нет доступа к микрофону. Разрешите в настройках браузера.'
            : err === 'no-speech'
              ? '🔇 Речь не обнаружена. Попробуйте ещё раз.'
              : `Ошибка: ${err}`,
        );
        setAppState('idle');
        setStatusMsg('Нажмите кнопку говорящего');
        setInterimText('');
      },
    });
  }, [appState, inputMode, asrSupported, langA, langB, startListening, processTranscript]);

  const handleTextSubmit = useCallback((text: string) => {
    setShowTextInput(false);
    setPendingSpeaker(null);
    processTranscript(text, pendingSpeaker ?? currentSpeakerRef.current);
  }, [pendingSpeaker, processTranscript]);

  const handleTextCancel = useCallback(() => {
    setShowTextInput(false);
    setPendingSpeaker(null);
    setErrorMsg('');
    setAppState('idle');
    setStatusMsg('Нажмите кнопку говорящего');
  }, []);

  const handleStop = useCallback(() => {
    if (appState === 'listening_a' || appState === 'listening_b') {
      stopListening();
    } else if (appState === 'speaking') {
      stopTTS();
      setAppState('idle');
      setStatusMsg('Нажмите кнопку говорящего');
    } else if (showTextInput) {
      setShowTextInput(false);
      setPendingSpeaker(null);
      setStatusMsg('Нажмите кнопку говорящего');
    }
  }, [appState, showTextInput, stopListening, stopTTS]);

  const replayTurn = useCallback((turn: Turn) => {
    if (appState !== 'idle') return;
    if (!ttsSupported) return;
    setAppState('speaking');
    setStatusMsg('Повтор...');
    speak(turn.translated, turn.langTo, () => {
      setAppState('idle');
      setStatusMsg('Нажмите кнопку говорящего');
    }, ttsRate);
  }, [appState, ttsSupported, speak, ttsRate]);

  const swapLanguages = useCallback(() => {
    if (appState !== 'idle') return;
    setLangA(langB);
    setLangB(langA);
  }, [appState, langA, langB]);

  const clearHistory = useCallback(() => {
    setTurns([]);
    setInterimText('');
  }, []);

  const isBusy = appState !== 'idle';

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col select-none">
      <header className="flex items-center justify-between px-4 pt-safe-top pt-3 pb-3 border-b border-slate-700/60 bg-slate-900/90 backdrop-blur sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🌐</span>
          <div>
            <h1 className="text-base font-bold leading-tight">VoiceTranslator</h1>
            <p className="text-[10px] text-slate-400 leading-tight">По очереди · Без разделения голосов</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={clearHistory}
            disabled={isBusy || turns.length === 0}
            className="p-2 rounded-xl hover:bg-slate-700 disabled:opacity-30 transition-colors"
            title="Очистить историю"
          >
            <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
          <button
            onClick={() => setShowSettings(s => !s)}
            className={`p-2 rounded-xl hover:bg-slate-700 transition-colors ${showSettings ? 'bg-slate-700' : ''}`}
            title="Настройки"
          >
            <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </header>

      {showSettings && (
        <div className="bg-slate-800/90 border-b border-slate-700/60 px-4 py-3 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-300">Автоговорение перевода</span>
            <button
              onClick={() => setAutoSpeak(v => !v)}
              className={`relative inline-flex h-6 w-11 rounded-full transition-colors ${
                autoSpeak ? 'bg-blue-600' : 'bg-slate-600'
              }`}
            >
              <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform mt-0.5 ${
                autoSpeak ? 'translate-x-5' : 'translate-x-0.5'
              }`} />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-300 whitespace-nowrap">Скорость речи</span>
            <input
              type="range" min={0.5} max={1.5} step={0.05}
              value={ttsRate}
              onChange={e => setTtsRate(+e.target.value)}
              className="flex-1 accent-blue-500"
            />
            <span className="text-sm text-slate-400 w-8 text-right">{ttsRate.toFixed(2)}</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-slate-300 whitespace-nowrap">Режим ввода</span>
            <div className="flex rounded-xl border border-slate-700 overflow-hidden">
              <button
                onClick={() => setInputMode('voice')}
                disabled={!asrSupported}
                className={`px-3 py-2 text-sm transition-colors ${
                  inputMode === 'voice' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300'
                } ${!asrSupported ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Голос
              </button>
              <button
                onClick={() => setInputMode('text')}
                className={`px-3 py-2 text-sm transition-colors ${
                  inputMode === 'text' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300'
                }`}
              >
                Текст
              </button>
            </div>
          </div>

          {!isSecure && (
            <p className="text-xs text-amber-400">
              ⚠️ Для голосового ввода нужен HTTPS или localhost.
            </p>
          )}
          {!asrSupported && (
            <p className="text-xs text-amber-400">
              ⚠️ Web Speech API не поддерживается в этом браузере. Используйте Chrome или Safari.
            </p>
          )}
          {!ttsSupported && (
            <p className="text-xs text-amber-400">⚠️ TTS не поддерживается.</p>
          )}
          <p className="text-xs text-slate-500">Перевод: MyMemory API (бесплатно, до ~100 запросов/день без ключа)</p>
        </div>
      )}

      <div className="flex items-center justify-center gap-3 px-4 py-3 bg-slate-800/50 border-b border-slate-700/40">
        <LanguageSelector
          value={langA}
          onChange={setLangA}
          label="Говорящий A"
          speaker="A"
          disabled={isBusy}
        />

        <button
          onClick={swapLanguages}
          disabled={isBusy}
          className="p-2 rounded-xl bg-slate-700 hover:bg-slate-600 disabled:opacity-40 transition-all active:scale-95"
          title="Поменять местами"
        >
          <svg className="w-5 h-5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        </button>

        <LanguageSelector
          value={langB}
          onChange={setLangB}
          label="Говорящий B"
          speaker="B"
          disabled={isBusy}
        />
      </div>

      <div
        ref={historyRef}
        className="flex-1 overflow-y-auto px-4 py-3 space-y-1"
        style={{ minHeight: 0 }}
      >
        {turns.length === 0 && !interimText && (
          <div className="flex flex-col items-center justify-center h-full gap-4 py-10 text-center">
            <div className="text-6xl">🎙️</div>
            <div>
              <p className="text-slate-400 text-sm">Нажмите на кнопку говорящего</p>
              <p className="text-slate-500 text-xs mt-1">Говорите — переводчик слушает и переводит</p>
            </div>
            <div className="flex flex-col gap-2 text-xs text-slate-600 max-w-xs">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-[10px]">A</span>
                <span>Нажмите 🎤 A → говорите → переводится на язык B</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px]">B</span>
                <span>Нажмите 🎤 B → говорите → переводится на язык A</span>
              </div>
            </div>
          </div>
        )}

        {turns.map(turn => (
          <TurnCard key={turn.id} turn={turn} onReplay={replayTurn} />
        ))}

        {interimText && (
          <div className={`flex ${currentSpeakerRef.current === 'A' ? 'justify-start' : 'justify-end'} mb-2`}>
            <div className={`
              max-w-[85%] rounded-2xl px-4 py-2 border border-dashed text-sm italic
              ${currentSpeakerRef.current === 'A'
                ? 'border-blue-500/40 text-blue-300/70 bg-blue-950/30 rounded-tl-sm'
                : 'border-emerald-500/40 text-emerald-300/70 bg-emerald-950/30 rounded-tr-sm'
              }
            `}>
              {interimText}
              <span className="inline-block ml-1 animate-pulse">▌</span>
            </div>
          </div>
        )}
      </div>

      <div className="px-4 py-2 bg-slate-800/60 border-t border-slate-700/40">
        <WaveformAnimation
          isActive={isListening}
          color={currentSpeakerRef.current === 'A' ? '#60a5fa' : '#34d399'}
          bars={20}
        />

        <div className="text-center mt-1 mb-2 min-h-[20px]">
          {errorMsg ? (
            <p className="text-xs text-red-400">{errorMsg}</p>
          ) : (
            <p className={`text-xs transition-all ${
              appState === 'processing' ? 'text-yellow-400 animate-pulse' :
              appState === 'speaking'   ? 'text-purple-400 animate-pulse' :
              isListening               ? 'text-blue-400 animate-pulse' :
              'text-slate-500'
            }`}>
              {appState === 'processing' && '⚙️ '}
              {appState === 'speaking'   && '🔊 '}
              {isListening               && '🎙️ '}
              {statusMsg}
            </p>
          )}
        </div>
      </div>

      <div className="px-4 pb-safe-bottom pb-6 pt-4 bg-slate-900 border-t border-slate-700/60">
        {isBusy && (
          <div className="flex justify-center mb-4">
            <button
              onClick={handleStop}
              className="flex items-center gap-2 px-6 py-2 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 text-sm font-medium hover:bg-red-500/30 active:scale-95 transition-all"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
              {appState === 'speaking' ? 'Остановить речь' : 'Готово / Стоп'}
            </button>
          </div>
        )}

        <div className="flex gap-4 justify-center">
          <button
            onClick={() => {
              if (appState === 'listening_a') {
                handleStop();
              } else {
                startSpeaking('A');
              }
            }}
            disabled={isBusy && appState !== 'listening_a'}
            className={`
              flex-1 max-w-[160px] flex flex-col items-center gap-2 py-5 rounded-3xl border-2 font-semibold
              transition-all active:scale-95 shadow-lg
              ${appState === 'listening_a'
                ? 'bg-blue-600 border-blue-400 shadow-blue-500/30 scale-[1.03]'
                : 'bg-slate-800 border-blue-500/40 hover:border-blue-500/70 hover:bg-slate-700/80'
              }
              ${isBusy && appState !== 'listening_a' ? 'opacity-40 pointer-events-none' : ''}
            `}
          >
            <div className={`w-14 h-14 rounded-full flex items-center justify-center text-3xl
              ${appState === 'listening_a' ? 'bg-blue-500/30 animate-pulse' : 'bg-slate-700'}
            `}>
              🎤
            </div>
            <span className="text-blue-400 text-xs font-bold tracking-widest uppercase">
              {appState === 'listening_a' ? 'Стоп' : 'Говорящий A'}
            </span>
            <span className="text-slate-400 text-xs">{langA.flag} {langA.label}</span>
          </button>

          <button
            onClick={() => {
              if (appState === 'listening_b') {
                handleStop();
              } else {
                startSpeaking('B');
              }
            }}
            disabled={isBusy && appState !== 'listening_b'}
            className={`
              flex-1 max-w-[160px] flex flex-col items-center gap-2 py-5 rounded-3xl border-2 font-semibold
              transition-all active:scale-95 shadow-lg
              ${appState === 'listening_b'
                ? 'bg-emerald-600 border-emerald-400 shadow-emerald-500/30 scale-[1.03]'
                : 'bg-slate-800 border-emerald-500/40 hover:border-emerald-500/70 hover:bg-slate-700/80'
              }
              ${isBusy && appState !== 'listening_b' ? 'opacity-40 pointer-events-none' : ''}
            `}
          >
            <div className={`w-14 h-14 rounded-full flex items-center justify-center text-3xl
              ${appState === 'listening_b' ? 'bg-emerald-500/30 animate-pulse' : 'bg-slate-700'}
            `}>
              🎤
            </div>
            <span className="text-emerald-400 text-xs font-bold tracking-widest uppercase">
              {appState === 'listening_b' ? 'Стоп' : 'Говорящий B'}
            </span>
            <span className="text-slate-400 text-xs">{langB.flag} {langB.label}</span>
          </button>
        </div>

        <p className="text-center text-[10px] text-slate-600 mt-3">
          Работает с Bluetooth (Jabra Speak 510 и др.) · Chrome / Safari
        </p>
      </div>

      {showTextInput && pendingSpeaker && (
        <TextInput
          speaker={pendingSpeaker}
          language={pendingSpeaker === 'A' ? langA : langB}
          onSubmit={handleTextSubmit}
          onCancel={handleTextCancel}
        />
      )}
    </div>
  );
}
