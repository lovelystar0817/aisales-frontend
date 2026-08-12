export enum ScoreRating {
  Poor = 'assessment.ratings.poor',       // 0-39
  Fair = 'assessment.ratings.fair',       // 40-59
  Good = 'assessment.ratings.good',       // 60-79
  Excellent = 'assessment.ratings.excellent' // 80-100
}

export function getScoreRating(score: number, secondary: boolean = false): {rating: ScoreRating, color: string} {
  if (score >= 80) return {rating: ScoreRating.Excellent, color: !secondary ? '#38A383' : '#A5E0CE'};
  if (score >= 60) return {rating: ScoreRating.Good, color: !secondary ? '#1C7AEB' : '#ABCEF8'};
  if (score >= 40) return {rating: ScoreRating.Fair, color: !secondary ? '#FF7E0D' : '#FFBE85'};
  return {rating: ScoreRating.Poor, color: !secondary ? '#E60D00' : '#FF9F99'};
}
