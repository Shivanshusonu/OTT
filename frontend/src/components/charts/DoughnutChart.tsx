import { Doughnut } from 'react-chartjs-2'
import { CHART_COLORS } from './chartDefaults'

interface DoughnutChartProps {
  labels: string[]
  data: number[]
  title?: string
  loading?: boolean
  error?: string | null
}

export default function DoughnutChart({ labels, data, title, loading = false, error = null }: DoughnutChartProps) {
  if (loading) return <div className="chart-loading">Loading…</div>
  if (error) return <div className="chart-error">Error: {error}</div>
  if (!labels?.length || !data?.length) return <div className="chart-loading">No data yet</div>

  const chartData = {
    labels,
    datasets: [{
      data,
      backgroundColor: CHART_COLORS.slice(0, labels.length),
      borderColor: '#0f1117',
      borderWidth: 2,
    }],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: '#e8eaf0', font: { size: 12 } }, position: 'right' as const },
      tooltip: {
        backgroundColor: '#22263a',
        titleColor: '#e8eaf0',
        bodyColor: '#8b90a8',
        borderColor: '#2d3147',
        borderWidth: 1,
      },
      title: title ? { display: true, text: title, color: '#8b90a8', font: { size: 12 } } : { display: false },
    },
  }

  return (
    <div className="chart-wrapper">
      <Doughnut data={chartData} options={options} />
    </div>
  )
}
