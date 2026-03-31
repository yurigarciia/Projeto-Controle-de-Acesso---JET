export default function SystemStatus({ online, lastUpdate }) {
  const timeStr = lastUpdate
    ? lastUpdate.toLocaleTimeString('pt-BR')
    : '--:--:--'

  return (
    <div className="system-status">
      <span className={`status-dot ${online ? 'online' : 'offline'}`} />
      <span className="status-text">
        {online ? 'Sistema Online' : 'Sem conexão'}
      </span>
      {lastUpdate && (
        <span className="status-time">| Atualizado: {timeStr}</span>
      )}
    </div>
  )
}
