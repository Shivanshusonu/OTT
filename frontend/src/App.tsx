import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Sidebar from './components/layout/Sidebar'
import CatalogPage from './pages/CatalogPage'
import RatingsPage from './pages/RatingsPage'
import BoxOfficePage from './pages/BoxOfficePage'
import PlatformsPage from './pages/PlatformsPage'
import GenresPage from './pages/GenresPage'
import CastPage from './pages/CastPage'
import RuntimePage from './pages/RuntimePage'
import AwardsPage from './pages/AwardsPage'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <div className="app-layout">
        <Sidebar />
        <main className="app-main">
          <Routes>
            <Route path="/" element={<CatalogPage />} />
            <Route path="/ratings" element={<RatingsPage />} />
            <Route path="/boxoffice" element={<BoxOfficePage />} />
            <Route path="/platforms" element={<PlatformsPage />} />
            <Route path="/genres" element={<GenresPage />} />
            <Route path="/cast" element={<CastPage />} />
            <Route path="/runtime" element={<RuntimePage />} />
            <Route path="/awards" element={<AwardsPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
