import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import CloseIcon from "@mui/icons-material/Close";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";

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

  const suggestedPeople = [
    {
      name: "User_Name",
      major: "Engineering",
    },
    {
      name: "User_Name",
      major: "Engineering",
    },
    {
      name: "User_Name",
      major: "Engineering",
    },
  ];

  const recommendedGroups = [
    {
      name: "Group_Name",
      members: "2.3k members",
    },
    {
      name: "Group_Name",
      members: "2.3k members",
    },
    {
      name: "Group_Name",
      members: "2.3k members",
    },
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


      {/* ================= RIGHT SIDEBAR ================= */}

      <aside className="explore-right-sidebar">

        {/* Suggested People */}

        <section className="suggested-section">

          <h2>Suggested People</h2>

          {suggestedPeople.map((person, index) => (

            <div className="suggested-person" key={index}>

              <div className="person-avatar">
                <PersonOutlineOutlinedIcon />
              </div>

              <div className="person-info">

                <div className="person-name">
                  {person.name}
                </div>

                <div className="person-major">
                  {person.major}
                </div>

              </div>

              <button className="follow-button">
                Follow
              </button>

            </div>

          ))}

          <button className="show-more-button">
            Show more...
          </button>

        </section>


        {/* Recommended */}

        <section className="recommended-section">

          <h2>Recommended</h2>

          {recommendedGroups.map((group, index) => (

            <div className="recommended-group" key={index}>

              <div className="group-avatar">
                <PersonOutlineOutlinedIcon />
              </div>

              <div className="group-info">

                <div className="group-name">
                  {group.name}
                </div>

                <div className="group-members">
                  {group.members}
                </div>

              </div>

              <button className="join-button">
                Join
              </button>

            </div>

          ))}

          <button className="show-more-button">
            Show more...
          </button>

        </section>

      </aside>

    </div>
  );
}

export default Explore;