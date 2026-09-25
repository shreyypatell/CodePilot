import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Send, Trash2, PanelRight, PanelRightClose,
  Bot, User, Wand2, BookOpen, Wrench, FileSearch, MessageSquare, AlertCircle
} from 'lucide-react'
import { generateCode, explainCode, fixCode, analyzeFile, chat } from '../utils/api'
import MessageRenderer from './MessageRenderer'
import FileUpload from './FileUpload'

const MODE_CONFIG = {
  chat: {
    icon: MessageSquare,
    title: 'Chat',
    placeholder: 'Ask me anything about code...',
    suggestions: [
      'What is the difference between async/await and promises?',
      'Explain Big O notation with examples',
      'What are design patterns? Give me examples',
      'How does garbage collection work in Python?',
    ],
  },
  generate: {
    icon: Wand2,
    title: 'Generate Code',
    placeholder: 'Describe the code you want to generate...',
    suggestions: [
      'Build a REST API with Flask and SQLite',
      'Create a React hook for debounced search',
      'Write a Python script to parse JSON files',
      'Generate a binary search tree implementation',
    ],
  },
  explain: {
    icon: BookOpen,
    title: 'Explain Code',
    placeholder: 'Paste or describe code to explain (or use the editor on the right)...',
    suggestions: [
      'Explain the code in the editor',
      'What does this recursive function do?',
      'Explain async/await step by step',
    ],
  },
  fix: {
    icon: Wrench,
    title: 'Fix Bugs',
    placeholder: 'Describe the issue, or use the editor to paste your buggy code...',
    suggestions: [
      'Fix the code in the editor',
      'Why is my React useEffect running twice?',
      "My API returns 400 but I'm not sure why",
    ],
  },
  analyze: {
    icon: FileSearch,
    title: 'Analyze File',
    placeholder: 'Upload a file or paste code to analyze its quality, patterns, and issues...',
    suggestions: [],
  },
}

