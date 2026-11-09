import { CalendarClock, IndianRupee, MapPin } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import EmptyState from '../components/EmptyState.jsx'
import LoadingState from '../components/LoadingState.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { rentalApi } from '../services/api.js'
import { formatCurrency, formatDate } from '../utils/formatters.js'

function RentalsPage() {
  const { isAuthenticated, token } = useAuth()
  const [rentals, setRentals] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false)
      return
    }
    rentalApi
      .myRentals(token)
      .then((response) => setRentals(response.data || []))
      .finally(() => setLoading(false))
  }, [isAuthenticated, token])

  const clearHistory = async () => {
    if (!window.confirm('Clear returned and cancelled rental records? Active and overdue rentals will remain.')) return
    const response = await rentalApi.clearHistory(token)
    setRentals((current) => current.filter((rental) => !['returned', 'cancelled'].includes(rental.status)))
    setMessage(response.message || 'Completed rental records cleared.')
  }

  if (!isAuthenticated) {
    return (
      <section className="page-section">
        <EmptyState title="Sign in required" message="Your active rentals and due dates appear after login." />
        <div className="center-actions">
          <Link className="button button-primary" to="/login">
            Sign in
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section className="page-section">
      <div className="page-heading page-heading-with-action">
        <div>
          <span className="eyebrow">Physical rentals</span>
          <h1>My rentals</h1>
          <p>Track active rentals, due dates, copy codes, shelf locations, and any overdue penalties.</p>
        </div>
        {rentals.some((rental) => ['returned', 'cancelled'].includes(rental.status)) && (
          <button className="button button-secondary" type="button" onClick={clearHistory}>Clear completed</button>
        )}
      </div>
      {message && <p className="success-banner">{message}</p>}

      {loading ? (
        <LoadingState />
      ) : rentals.length ? (
        <div className="rental-list">
          {rentals.map((rental) => (
            <article className="rental-card" key={rental._id}>
              <div>
                <span className={`status-pill ${rental.status}`}>{rental.status}</span>
                <h2>{rental.book?.title}</h2>
                <p>{rental.copy?.copyCode}</p>
              </div>
              <div className="rental-facts">
                <span>
                  <CalendarClock size={17} />
                  Due {formatDate(rental.dueDate)}
                </span>
                <span>
                  <IndianRupee size={17} />
                  Penalty {formatCurrency(rental.penaltyAmount)}
                </span>
                <span>
                  <MapPin size={17} />
                  {rental.copy?.location?.label || 'Store location'}
                </span>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState title="No rentals yet" message="Add a physical rental to your cart and place an order." />
      )}
    </section>
  )
}

export default RentalsPage
