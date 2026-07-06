import { useCallback, useRef } from 'react';

export function useTTS() {
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  const speak = useCallback((
    text: string,
    lang: string,
    onEnd?: () => void,
    rate = 0.95,
    pitch = 1.0,
  ) => {
    if (!isSupported) return;

    window.speechSynthesis.cancel();

    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = lang;
    utter.rate = rate;
    utter.pitch = pitch;
    utter.volume = 1.0;

    // Try to find the best matching voice
    const voices = window.speechSynthesis.getVoices();
    const exact = voices.find(v => v.lang === lang);
    const partial = voices.find(v => v.lang.startsWith(lang.split('-')[0]));
    const voice = exact ?? partial;
    if (voice) utter.voice = voice;

    utter.onend = () => onEnd?.();
    utter.onerror = () => onEnd?.();

    utteranceRef.current = utter;
    window.speechSynthesis.speak(utter);
  }, [isSupported]);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
  }, []);

  const getVoices = useCallback((): SpeechSynthesisVoice[] => {
    if (!isSupported) return [];
    return window.speechSynthesis.getVoices();
  }, [isSupported]);

  return { isSupported, speak, stop, getVoices };
}
