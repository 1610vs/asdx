import { Turn } from '../types';

type Props = {
  turn: Turn;
  onReplay: (turn: Turn) => void;
};

export function TurnCard({ turn, onReplay }: Props) {
  const isA = turn.speaker === 'A';

  return (
    <div className={`flex ${isA ? 'justify-start' : 'justify-end'} mb-3`}>
      <div className={`
        max-w-[85%] rounded-2xl px-4 py-3 shadow-lg
        ${isA
          ? 'bg-slate-700/80 border border-blue-500/20 rounded-tl-sm'
          : 'bg-slate-700/80 border border-emerald-500/20 rounded-tr-sm'
        }
      `}>
        {/* Speaker badge */}
        <div className={`flex items-center gap-2 mb-2`}>
          <span className={`
            text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full
            ${isA ? 'bg-blue-500/20 text-blue-400' : 'bg-emerald-500/20 text-emerald-400'}
          `}>
            {isA ? '🎤 A' : '🎤 B'}
          </span>
          <span className="text-[10px] text-slate-500">
            {turn.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          <button
            onClick={() => onReplay(turn)}
            className="ml-auto p-1 rounded-full hover:bg-slate-600 transition-colors group"
            title="Воспроизвести перевод"
          >
            <svg className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </button>
        </div>

        {/* Original text */}
        <p className="text-slate-300 text-sm leading-relaxed mb-1">
          {turn.original}
        </p>

        {/* Divider */}
        <div className={`h-px my-2 ${isA ? 'bg-blue-500/20' : 'bg-emerald-500/20'}`} />

        {/* Translated text */}
        <p className={`text-sm font-medium leading-relaxed ${
          isA ? 'text-blue-200' : 'text-emerald-200'
        }`}>
          {turn.translated}
        </p>
      </div>
    </div>
  );
}
