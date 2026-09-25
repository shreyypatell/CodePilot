import { MessageSquare, Wand2, BookOpen, Wrench, FileSearch, GraduationCap, ChevronLeft, ChevronRight } from 'lucide-react'

const MODE_META = {
  chat:     { icon: MessageSquare, label: 'Chat',     desc: 'General assistant' },
  generate: { icon: Wand2,         label: 'Generate', desc: 'Code from prompt' },
  explain:  { icon: BookOpen,      label: 'Explain',  desc: 'Understand code' },
  fix:      { icon: Wrench,        label: 'Fix Bugs', desc: 'Debug & repair' },
  analyze:  { icon: FileSearch,    label: 'Analyze',  desc: 'Review a file' },
  quiz:     { icon: GraduationCap, label: 'Quiz',      desc: 'Practice interview questions' },
}

export default function Sidebar({ mode, setMode, modes, open, toggle }) {
  return (
    <div className={`sidebar ${open ? '' : 'collapsed'}`}>
      <div className="sidebar-logo" onClick={toggle} title="Toggle sidebar">
        <div className="sidebar-logo-icon">CP</div>
        {open && (
          <div className="sidebar-logo-text">
            Code<span>Pilot</span>
          </div>
        )}
        {open && (
          <span style={{ marginLeft: 'auto', color: 'var(--text-muted)', display: 'flex' }}>
            <ChevronLeft size={14} />
          </span>
        )}
        {!open && (
          <span style={{ position: 'absolute', left: 60, color: 'var(--text-muted)', display: 'flex' }}>
            <ChevronRight size={14} />
          </span>
        )}
      </div>

      <nav className="sidebar-nav">
        {open && <div className="nav-label">Modes</div>}
        {modes.map((m) => {
          const { icon: Icon, label, desc } = MODE_META[m]
          return (
            <button
              key={m}
              className={`nav-item ${mode === m ? 'active' : ''}`}
              onClick={() => setMode(m)}
              title={open ? desc : label}
            >
              <Icon className="nav-item-icon" size={18} />
              {open && <span className="nav-item-text">{label}</span>}
            </button>
          )
        })}
      </nav>

      {open && (
        <div style={{
          padding: '12px 16px',
          borderTop: '1px solid var(--border)',
          fontSize: '11px',
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-mono)',
        }}>
          Powered by Ollama
        </div>
      )}
    </div>
  )
}
