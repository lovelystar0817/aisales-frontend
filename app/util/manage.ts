export function getScoreBadge(score: number) {
  if (score >= 80)
    return {
      label: 'Excellent',
      color: 'text-green-700 bg-green-50 border-green-200',
    };
  if (score >= 60)
    return { label: 'Good', color: 'text-blue-700 bg-blue-50 border-blue-200' };
  if (score >= 40)
    return {
      label: 'Fair',
      color: 'text-orange-700 bg-orange-50 border-orange-200',
    };
  if (score > 0)
    return { label: 'Poor', color: 'text-red-700 bg-red-50 border-red-200' };
  return { label: '', color: 'text-gray-700 bg-gray-50 border-gray-200' };
}

export function getManulifeScoreBadge(score: number) {
  if (score >= 27)
    return {
      label: 'Champion',
      color: 'text-green-700 bg-green-50 border-green-200',
    };
  if (score >= 24)
    return { label: 'Pass', color: 'text-blue-700 bg-blue-50 border-blue-200' };
  if (score < 24)
    return {
      label: 'Failed',
      color: 'text-orange-700 bg-orange-50 border-orange-200',
    };
  return { label: '', color: 'text-gray-700 bg-gray-50 border-gray-200' };
}

export function getStandingColors(level: string): {
  backgroundColor: string;
  textColor: string;
} {
  if (level === 'L3')
    return { backgroundColor: '#E7F8F3', textColor: '#058A62' };
  if (level === 'L2')
    return { backgroundColor: '#E8F1FD', textColor: '#1C7AEB' };
  // L1 or default
  return { backgroundColor: '#FFF4EB', textColor: '#B25300' };
}
