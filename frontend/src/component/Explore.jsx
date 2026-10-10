import { useEffect, useRef } from "react";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import CloseIcon from "@mui/icons-material/Close";

import "./Explore.css";

const trendingTopics = [
  "#CMUTrekking",
  "#Midterms_schedule",
  "#CMUEvents",
];

function Explore({ query, recentSearches, onSelectSearch, onRemoveSearch, onClose }) {
  const exploreRef = useRef(null);
  const term = query.trim();
  const matchingRecent = recentSearches.filter(item =>
    item.toLowerCase().includes(term.toLowerCase())
  );

  // Close Explore when clicking outside the popup or the search bar that controls it
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        exploreRef.current &&
        !exploreRef.current.contains(event.target) &&
        !event.target.closest?.(".top-bar-search")
      ) {
        onClose();
      }
    }
    function handleKeyDown(event) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div className="explore-page">

      {/* ================= EXPLORE CONTENT ================= */}

      <main className="explore-content">

        {/* ================= EXPLORE POPUP ================= */}

        <section
          className="explore-search-card"
          ref={exploreRef}
          aria-label="Search"
        >
          {term && (
            <button
              type="button"
              className="search-for"
              onClick={() => onSelectSearch(term)}
            >
              <SearchOutlinedIcon className="history-icon" />
              <span>Search for “<strong>{term}</strong>”</span>
            </button>
          )}

          <h2>Recent searches</h2>

          {matchingRecent.length === 0 && (
            <p className="search-status">
              {recentSearches.length ? "No matching recent searches." : "Your recent searches will appear here."}
            </p>
          )}

          <div className="recent-list">

            {matchingRecent.map(item => (

              <div
                className="recent-item"
                key={item}
              >

                <HistoryOutlinedIcon className="history-icon" />

                <button
                  type="button"
                  className="recent-search-term"
                  onClick={() => onSelectSearch(item)}
                >
                  {item}
                </button>

                <button
                  type="button"
                  className="remove-search"
                  aria-label={`Remove ${item} from recent searches`}
                  onClick={() => onRemoveSearch(item)}
                >
                  <CloseIcon />
                </button>

              </div>

            ))}

          </div>


          {/* ================= TRENDING ================= */}

          {!term && (
            <div className="trending-section">

              <h2>Trending</h2>

              <div className="trending-grid">

                <div className="trending-column">

                  {trendingTopics.map(topic => (
                    <button
                      type="button"
                      className="trending-item"
                      key={topic}
                      onClick={() => onSelectSearch(topic)}
                    >
                      {topic}
                    </button>
                  ))}

                </div>

              </div>

            </div>
          )}

        </section>

      </main>

    </div>
  );
}

export default Explore;
