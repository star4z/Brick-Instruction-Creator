import type { RotationCueType } from '../types/manual';

interface Props {
  cue: RotationCueType;
  accentColor: string;
  compact?: boolean;
}

const LABELS: Record<RotationCueType, string> = {
  none: '',
  yaw_90_cw: 'Rotate 90°',
  yaw_90_ccw: 'Rotate 90°',
  yaw_180: 'Turn 180°',
  flip_vertical: 'Flip Over',
};

export function RotationCueIcon({ cue, accentColor, compact = false }: Props) {
  if (cue === 'none') return null;

  const isFlip = cue === 'flip_vertical';
  const is180 = cue === 'yaw_180';

  return (
    <div
      className="inline-flex items-center gap-2 rounded-full pl-1.5 pr-3.5 py-1 shadow-md select-none"
      style={{
        backgroundColor: '#FFFFFF',
        border: `2.5px solid ${accentColor}`,
        color: '#18181B',
      }}
      title={LABELS[cue]}
    >
      <span
        className="rounded-full flex items-center justify-center shrink-0"
        style={{
          width: compact ? 26 : 32,
          height: compact ? 26 : 32,
          backgroundColor: accentColor,
          color: '#FFFFFF',
        }}
      >
        <svg
          width={compact ? 17 : 21}
          height={compact ? 17 : 21}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          {isFlip ? (
            <>
              <path d="M5 10.5C5 6.3 8.1 3.5 12 3.5c3.9 0 7 2.8 7 7" />
              <polyline points="16.2 8.2 19 11 21.8 8.2" />
              <path d="M19 13.5c0 4.2-3.1 7-7 7-3.9 0-7-2.8-7-7" />
              <polyline points="7.8 15.8 5 13 2.2 15.8" />
            </>
          ) : (
            <g transform={cue === 'yaw_90_ccw' ? 'translate(24 0) scale(-1 1)' : undefined}>
              <path d="M20.5 11.5A8.5 8.5 0 0 0 6.2 5.4L4 7.6" />
              <polyline points="4 3.5 4 7.6 8.1 7.6" />
              <path d="M3.5 12.5A8.5 8.5 0 0 0 17.8 18.6L20 16.4" />
              <polyline points="20 20.5 20 16.4 15.9 16.4" />
              {is180 && <circle cx="12" cy="12" r="2.2" fill="currentColor" stroke="none" />}
            </g>
          )}
        </svg>
      </span>
      {!compact && (
        <span className="text-xs font-extrabold tracking-tight leading-none">
          {LABELS[cue]}
        </span>
      )}
    </div>
  );
}
