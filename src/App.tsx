import { useMemo, useState } from 'react'
import { runSimulation } from './baccarat'
import { downloadCsv } from './csv'
import type { SimulationResult, StreakLength } from './types'

const STREAKS: StreakLength[] = [2, 3, 4, 5]

function App() {
  const [shoeInput, setShoeInput] = useState('10000')
  const [patternInput, setPatternInput] = useState('PPBBPP,PPBBPPBB')
  const [result, setResult] = useState<SimulationResult | null>(null)
  const [error, setError] = useState('')
  const [isRunning, setIsRunning] = useState(false)

  const parsedPatterns = useMemo(() => {
    const patterns = patternInput
      .split(',')
      .map((pattern) => pattern.trim().toUpperCase())
      .filter(Boolean)

    return [...new Set(patterns)]
  }, [patternInput])

  function handleRunSimulation() {
    const shoes = Number.parseInt(shoeInput, 10)

    if (!Number.isInteger(shoes) || shoes < 1 || shoes > 1_000_000) {
      setError('Enter a whole number of shoes from 1 to 1,000,000.')
      return
    }

    const invalidPattern = parsedPatterns.find(
      (pattern) => !/^[PB]+$/.test(pattern),
    )

    if (invalidPattern) {
      setError(
        `Invalid pattern "${invalidPattern}". Patterns can contain only P and B.`,
      )
      return
    }

    if (parsedPatterns.length === 0) {
      setError('Enter at least one P/B pattern.')
      return
    }

    setError('')
    setIsRunning(true)

    window.setTimeout(() => {
      setResult(runSimulation(shoes, parsedPatterns))
      setIsRunning(false)
    }, 0)
  }

  function handleExportCsv() {
    if (!result || result.csvRecords.length === 0) {
      setError('No data is available to export. Run a simulation first.')
      return
    }

    setError('')
    downloadCsv(result.csvRecords)
  }

  return (
    <main className="app-shell">
      <section className="card">
        <header className="hero">
          <div>
            <p className="eyebrow">EZ BACCARAT - DAIBAC - MINI BACCARAT</p>
            <h1>Baccarat Shoe Analyzer</h1>
            <p className="subtitle">
              Monte Carlo streak, break, classification, and pattern-position
              analysis.
            </p>
	    <p className="subtitle">
	    <br />
              Developed by: Long Nguyen
            </p>
          </div>
        </header>

        <section className="controls" aria-label="Simulation settings">
          <label>
            Number of shoes
            <input
              type="number"
              min="1"
              max="1000000"
              value={shoeInput}
              onChange={(event) => setShoeInput(event.target.value)}
            />
          </label>

          <label className="pattern-input">
            Patterns, comma separated
            <input
              type="text"
              value={patternInput}
              placeholder="PPBBPP, PPBBPPBB"
              onChange={(event) => setPatternInput(event.target.value)}
            />
          </label>

          <div className="button-group">
            <button
              type="button"
              className="primary-button"
              onClick={handleRunSimulation}
              disabled={isRunning}
            >
              {isRunning ? 'Running…' : 'Run simulation'}
            </button>

            <button
              type="button"
              className="secondary-button"
              onClick={handleExportCsv}
              disabled={!result || isRunning}
            >
              Export CSV
            </button>
          </div>
        </section>

        {error && (
          <p className="error-message" role="alert">
            {error}
          </p>
        )}

        {result ? (
          <Results result={result} />
        ) : (
          <section className="empty-state">
            <h2>Ready to simulate</h2>
            <p>
              Set the number of shoes and one or more Player/Banker patterns,
              then run the analysis.
            </p>
          </section>
        )}
      </section>
    </main>
  )
}

