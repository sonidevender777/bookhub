import { Heart, ShoppingBag, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import EmptyState from '../components/EmptyState.jsx'
import LoadingState from '../components/LoadingState.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useCart } from '../context/CartContext.jsx'
import { engagementApi } from '../services/api.js'
import { formatCurrency } from '../utils/formatters.js'

function WishlistPage() {
  const { isAuthenticated, token } = useAuth()
  const { addItem, setMessage } = useCart()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  const loadWishlist = () => {
    if (!isAuthenticated) {
      setLoading(false)
      return
    }
    engagementApi
      .wishlist(token)
      .then((response) => setItems(response.data || []))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadWishlist()
  }, [isAuthenticated, token])

  const removeItem = async (bookId) => {
    await engagementApi.removeWishlist(token, bookId)
    setMessage('Book removed from your wishlist.')
    window.dispatchEvent(new Event('bookhub:wishlist-updated'))
    loadWishlist()
  }

  if (!isAuthenticated) {
    return (
      <section className="page-section">
        <EmptyState title="Sign in required" message="Save books to your wishlist after login." />
        <div className="center-actions"><Link className="button button-primary" to="/login">Sign in</Link></div>
      </section>
    )
  }

  return (
    <section className="page-section">
      <div className="page-heading">
        <span className="eyebrow">Saved books</span>
        <h1>Wishlist</h1>
        <p>Keep track of books you want to buy, rent, or reserve later.</p>
      </div>
      {loading ? <LoadingState /> : items.length ? (
        <div className="simple-list">
          {items.map((item) => (
            <article className="simple-row" key={item._id}>
              <Heart size={22} />
              <div>
                <strong>{item.book?.title}</strong>
                <span>{formatCurrency(item.book?.purchasePrice)}</span>
              </div>
              <button
                className="button button-secondary"
                type="button"
                onClick={async () => {
                  await addItem(item.book, 'purchase')
                  setMessage(`${item.book?.title} moved from wishlist to cart.`)
                }}
              >
                <ShoppingBag size={17} /> Buy hardcopy
              </button>
              <button className="icon-button" type="button" aria-label="Remove from wishlist" onClick={() => removeItem(item.book._id)}>
                <Trash2 size={17} />
              </button>
            </article>
          ))}
        </div>
      ) : <EmptyState title="No wishlist books yet" message="Use the heart button on any book card to save it." />}
    </section>
  )
}

export default WishlistPage
