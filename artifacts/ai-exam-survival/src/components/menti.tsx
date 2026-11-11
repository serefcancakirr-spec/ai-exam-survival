/**
 * Menti – the AI Exam Survival mascot (a friendly blue cow), drawn as an SVG so it has no
 * background, stays sharp on every screen and can move a little (wave, blink, bounce).
 * Animations live in index.css (classes starting with "menti-") and stop when the device asks
 * for reduced motion. Menti is decoration: it never reads or writes saved data.
 */

import type { ReactNode } from 'react';
import { useI18n } from '@/i18n/i18n';

export type MentiPose = 'wave' | 'think' | 'cheer' | 'encourage' | 'surprised' | 'point' | 'clap';

const C = {
  line: '#1d3566',
  body: '#8cc4ea',
  shade: '#6fa9dc',
  light: '#c6dcf6',
  muzzle: '#c9d6f3',
  white: '#ffffff',
  horn: '#efe2c2',
  hair: '#3f76c4',
  tongue: '#f28a9e',
  scarf: '#9cc6ee',
  bell: '#b7cbe6',
};

type Arm = {
  pts: string;
  hand: [number, number];
  front?: boolean;
  cls?: string;
  origin?: string;
  spot?: [number, number];
};

// Shoulders are at about (86,176) and (154,176).
const ARMS: Record<MentiPose, [Arm, Arm]> = {
  wave: [
    {
      pts: '88,178 62,160 42,126',
      hand: [39, 120],
      cls: 'menti-wave',
      origin: '88px 178px',
      spot: [64, 160],
    },
    { pts: '152,180 164,208 170,236', hand: [171, 240], spot: [163, 206] },
  ],
  think: [
    { pts: '88,180 76,208 72,234', hand: [71, 238], spot: [77, 208] },
    { pts: '154,184 170,176 160,160', hand: [156, 156], front: true },
  ],
  cheer: [
    {
      pts: '88,178 62,152 46,116',
      hand: [43, 110],
      cls: 'menti-cheer-l',
      origin: '88px 178px',
      spot: [64, 154],
    },
    {
      pts: '152,178 178,152 194,116',
      hand: [197, 110],
      cls: 'menti-cheer-r',
      origin: '152px 178px',
      spot: [176, 154],
    },
  ],
  encourage: [
    { pts: '88,180 76,208 72,234', hand: [71, 238], spot: [77, 208] },
    {
      pts: '152,178 176,166 186,140',
      hand: [187, 134],
      cls: 'menti-pump',
      origin: '152px 178px',
      spot: [175, 164],
    },
  ],
  surprised: [
    { pts: '88,178 64,172 48,152', hand: [45, 147], spot: [66, 170] },
    { pts: '152,178 176,172 192,152', hand: [195, 147], spot: [174, 170] },
  ],
  point: [
    { pts: '88,180 76,208 72,234', hand: [71, 238], spot: [77, 208] },
    {
      pts: '152,178 180,170 206,160',
      hand: [211, 158],
      cls: 'menti-point',
      origin: '152px 178px',
      spot: [180, 170],
    },
  ],
  clap: [
    {
      pts: '86,184 96,210 110,206',
      hand: [113, 203],
      front: true,
      cls: 'menti-clap-l',
      origin: '86px 184px',
    },
    {
      pts: '154,184 144,210 130,206',
      hand: [127, 203],
      front: true,
      cls: 'menti-clap-r',
      origin: '154px 184px',
    },
  ],
};

function Limb({ arm }: { arm: Arm }) {
  return (
    <g className={arm.cls} style={arm.origin ? { transformOrigin: arm.origin } : undefined}>
      <polyline points={arm.pts} fill="none" stroke={C.line} strokeWidth={27} strokeLinecap="round" strokeLinejoin="round" />
      <polyline points={arm.pts} fill="none" stroke={C.body} strokeWidth={21} strokeLinecap="round" strokeLinejoin="round" />
      {arm.spot && <circle cx={arm.spot[0]} cy={arm.spot[1]} r={4.5} fill={C.white} />}
      <circle cx={arm.hand[0]} cy={arm.hand[1]} r={11} fill={C.white} stroke={C.line} strokeWidth={3} />
      <path
        d={`M${arm.hand[0] - 3.5} ${arm.hand[1] - 10} l3.5 5 l3.5 -5`}
        fill="none"
        stroke={C.line}
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  );
}

