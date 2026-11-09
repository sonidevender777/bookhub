import { Bell, CheckCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import EmptyState from '../components/EmptyState.jsx'
import LoadingState from '../components/LoadingState.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { adminApi, notificationApi } from '../services/api.js'
import { formatDate } from '../utils/formatters.js'

function NotificationsPage() {
  const { isAuthenticated, token, user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionMessage, setActionMessage] = useState('')
  const [actionError, setActionError] = useState('')
  const [acceptingId, setAcceptingId] = useState('')
  const isAdmin = ['owner', 'manager'].includes(user?.role)

  const loadNotifications = () => {
    if (!isAuthenticated) {
      setLoading(false)
      return
    }
    notificationApi
      .mine(token)
      .then((response) => {
        setNotifications(response.data || [])
        if (response.unreadCount) {
          notificationApi.markAllRead(token).then(() => {
            window.dispatchEvent(new Event('bookhub:notifications-updated'))
          })
          return
        }
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadNotifications()
  }, [isAuthenticated, token])

  const markAllRead = async () => {
    await notificationApi.markAllRead(token)
    setNotifications([])
    window.dispatchEvent(new Event('bookhub:notifications-updated'))
  }

  const acceptOrderFromNotification = async (notification) => {
    const orderId = notification.metadata?.order
    if (!orderId) return
    setActionMessage('')
    setActionError('')
    setAcceptingId(notification._id)
    try {
      await adminApi.updateOrderStatus(token, orderId, { orderStatus: 'confirmed' })
      await notificationApi.markRead(token, notification._id)
      setNotifications((current) => current.filter((item) => item._id !== notification._id))
      window.dispatchEvent(new Event('bookhub:notifications-updated'))
      setActionMessage(`Order ${notification.metadata?.orderNumber || ''} accepted. The customer has been notified.`)
    } catch (error) {
      setActionError(error.response?.data?.message || 'Order could not be accepted. Please open Admin > Orders and try again.')
    } finally {
      setAcceptingId('')
    }
  }

  if (!isAuthenticated) {
    return (
      <section className="page-section">
        <EmptyState title="Sign in required" message="Order and rental notifications appear after login." />
        <div className="center-actions">
          <Link className="button button-primary" to="/login">Sign in</Link>
        </div>
      </section>
    )
  }

  return (
    <section className="page-section">
      <div className="page-heading split-heading">
        <div>
          <span className="eyebrow">Notification center</span>
          <h1>Notifications</h1>
          <p>BookHub shows order, rental, overdue, return, and digital-access updates here.</p>
        </div>
        {notifications.length ? (
          <button className="button button-secondary" type="button" onClick={markAllRead}>
            <CheckCheck size={18} />
            Clear all
          </button>
        ) : null}
      </div>

      {actionMessage && <p className="success-banner">{actionMessage}</p>}
      {actionError && <p className="form-error">{actionError}</p>}

      {loading ? (
        <LoadingState />
      ) : notifications.length ? (
        <div className="notification-list">
          {notifications.map((notification) => (
            <article className={`notification-card ${notification.readAt ? '' : 'unread'}`} key={notification._id}>
              <Bell size={20} />
              <div>
                <strong>{notification.title}</strong>
                <p>{notification.message}</p>
                <span>{formatDate(notification.createdAt)}</span>
                {isAdmin && notification.type === 'order_created' && notification.metadata?.order ? (
                  <div className="notification-actions">
                    <button
                      className="button button-primary"
                      type="button"
                      disabled={acceptingId === notification._id}
                      onClick={() => acceptOrderFromNotification(notification)}
                    >
                      {acceptingId === notification._id ? 'Accepting...' : 'Accept order'}
                    </button>
                    <Link className="button button-secondary" to="/admin">
                      Open admin portal
                    </Link>
                  </div>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState title="No active notifications" message="New order, rental, payment, and digital access updates will appear here." />
      )}
    </section>
  )
}

export default NotificationsPage
