import { ArrowLeft, BookOpen } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import BookCard from '../components/BookCard.jsx'
import EmptyState from '../components/EmptyState.jsx'
import LoadingState from '../components/LoadingState.jsx'
import { catalogApi } from '../services/api.js'
import { getCategoryImage } from '../utils/categoryVisuals.js'

function SectionPage() {
  const { slug } = useParams()
  const [category, setCategory] = useState(null)
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([catalogApi.listCategories(), catalogApi.listBooks({ category: slug, sort: 'popular', limit: 50 })])
      .then(([categoryResponse, bookResponse]) => {
        setCategory(categoryResponse.data?.find((item) => item.slug === slug) || null)
        setBooks(bookResponse.data || [])
      })
      .finally(() => setLoading(false))
  }, [slug])

  return (
    <section className="page-section section-page">
      <Link className="back-link" to="/">
        <ArrowLeft size={17} /> Back to sections
      </Link>
      <div className="section-page-hero">
        <div>
          <span className="eyebrow"><BookOpen size={16} /> Book section</span>
          <h1>{category?.name || 'Book section'}</h1>
          <p>{category?.description || 'Explore books selected for this part of the Book Hub catalogue.'}</p>
        </div>
        <img
          src={getCategoryImage(category)}
          alt=""
          fetchPriority="high"
          decoding="async"
          onError={(event) => {
            event.currentTarget.onerror = null
            event.currentTarget.src = getCategoryImage({}, 0)
          }}
        />
      </div>
      {loading ? <LoadingState /> : books.length ? (
        <div className="book-grid">{books.map((book) => <BookCard book={book} key={book._id} />)}</div>
      ) : (
        <EmptyState title="This section is growing" message="No books have been added here yet. Check another section or browse the full catalogue." />
      )}
    </section>
  )
}

export default SectionPage
