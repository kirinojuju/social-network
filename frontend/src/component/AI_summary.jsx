import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import './AI_summary.css'

export default function AISummary({ postText, onClose }) {
  return (
    <div className="ai-summary-overlay" role="presentation" onClick={onClose}>
      <section className="ai-summary-box" role="dialog" aria-modal="true" aria-labelledby="ai-summary-title"
        onClick={event => event.stopPropagation()}>
        <div className="ai-summary-header">
          <button type="button" className="ai-back-button" aria-label="Close AI summary" onClick={onClose}>
            <ArrowBackIcon />
          </button>
          <AutoAwesomeIcon className="ai-summary-icon" />
          <h2 id="ai-summary-title">AI Summary Preview</h2>
        </div>
        <div className="ai-summary-content">
          <p>The summary screen is ready. AI generation is not connected to the backend yet.</p>
          {postText && <>
            <h3>Selected post</h3>
            <p>{postText}</p>
          </>}
        </div>
      </section>
    </div>
  )
}
