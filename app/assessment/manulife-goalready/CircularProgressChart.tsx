import { getScoreColor } from '~/util/manulife-goalready';

interface CircularProgressChartProps {
  score: number;
  maxScore: number;
  size?: number;
  strokeWidth?: number;
}

export function CircularProgressChart({
  score,
  maxScore,
  size = 86,
  strokeWidth = 6,
}: CircularProgressChartProps) {
  const percentage = (score / maxScore) * 100;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // Determine color based on score percentage
  const strokeColor = getScoreColor(score, maxScore);

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#EAEDEF"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      </svg>
      {/* Score text in center */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[20px] font-bold leading-[28px] tracking-[-0.3px] text-[#161618]">
          {score}
        </span>
      </div>
    </div>
  );
}
