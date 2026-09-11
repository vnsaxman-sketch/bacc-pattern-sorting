import type {
  CsvRecord,
  Outcome,
  PatternBuckets,
  ShoeAnalysis,
  ShoeType,
  SimulationResult,
  StreakLength,
} from './types'

const STREAKS: StreakLength[] = [2, 3, 4, 5]

export function generateShoe(): Outcome[] {
  const hands = randomInteger(72, 80)
  const outcomes: Outcome[] = []

  for (let i = 0; i < hands; i += 1) {
    const random = Math.random()

    if (random < 0.458) {
      outcomes.push('B')
    } else if (random < 0.904) {
      outcomes.push('P')
    } else {
      outcomes.push('T')
    }
  }

  return outcomes
}

export function analyzeShoe(outcomes: Outcome[], patterns: string[]): ShoeAnalysis {
  const sequence = outcomes.filter((outcome): outcome is 'P' | 'B' => {
    return outcome === 'P' || outcome === 'B'
  })

  let firstStreak: StreakLength | null = null
  let streak = 1
  let maxStreak = 1

  for (let index = 1; index < sequence.length; index += 1) {
    if (sequence[index] === sequence[index - 1]) {
      streak += 1
      maxStreak = Math.max(maxStreak, streak)
    } else {
      streak = 1
    }

    if (
      firstStreak === null &&
      (streak === 2 || streak === 3 || streak === 4 || streak === 5)
    ) {
      firstStreak = streak
    }
  }

  const breaks = sequence.reduce((total, outcome, index) => {
    if (index === 0) {
      return total
    }

    return outcome !== sequence[index - 1] ? total + 1 : total
  }, 0)

  const patternHits: Record<string, number | null> = {}

  for (const pattern of patterns) {
    const position = sequence.join('').indexOf(pattern)
    patternHits[pattern] = position === -1 ? null : position + 1
  }

  const shoeType: ShoeType =
    maxStreak >= 5
      ? 'Trending'
      : breaks / Math.max(1, sequence.length) > 0.5
        ? 'Choppy'
        : 'Hybrid'

  return {
    firstStreak,
    maxStreak,
    breaks,
    patternHits,
    length: sequence.length,
    shoeType,
  }
}

export function runSimulation(shoes: number, patterns: string[]): SimulationResult {
  const firstStreakCount: Record<StreakLength, number> = {
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  }

  const streakPresence: Record<StreakLength, number> = {
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  }

  const shoeTypes: Record<ShoeType, number> = {
    Choppy: 0,
    Trending: 0,
    Hybrid: 0,
  }

  const patternBuckets: Record<string, PatternBuckets> = Object.fromEntries(
    patterns.map((pattern) => [
      pattern,
      {
        '1st': 0,
        '2nd': 0,
        '3rd': 0,
        '4th': 0,
        '5th': 0,
        Never: 0,
      },
    ]),
  )

  const conditionalCounts = {
    '≥3': 0,
    '≥4': 0,
    '≥5': 0,
    totalFirst2: 0,
  }

  let breakTotal = 0
  const csvRecords: CsvRecord[] = []

  for (let shoeIndex = 1; shoeIndex <= shoes; shoeIndex += 1) {
    const shoe = generateShoe()
    const analysis = analyzeShoe(shoe, patterns)

    if (analysis.firstStreak !== null) {
      firstStreakCount[analysis.firstStreak] += 1

      if (analysis.firstStreak === 2) {
        conditionalCounts.totalFirst2 += 1

        if (analysis.maxStreak >= 3) conditionalCounts['≥3'] += 1
        if (analysis.maxStreak >= 4) conditionalCounts['≥4'] += 1
        if (analysis.maxStreak >= 5) conditionalCounts['≥5'] += 1
      }
    }

    for (const streak of STREAKS) {
      if (analysis.maxStreak >= streak) {
        streakPresence[streak] += 1
      }
    }

    breakTotal += analysis.breaks
    shoeTypes[analysis.shoeType] += 1

    for (const [pattern, position] of Object.entries(analysis.patternHits)) {
      if (position === null) {
        patternBuckets[pattern].Never += 1
        continue
      }

      const percentThroughShoe = position / analysis.length

      if (percentThroughShoe <= 0.2) {
        patternBuckets[pattern]['1st'] += 1
      } else if (percentThroughShoe <= 0.4) {
        patternBuckets[pattern]['2nd'] += 1
      } else if (percentThroughShoe <= 0.6) {
        patternBuckets[pattern]['3rd'] += 1
      } else if (percentThroughShoe <= 0.8) {
        patternBuckets[pattern]['4th'] += 1
      } else {
        patternBuckets[pattern]['5th'] += 1
      }
    }

    const record: CsvRecord = {
      Shoe: shoeIndex,
      FirstStreak: analysis.firstStreak ?? 0,
      MaxStreak: analysis.maxStreak,
      Breaks: analysis.breaks,
      ShoeType: analysis.shoeType,
    }

    for (const [pattern, position] of Object.entries(analysis.patternHits)) {
      record[`Pattern_${pattern}`] = position ?? 'None'
    }

    csvRecords.push(record)
  }

  const conditionalDenominator = conditionalCounts.totalFirst2

  const condProbs = {
    '≥3':
      conditionalDenominator === 0
        ? 0
        : (conditionalCounts['≥3'] / conditionalDenominator) * 100,
    '≥4':
      conditionalDenominator === 0
        ? 0
        : (conditionalCounts['≥4'] / conditionalDenominator) * 100,
    '≥5':
      conditionalDenominator === 0
        ? 0
        : (conditionalCounts['≥5'] / conditionalDenominator) * 100,
  }

  return {
    shoes,
    patterns,
    firstStreakCount,
    streakPresence,
    breakTotal,
    patternBuckets,
    shoeTypes,
    condProbs,
    csvRecords,
  }
}

function randomInteger(minimum: number, maximum: number): number {
  return Math.floor(Math.random() * (maximum - minimum + 1)) + minimum
}

