export type Language = {
  code: string;        // BCP-47 for Speech API
  translateCode: string; // for MyMemory API
  label: string;
  flag: string;
  voice?: string;      // preferred TTS voice hint
};

export type AppState =
  | 'idle'
  | 'listening_a'
  | 'listening_b'
  | 'processing'
  | 'speaking';

export type Turn = {
  id: string;
  speaker: 'A' | 'B';
  original: string;
  translated: string;
  langFrom: string;
  langTo: string;
  timestamp: Date;
};
