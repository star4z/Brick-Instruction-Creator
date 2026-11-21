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
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 shadow-sm select-none"
      style={{
        backgroundColor: '#FFFFFF',
        border: `1.5px solid ${accentColor}`,
        color: '#17191C',
      }}
      title={LABELS[cue]}
    >
      <svg
        width={compact ? 16 : 20}
        height={compact ? 16 : 20}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        {isFlip ? (
          <>
            <path
              d="M5 10C5 6.5 8.2 4 12 4C15.8 4 19 6.5 19 10"
              stroke={accentColor}
              strokeWidth="2.2"
              strokeLinecap="round"
            />
            <path
              d="M16.5 8.5L19 11L21.5 8.5"
              stroke={accentColor}
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M19 14C19 17.5 15.8 20 12 20C8.2 20 5 17.5 5 14"
              stroke={accentColor}
              strokeWidth="2.2"
              strokeLinecap="round"
            />
            <path
              d="M7.5 15.5L5 13L2.5 15.5"
              stroke={accentColor}
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </>
        ) : (
          <>
            <path
              d={
                cue === 'yaw_90_ccw'
                  ? 'M18.5 9.5C17.2 6.5 14.3 5 11.2 5.3C7.6 5.7 5 8.7 5 12.2C5 15.9 8 19 11.8 19C14.7 19 17.2 17.3 18.2 14.8'
                  : 'M5.5 9.5C6.8 6.5 9.7 5 12.8 5.3C16.4 5.7 19 8.7 19 12.2C19 15.9 16 19 12.2 19C9.3 19 6.8 17.3 5.8 14.8'
              }
              stroke={accentColor}
              strokeWidth="2.2"
              strokeLinecap="round"
            />
            <path
              d={
                cue === 'yaw_90_ccw'
                  ? 'M15.2 9.5H19V5.8'
                  : 'M8.8 9.5H5V5.8'
              }
              stroke={accentColor}
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {is180 && (
              <circle cx="12" cy="12" r="2.2" fill={accentColor} />
            )}
          </>
        )}
      </svg>
      {!compact && (
        <span className="text-[11px] font-bold tracking-tight uppercase leading-none">
          {LABELS[cue]}
        </span>
      )}
    </div>
  );
}
