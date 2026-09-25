import axios from 'axios'

// In local dev: VITE_API_URL is unset, so we use the Vite proxy ('/api' -> localhost:5000)
// In production (Netlify, etc.): set VITE_API_URL to your deployed backend, e.g.
//   VITE_API_URL=https://your-backend.onrender.com/api
const BASE_URL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 120000, // 2 minutes for LLM responses
  headers: { 'Content-Type': 'application/json' },
})

// ─── Response interceptor ───────────────────────
api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const message =
      err.response?.data?.error ||
      err.message ||
      'An unexpected error occurred'
    return Promise.reject(new Error(message))
  }
)

// ─── API Methods ────────────────────────────────

export const generateCode = (prompt, language = '', model = null) =>
  api.post('/generate', { prompt, language, model })

export const explainCode = (code, language = '', model = null) =>
  api.post('/explain', { code, language, model })

export const fixCode = (code, errorMessage = '', language = '', model = null) =>
  api.post('/fix', { code, error_message: errorMessage, language, model })

export const analyzeFile = (content, filename = '', model = null) =>
  api.post('/analyze', { content, filename, model })

export const analyzeFileUpload = (file, model = null) => {
  const formData = new FormData()
  formData.append('file', file)
  if (model) formData.append('model', model)
  return api.post('/analyze', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export const chat = (message, history = [], contextFile = null, model = null) =>
  api.post('/chat', {
    message,
    history,
    context_file: contextFile,
    model,
  })

export const explainError = (code, language = '', errorMessage = '', model = null) =>
  api.post('/explain-error', { code, error_message: errorMessage, language, model })

export const generateQuiz = (language = '', difficulty = '', exclude = [], model = null) =>
  api.post('/quiz/generate', { language, difficulty, exclude, model })

export const checkQuizAnswer = (question, referenceSolution, userCode, language = '', model = null) =>
  api.post('/quiz/check', {
    question,
    reference_solution: referenceSolution,
    user_code: userCode,
    language,
    model,
  })

export const getModels = () => api.get('/models')

export const checkHealth = () => api.get('/health')

export default api
