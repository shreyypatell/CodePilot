import { RefreshCw, Cpu } from 'lucide-react'

const MODE_LABELS = {
  chat: 'Chat Mode',
  generate: 'Code Generation',
  explain: 'Code Explanation',
  fix: 'Bug Fixer',
  analyze: 'File Analysis',
  quiz: 'Coding Quiz',
}

export default function StatusBar({ ollamaStatus, model, models, onModelChange, onRefresh, mode }) {
  return (
    <div className="status-bar">
      {/* Ollama status */}
      <div className="status-indicator" title={`Ollama: ${ollamaStatus}`}>
        <div className={`status-dot ${ollamaStatus}`} />
        <span>Ollama {ollamaStatus}</span>
      </div>

      <div className="status-sep" />

      {/* Model selector */}
      <div className="status-indicator">
        <Cpu size={11} />
        {models.length > 0 ? (
          <select
            className="status-model-select"
            value={model || ''}
            onChange={e => onModelChange(e.target.value)}
          >
            {models.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        ) : (
          <span style={{ color: 'var(--error)' }}>No models found</span>
        )}
      </div>

      <div className="status-sep" />

      {/* Current mode */}
      <span>{MODE_LABELS[mode] || mode}</span>

      {/* Right side */}
      <div className="status-right">
        <button
          className="btn-icon"
          onClick={onRefresh}
          title="Refresh Ollama connection"
          style={{ padding: '2px', border: 'none', cursor: 'pointer' }}
        >
          <RefreshCw size={11} color="var(--text-muted)" />
        </button>
        <span style={{ color: 'var(--text-muted)' }}>CodePilot v1.0</span>
      </div>
    </div>
  )
}
