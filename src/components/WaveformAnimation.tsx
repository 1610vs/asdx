import { useEffect, useRef } from 'react';

type Props = {
  isActive: boolean;
  color?: string;
  bars?: number;
};

export function WaveformAnimation({ isActive, color = '#60a5fa', bars = 12 }: Props) {
  const barsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (!isActive) {
      barsRef.current.forEach(bar => {
        if (bar) {
          bar.style.height = '4px';
          bar.style.opacity = '0.3';
        }
      });
      return;
    }

    const intervals: ReturnType<typeof setInterval>[] = [];

    barsRef.current.forEach((bar, i) => {
      if (!bar) return;
      const interval = setInterval(() => {
        const h = Math.random() * 40 + 4;
        bar.style.height = `${h}px`;
        bar.style.opacity = '1';
      }, 80 + i * 10);
      intervals.push(interval);
    });

    return () => intervals.forEach(clearInterval);
  }, [isActive]);

  return (
    <div className="flex items-center justify-center gap-[3px]" style={{ height: '52px' }}>
      {Array.from({ length: bars }).map((_, i) => (
        <div
          key={i}
          ref={el => { barsRef.current[i] = el; }}
          style={{
            width: '4px',
            height: '4px',
            backgroundColor: color,
            borderRadius: '2px',
            transition: 'height 0.08s ease, opacity 0.08s ease',
            opacity: 0.3,
          }}
        />
      ))}
    </div>
  );
}
