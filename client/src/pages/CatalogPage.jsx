import { Filter, Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import BookCard from '../components/BookCard.jsx'
import EmptyState from '../components/EmptyState.jsx'
import LoadingState from '../components/LoadingState.jsx'
import { fallbackBooks } from '../data/fallbackBooks.js'
import { catalogApi } from '../services/api.js'

function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [books, setBooks] = useState([])
  const [categories, setCategories] = useState([])
  const [pagination, setPagination] = useState(null)
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState(searchParams.get('q') || '')

  const filters = useMemo(
    () => ({
      q: searchParams.get('q') || undefined,
      category: searchParams.get('category') || undefined,
      format: searchParams.get('format') || undefined,
      sort: searchParams.get('sort') || 'digital_first',
    }),
    [searchParams],
  )

  useEffect(() => {
    setQuery(searchParams.get('q') || '')
  }, [searchParams])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    Promise.all([
      catalogApi.listBooks({ ...filters, page: 1, limit: 50 }),
      catalogApi.listCategories(),
    ])
      .then(async ([bookResponse, categoryResponse]) => {
        const totalPages = bookResponse.pagination?.totalPages || 1
        const remainingPages = Array.from({ length: Math.max(0, totalPages - 1) }, (_, index) => index + 2)
        const remainingResponses = await Promise.all(
          remainingPages.map((page) => catalogApi.listBooks({ ...filters, page, limit: 50 })),
        )
        if (cancelled) return
        setBooks([bookResponse, ...remainingResponses].flatMap((response) => response.data || []))
        setPagination({ ...bookResponse.pagination, page: 1, limit: 50 })
        setCategories(categoryResponse.data || [])
      })
      .catch(() => {
        if (cancelled) return
        setBooks(fallbackBooks)
        setCategories([{ name: 'Fiction', slug: 'fiction' }, { name: 'Academic', slug: 'academic' }])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [filters])

  const updateFilter = (key, value) => {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value)
    else next.delete(key)
    setSearchParams(next, { replace: true })
  }

  const handleSearchChange = (value) => {
    setQuery(value)
    updateFilter('q', value.trim())
  }

  const submitSearch = (event) => {
    event.preventDefault()
    updateFilter('q', query.trim())
  }

  return (
    <section className="page-section">
      <div className="page-heading">
        <span className="eyebrow">Book discovery</span>
        <h1>Find your next read</h1>
        <p>Search by title, author, ISBN, category, or format. Rental and purchase details are shown on every book.</p>
      </div>

      <form className="catalog-toolbar" onSubmit={submitSearch}>
        <label className="search-field">
          <Search size={18} />
          <input
            value={query}
            onChange={(event) => handleSearchChange(event.target.value)}
            placeholder="Search books, authors, ISBN..."
            aria-label="Search books, authors, or ISBN"
          />
        </label>
        <label>
          <Filter size={17} />
          <select value={filters.category || ''} onChange={(event) => updateFilter('category', event.target.value)}>
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category._id || category.slug} value={category.slug || category.name}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <select value={filters.format || ''} onChange={(event) => updateFilter('format', event.target.value)}>
          <option value="">Any format</option>
          <option value="physical">Physical</option>
          <option value="digital">Digital edition (PDF/online)</option>
        </select>
        <select value={filters.sort} onChange={(event) => updateFilter('sort', event.target.value)}>
          <option value="digital_first">Digital edition available first</option>
          <option value="newest">Newest</option>
          <option value="popular">Popular</option>
          <option value="price_asc">Price low to high</option>
          <option value="price_desc">Price high to low</option>
          <option value="rating">Top rated</option>
        </select>
        <button className="button button-primary" type="submit">
          Search
        </button>
      </form>

      {loading ? (
        <LoadingState />
      ) : books.length ? (
        <>
          <p className="result-count">{pagination?.total || books.length} books found{filters.sort === 'digital_first' ? ' · Digital editions shown first' : ''}</p>
          <div className="book-grid">{books.map((book) => <BookCard book={book} key={book._id} />)}</div>
        </>
      ) : (
        <EmptyState title="No books found" message="Try removing one filter or searching for a simpler word." />
      )}
    </section>
  )
}

export default CatalogPage
