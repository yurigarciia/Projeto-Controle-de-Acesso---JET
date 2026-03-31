export default function AccessTable({ logs }) {
  if (logs.length === 0) {
    return (
      <div className="empty-state">
        <p>Nenhum registro encontrado.</p>
      </div>
    )
  }

  return (
    <div className="table-wrapper">
      <table className="access-table">
        <thead>
          <tr>
            <th>Status</th>
            <th>Usuário</th>
            <th>Tag RFID</th>
            <th>Dispositivo</th>
            <th>Data / Hora</th>
          </tr>
        </thead>
        <tbody>
          {logs.map(log => (
            <tr key={log._id} className={log.authorized ? 'row-allowed' : 'row-denied'}>
              <td>
                <span className={`badge ${log.authorized ? 'badge-allowed' : 'badge-denied'}`}>
                  {log.authorized ? '✓ Liberado' : '✗ Negado'}
                </span>
              </td>
              <td>{log.user}</td>
              <td className="rfid-cell">{log.rfid}</td>
              <td>{log.device}</td>
              <td>{new Date(log.timestamp).toLocaleString('pt-BR')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
