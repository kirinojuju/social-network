import { siteNameParts } from '../brand'
import './BrandName.css'

export default function BrandName({ className = '' }) {
  const [strong, light] = siteNameParts
  return (
    <span className={`brand-name ${className}`}>
      <span className="brand-name-strong">{strong}</span><span className="brand-name-light">{light}</span>
    </span>
  )
}
