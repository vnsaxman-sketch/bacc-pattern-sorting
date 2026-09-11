export type Outcome = 'P' | 'B' | 'T'

export type ShoeType = 'Choppy' | 'Trending' | 'Hybrid'

export type StreakLength = 2 | 3 | 4 | 5

export type PatternBucketName = '1st' | '2nd' | '3rd' | '4th' | '5th' | 'Never'

export type PatternBuckets = Record<PatternBucketName, number>

export interface ShoeAnalysis {
  firstStreak: StreakLength | null
  maxStreak: number
  breaks: number
  patternHits: Record<string, number | null>
  length: number
  shoeType: ShoeType
}

export interface CsvRecord {
  Shoe: number
  FirstStreak: number
  MaxStreak: number
  Breaks: number
  ShoeType: ShoeType
  [key: string]: string | number
}

export interface SimulationResult {
  shoes: number
  patterns: string[]
  firstStreakCount: Record<StreakLength, number>
  streakPresence: Record<StreakLength, number>
  breakTotal: number
  patternBuckets: Record<string, PatternBuckets>
  shoeTypes: Record<ShoeType, number>
  condProbs: Record<'≥3' | '≥4' | '≥5', number>
  csvRecords: CsvRecord[]
}

