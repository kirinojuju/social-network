import { useEffect, useRef, useState } from 'react'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
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
          {postText && <>
            <h3>Post</h3>
            <p>{postText}</p>
          </>}
          {messages.map((message, index) => (
            <p key={index} className={`ai-message ai-message-${message.role}`}>{message.content}</p>
          ))}
          {busy && <p role="status">Thinking...</p>}
          {error && <p role="alert">{error}</p>}
          <div ref={endRef} />
        </div>
        <form className="ai-chat-form" onSubmit={send}>
          <input value={input} onChange={event => setInput(event.target.value)} maxLength={4000}
            placeholder="Ask UniAI..." aria-label="Message UniAI" disabled={busy} />
          <button type="submit" disabled={busy || !input.trim()}>Send</button>
        </form>
      </section>
    </div>
  )
}