function Eyes({ pose }: { pose: MentiPose }) {
  if (pose === 'cheer' || pose === 'clap') {
    return (
      <g fill="none" stroke={C.line} strokeWidth={4} strokeLinecap="round">
        <path d="M88 99 q10 -12 20 0" />
        <path d="M132 99 q10 -12 20 0" />
      </g>
    );
  }
  const r = pose === 'surprised' ? 12.5 : 11.5;
  const look = pose === 'think' ? -2 : 0;
  return (
    <g>
      <g className="menti-blink" style={{ transformOrigin: '120px 98px' }}>
        {[98, 142].map((x) => (
          <g key={x}>
            <ellipse cx={x} cy={98} rx={r - 1} ry={r + 1} fill={C.line} />
            <circle cx={x + 3.5 + look} cy={92 + look} r={4.4} fill={C.white} />
            <circle cx={x - 3 + look} cy={102} r={1.6} fill={C.white} />
          </g>
        ))}
      </g>
      {/* lashes */}
      <path d="M87 91 l-5 -3 M88 96 l-6 0" stroke={C.line} strokeWidth={2.4} strokeLinecap="round" />
      <path d="M153 91 l5 -3 M152 96 l6 0" stroke={C.line} strokeWidth={2.4} strokeLinecap="round" />
    </g>
  );
}

function Brows({ pose }: { pose: MentiPose }) {
  const d =
    pose === 'surprised'
      ? ['M90 76 q8 -6 16 -1', 'M134 75 q8 -5 16 1']
      : pose === 'think'
        ? ['M90 80 q8 -3 16 1', 'M134 76 q8 -5 16 0']
        : pose === 'encourage'
          ? ['M90 79 q8 -5 16 -2', 'M134 77 q8 -3 16 2']
          : ['M91 80 q7 -4 14 -1', 'M135 79 q7 -3 14 1'];
  return (
    <g fill="none" stroke={C.line} strokeWidth={2.6} strokeLinecap="round">
      <path d={d[0]} />
      <path d={d[1]} />
    </g>
  );
}

function Mouth({ pose }: { pose: MentiPose }) {
  if (pose === 'surprised') {
    return <ellipse cx={120} cy={142} rx={7} ry={8} fill="#7a2c45" stroke={C.line} strokeWidth={3} />;
  }
  if (pose === 'think') {
    return <path d="M106 141 q10 6 22 -3" fill="none" stroke={C.line} strokeWidth={3.2} strokeLinecap="round" />;
  }
  const big = pose === 'cheer' || pose === 'clap';
  return (
    <g>
      <path
        d={big ? 'M100 136 q20 26 40 0 z' : 'M103 137 q17 20 34 0 z'}
        fill="#7a2c45"
        stroke={C.line}
        strokeWidth={3}
        strokeLinejoin="round"
      />
      <path d={big ? 'M108 149 q12 -9 24 0 q-12 8 -24 0 z' : 'M110 146 q10 -7 20 0 q-10 6 -20 0 z'} fill={C.tongue} />
    </g>
  );
}

function Extras({ pose }: { pose: MentiPose }) {
  if (pose === 'think') {
    return (
      <g className="menti-float" fill={C.hair}>
        <circle cx={186} cy={58} r={4} />
        <circle cx={198} cy={42} r={6} />
        <text x={206} y={30} fontSize={26} fontWeight={800} fontFamily="Inter, sans-serif" fill={C.hair}>
          ?
        </text>
      </g>
    );
  }
  if (pose === 'cheer' || pose === 'clap') {
    const star = (x: number, y: number, s: number, fill: string) => (
      <path
        key={`${x}-${y}`}
        d={`M${x} ${y - s} L${x + s * 0.3} ${y - s * 0.3} L${x + s} ${y} L${x + s * 0.3} ${y + s * 0.3} L${x} ${y + s} L${x - s * 0.3} ${y + s * 0.3} L${x - s} ${y} L${x - s * 0.3} ${y - s * 0.3} Z`}
        fill={fill}
      />
    );
    return (
      <g className="menti-sparkle">
        {star(30, 70, 9, '#5be0dc')}
        {star(212, 76, 8, '#9d95ff')}
        {star(204, 196, 6, '#5be0dc')}
        {star(36, 188, 6, '#f6c35b')}
      </g>
    );
  }
  if (pose === 'surprised') {
    return (
      <g stroke={C.hair} strokeWidth={3.5} strokeLinecap="round">
        <path d="M36 50 l10 10 M28 72 l13 3 M204 50 l-10 10 M212 72 l-13 3" />
      </g>
    );
  }
  return null;
}

