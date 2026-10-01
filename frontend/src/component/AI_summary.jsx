import { useEffect, useRef, useState } from 'react'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import SendIcon from '@mui/icons-material/Send'
import { chatWithAI, summarizePost } from '../ai/client'
import './AI_summary.css'

export default function AISummary({ postText, user, onClose }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(Boolean(postText))
  const [error, setError] = useState('')
  const endRef = useRef(null)

  useEffect(() => {
    if (!postText) return undefined
    let cancelled = false
    summarizePost(user, postText)
      .then(summary => { if (!cancelled) setMessages([{ role: 'assistant', content: summary }]) })
      .catch(err => { if (!cancelled) setError(err.message) })
      .finally(() => { if (!cancelled) setBusy(false) })
    return () => { cancelled = true }
  }, [user, postText])

  useEffect(() => { endRef.current?.scrollIntoView?.({ block: 'end' }) }, [messages, busy])

  async function send(event) {
    event.preventDefault()
    const text = input.trim()
    if (!text || busy) return
    const next = [...messages, { role: 'user', content: text }]
    setMessages(next)
    setInput('')
    setError('')
    setBusy(true)
    try {
      const reply = await chatWithAI(user, next, postText || '')
      setMessages([...next, { role: 'assistant', content: reply }])
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="ai-summary-overlay" role="presentation" onClick={onClose}>
      <section className="ai-summary-box" role="dialog" aria-modal="true" aria-labelledby="ai-summary-title"
        onClick={event => event.stopPropagation()}>
        <div className="ai-summary-header">
          <button type="button" className="ai-back-button" aria-label="Close UniAI" onClick={onClose}>
            <ArrowBackIcon />
          </button>
          <AutoAwesomeIcon className="ai-summary-icon" />
          <h2 id="ai-summary-title">UniAI</h2>
        </div>
        <div className="ai-summary-content">
          {postText && (
            <details className="ai-post-card">
              <summary>Post</summary>
              <p>{postText}</p>
            </details>
          )}
          {messages.map((message, index) => (
            <div key={index} className={`ai-message ai-message-${message.role}`}>
              {message.role === 'assistant' && <span className="ai-avatar" aria-hidden="true"><AutoAwesomeIcon /></span>}
              <p>{message.content}</p>
            </div>
          ))}
          {busy && (
            <div className="ai-message ai-message-assistant" role="status" aria-label="UniAI is thinking">
              <span className="ai-avatar" aria-hidden="true"><AutoAwesomeIcon /></span>
              <p className="ai-typing"><span /><span /><span /></p>
            </div>
          )}
          {error && <p className="ai-error" role="alert">{error}</p>}
          <div ref={endRef} />
        </div>
        <form className="ai-chat-form" onSubmit={send}>
          <input value={input} onChange={event => setInput(event.target.value)} maxLength={4000}
            placeholder="Ask UniAI..." aria-label="Message UniAI" disabled={busy} />
          <button type="submit" aria-label="Send" disabled={busy || !input.trim()}><SendIcon /></button>
        </form>
      </section>
    </div>
  )
}
