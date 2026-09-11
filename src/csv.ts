import type { CsvRecord } from './types'

export function downloadCsv(records: CsvRecord[]): void {
  if (records.length === 0) {
    return
  }

  const headers = Object.keys(records[0])

  const content = [
    headers.join(','),
    ...records.map((record) =>
      headers.map((header) => escapeCsvValue(record[header])).join(','),
    ),
  ].join('\n')

  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = 'baccarat-simulation.csv'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  URL.revokeObjectURL(url)
}

function escapeCsvValue(value: string | number): string {
  const text = String(value)

  if (/[",\n]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`
  }

  return text
}

