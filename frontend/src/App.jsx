import { useState, useEffect, useCallback } from 'react'
import StatsPanel   from './components/StatsPanel'
import AccessTable  from './components/AccessTable'
import TagManager   from './components/TagManager'
import SystemStatus from './components/SystemStatus'

const REFRESH_INTERVAL = 5000 // ms

export default function App() {
  const [activeTab,   setActiveTab]   = useState('dashboard')
  const [logs,        setLogs]        = useState([])
  const [filter,      setFilter]      = useState('all')
  const [online,      setOnline]      = useState(false)
  const [lastUpdate,  setLastUpdate]  = useState(null)

  const fetchLogs = useCallback(async () => {
    try {
      const query = filter !== 'all' ? `?status=${filter}` : ''
      const res   = await fetch(`/api/logs${query}`)
      if (!res.ok) throw new Error()
      const data  = await res.json()
      setLogs(data)
      setOnline(true)
      setLastUpdate(new Date())
    } catch {
      setOnline(false)
    }
  }, [filter])

  // Busca inicial + auto-refresh a cada 5 segundos
  useEffect(() => {
    fetchLogs()
    const timer = setInterval(fetchLogs, REFRESH_INTERVAL)
    return () => clearInterval(timer)
  }, [fetchLogs])

  const stats = {
    total:      logs.length,
    authorized: logs.filter(l =>  l.authorized).length,
    denied:     logs.filter(l => !l.authorized).length,
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <h1>Controle de Acesso IoT</h1>
          <span className="subtitle">Laboratório de Inovação</span>
        </div>
        <SystemStatus online={online} lastUpdate={lastUpdate} />
      </header>

      <nav className="nav-tabs">
        <button
          className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          Dashboard
        </button>
        <button
          className={`tab-btn ${activeTab === 'tags' ? 'active' : ''}`}
          onClick={() => setActiveTab('tags')}
        >
          Tags Autorizadas
        </button>
      </nav>

      <main className="app-main">
        {activeTab === 'dashboard' && (
          <div className="dashboard">
            <StatsPanel stats={stats} />

            <div className="filter-bar">
              <span className="filter-label">Filtrar:</span>
              {[
                { key: 'all',        label: 'Todos'    },
                { key: 'authorized', label: 'Liberados' },
                { key: 'denied',     label: 'Negados'   },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  className={`filter-btn ${filter === key ? 'active' : ''}`}
                  onClick={() => setFilter(key)}
                >
                  {label}
                </button>
              ))}
              <button className="refresh-btn" onClick={fetchLogs} title="Atualizar agora">
                ↻ Atualizar
              </button>
            </div>

            <AccessTable logs={logs} />
          </div>
        )}

        {activeTab === 'tags' && <TagManager />}
      </main>
    </div>
  )
}
