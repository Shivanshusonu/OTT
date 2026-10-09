import { Bar } from 'react-chartjs-2'
import { CHART_COLORS, darkDefaults } from './chartDefaults'

interface Dataset {
  label: string
  data: number[]
  backgroundColor?: string | string[]
}

interface BarChartProps {
  labels: string[]
  datasets: Dataset[]
  title?: string
  horizontal?: boolean
  stacked?: boolean
  loading?: boolean
  error?: string | null
}

export default function BarChart({
  labels, datasets, title, horizontal = false, stacked = false, loading = false, error = null,
}: BarChartProps) {
  if (loading) return <div className="chart-loading">Loading…</div>
  if (error) return <div className="chart-error">Error: {error}</div>
  if (!labels?.length || !datasets?.length) return <div className="chart-loading">No data yet</div>

  const data = {
    labels,
    datasets: datasets.map((ds, i) => ({
      ...ds,
      backgroundColor: ds.backgroundColor ?? CHART_COLORS[i % CHART_COLORS.length],
    })),
  }

  const options = {
    ...darkDefaults,
    indexAxis: (horizontal ? 'y' : 'x') as 'x' | 'y',
    plugins: {
      ...darkDefaults.plugins,
      title: title ? { display: true, text: title, color: '#8b90a8', font: { size: 12 } } : { display: false },
    },
    scales: {
      x: { ...darkDefaults.scales.x, stacked },
      y: { ...darkDefaults.scales.y, stacked },
    },
  }

  return (
    <div className="chart-wrapper">
      <Bar data={data} options={options} />
    </div>
  )
}
