import { useEffect, useRef, useState } from "react";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import CloseIcon from "@mui/icons-material/Close";
import { listTrending } from "../search/client";

import "./Explore.css";

function Explore({ user, query, recentSearches, onSelectSearch, onRemoveSearch, onClose }) {
  const exploreRef = useRef(null);
  const term = query.trim();
  const matchingRecent = recentSearches.filter(item =>
    item.toLowerCase().includes(term.toLowerCase())
  );
  const [trending, setTrending] = useState({ status: "loading", topics: [], error: "" });

  useEffect(() => {
    if (!user || term) return;
    let active = true;
    const controller = new AbortController();
    listTrending(user, { signal: controller.signal })
      .then(topics => {
        if (active) setTrending({ status: "ready", topics, error: "" });
      })
      .catch(failure => {
        if (!active || failure.name === "AbortError") return;
        setTrending({ status: "error", topics: [], error: failure.message });
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [user, term]);

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

              {trending.status === "loading" && (
                <p className="search-status" role="status">Loading trending topics…</p>
              )}
              {trending.status === "error" && (
                <p className="search-status" role="alert">{trending.error}</p>
              )}
              {trending.status === "ready" && trending.topics.length === 0 && (
                <p className="search-status">
                  No trending topics yet. Use #hashtags in your posts to start trends.
                </p>
              )}

              {trending.status === "ready" && trending.topics.length > 0 && (
                <div className="trending-grid">
                  {[trending.topics.slice(0, 3), trending.topics.slice(3, 6)].map((column, index) => (
                    <div className="trending-column" key={index}>
                      {column.map(topic => (
                        <button
                          type="button"
                          className="trending-item"
                          key={topic.tag}
                          onClick={() => onSelectSearch(topic.tag)}
                        >
                          {topic.tag}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              )}

            </div>
          )}

        </section>

      </main>

    </div>
  );
}

export default Explore;
