import { Scatter } from 'react-chartjs-2'
import { CHART_COLORS } from './chartDefaults'

interface ScatterPoint { x: number; y: number; label?: string }

interface ScatterDataset {
  label: string
  data: ScatterPoint[]
  backgroundColor?: string
}

interface ScatterChartProps {
  datasets: ScatterDataset[]
  title?: string
  xLabel?: string
  yLabel?: string
  loading?: boolean
  error?: string | null
}

export default function ScatterChart({
  datasets, title, xLabel, yLabel, loading = false, error = null,
}: ScatterChartProps) {
  if (loading) return <div className="chart-loading">Loading…</div>
  if (error) return <div className="chart-error">Error: {error}</div>
  if (!datasets?.length) return <div className="chart-loading">No data yet</div>

  const chartData = {
    datasets: datasets.map((ds, i) => ({
      ...ds,
      backgroundColor: ds.backgroundColor ?? `${CHART_COLORS[i % CHART_COLORS.length]}bb`,
      pointRadius: 5,
      pointHoverRadius: 7,
    })),
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: '#e8eaf0', font: { size: 12 } } },
      tooltip: {
        backgroundColor: '#22263a',
        titleColor: '#e8eaf0',
        bodyColor: '#8b90a8',
        borderColor: '#2d3147',
        borderWidth: 1,
        callbacks: {
          label: (ctx: { raw: unknown }) => {
            const pt = ctx.raw as ScatterPoint
            return pt.label ? `${pt.label}: (${pt.x}, ${pt.y})` : `(${pt.x}, ${pt.y})`
          },
        },
      },
      title: title ? { display: true, text: title, color: '#8b90a8', font: { size: 12 } } : { display: false },
    },
    scales: {
      x: {
        ticks: { color: '#8b90a8', font: { size: 11 } },
        grid: { color: 'rgba(255,255,255,0.06)' },
        title: xLabel ? { display: true, text: xLabel, color: '#8b90a8' } : { display: false },
      },
      y: {
        ticks: { color: '#8b90a8', font: { size: 11 } },
        grid: { color: 'rgba(255,255,255,0.06)' },
        title: yLabel ? { display: true, text: yLabel, color: '#8b90a8' } : { display: false },
      },
    },
  }

  return (
    <div className="chart-wrapper">
      <Scatter data={chartData} options={options} />
    </div>
  )
}
