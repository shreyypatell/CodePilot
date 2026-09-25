import { useRef, useState } from 'react'
import { Upload, X, FileCode } from 'lucide-react'

const ALLOWED_EXTENSIONS = [
  '.py', '.js', '.jsx', '.ts', '.tsx', '.java', '.cpp', '.c', '.h',
  '.go', '.rs', '.rb', '.php', '.swift', '.kt', '.cs', '.html', '.css',
  '.json', '.yaml', '.yml', '.toml', '.sh', '.bash', '.sql', '.md', '.txt',
]

export default function FileUpload({ onFileLoad, uploadedFile, onClear }) {
  const inputRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState(null)

  const processFile = (file) => {
    setError(null)
    const ext = '.' + file.name.split('.').pop().toLowerCase()
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setError(`Unsupported file type. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`)
      return
    }
    if (file.size > 500 * 1024) {
      setError('File too large. Max size: 500KB')
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      onFileLoad({ name: file.name, content: e.target.result })
    }
    reader.readAsText(file)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }

  if (uploadedFile) {
    return (
      <div className="file-context-banner">
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <FileCode size={13} />
          {uploadedFile.name}
          <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>
            ({Math.round(uploadedFile.content.length / 1024 * 10) / 10}KB loaded)
          </span>
        </span>
        <button
          onClick={onClear}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', display: 'flex' }}
        >
          <X size={13} />
        </button>
      </div>
    )
  }

  return (
    <div>
      <div
        className={`upload-zone ${dragOver ? 'drag-over' : ''}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ALLOWED_EXTENSIONS.join(',')}
          onChange={(e) => e.target.files[0] && processFile(e.target.files[0])}
        />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <Upload size={20} />
          <div>
            <strong style={{ color: 'var(--text-secondary)' }}>Upload a code file</strong>
            <div style={{ fontSize: '11px', marginTop: '2px' }}>
              Click or drag & drop · Max 500KB
            </div>
          </div>
        </div>
      </div>
      {error && (
        <div style={{ color: 'var(--error)', fontSize: '12px', marginTop: '6px' }}>
          {error}
        </div>
      )}
    </div>
  )
}
