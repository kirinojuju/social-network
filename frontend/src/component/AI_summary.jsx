import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { useEffect, useState } from 'react'
import { summarizePost } from '../ai/client'
import './AI_summary.css'

export default function AISummary({ postText, user, onClose }) {
  const [summary, setSummary] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    summarizePost(user, postText)
      .then(result => { if (!cancelled) setSummary(result) })
      .catch(err => { if (!cancelled) setError(err.message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [user, postText])

  return (
    <div className="ai-summary-overlay" role="presentation" onClick={onClose}>
      <section className="ai-summary-box" role="dialog" aria-modal="true" aria-labelledby="ai-summary-title"
        onClick={event => event.stopPropagation()}>
        <div className="ai-summary-header">
          <button type="button" className="ai-back-button" aria-label="Close AI summary" onClick={onClose}>
            <ArrowBackIcon />
          </button>
          <AutoAwesomeIcon className="ai-summary-icon" />
          <h2 id="ai-summary-title">AI Summary</h2>
        </div>
        <div className="ai-summary-content">
          {loading && <p>Summarizing...</p>}
          {error && <p role="alert">{error}</p>}
          {summary && <p>{summary}</p>}
          {postText && <>
            <h3>Original post</h3>
            <p>{postText}</p>
          </>}
        </div>
      </section>
    </div>
  )
}
