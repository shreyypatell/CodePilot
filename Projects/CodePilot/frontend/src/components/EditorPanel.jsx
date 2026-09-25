import { useRef, useState } from 'react'
import Editor from '@monaco-editor/react'
import { Code2, Trash2, Stethoscope, AlertCircle } from 'lucide-react'
import { explainError } from '../utils/api'

const LANGUAGES = [
  'javascript', 'typescript', 'python', 'java', 'cpp', 'c', 'csharp',
  'go', 'rust', 'ruby', 'php', 'swift', 'kotlin', 'sql', 'bash',
  'html', 'css', 'json', 'yaml', 'markdown', 'plaintext',
]

const MONACO_OPTIONS = {
  fontSize: 13,
  fontFamily: '"JetBrains Mono", monospace',
  fontLigatures: true,
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  lineNumbers: 'on',
  roundedSelection: true,
  automaticLayout: true,
  padding: { top: 16, bottom: 16 },
  wordWrap: 'on',
  tabSize: 2,
  renderWhitespace: 'selection',
  cursorBlinking: 'smooth',
  smoothScrolling: true,
  contextmenu: true,
  bracketPairColorization: { enabled: true },
  guides: { bracketPairs: true },
}

const MONACO_THEME_DATA = {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: 'comment', foreground: '4a5568', fontStyle: 'italic' },
    { token: 'keyword', foreground: '00e5a0' },
    { token: 'string', foreground: 'a8d8b0' },
    { token: 'number', foreground: 'ffc940' },
    { token: 'type', foreground: '5b9cf6' },
  ],
  colors: {
    'editor.background': '#0d1117',
    'editor.foreground': '#e8edf3',
    'editor.lineHighlightBackground': '#1a1f2680',
    'editor.selectionBackground': '#00e5a020',
    'editorCursor.foreground': '#00e5a0',
    'editorLineNumber.foreground': '#2e3845',
    'editorLineNumber.activeForeground': '#4a5568',
    'editor.inactiveSelectionBackground': '#00e5a010',
    'scrollbarSlider.background': '#252c3680',
    'scrollbarSlider.hoverBackground': '#2e384580',
  },
}

export default function EditorPanel({
  code, setCode, language, setLanguage, errorMessage, setErrorMessage,
  model, quizMode,
}) {
  const editorRef = useRef(null)
  const [detecting, setDetecting] = useState(false)
  const [detectFailMsg, setDetectFailMsg] = useState(null)

  const handleEditorMount = (editor, monaco) => {
    editorRef.current = editor
    monaco.editor.defineTheme('codepilot-dark', MONACO_THEME_DATA)
    monaco.editor.setTheme('codepilot-dark')
  }

  const handleDetectError = async () => {
    if (!code.trim() || detecting) return
    setDetecting(true)
    setDetectFailMsg(null)
    try {
      const result = await explainError(code, language, errorMessage, model)
      if (result.success) {
        setErrorMessage(result.content)
      } else {
        throw new Error(result.error || 'Could not diagnose the error')
      }
    } catch (err) {
      setDetectFailMsg(err.message)
    } finally {
      setDetecting(false)
    }
  }

  return (
    <div className="editor-panel">
      {/* Header */}
      <div className="editor-header">
        <Code2 size={15} color="var(--accent)" />
        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
          Code Editor
        </span>

        <select
          className="editor-lang-select"
          value={language}
          onChange={e => setLanguage(e.target.value)}
        >
          {LANGUAGES.map(l => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>

        <button
          className="btn-icon"
          style={{ marginLeft: 'auto' }}
          onClick={() => {
            setCode('// Your code here...\n')
            setErrorMessage('')
          }}
          title="Clear editor"
        >
          <Trash2 size={13} />
        </button>
      </div>

      {/* Monaco Editor */}
      <div className="editor-container">
        <Editor
          height="100%"
          language={language}
          value={code}
          onChange={(val) => setCode(val || '')}
          onMount={handleEditorMount}
          options={MONACO_OPTIONS}
          theme="codepilot-dark"
          loading={
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              height: '100%', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)',
              fontSize: '13px', gap: '10px'
            }}>
              <div className="spinner" />
              Loading editor...
            </div>
          }
        />
      </div>

      {/* Error message input (for Fix mode) */}
      {!quizMode && (
        <>
          <div
            className="error-input-label"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}
          >
            <span>
              Error Message <span style={{ color: 'var(--text-muted)' }}>(optional — for Fix mode)</span>
            </span>
            <button
              className="btn-icon"
              onClick={handleDetectError}
              disabled={!code.trim() || detecting}
              title="Analyze the code and explain why it's erroring"
              style={{
                display: 'flex', alignItems: 'center', gap: '4px',
                padding: '3px 8px', fontSize: '11px', fontFamily: 'var(--font-mono)',
                textTransform: 'none', letterSpacing: 0,
              }}
            >
              {detecting
                ? <div className="spinner" style={{ width: 11, height: 11 }} />
                : <Stethoscope size={12} />
              }
              {detecting ? 'Diagnosing...' : 'Why is this erroring?'}
            </button>
          </div>
          {detectFailMsg && (
            <div className="error-banner" style={{ margin: '0 16px 8px', fontSize: '12px' }}>
              <AlertCircle size={13} />
              {detectFailMsg}
            </div>
          )}
          <textarea
            className="error-input"
            value={errorMessage}
            onChange={e => setErrorMessage(e.target.value)}
            placeholder="Paste any error messages or stack traces here, or click 'Why is this erroring?' to have CodePilot diagnose it..."
          />
        </>
      )}
    </div>
  )
}
