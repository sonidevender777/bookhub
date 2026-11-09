import { ArrowRight, BookCopy, Clock3, LogIn, MapPin, ShieldCheck, Sparkles, UsersRound } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import BookCard from '../components/BookCard.jsx'
import LoadingState from '../components/LoadingState.jsx'
import { fallbackBooks } from '../data/fallbackBooks.js'
import { catalogApi } from '../services/api.js'
import { getCategoryImage } from '../utils/categoryVisuals.js'
import { useAuth } from '../context/AuthContext.jsx'

function HomePage() {
  const { isAuthenticated } = useAuth()
  const [books, setBooks] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      catalogApi.listBooks({ ...(isAuthenticated ? {} : { featured: 'true' }), sort: 'popular', limit: isAuthenticated ? 50 : 6 }),
      catalogApi.listCategories(),
    ])
      .then(([bookResponse, categoryResponse]) => {
        setBooks(bookResponse.data || [])
        setCategories(categoryResponse.data || [])
      })
      .catch(() => {
        setBooks(fallbackBooks)
        setCategories([
          { name: 'Fiction', slug: 'fiction', description: 'Stories for thoughtful everyday reading.', bookCount: 1 },
          { name: 'Academic & Study', slug: 'academic-study', description: 'Focused reading for learners.', bookCount: 1 },
          { name: 'Personal Growth', slug: 'personal-growth', description: 'Practical ideas for better everyday habits.', bookCount: 1 },
          { name: 'Young Readers', slug: 'young-readers', description: 'Imaginative adventures for growing readers.', bookCount: 1 },
        ])
      })
      .finally(() => setLoading(false))
  }, [isAuthenticated])

  const visibleBooks = isAuthenticated ? books : books.slice(0, 6)

  return (
    <>
      <section className="hero-section">
        <div className="hero-content">
          <span className="eyebrow">
            <Sparkles size={16} />
            Rewari bookstore for students and everyday readers
          </span>
          <h1>Book Hub</h1>
          <p>
            Discover books, rent physical copies, access digital PDFs, reserve unavailable titles, and know exactly where every
            copy lives inside the store.
          </p>
          <div className="hero-metrics" aria-label="Book Hub highlights">
            <span><strong>20+</strong> copies tracked</span>
            <span><strong>14 days</strong> default digital access</span>
            <span><strong>₹</strong> India-ready pricing</span>
          </div>
          <div className="hero-actions">
            <Link className="button button-primary" to="/books">
              {isAuthenticated ? 'Browse all books' : 'View book preview'}
              <ArrowRight size={18} />
            </Link>
            <Link className="button button-secondary" to="/register">
              Create account
            </Link>
          </div>
        </div>
        <div className="hero-panel" aria-label="Book Hub highlights">
          <div className="hero-book hero-book-one">Academic</div>
          <div className="hero-book hero-book-two">Fiction</div>
          <div className="hero-book hero-book-three">Rentals</div>
        </div>
      </section>

      <section className="feature-strip">
        <article>
          <BookCopy size={24} />
          <strong>Buy or rent</strong>
          <span>Physical and digital options</span>
        </article>
        <article>
          <MapPin size={24} />
          <strong>Exact shelves</strong>
          <span>Branch, floor, rack, and shelf tracking</span>
        </article>
        <article>
          <Clock3 size={24} />
          <strong>Due dates</strong>
          <span>Rental duration and late penalty ready</span>
        </article>
      </section>

      <section className="story-section">
        <div>
          <span className="eyebrow">Built like a real bookstore system</span>
          <h2>One platform for readers, staff, and shop owners.</h2>
          <p>
            BookHub is not only a catalog. It tracks shelf locations, rental returns, overdue penalties, payment records,
            reviews, waitlists, notifications, and customer history from the same MERN stack foundation.
          </p>
        </div>
        <div className="story-grid">
          <article>
            <UsersRound size={22} />
            <strong>Customer portal</strong>
            <span>Orders, rentals, wishlist, reviews, reservations, and PDF library.</span>
          </article>
          <article>
            <ShieldCheck size={22} />
            <strong>Backend checked access</strong>
            <span>Digital rentals expire from the server, not from frontend tricks.</span>
          </article>
          <article>
            <MapPin size={22} />
            <strong>Location control</strong>
            <span>Branch → floor → section → rack → shelf → physical copy.</span>
          </article>
        </div>
      </section>

      <section className="section-block category-showcase">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Browse by section</span>
            <h2>Find the kind of story you need</h2>
          </div>
          {isAuthenticated ? <Link to="/books">Explore all books</Link> : <Link to="/login">Sign in to explore all</Link>}
        </div>
        <div className="category-grid">
          {categories.map((category, index) => (
            <Link className="category-card" to={`/sections/${category.slug}`} key={category._id || category.slug}>
              <img
                src={getCategoryImage(category, index)}
                alt=""
                loading={index < 4 ? 'eager' : 'lazy'}
                fetchPriority={index < 4 ? 'high' : 'auto'}
                onError={(event) => {
                  event.currentTarget.onerror = null
                  event.currentTarget.src = getCategoryImage({}, index)
                }}
              />
              <div className="category-card-content">
                <strong>{category.name}</strong>
                <span>{`${category.bookCount || 0} ${(category.bookCount || 0) === 1 ? 'book' : 'books'}`}</span>
                <ArrowRight size={16} aria-hidden="true" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div>
            <span className="eyebrow">{isAuthenticated ? 'Full catalog preview' : 'A small preview'}</span>
            <h2>{isAuthenticated ? 'Explore the complete collection' : 'Popular picks at Book Hub'}</h2>
          </div>
          {isAuthenticated && <Link to="/books">Open catalog</Link>}
        </div>
        {loading ? <LoadingState /> : <div className="book-grid">{visibleBooks.map((book) => <BookCard book={book} key={book._id} />)}</div>}
        {!isAuthenticated && !loading && (
          <div className="catalog-login-gate">
            <div>
              <span className="eyebrow"><LogIn size={15} /> Member access</span>
              <h3>Sign in to view all books</h3>
              <p>Browse the complete catalogue, check availability, save a wishlist, rent books, and open your digital library.</p>
            </div>
            <Link className="button button-primary" to="/login">Sign in to continue <ArrowRight size={17} /></Link>
          </div>
        )}
      </section>
    </>
  )
}

export default HomePage
