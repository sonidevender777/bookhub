import { BookOpenCheck, CalendarClock, FileText, ShieldCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import EmptyState from '../components/EmptyState.jsx'
import LoadingState from '../components/LoadingState.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { digitalAccessApi } from '../services/api.js'
import { formatCurrency, formatDate } from '../utils/formatters.js'

function DigitalLibraryPage() {
  const { isAuthenticated, token } = useAuth()
  const [accesses, setAccesses] = useState([])
  const [reader, setReader] = useState(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false)
      return
    }
    digitalAccessApi
      .mine(token)
      .then((response) => setAccesses(response.data || []))
      .finally(() => setLoading(false))
  }, [isAuthenticated, token])

  const openAccess = async (accessId) => {
    const response = await digitalAccessApi.open(token, accessId)
    setReader(response.data)
  }

  const clearHistory = async () => {
    if (!window.confirm('Clear expired digital access records? Active digital rentals will remain available.')) return
    const response = await digitalAccessApi.clearHistory(token)
    setAccesses((current) => current.filter((access) => access.status === 'active'))
    setMessage(response.message || 'Expired digital records cleared.')
  }

  if (!isAuthenticated) {
    return (
      <section className="page-section">
        <EmptyState title="Sign in required" message="Your rented digital editions appear after login." />
        <div className="center-actions">
          <Link className="button button-primary" to="/login">Sign in</Link>
        </div>
      </section>
    )
  }

  return (
    <section className="page-section">
      <div className="page-heading page-heading-with-action">
        <div>
          <span className="eyebrow">Digital rentals</span>
          <h1>Digital library</h1>
          <p>Digital access is checked by the backend every time you open a rental. Expired rentals cannot be opened.</p>
        </div>
        {accesses.some((access) => access.status !== 'active') && (
          <button className="button button-secondary" type="button" onClick={clearHistory}>Clear expired</button>
        )}
      </div>
      {message && <p className="success-banner">{message}</p>}

      {reader && (
        <section className="reader-panel">
          <BookOpenCheck size={24} />
          <div>
            <h2>{reader.reader.title || `Reading access unlocked for ${reader.access?.book?.title || 'this book'}.`}</h2>
            <p>{reader.reader.message}</p>
            {reader.reader.fileUrl && (
              <a className="button button-primary reader-open-link" href={reader.reader.fileUrl} target="_blank" rel="noreferrer">
                {reader.reader.kind === 'pdf' ? 'Open attached PDF' : 'Open digital edition'}
              </a>
            )}
          </div>
        </section>
      )}

      {loading ? (
        <LoadingState />
      ) : accesses.length ? (
        <div className="digital-list">
          {accesses.map((access) => (
            <article className="digital-card" key={access._id}>
              <FileText size={28} />
              <div>
                <span className={`status-pill ${access.status}`}>{access.status}</span>
                <h2>{access.book?.title}</h2>
                <p><CalendarClock size={16} /> Expires {formatDate(access.expirationTime)}</p>
                <p><ShieldCheck size={16} /> Rental charge {formatCurrency(access.price)}</p>
              </div>
              <button className="button button-primary" type="button" onClick={() => openAccess(access._id)} disabled={access.status !== 'active'}>
                Open digital edition
              </button>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState title="No digital rentals yet" message="Rent a digital edition from a book details page and place an order." />
      )}
    </section>
  )
}

export default DigitalLibraryPage
