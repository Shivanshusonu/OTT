import type { ReactNode } from 'react'
import './PageShell.css'

interface PageShellProps {
  title: string
  subtitle?: string
  children: ReactNode
}

export default function PageShell({ title, subtitle, children }: PageShellProps) {
  return (
    <div className="page-shell">
      <div className="page-header">
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      <div className="page-content">{children}</div>
    </div>
  )
}
