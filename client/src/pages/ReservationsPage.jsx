import { BookmarkCheck, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import EmptyState from '../components/EmptyState.jsx'
import LoadingState from '../components/LoadingState.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { engagementApi } from '../services/api.js'
import { formatDate } from '../utils/formatters.js'

function ReservationsPage() {
  const { isAuthenticated, token } = useAuth()
  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(true)

  const loadReservations = () => {
    if (!isAuthenticated) {
      setLoading(false)
      return
    }
    engagementApi
      .reservations(token)
      .then((response) => setReservations(response.data || []))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadReservations()
  }, [isAuthenticated, token])

  const cancelReservation = async (reservationId) => {
    await engagementApi.cancelReservation(token, reservationId)
    loadReservations()
  }

  if (!isAuthenticated) {
    return (
      <section className="page-section">
        <EmptyState title="Sign in required" message="Your waitlist reservations appear after login." />
        <div className="center-actions"><Link className="button button-primary" to="/login">Sign in</Link></div>
      </section>
    )
  }

  return (
    <section className="page-section">
      <div className="page-heading">
        <span className="eyebrow">Waitlist</span>
        <h1>Reservations</h1>
        <p>When a physical copy is unavailable, BookHub can hold your waitlist position.</p>
      </div>
      {loading ? <LoadingState /> : reservations.length ? (
        <div className="simple-list">
          {reservations.map((reservation) => (
            <article className="simple-row" key={reservation._id}>
              <BookmarkCheck size={22} />
              <div>
                <strong>{reservation.book?.title}</strong>
                <span>Position {reservation.position || '-'} · {reservation.status} · {formatDate(reservation.createdAt)}</span>
              </div>
              {['waiting', 'notified'].includes(reservation.status) && (
                <button className="button button-secondary" type="button" onClick={() => cancelReservation(reservation._id)}>
                  <XCircle size={17} /> Cancel
                </button>
              )}
            </article>
          ))}
        </div>
      ) : <EmptyState title="No reservations yet" message="Reserve a book when all physical copies are unavailable." />}
    </section>
  )
}

export default ReservationsPage
