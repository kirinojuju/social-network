import { useEffect, useRef, useState } from "react";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import CloseIcon from "@mui/icons-material/Close";

import "./Explore.css";

function Explore({ onClose }) {
  const exploreRef = useRef(null);

  const [searchText, setSearchText] = useState("");

  const [recentSearches, setRecentSearches] = useState([
    "algorithm notes",
    "fresher night",
    "algorithm notes",
    "Entaneer shirt",
  ]);

  const trendingTopics = [
    "#CMUTrekking",
    "#Midterms_schedule",
    "#CMUEvents",
  ];

  // Close Explore when clicking anywhere outside the box
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        exploreRef.current &&
        !exploreRef.current.contains(event.target)
      ) {
        onClose();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  function removeSearch(indexToRemove) {
    setRecentSearches(
      recentSearches.filter((_, index) => index !== indexToRemove)
    );
  }

  return (
    <div className="explore-page">

      {/* ================= EXPLORE CONTENT ================= */}

      <main className="explore-content">

        {/* ================= EXPLORE POPUP ================= */}

        <section
          className="explore-search-card"
          ref={exploreRef}
        >

          <h2>Recently searches</h2>

          <div className="recent-list">

            {recentSearches.map((search, index) => (

              <div
                className="recent-item"
                key={`${search}-${index}`}
              >

                <HistoryOutlinedIcon className="history-icon" />

                <span>{search}</span>

                <button
                  className="remove-search"
                  onClick={() => removeSearch(index)}
                >
                  <CloseIcon />
                </button>

              </div>

            ))}

          </div>


          {/* ================= TRENDING ================= */}

          <div className="trending-section">

            <h2>Trending</h2>

            <div className="trending-grid">

              <div className="trending-column">

                {trendingTopics.map((topic, index) => (
                  <div
                    className="trending-item"
                    key={index}
                  >
                    {topic}
                  </div>
                ))}

              </div>


              <div className="trending-column">

                {trendingTopics.map((topic, index) => (
                  <div
                    className="trending-item"
                    key={index}
                  >
                    {topic}
                  </div>
                ))}

              </div>

            </div>

          </div>

        </section>

      </main>

    </div>
  );
}

export default Explore;