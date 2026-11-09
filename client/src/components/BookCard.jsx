import { BookMarked, Heart, Star } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useCart } from '../context/CartContext.jsx'
import { engagementApi } from '../services/api.js'
import { formatCurrency } from '../utils/formatters.js'
import { getCoverCandidates } from '../utils/categoryVisuals.js'

function BookCard({ book }) {
  const navigate = useNavigate()
  const { addItem, setMessage } = useCart()
  const { token } = useAuth()
  const author = book.authors?.map((item) => item.name).join(', ') || 'Book Hub Author'
  const category = book.categories?.[0]?.name || book.genres?.[0] || 'Book'
  const coverInitials = book.title
    .split(' ')
    .slice(0, 3)
    .map((word) => word[0])
    .join('')
  const coverCandidates = getCoverCandidates(book)
  const [coverIndex, setCoverIndex] = useState(0)
  const imageUrl = coverCandidates[coverIndex]

  return (
    <article
      className="book-card book-card-clickable"
      onClick={(event) => {
        if (event.target.closest('a, button')) return
        navigate(`/books/${book.slug || book._id}`)
      }}
      onKeyDown={(event) => {
        if ((event.key === 'Enter' || event.key === ' ') && event.target === event.currentTarget) {
          event.preventDefault()
          navigate(`/books/${book.slug || book._id}`)
        }
      }}
      role="link"
      tabIndex={0}
      aria-label={`Open ${book.title}`}
    >
      <Link className={`book-cover ${imageUrl ? 'book-cover-image' : ''}`} to={`/books/${book.slug || book._id}`} aria-label={`View ${book.title}`}>
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={book.cover?.altText || `${book.title} cover`}
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            onError={() => setCoverIndex((current) => current + 1)}
          />
        ) : <span>{coverInitials}</span>}
      </Link>
      <div className="book-card-body">
        <div className="book-card-topline">
          <span>{category}</span>
          <div className="book-card-actions">
            {book.hasDigitalEdition && <span className="pdf-badge" title={book.digitalKind === 'pdf' ? 'A digital PDF is attached to this book' : 'An online digital edition is available'}>{book.digitalKind === 'pdf' ? 'PDF available' : 'Digital edition'}</span>}
            <button
              type="button"
              aria-label={`Add ${book.title} to wishlist`}
              onClick={async () => {
                if (!token) {
                  setMessage('Please sign in to save books to your wishlist.')
                  return
                }
                try {
                  await engagementApi.addWishlist(token, book._id)
                  window.dispatchEvent(new Event('bookhub:wishlist-updated'))
                  setMessage(`${book.title} saved to your wishlist.`)
                } catch (error) {
                  setMessage(error.response?.data?.message || `${book.title} is already in your wishlist.`)
                }
              }}
            >
              <Heart size={17} />
            </button>
          </div>
        </div>
        <h3>
          <Link to={`/books/${book.slug || book._id}`}>{book.title}</Link>
        </h3>
        <p className="muted">{author}</p>
        <div className="rating-row">
          <Star size={16} fill="currentColor" />
          <span>{book.averageRating || 'New'}</span>
          <small>{book.reviewCount ? `${book.reviewCount} reviews` : 'No reviews yet'}</small>
        </div>
        <p className="book-description">{book.description}</p>
        <div className="price-grid">
          <span>
            Buy <strong>{formatCurrency(book.purchasePrice)}</strong>
          </span>
          <span>
            Rent <strong>{formatCurrency(book.physicalRental?.price || book.digitalRental?.price)}</strong>
          </span>
        </div>
        <button className="button button-secondary" type="button" onClick={() => addItem(book, 'purchase')}>
          <BookMarked size={17} />
          Buy hardcopy
        </button>
      </div>
    </article>
  )
}

export default BookCard
