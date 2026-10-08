import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import CloseIcon from "@mui/icons-material/Close";

import "./Explore.css";

function Explore() {
  const recentSearches = [
    "algorithm notes",
    "fresher night",
    "algorithm notes",
    "Entaneer shirt",
  ];

  const trendingTopics = [
    "#CMUTrekking",
    "#Midterms_schedule",
    "#CMUEvents",
  ];

  return (
    <div className="explore-page">

      {/* ================= SEARCH AREA ================= */}

      <section className="explore-main">

        <div className="explore-search-container">
          <SearchOutlinedIcon className="explore-search-icon" />

          <input
            type="text"
            placeholder="Search people, posts, courses, and more..."
          />
        </div>


        {/* ================= RECENT SEARCHES ================= */}

        <div className="recent-section">

          <h2>Recently searches</h2>

          <div className="recent-list">

            {recentSearches.map((search, index) => (
              <div className="recent-item" key={index}>

                <HistoryOutlinedIcon className="history-icon" />

                <span>{search}</span>

                <button className="remove-search">
                  <CloseIcon />
                </button>

              </div>
            ))}

          </div>

        </div>


        {/* ================= TRENDING ================= */}

        <div className="trending-section">

          <h2>Trending</h2>

          <div className="trending-grid">

            <div className="trending-column">

              {trendingTopics.map((topic, index) => (
                <div className="trending-item" key={index}>
                  {topic}
                </div>
              ))}

            </div>


            <div className="trending-column">

              {trendingTopics.map((topic, index) => (
                <div className="trending-item" key={index}>
                  {topic}
                </div>
              ))}

            </div>

          </div>

        </div>

      </section>

    </div>
  );
}

export default Explore;