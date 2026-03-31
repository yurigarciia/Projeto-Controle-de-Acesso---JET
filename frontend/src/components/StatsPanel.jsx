export default function StatsPanel({ stats }) {
  return (
    <div className="stats-panel">
      <div className="stat-card total">
        <span className="stat-number">{stats.total}</span>
        <span className="stat-label">Total de Tentativas</span>
      </div>
      <div className="stat-card authorized">
        <span className="stat-number">{stats.authorized}</span>
        <span className="stat-label">Acessos Liberados</span>
      </div>
      <div className="stat-card denied">
        <span className="stat-number">{stats.denied}</span>
        <span className="stat-label">Acessos Negados</span>
      </div>
    </div>
  )
}
