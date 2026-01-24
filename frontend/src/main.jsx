import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import ErrorBoundary from './ErrorBoundary.jsx'

// Layout
import Layout from './components/Layout.jsx'

// Pages
import Dashboard from './App.jsx' // Existing App.jsx becomes Dashboard
import TransitsPage from './pages/TransitsPage.jsx'
import TimePage from './pages/TimePage.jsx'
import ProjectsPage from './pages/ProjectsPage.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="transits" element={<TransitsPage />} />
            <Route path="time" element={<TimePage />} />
            <Route path="projects" element={<ProjectsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
)
