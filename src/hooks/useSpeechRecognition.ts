import { useCallback, useEffect, useRef, useState } from 'react';

export type RecognitionResult = {
  transcript: string;
  isFinal: boolean;
};

type Options = {
  lang: string;
  continuous?: boolean;
  onResult: (r: RecognitionResult) => void;
  onEnd?: () => void;
  onError?: (e: string) => void;
};

// Polyfill type
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

export function useSpeechRecognition() {
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsSupported(!!SR);
  }, []);

  const startListening = useCallback((options: Options) => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;

    const startRecognition = () => {
      // Stop any previous session
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      const rec = new SR();
      rec.lang = options.lang;
      rec.continuous = options.continuous ?? false;
      rec.interimResults = true;
      rec.maxAlternatives = 1;

      rec.onstart = () => setIsListening(true);

      rec.onresult = (event: SpeechRecognitionEvent) => {
        let interim = '';
        let final = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const t = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            final += t;
          } else {
            interim += t;
          }
        }
        if (final) {
          options.onResult({ transcript: final, isFinal: true });
        } else {
          options.onResult({ transcript: interim, isFinal: false });
        }
      };

      rec.onend = () => {
        setIsListening(false);
        options.onEnd?.();
      };

      rec.onerror = (event: SpeechRecognitionErrorEvent) => {
        setIsListening(false);
        options.onError?.(event.error);
      };

      recognitionRef.current = rec;
      rec.start();
    };

    if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          stream.getTracks().forEach(track => track.stop());
          startRecognition();
        })
        .catch(() => {
          setIsListening(false);
          options.onError?.('not-allowed');
        });
      return;
    }

    startRecognition();
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  const abortListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  return { isSupported, isListening, startListening, stopListening, abortListening };
}
