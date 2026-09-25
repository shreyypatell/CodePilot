import { useState, useCallback } from 'react'
import { useOllama } from './hooks/useOllama'
import Sidebar from './components/Sidebar'
import ChatPanel from './components/ChatPanel'
import QuizPanel from './components/QuizPanel'
import EditorPanel from './components/EditorPanel'
import StatusBar from './components/StatusBar'
import './styles/app.css'

const MODES = ['chat', 'generate', 'explain', 'fix', 'analyze', 'quiz']

export default function App() {
  const ollama = useOllama()

  // UI state
  const [mode, setMode] = useState('chat')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [showEditor, setShowEditor] = useState(true)

  // Editor state
  const [editorCode, setEditorCode] = useState('// Your code here...\n')
  const [editorLanguage, setEditorLanguage] = useState('javascript')
  const [errorMessage, setErrorMessage] = useState('')

  // File upload state
  const [uploadedFile, setUploadedFile] = useState(null) // { name, content }

  // Chat history (per mode)
  const [chatHistory, setChatHistory] = useState([])

  const addToHistory = useCallback((role, content) => {
    setChatHistory(prev => [...prev, { role, content, id: Date.now() + Math.random() }])
  }, [])

  const clearHistory = useCallback(() => {
    setChatHistory([])
    setUploadedFile(null)
  }, [])

  return (
    <div className="app-shell">
      <Sidebar
        mode={mode}
        setMode={(m) => { setMode(m); clearHistory() }}
        modes={MODES}
        open={sidebarOpen}
        toggle={() => setSidebarOpen(o => !o)}
      />

      <div className="app-content">
        <div className={`panel-container ${showEditor ? 'split' : 'full'}`}>
          {/* Left: Chat / Quiz / Output Panel */}
          {mode === 'quiz' ? (
            <QuizPanel
              model={ollama.selectedModel}
              editorCode={editorCode}
              setEditorCode={setEditorCode}
              editorLanguage={editorLanguage}
              setEditorLanguage={setEditorLanguage}
              showEditorToggle={showEditor}
              onToggleEditor={() => setShowEditor(v => !v)}
            />
          ) : (
            <ChatPanel
              mode={mode}
              history={chatHistory}
              onAddHistory={addToHistory}
              onClear={clearHistory}
              model={ollama.selectedModel}
              editorCode={editorCode}
              editorLanguage={editorLanguage}
              errorMessage={errorMessage}
              uploadedFile={uploadedFile}
              setUploadedFile={setUploadedFile}
              showEditorToggle={showEditor}
              onToggleEditor={() => setShowEditor(v => !v)}
            />
          )}

          {/* Right: Monaco Editor */}
          {showEditor && (
            <EditorPanel
              code={editorCode}
              setCode={setEditorCode}
              language={editorLanguage}
              setLanguage={setEditorLanguage}
              errorMessage={errorMessage}
              setErrorMessage={setErrorMessage}
              model={ollama.selectedModel}
              quizMode={mode === 'quiz'}
            />
          )}
        </div>

        <StatusBar
          ollamaStatus={ollama.status}
          model={ollama.selectedModel}
          models={ollama.models}
          onModelChange={ollama.setSelectedModel}
          onRefresh={ollama.refresh}
          mode={mode}
        />
      </div>
    </div>
  )
}
