import { NavLink } from 'react-router-dom'
import './Sidebar.css'

const NAV_ITEMS = [
  { to: '/',          icon: '🎬', label: 'Catalog'     },
  { to: '/ratings',   icon: '⭐', label: 'Ratings'     },
  { to: '/boxoffice', icon: '💰', label: 'Box Office'  },
  { to: '/platforms', icon: '📺', label: 'Platforms'   },
  { to: '/genres',    icon: '🎭', label: 'Genres'      },
  { to: '/cast',      icon: '👥', label: 'Cast & Crew' },
  { to: '/runtime',   icon: '⏱',  label: 'Runtime'     },
  { to: '/awards',    icon: '🏆', label: 'Awards'      },
]

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="brand-icon">🎬</span>
        <span className="brand-text">OTT Analytics</span>
      </div>
      <nav className="sidebar-nav">
        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer">
        <span>Movie &amp; OTT Dashboard</span>
      </div>
    </aside>
  )
}