export function MentiArt({ pose = 'wave', title, faceOnly = false }: { pose?: MentiPose; title?: string; faceOnly?: boolean }) {
  const [a, b] = ARMS[pose];
  const back = [a, b].filter((x) => !x.front);
  const front = [a, b].filter((x) => x.front);
  return (
    <svg
      viewBox={faceOnly ? '14 10 212 170' : '0 0 240 300'}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      className="h-full w-full overflow-visible"
      data-menti-pose={pose}
    >
      {!faceOnly && <ellipse cx={120} cy={290} rx={62} ry={7} fill="#1d3566" opacity={0.12} />}
      <g className="menti-bob">
        {!faceOnly && (
          <>
            {/* tail */}
            <path d="M150 248 q26 4 36 -10" fill="none" stroke={C.line} strokeWidth={8} strokeLinecap="round" />
            <path d="M150 248 q26 4 36 -10" fill="none" stroke={C.body} strokeWidth={3.5} strokeLinecap="round" />
            <path
              className="menti-tail"
              style={{ transformOrigin: '186px 238px' }}
              d="M186 238 c2 -10 12 -14 16 -8 c6 -2 8 8 2 11 c4 6 -6 12 -12 7 c-6 4 -10 -4 -6 -10 z"
              fill={C.hair}
              stroke={C.line}
              strokeWidth={2.5}
              strokeLinejoin="round"
            />
            {/* legs */}
            {[100, 140].map((x) => (
              <g key={x}>
                <rect x={x - 14} y={238} width={28} height={44} rx={12} fill={C.body} stroke={C.line} strokeWidth={3} />
                <path
                  d={`M${x - 14} 266 h28 v6 a10 10 0 0 1 -10 10 h-8 a10 10 0 0 1 -10 -10 z`}
                  fill={C.white}
                  stroke={C.line}
                  strokeWidth={3}
                  strokeLinejoin="round"
                />
                <path d={`M${x} 268 v13`} stroke={C.line} strokeWidth={2} />
              </g>
            ))}
            <circle cx={92} cy={252} r={5} fill={C.white} />
            {back.map((arm, i) => (
              <Limb key={`b${i}`} arm={arm} />
            ))}
            {/* body */}
            <path
              d="M86 164 C74 196 72 234 86 252 C100 264 140 264 154 252 C168 234 166 196 154 164 Z"
              fill={C.body}
              stroke={C.line}
              strokeWidth={3}
              strokeLinejoin="round"
            />
            <ellipse cx={120} cy={218} rx={31} ry={35} fill={C.light} />
            <path d="M80 200 c9 -2 11 12 2 16 z" fill={C.white} />
            <path d="M162 226 c-10 0 -11 13 -2 17 z" fill={C.white} />
            {/* scarf */}
            <path
              d="M84 162 Q120 182 156 162 L158 172 Q120 194 82 172 Z"
              fill={C.scarf}
              stroke={C.line}
              strokeWidth={3}
              strokeLinejoin="round"
            />
            <path
              d="M92 170 l6 5 l6 -5 M110 176 l6 5 l6 -5 M128 176 l6 5 l6 -5 M144 170 l6 5"
              fill="none"
              stroke={C.white}
              strokeWidth={2}
              strokeLinecap="round"
            />
            <path
              d="M152 164 l18 -8 l-4 14 z M152 168 l20 6 l-12 8 z"
              fill={C.scarf}
              stroke={C.line}
              strokeWidth={2.6}
              strokeLinejoin="round"
            />
            {/* bell */}
            <g className="menti-bell" style={{ transformOrigin: '120px 180px' }}>
              <path
                d="M109 199 q0 -19 11 -19 q11 0 11 19 z"
                fill={C.bell}
                stroke={C.line}
                strokeWidth={2.6}
                strokeLinejoin="round"
              />
              <circle cx={120} cy={201} r={3.4} fill={C.line} />
            </g>
            {front.map((arm, i) => (
              <Limb key={`f${i}`} arm={arm} />
            ))}
          </>
        )}
        {/* ears */}
        <g className="menti-ear-l" style={{ transformOrigin: '66px 84px' }}>
          <path
            d="M68 76 C52 66 26 66 20 78 C16 88 36 98 66 94 Z"
            fill={C.body}
            stroke={C.line}
            strokeWidth={3}
            strokeLinejoin="round"
          />
          <path d="M60 80 C48 74 32 74 28 80 C28 86 42 90 60 89 Z" fill={C.light} />
        </g>
        <g className="menti-ear-r" style={{ transformOrigin: '174px 84px' }}>
          <path
            d="M172 76 C188 66 214 66 220 78 C224 88 204 98 174 94 Z"
            fill={C.body}
            stroke={C.line}
            strokeWidth={3}
            strokeLinejoin="round"
          />
          <path d="M180 80 C192 74 208 74 212 80 C212 86 198 90 180 89 Z" fill={C.light} />
        </g>
        {/* horns */}
        <path
          d="M80 56 C68 48 66 34 72 26 C80 32 92 38 100 46 Z"
          fill={C.horn}
          stroke={C.line}
          strokeWidth={3}
          strokeLinejoin="round"
        />
        <path
          d="M160 56 C172 48 174 34 168 26 C160 32 148 38 140 46 Z"
          fill={C.horn}
          stroke={C.line}
          strokeWidth={3}
          strokeLinejoin="round"
        />
        {/* head */}
        <path
          d="M120 38 C160 38 180 56 182 86 C184 106 190 128 178 148 C166 168 74 168 62 148 C50 128 56 106 58 86 C60 56 80 38 120 38 Z"
          fill={C.body}
          stroke={C.line}
          strokeWidth={3.2}
          strokeLinejoin="round"
        />
        {/* white blaze and cheek patch */}
        <path
          d="M104 42 C112 40 128 40 138 43 C140 60 132 72 128 84 C126 92 124 104 120 106 C114 100 114 86 112 78 C108 66 102 56 104 42 Z"
          fill={C.white}
        />
        <path d="M172 112 c-10 2 -12 16 -4 22 c6 0 10 -8 10 -14 z" fill={C.white} />
        <path d="M68 128 c6 -2 10 6 6 10 c-4 2 -8 -2 -6 -10 z" fill={C.white} />
        {/* hair tuft */}
        <path
          d="M106 46 C102 36 110 28 118 34 C120 24 132 24 132 34 C140 30 146 38 140 46 C132 42 126 48 120 44 C114 50 110 44 106 46 Z"
          fill={C.hair}
          stroke={C.line}
          strokeWidth={2.6}
          strokeLinejoin="round"
        />
        <Brows pose={pose} />
        <Eyes pose={pose} />
        {/* muzzle */}
        <ellipse cx={120} cy={134} rx={45} ry={27} fill={C.muzzle} stroke={C.line} strokeWidth={3} />
        <ellipse cx={106} cy={124} rx={3.4} ry={4.4} fill={C.line} />
        <ellipse cx={134} cy={124} rx={3.4} ry={4.4} fill={C.line} />
        <Mouth pose={pose} />
      </g>
      {!faceOnly && <Extras pose={pose} />}
    </svg>
  );
}