function Results({ result }: { result: SimulationResult }) {
  const averageBreaks = result.breakTotal / result.shoes

  return (
    <section className="results">
      <div className="results-heading">
        <h2>Simulation summary</h2>
        <span>{result.shoes.toLocaleString()} shoes</span>
      </div>

      <div className="metric-grid">
        <MetricCard
          label="Average breaks"
          value={averageBreaks.toFixed(2)}
          detail="Per shoe"
        />
        <MetricCard
          label="Trending shoes"
          value={`${percentage(result.shoeTypes.Trending, result.shoes)}%`}
          detail={`${result.shoeTypes.Trending.toLocaleString()} shoes`}
        />
        <MetricCard
          label="Choppy shoes"
          value={`${percentage(result.shoeTypes.Choppy, result.shoes)}%`}
          detail={`${result.shoeTypes.Choppy.toLocaleString()} shoes`}
        />
        <MetricCard
          label="Hybrid shoes"
          value={`${percentage(result.shoeTypes.Hybrid, result.shoes)}%`}
          detail={`${result.shoeTypes.Hybrid.toLocaleString()} shoes`}
        />
      </div>

      <div className="table-grid">
        <DataTable
          title="First streak distribution"
          headers={['First streak', 'Shoes', 'Rate']}
          rows={STREAKS.map((streak) => [
            `First ${streak}-streak`,
            result.firstStreakCount[streak].toLocaleString(),
            `${percentage(result.firstStreakCount[streak], result.shoes)}%`,
          ])}
        />

        <DataTable
          title="Streak presence"
          headers={['Maximum streak', 'Shoes', 'Rate']}
          rows={STREAKS.map((streak) => [
            `≥${streak}-streak exists`,
            result.streakPresence[streak].toLocaleString(),
            `${percentage(result.streakPresence[streak], result.shoes)}%`,
          ])}
        />

        <DataTable
          title="Conditional probabilities"
          headers={['Condition after first 2-streak', 'Probability']}
          rows={[
            ['Maximum streak ≥3', `${result.condProbs['≥3'].toFixed(2)}%`],
            ['Maximum streak ≥4', `${result.condProbs['≥4'].toFixed(2)}%`],
            ['Maximum streak ≥5', `${result.condProbs['≥5'].toFixed(2)}%`],
          ]}
        />

        <DataTable
          title="Shoe classification"
          headers={['Classification', 'Shoes', 'Rate']}
          rows={(Object.keys(result.shoeTypes) as Array<keyof typeof result.shoeTypes>).map(
            (type) => [
              type,
              result.shoeTypes[type].toLocaleString(),
              `${percentage(result.shoeTypes[type], result.shoes)}%`,
            ],
          )}
        />
      </div>

      <section className="patterns-section">
        <h2>Pattern positions</h2>
        <p className="section-description">
          Each result records the first occurrence of the pattern among
          non-tie Player/Banker outcomes.
        </p>

        <div className="pattern-grid">
          {result.patterns.map((pattern) => {
            const buckets = result.patternBuckets[pattern]

            return (
              <DataTable
                key={pattern}
                title={`Pattern ${pattern}`}
                headers={['Position', 'Shoes', 'Rate']}
                rows={Object.entries(buckets).map(([bucket, count]) => [
                  bucket,
                  count.toLocaleString(),
                  `${percentage(count, result.shoes)}%`,
                ])}
              />
            )
          })}
        </div>
      </section>
    </section>
  )
}

function MetricCard({
  label,
  value,
  detail,
}: {
  label: string
  value: string
  detail: string
}) {
  return (
    <article className="metric-card">
      <p>{label}</p>
      <strong>{value}</strong>
      <span>{detail}</span>
    </article>
  )
}

function DataTable({
  title,
  headers,
  rows,
}: {
  title: string
  headers: string[]
  rows: string[][]
}) {
  return (
    <section className="data-table-card">
      <h3>{title}</h3>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              {headers.map((header) => (
                <th key={header}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={`${title}-${rowIndex}`}>
                {row.map((cell, cellIndex) => (
                  <td key={`${title}-${rowIndex}-${cellIndex}`}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function percentage(value: number, total: number): string {
  return ((value / total) * 100).toFixed(2)
}

export default App

