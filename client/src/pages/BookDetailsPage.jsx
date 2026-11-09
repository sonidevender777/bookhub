import { ArrowLeft, CalendarDays, CheckCircle2, ExternalLink, FileText, Heart, MapPin, ShieldCheck, ShoppingBag, Star, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import EmptyState from '../components/EmptyState.jsx'
import LoadingState from '../components/LoadingState.jsx'
import { catalogApi } from '../services/api.js'
import { useCart } from '../context/CartContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { adminApi, engagementApi } from '../services/api.js'
import { formatCurrency, formatDate } from '../utils/formatters.js'
import { getCoverCandidates } from '../utils/categoryVisuals.js'

function BookDetailsPage() {
  const { addItem, setMessage } = useCart()
  const { token, user } = useAuth()
  const { slugOrId } = useParams()
  const [book, setBook] = useState(null)
  const [availability, setAvailability] = useState(null)
  const [reviews, setReviews] = useState([])
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', comment: '' })
  const [reviewError, setReviewError] = useState('')
  const [actionNotice, setActionNotice] = useState('')
  const [loading, setLoading] = useState(true)
  const [coverIndex, setCoverIndex] = useState(0)
  const [openingPdf, setOpeningPdf] = useState(false)

  useEffect(() => {
    catalogApi
      .getBook(slugOrId)
      .then(async (response) => {
        const loadedBook = response.data.book
        setBook(loadedBook)
        setCoverIndex(0)
        if (loadedBook?._id) {
          const availabilityResponse = await catalogApi.getAvailability(loadedBook._id)
          setAvailability(availabilityResponse.data)
          const reviewResponse = await engagementApi.reviews(loadedBook._id)
          setReviews(reviewResponse.data || [])
        }
      })
      .catch(() => setBook(null))
      .finally(() => setLoading(false))
  }, [slugOrId])

  if (loading) return <section className="page-section"><LoadingState /></section>
  if (!book) return <EmptyState title="Book not found" message="The book may have been archived or moved." />

  const author = book.authors?.map((item) => item.name).join(', ') || 'Book Hub Author'
  const category = book.categories?.map((item) => item.name).join(', ') || 'General'
  const coverInitials = book.title.split(' ').slice(0, 3).map((word) => word[0]).join('')
  const coverCandidates = getCoverCandidates(book)
  const coverUrl = coverCandidates[coverIndex]
  const handleCartAction = async (itemType) => {
    if (itemType === 'digital_rental' && !book.hasDigitalEdition) {
      setActionNotice('A digital edition has not been attached to this title yet.')
      return
    }
    const added = await addItem(book, itemType)
    if (!added) {
      setActionNotice('Please check the message below. If you are not signed in, login first and try again.')
      return
    }
    const actionLabel = itemType === 'purchase' ? 'hardcopy purchase' : itemType === 'physical_rental' ? 'physical rental' : book.digitalKind === 'pdf' ? 'digital PDF rental' : 'online digital-edition rental'
    setActionNotice(`${book.title} was added to your cart as a ${actionLabel}. Open the cart to place the order.`)
  }

  const handleReserve = async () => {
    if (!token) {
      setActionNotice('Please sign in to join the waitlist for this book.')
      return
    }
    try {
      const response = await engagementApi.reserve(token, book._id)
      const reservation = response.data?.reservation
      setActionNotice(reservation?.position
        ? `You are #${reservation.position} on the waitlist. BookHub will notify you when a physical copy becomes available.`
        : 'Your reservation is already active. BookHub will notify you when a physical copy becomes available.')
    } catch (error) {
      setActionNotice(error.response?.data?.message || 'This book could not be reserved right now.')
    }
  }

  const handleAdminPdfOpen = async () => {
    setOpeningPdf(true)
    try {
      const response = await adminApi.openBook(token, book._id)
      const fileUrl = response.data?.reader?.fileUrl
      if (!fileUrl) throw new Error('No digital edition is attached to this book.')
      window.open(fileUrl, '_blank', 'noopener,noreferrer')
    } catch (error) {
      setActionNotice(error.response?.data?.message || 'This book does not have a digital edition attached.')
    } finally {
      setOpeningPdf(false)
    }
  }

  return (
    <section className="detail-page">
      <Link className="back-link" to="/books">
        <ArrowLeft size={17} />
        Back to catalog
      </Link>

      <div className="detail-layout">
        <div className={`detail-cover ${coverUrl ? 'detail-cover-image' : ''}`}>
          {coverUrl ? <img src={coverUrl} alt={book.cover?.altText || `${book.title} cover`} decoding="async" referrerPolicy="no-referrer" onError={() => setCoverIndex((current) => current + 1)} /> : <span>{coverInitials}</span>}
        </div>
        <div className="detail-content">
          <span className="eyebrow">{category}</span>
          <h1>{book.title}</h1>
          <p className="detail-author">by {author}</p>
          <div className="rating-row">
            <Star size={17} fill="currentColor" />
            <span>{book.averageRating || 'New arrival'}</span>
            <small>{book.reviewCount ? `${book.reviewCount} reviews` : 'Reviews coming soon'}</small>
          </div>
          <p className="detail-description">{book.description}</p>

          <div className="detail-actions">
            <button className="button button-primary" type="button" onClick={() => handleCartAction('purchase')}>
              <ShoppingBag size={18} />
              Buy hardcopy
            </button>
            <button className="button button-secondary" type="button" onClick={() => handleCartAction('physical_rental')}>
              <Heart size={18} />
              Rent physical
            </button>
            <button className="button button-secondary" type="button" disabled={!book.hasDigitalEdition} onClick={() => handleCartAction('digital_rental')} title={book.hasDigitalEdition ? 'Add the digital edition rental to your cart' : 'A digital edition is not attached to this title'}>
              <FileText size={18} />
              {book.hasDigitalEdition ? (book.digitalKind === 'pdf' ? 'Rent PDF' : 'Rent digital edition') : 'Digital edition unavailable'}
            </button>
            {['manager', 'owner'].includes(user?.role) && book.hasDigitalEdition && (
              <button className="button button-secondary" type="button" disabled={openingPdf} onClick={handleAdminPdfOpen}>
                <ExternalLink size={18} />
                {openingPdf ? 'Opening...' : (book.digitalKind === 'pdf' ? 'Open PDF directly' : 'Open digital edition')}
              </button>
            )}
            <button
              className="button button-secondary"
              type="button"
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
              <Heart size={18} />
              Wishlist
            </button>
            <button className="button button-secondary" type="button" onClick={handleReserve}>
              Reserve
            </button>
          </div>
          <div className={`digital-availability ${book.hasDigitalEdition ? 'available' : 'unavailable'}`} role="status">
            {book.hasDigitalEdition ? <CheckCircle2 size={17} /> : <XCircle size={17} />}
            <span>{book.hasDigitalEdition ? (book.digitalKind === 'pdf' ? 'PDF available for digital rental' : 'Online digital edition available for rental') : 'No digital edition attached yet'}</span>
          </div>
          <p className="reservation-help">Reserve joins the physical-copy waitlist when all copies are currently rented. You will receive a notification when one becomes available.</p>
          {actionNotice && <p className="action-notice">{actionNotice}</p>}
        </div>
      </div>

      <div className="detail-grid">
        <article>
          <h2>Purchase</h2>
          <strong>{formatCurrency(book.purchasePrice)}</strong>
          <p>Order request is reviewed by the bookstore owner before confirmation.</p>
        </article>
        <article>
          <h2>Physical rental</h2>
          <strong>{formatCurrency(book.physicalRental?.price)}</strong>
          <p>{book.physicalRental?.durationDays || 14} days. Late penalty follows owner rules.</p>
        </article>
        <article>
          <h2>{book.digitalKind === 'pdf' ? 'Digital PDF rental' : 'Digital edition rental'}</h2>
          <strong>{formatCurrency(book.digitalRental?.price)}</strong>
          <p>{book.digitalRental?.durationDays || 14} days with backend-checked access.</p>
        </article>
      </div>

      <section className="availability-panel">
        <div>
          <span className="eyebrow">Store availability</span>
          <h2>{availability?.counts?.available || 0} copies available now</h2>
        </div>
        <div className="availability-list">
          {(availability?.availableCopies || []).slice(0, 3).map((copy) => (
            <article key={copy._id}>
              <MapPin size={18} />
              <div>
                <strong>{copy.copyCode}</strong>
                <span>{copy.location?.label}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="meta-strip">
        <span><CalendarDays size={16} /> Published {formatDate(book.publicationDate)}</span>
        <span><ShieldCheck size={16} /> ISBN {book.isbn13 || 'Not listed'}</span>
      </section>

      <section className="reviews-panel">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Reader voices</span>
            <h2>Reviews</h2>
          </div>
        </div>
        {reviews.length ? (
          <div className="simple-list">
            {reviews.map((review) => (
              <article className="simple-row" key={review._id}>
                <Star size={20} fill="currentColor" />
                <div>
                  <strong>{review.title || `${review.rating} star review`}</strong>
                  <span>{review.comment}</span>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="muted">No visible reviews yet.</p>
        )}

        <form
          className="review-form"
          onSubmit={async (event) => {
            event.preventDefault()
            setReviewError('')
            try {
              const response = await engagementApi.createReview(token, { ...reviewForm, book: book._id })
              setReviews([response.data.review, ...reviews])
              setReviewForm({ rating: 5, title: '', comment: '' })
            } catch (error) {
              setReviewError(error.response?.data?.message || 'Review could not be submitted.')
            }
          }}
        >
          <h3>Write a review</h3>
          {reviewError && <p className="form-error">{reviewError}</p>}
          <select value={reviewForm.rating} onChange={(event) => setReviewForm({ ...reviewForm, rating: Number(event.target.value) })}>
            <option value="5">5 stars</option>
            <option value="4">4 stars</option>
            <option value="3">3 stars</option>
            <option value="2">2 stars</option>
            <option value="1">1 star</option>
          </select>
          <input value={reviewForm.title} onChange={(event) => setReviewForm({ ...reviewForm, title: event.target.value })} placeholder="Review title" />
          <textarea value={reviewForm.comment} onChange={(event) => setReviewForm({ ...reviewForm, comment: event.target.value })} placeholder="Share your thoughts" />
          <button className="button button-primary" type="submit" disabled={!token}>
            Submit review
          </button>
        </form>
      </section>
    </section>
  )
}

export default BookDetailsPage
