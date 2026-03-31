import { useState, useEffect } from 'react'

const ROLE_LABELS = {
  aluno:       'Aluno',
  professor:   'Professor',
  funcionario: 'Funcionário',
  visitante:   'Visitante',
}

export default function TagManager() {
  const [tags,    setTags]    = useState([])
  const [form,    setForm]    = useState({ rfid: '', name: '', role: 'aluno' })
  const [error,   setError]   = useState('')
  const [success, setSuccess] = useState('')

  const loadTags = async () => {
    try {
      const res  = await fetch('/api/tags')
      const data = await res.json()
      setTags(data)
    } catch {
      setError('Erro ao carregar tags')
    }
  }

  useEffect(() => { loadTags() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    try {
      const res  = await fetch('/api/tags', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Erro ao cadastrar'); return }
      setSuccess(`Tag de "${form.name}" cadastrada com sucesso!`)
      setForm({ rfid: '', name: '', role: 'aluno' })
      loadTags()
    } catch {
      setError('Erro ao comunicar com o servidor')
    }
  }

  const handleToggle = async (id) => {
    await fetch(`/api/tags/${id}/toggle`, { method: 'PATCH' })
    loadTags()
  }

  const handleDelete = async (id, name) => {
    if (!confirm(`Remover a tag de "${name}"?`)) return
    await fetch(`/api/tags/${id}`, { method: 'DELETE' })
    loadTags()
  }

  return (
    <div className="tag-manager">
      {/* ── Formulário de cadastro ── */}
      <div className="form-card">
        <h2>Cadastrar Nova Tag</h2>

        {error   && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit} className="tag-form">
          <div className="form-group">
            <label>ID da Tag RFID</label>
            <input
              type="text"
              value={form.rfid}
              onChange={e => setForm({ ...form, rfid: e.target.value.toUpperCase() })}
              placeholder="Ex: A1B2C3D4"
              required
            />
          </div>
          <div className="form-group">
            <label>Nome do Usuário</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="Ex: Maria Silva"
              required
            />
          </div>
          <div className="form-group">
            <label>Perfil de Acesso</label>
            <select
              value={form.role}
              onChange={e => setForm({ ...form, role: e.target.value })}
            >
              {Object.entries(ROLE_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn-primary">Cadastrar Tag</button>
        </form>
      </div>

      {/* ── Lista de tags ── */}
      <div className="tags-list">
        <h2>Tags Cadastradas ({tags.length})</h2>

        {tags.length === 0 ? (
          <p className="empty-state">Nenhuma tag cadastrada ainda.</p>
        ) : (
          <table className="tags-table">
            <thead>
              <tr>
                <th>Tag RFID</th>
                <th>Nome</th>
                <th>Perfil</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {tags.map(tag => (
                <tr key={tag._id}>
                  <td className="rfid-cell">{tag.rfid}</td>
                  <td>{tag.name}</td>
                  <td>{ROLE_LABELS[tag.role] || tag.role}</td>
                  <td>
                    <span className={`badge ${tag.active ? 'badge-allowed' : 'badge-inactive'}`}>
                      {tag.active ? 'Ativa' : 'Inativa'}
                    </span>
                  </td>
                  <td className="actions">
                    <button
                      className={`btn-sm ${tag.active ? 'btn-warn' : 'btn-success'}`}
                      onClick={() => handleToggle(tag._id)}
                    >
                      {tag.active ? 'Desativar' : 'Ativar'}
                    </button>
                    <button
                      className="btn-sm btn-danger"
                      onClick={() => handleDelete(tag._id, tag.name)}
                    >
                      Remover
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
