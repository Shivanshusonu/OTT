import { Line } from 'react-chartjs-2'
import { CHART_COLORS, darkDefaults } from './chartDefaults'

interface LineDataset {
  label: string
  data: number[]
  borderColor?: string
  backgroundColor?: string
  fill?: boolean
}

interface LineChartProps {
  labels: string[]
  datasets: LineDataset[]
  title?: string
  loading?: boolean
  error?: string | null
}

export default function LineChart({
  labels, datasets, title, loading = false, error = null,
}: LineChartProps) {
  if (loading) return <div className="chart-loading">Loading…</div>
  if (error) return <div className="chart-error">Error: {error}</div>
  if (!labels?.length || !datasets?.length) return <div className="chart-loading">No data yet</div>

  const data = {
    labels,
    datasets: datasets.map((ds, i) => ({
      ...ds,
      borderColor: ds.borderColor ?? CHART_COLORS[i % CHART_COLORS.length],
      backgroundColor: ds.backgroundColor ?? `${CHART_COLORS[i % CHART_COLORS.length]}22`,
      tension: 0.3,
      pointRadius: 3,
    })),
  }

  const options = {
    ...darkDefaults,
    plugins: {
      ...darkDefaults.plugins,
      title: title ? { display: true, text: title, color: '#8b90a8', font: { size: 12 } } : { display: false },
    },
  }

  return (
    <div className="chart-wrapper">
      <Line data={data} options={options} />
    </div>
  )
}
