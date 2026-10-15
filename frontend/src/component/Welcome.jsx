import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined'
import PhotoLibraryOutlinedIcon from '@mui/icons-material/PhotoLibraryOutlined'
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined'
import ChatBubbleOutlineOutlinedIcon from '@mui/icons-material/ChatBubbleOutlineOutlined'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import { logoUrl, siteName, tagline } from '../brand'
import BrandName from './BrandName'
import './Welcome.css'

const features = [
  { icon: PhotoLibraryOutlinedIcon, title: 'Share your moments', text: 'Post updates and up to 10 photos at a time.' },
  { icon: PeopleAltOutlinedIcon, title: 'Make friends', text: 'Follow classmates from every faculty and major.' },
  { icon: ChatBubbleOutlineOutlinedIcon, title: 'Chat directly', text: 'Send messages and photos to your friends.' },
  { icon: AutoAwesomeIcon, title: 'Study with UniAI', text: 'Ask questions or summarise any post in one click.' },
]

export default function Welcome({ onCreateAccount, onSignIn }) {
  return (
    <main className="welcome-page">
      <section className="welcome-hero">
        <div className="welcome-logo" aria-label={`${siteName} logo`}>
          {logoUrl ? <img src={logoUrl} alt={`${siteName} logo`} /> : (
            <span className="welcome-logo-placeholder">
              <ImageOutlinedIcon />
              Logo
            </span>
          )}
        </div>

        <h1>Welcome to <BrandName /></h1>
        <p className="welcome-tagline">{tagline}</p>
        <p className="welcome-intro">
          The social network for university students. Share your student life, meet new friends
          and get study help, all in one place.
        </p>

        <div className="welcome-actions">
          <button type="button" className="welcome-primary" onClick={onCreateAccount}>Create account</button>
          <button type="button" className="welcome-secondary" onClick={onSignIn}>Sign in</button>
        </div>
        <p className="welcome-note">Sign up with your CMU email. It only takes a minute.</p>
      </section>

      <section className="welcome-features" aria-label={`What you can do on ${siteName}`}>
        {features.map(({ icon: Icon, title, text }) => (
          <article className="welcome-feature" key={title}>
            <span className="welcome-feature-icon" aria-hidden="true"><Icon /></span>
            <div>
              <h2>{title}</h2>
              <p>{text}</p>
            </div>
          </article>
        ))}
      </section>
    </main>
  )
}
