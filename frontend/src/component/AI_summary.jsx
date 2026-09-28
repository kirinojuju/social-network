import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import "./AI_summary.css";

function AISummary({ onClose }) {
  return (
    <div className="ai-summary-overlay">

      <div className="ai-summary-box">

        {/* HEADER */}
        <div className="ai-summary-header">

          <button
            className="ai-back-button"
            onClick={onClose}
          >
            <ArrowBackIcon />
          </button>

          <AutoAwesomeIcon className="ai-summary-icon" />

          <h2>AI Summary</h2>

        </div>


        {/* CONTENT */}
        <div className="ai-summary-content">

          <h3>Quick Summary</h3>

          <p>
            This announcement explains the midterm
            schedule and required topics.
          </p>


          <h3>Key Points</h3>

          <ul>
            <li>Exam date: Oct 15</li>
            <li>Chapters 1–5</li>
            <li>30% of final grade</li>
          </ul>

        </div>

      </div>

    </div>
  );
}

export default AISummary;