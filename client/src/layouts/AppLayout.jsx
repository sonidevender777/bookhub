import { Bell, BookOpen, Heart, Menu, Moon, Search, ShoppingBag, Sun, UserRound, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useCart } from '../context/CartContext.jsx'
import { engagementApi, notificationApi } from '../services/api.js'

function AppLayout() {
  const { pathname } = useLocation()
  const { user, token, isAuthenticated, logout } = useAuth()
  const { summary, message, setMessage } = useCart()
  const [unreadCount, setUnreadCount] = useState(0)
  const [wishlistCount, setWishlistCount] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)
  const [theme, setTheme] = useState(() => localStorage.getItem('bookhub-theme') || 'light')
  const isAdminUser = ['owner', 'manager'].includes(user?.role)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('bookhub-theme', theme)
  }, [theme])

  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadCount(0)
      setWishlistCount(0)
      return
    }
    notificationApi.mine(token, { unread: 'true', limit: 1 }).then((response) => setUnreadCount(response.unreadCount || 0))
    if (!isAdminUser) {
      engagementApi.wishlist(token).then((response) => setWishlistCount(response.data?.length || 0))
    }
  }, [isAuthenticated, token, message, isAdminUser])

  useEffect(() => {
    const refreshUnreadCount = () => {
      if (!isAuthenticated) {
        setUnreadCount(0)
        return
      }
      notificationApi.mine(token, { unread: 'true', limit: 1 }).then((response) => setUnreadCount(response.unreadCount || 0))
    }

    window.addEventListener('bookhub:notifications-updated', refreshUnreadCount)
    return () => window.removeEventListener('bookhub:notifications-updated', refreshUnreadCount)
  }, [isAuthenticated, token])

  useEffect(() => {
    const refreshWishlistCount = () => {
      if (!isAuthenticated || isAdminUser) {
        setWishlistCount(0)
        return
      }
      engagementApi.wishlist(token).then((response) => setWishlistCount(response.data?.length || 0))
    }

    window.addEventListener('bookhub:wishlist-updated', refreshWishlistCount)
    return () => window.removeEventListener('bookhub:wishlist-updated', refreshWishlistCount)
  }, [isAuthenticated, isAdminUser, token])

  useEffect(() => {
    if (!message) return undefined
    const timer = window.setTimeout(() => setMessage(''), 2800)
    return () => window.clearTimeout(timer)
  }, [message, setMessage])

  const navItems = isAdminUser ? [
    { to: '/', label: 'Home' },
    { to: '/books', label: 'Books' },
    { to: '/admin', label: 'Admin' },
    { to: '/payments', label: 'Payments' },
  ] : [
    { to: '/', label: 'Home' },
    { to: '/books', label: 'Books' },
    { to: '/rentals', label: 'My rentals' },
    { to: '/digital-library', label: 'Digital library' },
    { to: '/payments', label: 'Payments' },
    { to: '/admin', label: 'Admin' },
  ]

  return (
    <div className="app-shell">
      <header className="site-header">
        <Link className="brand" to="/" aria-label="Book Hub home">
          <span className="brand-mark">
            <BookOpen size={22} />
          </span>
          <span>
            <strong>Book Hub</strong>
            <small>Rewari</small>
          </span>
        </Link>

        <nav className="desktop-nav" aria-label="Primary navigation">
          {navItems.map((item) => (
            <NavLink key={item.label} to={item.to}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="header-actions">
          <Link className="icon-button" to="/books" aria-label="Search books">
            <Search size={18} />
          </Link>
          {!isAdminUser && (
            <Link className="icon-button cart-button" to="/wishlist" aria-label="Wishlist">
              <Heart size={18} />
              {wishlistCount ? <span>{wishlistCount}</span> : null}
            </Link>
          )}
          <Link className="icon-button cart-button" to="/notifications" aria-label="Notifications">
            <Bell size={18} />
            {unreadCount ? <span>{unreadCount}</span> : null}
          </Link>
          {!isAdminUser && (
            <Link className="icon-button cart-button" to="/cart" aria-label="Cart">
              <ShoppingBag size={18} />
              {summary.items?.length ? <span>{summary.items.length}</span> : null}
            </Link>
          )}
          <button
            className="icon-button"
            type="button"
            aria-label="Toggle theme"
            onClick={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          {isAuthenticated ? (
            <Link className="account-link account-button" to="/profile">
              <UserRound size={17} />
              <span>{user?.fullName?.split(' ')[0] || 'Logout'}</span>
              {isAdminUser && <small className="role-badge role-badge-admin">Admin</small>}
            </Link>
          ) : (
            <Link className="account-link" to="/login">
              <UserRound size={17} />
              Sign in
            </Link>
          )}
          <button className="icon-button mobile-menu-button" type="button" aria-label="Open menu" onClick={() => setMenuOpen(true)}>
            <Menu size={20} />
          </button>
        </div>
      </header>

      {menuOpen && (
        <div className="mobile-menu" role="dialog" aria-modal="true" aria-label="Mobile navigation">
          <button className="icon-button close-menu" type="button" aria-label="Close menu" onClick={() => setMenuOpen(false)}>
            <X size={20} />
          </button>
          {navItems.map((item) => (
            <NavLink key={item.label} to={item.to} onClick={() => setMenuOpen(false)}>
              {item.label}
            </NavLink>
          ))}
          {isAuthenticated ? (
            <>
              <Link className="mobile-profile" to="/profile" onClick={() => setMenuOpen(false)}>
                <UserRound size={18} />
                <span>{user?.fullName || 'Signed in'}</span>
                {isAdminUser && <small className="role-badge role-badge-admin">Admin</small>}
              </Link>
            <button className="mobile-logout" type="button" onClick={() => { logout(); setMenuOpen(false) }}>
              Logout
            </button>
            </>
          ) : (
            <Link to="/login" onClick={() => setMenuOpen(false)}>
              Sign in
            </Link>
          )}
        </div>
      )}

      <main>
        {message && (
          <div className="toast" role="status">
            <span>{message}</span>
            <button type="button" onClick={() => setMessage('')} aria-label="Dismiss message">
              <X size={16} />
            </button>
          </div>
        )}
        <Outlet />
      </main>

      <footer className="site-footer">
        <div className="footer-brand">
          <Link className="brand" to="/" aria-label="Book Hub home">
            <span className="brand-mark">
              <BookOpen size={22} />
            </span>
            <span>
              <strong>Book Hub</strong>
              <small>Rewari, India</small>
            </span>
          </Link>
          <p>
            A MERN-stack bookstore management platform for buying books, renting physical copies, accessing digital PDFs,
            tracking shelf locations, and managing owner operations from one place.
          </p>
          <span className="footer-credit">Designed and developed by Devender Soni for the BookHub academic project.</span>
        </div>
        <div className="footer-columns">
          <div>
            <strong>Explore</strong>
            <Link to="/books">Catalog</Link>
            <Link to="/wishlist">Wishlist</Link>
            <Link to="/reservations">Reservations</Link>
          </div>
          <div>
            <strong>Customer</strong>
            <Link to="/login">Customer login</Link>
            <Link to="/register">Create account</Link>
            <Link to="/rentals">My rentals</Link>
          </div>
          <div>
            <strong>Store tools</strong>
            <Link to="/admin">Owner dashboard</Link>
            <Link to="/digital-library">Digital library</Link>
            <Link to="/payments">Payments</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default AppLayout
