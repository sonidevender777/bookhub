import { Bell, LogOut, Mail, MapPin, ShieldCheck, UserRound } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import EmptyState from '../components/EmptyState.jsx'
import { useAuth } from '../context/AuthContext.jsx'

function ProfilePage() {
  const { user, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()
  const isAdmin = ['owner', 'manager'].includes(user?.role)

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  if (!isAuthenticated) {
    return (
      <section className="page-section">
        <EmptyState title="Profile login required" message="Sign in to view your BookHub profile." />
        <div className="center-actions">
          <Link className="button button-primary" to="/login">Sign in</Link>
        </div>
      </section>
    )
  }

  return (
    <section className="page-section">
      <div className="profile-hero">
        <div className="profile-avatar">
          <UserRound size={40} />
        </div>
        <div>
          <span className="eyebrow">{isAdmin ? 'BookHub owner account' : 'BookHub reader account'}</span>
          <h1>{user.fullName}</h1>
          <p>{isAdmin ? 'Manage catalog, inventory, orders, and store activity from the admin portal.' : 'Track orders, rentals, wishlist, reservations, and digital reading access.'}</p>
        </div>
        {isAdmin && <span className="status-pill role-chip">Admin</span>}
      </div>

      <div className="profile-grid">
        <article>
          <Mail size={22} />
          <span>Email</span>
          <strong>{user.email}</strong>
        </article>
        <article>
          <ShieldCheck size={22} />
          <span>Role</span>
          <strong>{isAdmin ? 'Owner / Admin' : 'Customer'}</strong>
        </article>
        <article>
          <Bell size={22} />
          <span>Account status</span>
          <strong>{user.accountStatus || 'active'}</strong>
        </article>
        <article>
          <MapPin size={22} />
          <span>Store</span>
          <strong>Book Hub, Rewari</strong>
        </article>
      </div>

      <div className="profile-actions">
        {isAdmin ? <Link className="button button-primary" to="/admin">Open admin dashboard</Link> : <Link className="button button-primary" to="/books">Browse books</Link>}
        <Link className="button button-secondary" to="/notifications">View notifications</Link>
        <button className="button button-danger" type="button" onClick={handleLogout}>
          <LogOut size={17} />
          Logout
        </button>
      </div>
    </section>
  )
}

export default ProfilePage
