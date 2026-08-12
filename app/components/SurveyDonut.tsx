import React from 'react';

interface SurveyDonutProps {
  size?: number;
  yesPercent: number;
  totalResponses: number;
  yesColor?: string;
  noColor?: string;
  emptyText?: string;
  className?: string;
}

function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, value));
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(angleRad), y: cy + r * Math.sin(angleRad) };
}

function describeWedge(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number,
) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;
  return `M ${cx} ${cy} L ${end.x} ${end.y} A ${r} ${r} 0 ${largeArcFlag} 1 ${start.x} ${start.y} Z`;
}

export default function SurveyDonut({
  size = 200,
  yesPercent,
  totalResponses,
  yesColor = '#1C7AEB',
  noColor = '#f97316',
  emptyText,
  className,
}: SurveyDonutProps) {
  const cx = size / 2;
  const cy = size / 2;
  const radius = Math.max(0, size / 2 - 8);

  if (!totalResponses || totalResponses === 0) {
    return (
      <div className={`relative shrink-0`} style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className={className}>
          <circle cx={cx} cy={cy} r={radius} fill="#ffffff" stroke="#e5e7eb" strokeWidth={1} />
        </svg>
        {emptyText && (
          <div className="absolute inset-0 flex items-center justify-center text-center text-gray-500 text-sm px-4">
            {emptyText}
          </div>
        )}
      </div>
    );
  }

  const clampedYes = clampPercent(yesPercent);
  const yesAngle = Math.min(359.999, (clampedYes / 100) * 360);
  const noAngleStart = yesAngle;
  const yesPath = clampedYes > 0 ? describeWedge(cx, cy, radius + 6, 0, yesAngle) : '';
  const noPath = clampedYes < 100 ? describeWedge(cx, cy, radius + 6, noAngleStart, 359.999) : '';

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className={className}>
      {clampedYes > 0 && (
        <path d={yesPath} fill={yesColor} stroke="#ffffff" strokeWidth={4} strokeLinejoin="round" />
      )}
      {clampedYes < 100 && (
        <path d={noPath} fill={noColor} stroke="#ffffff" strokeWidth={4} strokeLinejoin="round" />
      )}
    </svg>
  );
}


