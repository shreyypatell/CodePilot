import { useState, useCallback, useRef, useEffect } from 'react'
import {
  GraduationCap, RefreshCw, CheckCircle2, XCircle, Eye,
  PanelRight, PanelRightClose, AlertCircle, Sparkles,
} from 'lucide-react'
import { generateQuiz, checkQuizAnswer } from '../utils/api'
import MessageRenderer from './MessageRenderer'
import CodeBlock from './CodeBlock'

const QUIZ_LANGUAGES = [
  'javascript', 'typescript', 'python', 'java', 'cpp', 'c', 'csharp',
  'go', 'rust', 'ruby', 'php', 'swift', 'kotlin', 'sql',
]

const DIFFICULTIES = [
  { value: '', label: 'Random difficulty' },
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
]

export default function QuizPanel({
  model,
  editorCode,
  setEditorCode,
  editorLanguage,
  setEditorLanguage,
  showEditorToggle,
  onToggleEditor,
}) {
  const [language, setLanguage] = useState(
    QUIZ_LANGUAGES.includes(editorLanguage) ? editorLanguage : 'javascript'
  )
  const [difficulty, setDifficulty] = useState('')
  const [question, setQuestion] = useState(null)
  const [askedTopics, setAskedTopics] = useState([])
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(false)
  const [feedback, setFeedback] = useState(null) // { correct, message }
  const [revealed, setRevealed] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [errorMsg, setErrorMsg] = useState(null)
  const bodyRef = useRef(null)

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }, [question])

  const handleNewQuiz = useCallback(async () => {
    setLoading(true)
    setErrorMsg(null)
    setFeedback(null)
    setRevealed(false)
    setAttempts(0)

    try {
      const res = await generateQuiz(language, difficulty, askedTopics, model)
      if (!res.success) throw new Error(res.error || 'Failed to generate a question')

      setQuestion(res.quiz)
      setEditorLanguage(language)
      setEditorCode(res.quiz.starter_code || `// Write your ${language} solution here...\n`)
      setAskedTopics(prev => [...prev, res.quiz.topic].filter(Boolean).slice(-12))
    } catch (err) {
      setErrorMsg(err.message)
    } finally {
      setLoading(false)
    }
  }, [language, difficulty, askedTopics, model, setEditorCode, setEditorLanguage])

  const handleSubmit = useCallback(async () => {
    if (!question || checking) return
    if (!editorCode.trim()) {
      setErrorMsg('Write your answer in the editor before submitting.')
      return
    }

    setChecking(true)
    setErrorMsg(null)
    setFeedback(null)

    try {
      const res = await checkQuizAnswer(
        question.question,
        question.reference_solution,
        editorCode,
        language,
        model
      )
      if (!res.success) throw new Error(res.error || 'Failed to check your answer')

      setFeedback({ correct: res.correct, message: res.feedback })
      setAttempts(a => a + 1)
    } catch (err) {
      setErrorMsg(err.message)
    } finally {
      setChecking(false)
    }
  }, [question, editorCode, language, model, checking])

  const handleTryAgain = () => {
    setFeedback(null)
    setErrorMsg(null)
  }

  const difficultyColor = {
    easy: 'var(--accent)', medium: 'var(--warning)', hard: 'var(--error)',
  }[question?.difficulty] || 'var(--text-secondary)'

  return (
    <div className="chat-panel">
      {/* Header */}
      <div className="chat-header">
        <div className="chat-title">
          <GraduationCap size={16} color="var(--accent)" />
          Quiz
          <span className="chat-title-badge">interview prep</span>
        </div>
        <div className="chat-actions">
          <button
            className="btn-icon"
            onClick={onToggleEditor}
            title={showEditorToggle ? 'Hide editor' : 'Show editor'}
          >
            {showEditorToggle ? <PanelRightClose size={14} /> : <PanelRight size={14} />}
          </button>
        </div>
      </div>

      {/* Controls */}
      <div style={{
        display: 'flex', gap: '10px', alignItems: 'center',
        padding: '12px 20px', borderBottom: '1px solid var(--border)',
        background: 'var(--bg-secondary)', flexWrap: 'wrap',
      }}>
        <select
          className="editor-lang-select"
          value={language}
          onChange={e => setLanguage(e.target.value)}
          title="Preferred language"
        >
          {QUIZ_LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
        </select>

        <select
          className="editor-lang-select"
          value={difficulty}
          onChange={e => setDifficulty(e.target.value)}
          title="Difficulty"
        >
          {DIFFICULTIES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
        </select>

        <button
          className="btn btn-primary"
          onClick={handleNewQuiz}
          disabled={loading}
          style={{ marginLeft: 'auto' }}
        >
          {loading ? <div className="spinner" style={{ borderTopColor: '#000' }} /> : <Sparkles size={14} />}
          {question ? 'New Question' : 'Start Quiz'}
        </button>
      </div>

      {/* Body */}
      <div className="chat-messages" ref={bodyRef}>
        {!question && !loading ? (
          <div className="empty-state">
            <div className="empty-icon"><GraduationCap size={22} /></div>
            <div className="empty-title">Coding Interview Quiz</div>
            <div className="empty-desc">
              Pick a language and difficulty above, then generate a random interview-style
              question. Write your answer in the editor and submit — you get unlimited attempts,
              and you can always reveal the correct answer if you get stuck.
            </div>
          </div>
        ) : loading ? (
          <div className="empty-state">
            <div className="spinner" style={{ width: 24, height: 24 }} />
            <div className="empty-desc">Generating a fresh question...</div>
          </div>
        ) : (
          <div className="message animate-fade-in">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
              <span className="chat-title-badge" style={{ color: difficultyColor, borderColor: difficultyColor }}>
                {question.difficulty}
              </span>
              <span className="chat-title-badge">{question.topic}</span>
              <span className="chat-title-badge">{language}</span>
              {attempts > 0 && (
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  attempt {attempts}
                </span>
              )}
            </div>

            <div className="message-body" style={{ paddingLeft: 0 }}>
              <h3 style={{ marginTop: 0 }}>{question.title}</h3>
              <MessageRenderer content={question.question} />
            </div>

            {feedback && (
              <div
                className="error-banner"
                style={
                  feedback.correct
                    ? { background: 'var(--accent-glow2)', borderColor: 'var(--accent-glow)', color: 'var(--accent)' }
                    : {}
                }
              >
                {feedback.correct ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                <span>{feedback.message}</span>
              </div>
            )}

            {revealed && (
              <div style={{ marginTop: '12px' }}>
                <div className="error-input-label">Reference Solution</div>
                <CodeBlock language={language}>{question.reference_solution}</CodeBlock>
                {question.explanation && (
                  <div className="message-body" style={{ paddingLeft: 0, marginTop: '8px' }}>
                    <MessageRenderer content={question.explanation} />
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div className="chat-input-area">
        {errorMsg && (
          <div className="error-banner" style={{ marginBottom: '10px' }}>
            <AlertCircle size={14} />
            {errorMsg}
          </div>
        )}

        {question && (
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={checking || loading}>
              {checking ? <div className="spinner" style={{ borderTopColor: '#000' }} /> : <CheckCircle2 size={14} />}
              Submit Answer
            </button>

            {feedback && !feedback.correct && (
              <>
                <button className="btn btn-ghost" onClick={handleTryAgain} disabled={checking}>
                  <RefreshCw size={14} />
                  Try Again
                </button>
                {!revealed && (
                  <button className="btn btn-ghost" onClick={() => setRevealed(true)} disabled={checking}>
                    <Eye size={14} />
                    Show Correct Answer
                  </button>
                )}
              </>
            )}

            {feedback && feedback.correct && (
              <button className="btn btn-ghost" onClick={handleNewQuiz} disabled={loading}>
                <Sparkles size={14} />
                Next Quiz
              </button>
            )}
          </div>
        )}

        <div style={{
          marginTop: '8px', fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)',
        }}>
          Write your answer in the editor on the right, then submit · Unlimited attempts per question
        </div>
      </div>
    </div>
  )
}
