// Shared chart defaults for dark theme
export const CHART_COLORS = [
  '#e50914', '#3b82f6', '#10b981', '#f59e0b',
  '#8b5cf6', '#ef4444', '#06b6d4', '#84cc16',
  '#f97316', '#ec4899', '#14b8a6', '#a855f7',
]

export const darkDefaults = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: { color: '#e8eaf0', font: { size: 12 } },
    },
    tooltip: {
      backgroundColor: '#22263a',
      titleColor: '#e8eaf0',
      bodyColor: '#8b90a8',
      borderColor: '#2d3147',
      borderWidth: 1,
    },
  },
  scales: {
    x: {
      ticks: { color: '#8b90a8', font: { size: 11 } },
      grid: { color: 'rgba(255,255,255,0.06)' },
    },
    y: {
      ticks: { color: '#8b90a8', font: { size: 11 } },
      grid: { color: 'rgba(255,255,255,0.06)' },
    },
  },
}
