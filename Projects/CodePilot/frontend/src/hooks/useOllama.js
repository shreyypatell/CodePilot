import { useState, useEffect, useCallback } from 'react'
import { getModels, checkHealth } from '../utils/api'

export function useOllama() {
  const [models, setModels] = useState([])
  const [selectedModel, setSelectedModel] = useState(null)
  const [status, setStatus] = useState('checking') // 'checking' | 'online' | 'offline'
  const [error, setError] = useState(null)

  const refresh = useCallback(async () => {
    setStatus('checking')
    setError(null)
    try {
      await checkHealth()
      const data = await getModels()
      setModels(data.models || [])
      setSelectedModel(data.selected || data.models?.[0] || null)
      setStatus('online')
    } catch (err) {
      setStatus('offline')
      setError(err.message)
      setModels([])
    }
  }, [])

  useEffect(() => {
    refresh()
    // Poll every 30 seconds
    const interval = setInterval(refresh, 30000)
    return () => clearInterval(interval)
  }, [refresh])

  return { models, selectedModel, setSelectedModel, status, error, refresh }
}
