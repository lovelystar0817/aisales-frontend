import { useTranslation } from 'react-i18next';
import type { AssessmentCriteria } from './types';

// Circle component for score ring
export function Circle({
  size = 100,
  strokeWidth = 8,
  value,
  color,
}: {
  size?: number;
  strokeWidth?: number;
  value: number;
  color: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - value / 100);

  return (
    <svg
      width={size}
      height={size}
      style={{
        transform: 'rotate(-90deg)',
        transformOrigin: '50% 50%',
      }}
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="#E5E7EB"
        strokeWidth={strokeWidth}
        fill="transparent"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        fill="transparent"
      />
    </svg>
  );
}

// Utility functions
export function getScoreMarking(score: number, t: ReturnType<typeof useTranslation>['t']): string {
  if (score >= 95) return t('callAnalysis.assessment.scores.exceptional');
  if (score >= 85) return t('callAnalysis.assessment.scores.excellent');
  if (score >= 80) return t('callAnalysis.assessment.scores.good');
  if (score >= 75) return t('callAnalysis.assessment.scores.developing');
  return t('callAnalysis.assessment.scores.unsatisfactory');
}

export function getScoreColor(score: number): string {
  if (score >= 95) return '#22C55E';
  if (score >= 85) return '#3B82F6';
  if (score >= 80) return '#F59E0B';
  if (score >= 75) return '#8B5CF6';
  return '#EF4444';
}

// Scorecard Section Component for Print
export function ScorecardSectionPrint({
  title,
  criteria,
}: {
  title: string;
  criteria: AssessmentCriteria[];
}) {
  const totalScore = criteria.reduce(
    (sum, c) => sum + c.score * (c.weight || 1),
    0,
  );
  const totalMaxScore = criteria.reduce(
    (sum, c) => sum + c.maxScore * (c.weight || 1),
    0,
  );
  const percentage = totalMaxScore > 0 ? (totalScore / totalMaxScore) * 100 : 0;

  return (
    <div style={{ marginBottom: '24px', pageBreakInside: 'avoid' }}>
      <div
        style={{
          padding: '20px',
          border: '1px solid #E5E7EB',
          borderRadius: '8px',
          backgroundColor: '#FFFFFF',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
            paddingBottom: '16px',
            borderBottom: '1px solid #E5E7EB',
          }}
        >
          <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#161618' }}>
            {title}
          </h4>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '14px', fontWeight: 700, color: '#161618' }}>
              {totalScore}/{totalMaxScore}
            </span>
            <div
              style={{
                width: '80px',
                height: '8px',
                backgroundColor: '#E5E7EB',
                borderRadius: '9999px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${percentage}%`,
                  backgroundColor: '#3B82F6',
                  transition: 'width 0.3s',
                }}
              />
            </div>
          </div>
        </div>
        <div>
          {criteria.map((item, idx) => (
            <div
              key={idx}
              style={{
                paddingBottom: idx < criteria.length - 1 ? '12px' : 0,
                marginBottom: idx < criteria.length - 1 ? '12px' : 0,
                borderBottom: idx < criteria.length - 1 ? '1px solid #F3F4F6' : 'none',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#58595A' }}>
                  {item.criteria}
                </span>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#161618' }}>
                  {item.score * (item.weight || 1)}/{item.maxScore * (item.weight || 1)}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div
                  style={{
                    width: '4px',
                    flexShrink: 0,
                    borderRadius: '9999px',
                    backgroundColor: '#D1D5DB',
                    marginTop: '4px',
                  }}
                />
                <p style={{ margin: 0, fontSize: '14px', color: '#58595A', lineHeight: '1.5' }}>
                  {item.evaluation}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}