export const MENTI_POSES: MentiPose[] = ['wave', 'think', 'cheer', 'encourage', 'surprised', 'point', 'clap'];

/**
 * Menti with an optional speech bubble. `size` is Menti's width in pixels (height is 1.25 × width).
 * `bubble` puts the speech bubble to the left, right or above Menti.
 */
export function Menti({
  pose = 'wave',
  size = 96,
  message,
  bubble = 'right',
  className = '',
  testId = 'menti',
  children,
}: {
  pose?: MentiPose;
  size?: number;
  message?: ReactNode;
  bubble?: 'left' | 'right' | 'top';
  className?: string;
  testId?: string;
  children?: ReactNode;
}) {
  const { t } = useI18n();
  const figure = (
    <div className="menti-figure shrink-0" style={{ width: size, height: size * 1.25 }}>
      <MentiArt pose={pose} title={t('menti.label')} />
    </div>
  );
  if (!message && !children) {
    return (
      <div className={className} data-testid={testId} data-pose={pose}>
        {figure}
      </div>
    );
  }
  const layout =
    bubble === 'top' ? 'flex-col items-center' : bubble === 'left' ? 'flex-row-reverse items-center' : 'flex-row items-center';
  const tail =
    bubble === 'top'
      ? 'left-1/2 -bottom-[7px] -translate-x-1/2 border-b border-r'
      : bubble === 'left'
        ? '-right-[7px] top-1/2 -translate-y-1/2 border-r border-t'
        : '-left-[7px] top-1/2 -translate-y-1/2 border-b border-l';
  return (
    <div className={`flex gap-3 ${layout} ${className}`} data-testid={testId} data-pose={pose}>
      {figure}
      <div
        className="menti-bubble relative min-w-0 max-w-[300px] rounded-[18px] border border-[#dcdff0] bg-white px-4 py-3 text-left text-[12px] font-bold leading-relaxed text-[#27305a] shadow-[0_10px_30px_rgba(29,42,90,.10)] sm:text-[13px]"
        data-testid={`${testId}-bubble`}
      >
        <span className={`absolute h-3.5 w-3.5 rotate-45 border-[#dcdff0] bg-white ${tail}`} aria-hidden="true" />
        <span className="relative block">{message}</span>
        {children && <div className="relative mt-2">{children}</div>}
      </div>
    </div>
  );
}
