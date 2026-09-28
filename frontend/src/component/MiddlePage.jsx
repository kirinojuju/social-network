import "./MiddlePage.css";
import PhotoCameraOutlinedIcon from "@mui/icons-material/PhotoCameraOutlined";
import VideocamOutlinedIcon from "@mui/icons-material/VideocamOutlined";
import AttachFileOutlinedIcon from "@mui/icons-material/AttachFileOutlined";
import FavoriteBorderOutlinedIcon from "@mui/icons-material/FavoriteBorderOutlined";
import ChatBubbleOutlineOutlinedIcon from "@mui/icons-material/ChatBubbleOutlineOutlined";
import SendOutlinedIcon from "@mui/icons-material/SendOutlined";
import BookmarkBorderOutlinedIcon from "@mui/icons-material/BookmarkBorderOutlined";
import { useState } from "react";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";

function MiddlePage() {
  const stories = ["A", "B", "C", "D", "E", "F"];
    const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  return (
    <main className="middle-page">
      {/* Top bar */}
      <header className="topbar">
        <div className="search-box">
          <span className="search-icon">⌕</span>
          <input
            type="text"
            placeholder="Search people, posts, courses, and more..."
          />
        </div>

        <div className="topbar-actions">
          <button aria-label="Create post">✎</button>
          <button aria-label="Notifications">🔔</button>
          <div className="profile-icon">◯</div>
        </div>
      </header>

      <section className="feed-content">
        {/* Post Box */}
        <section className="create-post-card">
          <div className="create-post-top">
            <div className="avatar">👤</div>
            <div className="post-placeholder">Create a post...</div>
          </div>

          <div className="post-divider" />

         <div className="post-tools">
            <button className="tool-button">
                <PhotoCameraOutlinedIcon />
                <span>Photo</span>
            </button>

            <button className="tool-button">
                <VideocamOutlinedIcon />
                <span>Video</span>
            </button>

            <button className="tool-button">
                <AttachFileOutlinedIcon />
                <span>File</span>
            </button>

            <button className="post-button">Post</button>
            </div>
        </section>

        {/* Stories */}
        {/* Stories */}
            <div className="stories-box">
            <h2>Stories</h2>

            <div className="stories-list">
                {stories.map((name) => (
                <article className="story-card" key={name}>
                    <div className="story-avatar">👤</div>
                    <div className="story-image">...</div>
                    <p>{name}</p>
                </article>
                ))}
            </div>
            </div>

        {/* Sample Post */}
        <article className="sample-post">
          <div className="post-header">
            <div className="avatar">👤</div>

            <div>
              <strong>User_Name</strong>
              <p>ISNE · 2 hr</p>
            </div>

            <button className="follow-button">Follow</button>
            <button className="more-button">•••</button>
          </div>

          <p className="post-text">
            Welcome to UniConnect! test post 1234658799876543216858641.
          </p>

         {/* 
<div className="post-image-placeholder">
  <span>UniConnect</span>
</div> 
*/}

          <div className="post-actions">
  <button className="post-action-button">
    <FavoriteBorderOutlinedIcon />
    <span>1.1k</span>
  </button>

  <button className="post-action-button">
    <ChatBubbleOutlineOutlinedIcon />
    <span>520</span>
  </button>

  <button className="post-action-button">
    <SendOutlinedIcon />
    <span>143</span>
  </button>

  <button className="post-action-button">
    <BookmarkBorderOutlinedIcon />
    <span>493</span>
  </button>

  <button className="summarise-button">
  ✦ Summarise
</button>
</div>
        </article>

        <article className="sample-post">
  <div className="post-header">
    <div className="avatar">👤</div>

    <div>
      <strong>CMU Student</strong>
      <p>Faculty of Engineering · 1 hr</p>
    </div>

    <button className="follow-button">Follow</button>
    <button className="more-button">•••</button>
  </div>

  <p className="post-text">
     Wonderful day at the university! 🌿
  </p>

  <img
    className="post-image"
    src="https://www.geocities.ws/entaneer-cmu/Slide-CMU-05.jpg"
    alt="University campus"
  />

  <div className="post-actions">
    <button className="post-action-button">
      <FavoriteBorderOutlinedIcon />
      <span>245</span>
    </button>

    <button className="post-action-button">
      <ChatBubbleOutlineOutlinedIcon />
      <span>32</span>
    </button>

    <button className="post-action-button">
      <SendOutlinedIcon />
      <span>10</span>
    </button>

    <button className="post-action-button">
      <BookmarkBorderOutlinedIcon />
      <span>58</span>
    </button>

    <button className="summarise-button">
      ✦ Summarise
    </button>
  </div>
</article>
<article className="sample-post">
  <div className="post-header">
    <div className="avatar">👤</div>

    <div>
      <strong>CMU Campus Life</strong>
      <p>Faculty of Engineering  · 30 min</p>
    </div>

    <button className="follow-button">Follow</button>
    <button className="more-button">•••</button>
  </div>

  <p className="post-text">
    Wonderful day at the university! 🌿 * 3
  </p>

  <div className="post-gallery">
    <img
      src="https://www.geocities.ws/entaneer-cmu/Slide-CMU-05.jpg"
   
    />

    <img
      src="https://www.geocities.ws/entaneer-cmu/Slide-CMU-05.jpg"
   
    />

    <img
      src="https://www.geocities.ws/entaneer-cmu/Slide-CMU-05.jpg"

    /> 
    
  </div>

  <div className="post-actions">
    <button className="post-action-button">
      <FavoriteBorderOutlinedIcon />
      <span>326</span>
    </button>

    <button className="post-action-button">
      <ChatBubbleOutlineOutlinedIcon />
      <span>47</span>
    </button>

    <button className="post-action-button">
      <SendOutlinedIcon />
      <span>21</span>
    </button>

    <button className="post-action-button">
      <BookmarkBorderOutlinedIcon />
      <span>89</span>
    </button>

    <button className="summarise-button">
      ✦ Summarise
    </button>
  </div>
</article>
<article className="sample-post">
  <div className="post-header">
    <div className="avatar">👤</div>

    <div>
      <strong>CMU Campus Life</strong>
      <p>Faculty of Engineering  · 10 min</p>
    </div>

    <button className="follow-button">Follow</button>
    <button className="more-button">•••</button>
  </div>

  <p className="post-text">
    Vid test 
  </p>

<div className="video-frame">
  {!isVideoPlaying ? (
    <button
      className="video-thumbnail white-thumbnail"
      onClick={() => setIsVideoPlaying(true)}
    
    >
      <span className="play-icon">
        <PlayArrowRoundedIcon />
      </span>
    </button>
  ) : (
    <iframe
      src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1"
      title="CMU Campus Video"
      allow="autoplay; encrypted-media; picture-in-picture"
      allowFullScreen
    />
  )}
</div>

  <div className="post-actions">
    <button className="post-action-button">
      <FavoriteBorderOutlinedIcon />
      <span>615</span>
    </button>

    <button className="post-action-button">
      <ChatBubbleOutlineOutlinedIcon />
      <span>84</span>
    </button>

    <button className="post-action-button">
      <SendOutlinedIcon />
      <span>36</span>
    </button>

    <button className="post-action-button">
      <BookmarkBorderOutlinedIcon />
      <span>121</span>
    </button>

    <button className="summarise-button">
      ✦ Summarise
    </button>
  </div>
</article>
      </section>
    </main>
  );
}

export default MiddlePage;