export default function ChatPanel({
  mode,
  history,
  onAddHistory,
  onClear,
  model,
  editorCode,
  editorLanguage,
  errorMessage,
  uploadedFile,
  setUploadedFile,
  showEditorToggle,
  onToggleEditor,
}) {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const messagesEndRef = useRef(null)
  const textareaRef = useRef(null)

  const cfg = MODE_CONFIG[mode]
  const Icon = cfg.icon

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [history, loading])

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px'
    }
  }, [input])

  const handleSubmit = useCallback(async (overrideInput) => {
    const userMessage = (overrideInput || input).trim()
    if (!userMessage && mode !== 'explain' && mode !== 'fix') return
    if (loading) return

    setError(null)
    setLoading(true)
    setInput('')

    const displayMsg = userMessage || '[Using code from editor]'
    onAddHistory('user', displayMsg)

    try {
      let result

      if (mode === 'generate') {
        const lang = userMessage.match(/\b(python|javascript|typescript|java|go|rust|cpp|c\+\+|ruby|php|swift|kotlin|sql|bash|html|css)\b/i)?.[1] || editorLanguage
        result = await generateCode(userMessage, lang, model)

      } else if (mode === 'explain') {
        const codeToExplain = editorCode || userMessage
        result = await explainCode(codeToExplain, editorLanguage, model)

      } else if (mode === 'fix') {
        const codeToFix = editorCode || userMessage
        result = await fixCode(codeToFix, errorMessage, editorLanguage, model)

      } else if (mode === 'analyze') {
        const content = uploadedFile?.content || editorCode || userMessage
        const filename = uploadedFile?.name || ''
        result = await analyzeFile(content, filename, model)

      } else {
        const chatHist = history.map(m => ({ role: m.role, content: m.content }))
        result = await chat(
          userMessage,
          chatHist,
          uploadedFile?.content || null,
          model
        )
      }

      if (result.success) {
        onAddHistory('assistant', result.content)
      } else {
        throw new Error(result.error || 'Unknown error from backend')
      }
    } catch (err) {
      setError(err.message)
      onAddHistory('assistant', `❌ **Error:** ${err.message}`)
    } finally {
      setLoading(false)
    }
  }, [input, mode, loading, history, model, editorCode, editorLanguage, errorMessage, uploadedFile, onAddHistory])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="chat-panel">
      {/* Header */}
      <div className="chat-header">
        <div className="chat-title">
          <Icon size={16} color="var(--accent)" />
          {cfg.title}
          <span className="chat-title-badge">{mode}</span>
        </div>
        <div className="chat-actions">
          {history.length > 0 && (
            <button className="btn-icon" onClick={onClear} title="Clear conversation">
              <Trash2 size={14} />
            </button>
          )}
          <button
            className="btn-icon"
            onClick={onToggleEditor}
            title={showEditorToggle ? 'Hide editor' : 'Show editor'}
          >
            {showEditorToggle ? <PanelRightClose size={14} /> : <PanelRight size={14} />}
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="chat-messages">
        {history.length === 0 && !loading ? (
          <div className="empty-state">
            <div className="empty-icon">
              <Icon size={22} />
            </div>
            <div className="empty-title">{cfg.title}</div>
            <div className="empty-desc">
              {mode === 'chat' && 'Ask any coding question, get expert answers with code examples.'}
              {mode === 'generate' && 'Describe what you need — get production-quality code instantly.'}
              {mode === 'explain' && 'Paste code in the editor or describe it — get a clear explanation.'}
              {mode === 'fix' && "Put your buggy code in the editor — I'll find and fix the issues."}
              {mode === 'analyze' && 'Upload a code file or paste code in the editor for a thorough review.'}
            </div>
            {cfg.suggestions.length > 0 && (
              <div className="suggestion-chips">
                {cfg.suggestions.map((s, i) => (
                  <button key={i} className="chip" onClick={() => handleSubmit(s)}>
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            {history.map((msg) => (
              <div key={msg.id} className="message animate-fade-in">
                <div className="message-header">
                  <div className={`message-avatar ${msg.role}`}>
                    {msg.role === 'user' ? <User size={12} /> : <Bot size={12} />}
                  </div>
                  <span className="message-role">{msg.role === 'user' ? 'You' : 'CodePilot'}</span>
                </div>
                <div className={`message-body ${msg.role}`}>
                  {msg.role === 'assistant'
                    ? <MessageRenderer content={msg.content} />
                    : <span>{msg.content}</span>
                  }
                </div>
              </div>
            ))}

            {loading && (
              <div className="message animate-fade-in">
                <div className="message-header">
                  <div className="message-avatar assistant"><Bot size={12} /></div>
                  <span className="message-role">CodePilot</span>
                </div>
                <div className="message-body" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div className="spinner" />
                  <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                    Thinking...
                  </span>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="chat-input-area">
        {(mode === 'analyze' || mode === 'chat') && (
          <div style={{ marginBottom: '10px' }}>
            <FileUpload
              onFileLoad={setUploadedFile}
              uploadedFile={uploadedFile}
              onClear={() => setUploadedFile(null)}
            />
          </div>
        )}

        {error && (
          <div className="error-banner" style={{ marginBottom: '10px' }}>
            <AlertCircle size={14} />
            {error}
          </div>
        )}

        <div className="input-row">
          <textarea
            ref={textareaRef}
            className="chat-textarea"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={cfg.placeholder}
            disabled={loading}
            rows={1}
          />
          <button
            className="btn-send"
            onClick={() => handleSubmit()}
            disabled={loading || (!input.trim() && mode !== 'explain' && mode !== 'fix' && mode !== 'analyze')}
            title="Send (Enter)"
          >
            {loading
              ? <div className="spinner" style={{ borderTopColor: '#000' }} />
              : <Send size={16} />
            }
          </button>
        </div>

        <div style={{
          marginTop: '8px',
          fontSize: '11px',
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-mono)',
        }}>
          {mode === 'explain' || mode === 'fix'
            ? 'Enter ↵ to send · Uses code from editor · Shift+Enter for newline'
            : 'Enter ↵ to send · Shift+Enter for newline'
          }
        </div>
      </div>
    </div>
  )
}
