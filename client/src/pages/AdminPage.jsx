import { BarChart3, BookCopy, Boxes, IndianRupee, LibraryBig, PlusCircle, ShoppingBag, Trash2, UsersRound } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import EmptyState from '../components/EmptyState.jsx'
import LoadingState from '../components/LoadingState.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { adminApi, catalogApi, paymentApi } from '../services/api.js'
import { formatCurrency, formatDate } from '../utils/formatters.js'

const statIcons = {
  totalBooks: LibraryBig,
  totalCopies: Boxes,
  availableCopies: BookCopy,
  rentedCopies: BookCopy,
  orders: ShoppingBag,
  customers: UsersRound,
  revenue: IndianRupee,
  overdueRentals: BarChart3,
}

function StatCard({ label, value, name }) {
  const Icon = statIcons[name] || BarChart3
  return (
    <article className="admin-stat">
      <Icon size={22} />
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  )
}

function AdminPayments({ payments, token, onCleared }) {
  const clearPayment = async (payment) => {
    if (!window.confirm(`Clear payment ${payment.paymentNumber}? The related order will remain unchanged.`)) return
    await paymentApi.clear(token, payment._id)
    onCleared(payment._id)
  }

  const clearAllPayments = async () => {
    if (!window.confirm('Clear all payment records for the store? Related orders will remain unchanged.')) return
    await paymentApi.clearAll(token)
    onCleared('all')
  }

  return payments.length ? (
    <>
      <div className="admin-panel-heading">
        <span className="muted">BookHub payment records can be cleared here. Gateway-processed records remain protected.</span>
        {payments.some((payment) => payment.provider === 'demo') && (
          <button className="button button-secondary" type="button" onClick={clearAllPayments}>
            <Trash2 size={17} /> Clear all
          </button>
        )}
      </div>
      <div className="simple-list">
        {payments.map((payment) => (
        <article className="simple-row" key={payment._id}>
          <IndianRupee size={20} />
          <div>
            <strong>{payment.paymentNumber}</strong>
            <span>{payment.user?.fullName || 'Customer'} · {payment.user?.email || '—'}</span>
            <span className="muted">{payment.order?.orderNumber || 'Order'} · {payment.status === 'demo_pending' ? 'Recorded for store review' : payment.status}</span>
          </div>
          <strong>{formatCurrency(payment.amount)}</strong>
          {payment.provider === 'demo' && (
            <button className="icon-button" type="button" title="Clear payment record" aria-label={`Clear ${payment.paymentNumber}`} onClick={() => clearPayment(payment)}>
              <Trash2 size={17} />
            </button>
          )}
        </article>
        ))}
      </div>
    </>
  ) : <EmptyState title="No payment records" message="Customer payment records will appear here after an order is placed." />
}

function AdminHistoryPanel({ type, records, token, onCleared }) {
  const isDigital = type === 'digital'
  const clearHistory = async () => {
    const label = isDigital ? 'expired digital access' : 'completed rental'
    if (!window.confirm(`Clear all ${label} records? Active records will remain protected.`)) return
    const response = isDigital ? await adminApi.clearDigitalHistory(token) : await adminApi.clearRentalHistory(token)
    onCleared()
    return response
  }

  const clearable = records.filter((record) => isDigital
    ? ['expired', 'revoked'].includes(record.status)
    : ['returned', 'cancelled'].includes(record.status))

  return records.length ? (
    <>
      <div className="admin-panel-heading">
        <span className="muted">{isDigital ? 'Active PDF access stays protected.' : 'Active and overdue rentals stay protected.'}</span>
        {clearable.length > 0 && <button className="button button-secondary" type="button" onClick={clearHistory}>Clear completed</button>}
      </div>
      <div className="simple-list">
        {records.map((record) => (
          <article className="simple-row" key={record._id}>
            <BookCopy size={20} />
            <div>
              <strong>{record.book?.title || 'Book record'}</strong>
              <span>{record.user?.fullName || 'Customer'} · {isDigital ? record.accessNumber : record.rentalNumber}</span>
              <span className="muted">{isDigital ? `Expires ${formatDate(record.expirationTime)}` : `Due ${formatDate(record.dueDate)}`}</span>
            </div>
            <span className={`status-pill ${record.status}`}>{record.status}</span>
          </article>
        ))}
      </div>
    </>
  ) : <EmptyState title={`No ${isDigital ? 'digital access' : 'rental'} records`} message="Records will appear here after customers use the platform." />
}

function AdminPage() {
  const { isAuthenticated, token, user } = useAuth()
  const [dashboard, setDashboard] = useState(null)
  const [customers, setCustomers] = useState([])
  const [orders, setOrders] = useState([])
  const [payments, setPayments] = useState([])
  const [adminRentals, setAdminRentals] = useState([])
  const [adminDigitalAccess, setAdminDigitalAccess] = useState([])
  const [books, setBooks] = useState([])
  const [allBooks, setAllBooks] = useState([])
  const [authors, setAuthors] = useState([])
  const [categories, setCategories] = useState([])
  const [branches, setBranches] = useState([])
  const [locations, setLocations] = useState([])
  const [tab, setTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [inventoryMessage, setInventoryMessage] = useState('')
  const [inventoryError, setInventoryError] = useState('')
  const [savingBranch, setSavingBranch] = useState(false)
  const [savingLocation, setSavingLocation] = useState(false)
  const [savingCategory, setSavingCategory] = useState(false)
  const [orderMessage, setOrderMessage] = useState('')
  const [orderError, setOrderError] = useState('')
  const [updatingOrderId, setUpdatingOrderId] = useState('')
  const [savingBook, setSavingBook] = useState(false)
  const [openingBookId, setOpeningBookId] = useState('')
  const [bookAccessNotice, setBookAccessNotice] = useState('')
  const [bookForm, setBookForm] = useState({
    title: '',
    authorName: '',
    categoryId: '',
    isbn13: '',
    coverUrl: '',
    pdfUrl: '',
    description: '',
    purchasePrice: '',
    physicalRentalPrice: '',
    physicalRentalDays: '14',
    digitalRentalPrice: '',
    digitalRentalDays: '14',
    copies: '1',
    branch: '',
    location: '',
  })
  const [branchForm, setBranchForm] = useState({
    name: '',
    phone: '',
    email: '',
    line1: '',
    city: 'Rewari',
    state: 'Haryana',
    postalCode: '',
  })
  const [locationForm, setLocationForm] = useState({
    branch: '',
    floor: 'Ground Floor',
    section: '',
    rack: '',
    shelf: '',
    notes: '',
  })
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    imageUrl: '',
    sortOrder: '',
  })
  const isAdmin = ['manager', 'owner'].includes(user?.role)
  const locationsForSelectedBranch = locations.filter((location) => String(location.branch?._id || location.branch) === String(bookForm.branch))

  const formatApiError = (apiError, fallback) => {
    const errors = apiError.response?.data?.errors
    if (errors?.length) return errors.map((item) => item.message).join(' ')
    return apiError.response?.data?.message || fallback
  }

  const loadAdminData = async () => {
    const [dashboardResponse, customerResponse, ordersResponse, paymentsResponse, rentalsResponse, digitalAccessResponse, booksResponse, allBooksResponse, authorsResponse, categoriesResponse, branchesResponse, locationsResponse] = await Promise.all([
      adminApi.dashboard(token),
      adminApi.customers(token),
      adminApi.orders(token),
      paymentApi.admin(token),
      adminApi.rentals(token),
      adminApi.digitalAccess(token),
      catalogApi.listBooks({ limit: 50, sort: 'newest' }),
      adminApi.books(token),
      catalogApi.listAuthors(),
      catalogApi.listCategories(),
      adminApi.branches(token),
      adminApi.locations(token),
    ])

    setDashboard(dashboardResponse.data)
    setCustomers(customerResponse.data || [])
    setOrders(ordersResponse.data || [])
    setPayments(paymentsResponse.data || [])
    setAdminRentals(rentalsResponse.data || [])
    setAdminDigitalAccess(digitalAccessResponse.data || [])
    setBooks(booksResponse.data || [])
    setAllBooks(allBooksResponse.data || [])
    setAuthors(authorsResponse.data || [])
    setCategories(categoriesResponse.data || [])
    setBranches(branchesResponse.data || [])
    setLocations(locationsResponse.data || [])

    setBookForm((current) => {
      const selectedBranch = current.branch || branchesResponse.data?.[0]?._id || ''
      const matchingLocations = (locationsResponse.data || []).filter((location) => String(location.branch?._id || location.branch) === String(selectedBranch))
      const currentLocationIsValid = matchingLocations.some((location) => String(location._id) === String(current.location))
      return {
        ...current,
        categoryId: (categoriesResponse.data || []).some((category) => String(category._id) === String(current.categoryId))
          ? current.categoryId
          : categoriesResponse.data?.[0]?._id || '',
        branch: selectedBranch,
        location: currentLocationIsValid ? current.location : matchingLocations[0]?._id || '',
      }
    })
    setLocationForm((current) => ({
      ...current,
      branch: current.branch || branchesResponse.data?.[0]?._id || '',
    }))
  }

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) {
      setLoading(false)
      return
    }
    loadAdminData()
      .finally(() => setLoading(false))
  }, [isAuthenticated, isAdmin, token])

  const resolveReference = async (records, name, createApi, listApi, responseKey) => {
    const cleanName = name.trim()
    const existing = records.find((record) => record.name.toLowerCase() === cleanName.toLowerCase())
    if (existing) return existing._id
    try {
      const response = await createApi(token, { name: cleanName })
      return response.data[responseKey]._id
    } catch (apiError) {
      const refreshed = await listApi()
      const refreshedRecord = refreshed.data?.find((record) => record.name.toLowerCase() === cleanName.toLowerCase())
      if (refreshedRecord) return refreshedRecord._id
      throw apiError
    }
  }

  const submitBook = async (event) => {
    event.preventDefault()
    setInventoryError('')
    setInventoryMessage('')
    setSavingBook(true)

    try {
      const purchasePrice = Number(bookForm.purchasePrice)
      const authorId = await resolveReference(authors, bookForm.authorName, adminApi.createAuthor, catalogApi.listAuthors, 'author')
      const selectedCategory = categories.find((category) => String(category._id) === String(bookForm.categoryId))
      if (!selectedCategory) throw new Error('Choose a book section before adding this title.')
      const physicalRentalPrice = bookForm.physicalRentalPrice ? Number(bookForm.physicalRentalPrice) : Math.max(1, Math.round(purchasePrice * 0.05))
      const digitalRentalPrice = bookForm.digitalRentalPrice ? Number(bookForm.digitalRentalPrice) : Math.max(1, Math.round(purchasePrice * 0.02))

      const bookResponse = await adminApi.createBook(token, {
        title: bookForm.title,
        isbn13: bookForm.isbn13 || undefined,
        authors: [authorId],
        categories: [selectedCategory._id],
        genres: [selectedCategory.name],
        description: bookForm.description,
        cover: bookForm.coverUrl ? { url: bookForm.coverUrl, altText: `${bookForm.title} cover` } : undefined,
        purchasePrice,
        physicalEnabled: true,
        digitalEnabled: Boolean(bookForm.pdfUrl),
        physicalRental: {
          enabled: true,
          price: physicalRentalPrice,
          durationDays: Number(bookForm.physicalRentalDays || 14),
        },
        digitalRental: {
          enabled: Boolean(bookForm.pdfUrl),
          price: digitalRentalPrice,
          durationDays: Number(bookForm.digitalRentalDays || 14),
        },
        digitalFormat: 'pdf',
        digitalAssetKey: bookForm.pdfUrl || undefined,
      })

      const createdBook = bookResponse.data.book
      const copyCount = Math.max(1, Number(bookForm.copies || 1))
      await Promise.all(
        Array.from({ length: copyCount }, (_, index) =>
          adminApi.createCopy(token, {
            book: createdBook._id,
            branch: bookForm.branch,
            location: bookForm.location,
            copyCode: `BH-${Date.now()}-${index + 1}`,
            status: 'available',
            acquisitionPrice: purchasePrice,
            condition: { grade: 'good' },
          }),
        ),
      )

      setInventoryMessage(`${createdBook.title} added with ${copyCount} physical ${copyCount === 1 ? 'copy' : 'copies'}.`)
      setBookForm((current) => ({
        title: '',
        authorName: '',
        categoryId: current.categoryId,
        isbn13: '',
        coverUrl: '',
        pdfUrl: '',
        description: '',
        purchasePrice: '',
        physicalRentalPrice: '',
        physicalRentalDays: '14',
        digitalRentalPrice: '',
        digitalRentalDays: '14',
        copies: '1',
        branch: current.branch,
        location: current.location,
      }))
      await loadAdminData()
    } catch (apiError) {
      setInventoryError(formatApiError(apiError, 'Book could not be added.'))
    } finally {
      setSavingBook(false)
    }
  }

  const archiveBook = async (book) => {
    if (!window.confirm(`Remove "${book.title}" from the public catalog?`)) return
    setInventoryError('')
    setInventoryMessage('')
    try {
      await adminApi.archiveBook(token, book._id)
      setInventoryMessage(`${book.title} was removed from the public catalog.`)
      await loadAdminData()
    } catch (apiError) {
      setInventoryError(formatApiError(apiError, 'Book could not be removed.'))
    }
  }

  const submitBranch = async (event) => {
    event.preventDefault()
    setInventoryError('')
    setInventoryMessage('')
    setSavingBranch(true)
    try {
      const response = await adminApi.createBranch(token, {
        name: branchForm.name,
        phone: branchForm.phone || undefined,
        email: branchForm.email || undefined,
        address: {
          line1: branchForm.line1 || undefined,
          city: branchForm.city || 'Rewari',
          state: branchForm.state || 'Haryana',
          country: 'India',
          postalCode: branchForm.postalCode || undefined,
        },
      })
      setInventoryMessage(response.data.reused ? `${response.data.branch.name} already exists, so it has been selected.` : `${response.data.branch.name} branch created successfully.`)
      setBranchForm({ name: '', phone: '', email: '', line1: '', city: 'Rewari', state: 'Haryana', postalCode: '' })
      await loadAdminData()
      setBookForm((current) => ({ ...current, branch: response.data.branch._id, location: '' }))
      setLocationForm((current) => ({ ...current, branch: response.data.branch._id }))
    } catch (apiError) {
      setInventoryError(formatApiError(apiError, 'Branch could not be created.'))
    } finally {
      setSavingBranch(false)
    }
  }

  const submitLocation = async (event) => {
    event.preventDefault()
    setInventoryError('')
    setInventoryMessage('')
    setSavingLocation(true)
    try {
      const response = await adminApi.createLocation(token, {
        branch: locationForm.branch,
        floor: locationForm.floor,
        section: locationForm.section,
        rack: locationForm.rack,
        shelf: locationForm.shelf,
        notes: locationForm.notes || undefined,
      })
      setInventoryMessage(response.data.reused ? `${response.data.location.label} already exists, so it has been selected.` : `${response.data.location.label} shelf location created successfully.`)
      setLocationForm((current) => ({ ...current, section: '', rack: '', shelf: '', notes: '' }))
      await loadAdminData()
      setBookForm((current) => ({ ...current, branch: response.data.location.branch._id || response.data.location.branch, location: response.data.location._id }))
    } catch (apiError) {
      setInventoryError(formatApiError(apiError, 'Shelf location could not be created.'))
    } finally {
      setSavingLocation(false)
    }
  }

  const submitCategory = async (event) => {
    event.preventDefault()
    setInventoryError('')
    setInventoryMessage('')
    setSavingCategory(true)
    try {
      const response = await adminApi.createCategory(token, {
        name: categoryForm.name,
        description: categoryForm.description || undefined,
        imageUrl: categoryForm.imageUrl || undefined,
        sortOrder: categoryForm.sortOrder ? Number(categoryForm.sortOrder) : undefined,
      })
      setInventoryMessage(`${response.data.category.name} section is ready for new books.`)
      setCategoryForm({ name: '', description: '', imageUrl: '', sortOrder: '' })
      await loadAdminData()
      setBookForm((current) => ({ ...current, categoryId: response.data.category._id }))
    } catch (apiError) {
      setInventoryError(formatApiError(apiError, 'Book section could not be created.'))
    } finally {
      setSavingCategory(false)
    }
  }

  const handleBookBranchChange = (branchId) => {
    const firstLocation = locations.find((location) => String(location.branch?._id || location.branch) === String(branchId))
    setBookForm({ ...bookForm, branch: branchId, location: firstLocation?._id || '' })
  }

  const acceptOrder = async (order) => {
    setOrderError('')
    setOrderMessage('')
    setUpdatingOrderId(order._id)
    try {
      await adminApi.updateOrderStatus(token, order._id, { orderStatus: 'confirmed' })
      setOrderMessage(`Order ${order.orderNumber} accepted. The customer has been notified professionally.`)
      await loadAdminData()
    } catch (apiError) {
      setOrderError(formatApiError(apiError, 'Order could not be accepted.'))
    } finally {
      setUpdatingOrderId('')
    }
  }

  const openAdminBook = async (book) => {
    setBookAccessNotice('')
    setOpeningBookId(book._id)
    try {
      const response = await adminApi.openBook(token, book._id)
      const fileUrl = response.data?.reader?.fileUrl
      if (!fileUrl) throw new Error('No digital file is attached.')
      window.open(fileUrl, '_blank', 'noopener,noreferrer')
    } catch (apiError) {
      setBookAccessNotice(apiError.response?.data?.message || 'This title does not have a digital edition attached.')
    } finally {
      setOpeningBookId('')
    }
  }

  if (!isAuthenticated) {
    return (
      <section className="page-section">
        <EmptyState title="Admin sign in required" message="Use the seeded owner account to open the admin portal." />
        <div className="center-actions"><Link className="button button-primary" to="/login">Sign in</Link></div>
      </section>
    )
  }

  if (!isAdmin) {
    return <EmptyState title="Admin access only" message="This dashboard is available to manager and owner accounts." />
  }

  if (loading) return <section className="page-section"><LoadingState /></section>

  const stats = dashboard?.stats || {}
  const statRows = [
    ['Total books', stats.totalBooks, 'totalBooks'],
    ['Total copies', stats.totalCopies, 'totalCopies'],
    ['Available copies', stats.availableCopies, 'availableCopies'],
    ['Rented copies', stats.rentedCopies, 'rentedCopies'],
    ['Overdue rentals', stats.overdueRentals, 'overdueRentals'],
    ['Customers', stats.customers, 'customers'],
    ['Orders', stats.orders, 'orders'],
    ['Revenue', formatCurrency(stats.revenue), 'revenue'],
  ]

  return (
    <section className="admin-page">
      <aside className="admin-sidebar">
        <strong>BookHub Admin</strong>
        {['overview', 'books', 'orders', 'rentals', 'digital', 'customers', 'payments', 'inventory'].map((item) => (
          <button className={tab === item ? 'active' : ''} key={item} type="button" onClick={() => setTab(item)}>
            {item}
          </button>
        ))}
      </aside>

      <div className="admin-main">
        <div className="page-heading">
          <span className="eyebrow">Shop owner portal</span>
          <h1>Dashboard</h1>
          <p>Live bookstore metrics from catalog, inventory, orders, rentals, customers, reviews, and reservations.</p>
        </div>

        {tab === 'overview' && (
          <>
            <div className="admin-stats">{statRows.map(([label, value, name]) => <StatCard key={label} label={label} value={value ?? 0} name={name} />)}</div>
            <div className="admin-panels">
              <section className="admin-panel">
                <h2>Recent orders</h2>
                {orderMessage && <p className="success-banner">{orderMessage}</p>}
                {orderError && <p className="form-error">{orderError}</p>}
                {(dashboard?.recentOrders || []).map((order) => (
                  <article className="admin-row" key={order._id}>
                    <div><strong>{order.orderNumber}</strong><span>{order.user?.fullName || 'Customer'}</span></div>
                    <span>{formatCurrency(order.grandTotal)}</span>
                    <span className="status-pill">{order.orderStatus === 'pending' ? 'Needs acceptance' : order.orderStatus}</span>
                    {order.orderStatus === 'pending' ? (
                      <button className="button button-primary" type="button" disabled={updatingOrderId === order._id} onClick={() => acceptOrder(order)}>
                        {updatingOrderId === order._id ? 'Accepting...' : 'Accept order'}
                      </button>
                    ) : null}
                  </article>
                ))}
              </section>
              <section className="admin-panel">
                <h2>Low stock</h2>
                {(dashboard?.lowStock || []).map((book) => (
                  <article className="admin-row" key={book._id}>
                    <div><strong>{book.title}</strong><span>{book.isbn13}</span></div>
                    <span>{book.available} left</span>
                  </article>
                ))}
              </section>
            </div>
          </>
        )}

        {tab === 'customers' && (
          <section className="admin-panel">
            <h2>Customers</h2>
            {customers.map((customer) => (
              <article className="admin-row" key={customer._id}>
                <div><strong>{customer.fullName}</strong><span>{customer.email}</span></div>
                <span>{customer.accountStatus}</span>
                <span>{formatDate(customer.createdAt)}</span>
              </article>
            ))}
          </section>
        )}

        {tab !== 'overview' && tab !== 'customers' && (
          <section className="admin-panel">
            <h2>{tab === 'books' ? 'All books' : tab}</h2>
            {tab === 'books' ? (
              <>
                {bookAccessNotice && <p className="form-error">{bookAccessNotice}</p>}
                <div className="admin-panel-heading">
                  <span className="muted">Admin catalog access includes every title currently stored in BookHub, with its availability and digital-file status.</span>
                  <strong>{allBooks.length} titles</strong>
                </div>
                {allBooks.length ? (
                  <div className="simple-list">
                    {allBooks.map((book) => (
                      <article className="simple-row admin-book-row" key={book._id}>
                        <BookCopy size={20} />
                        <div>
                          <strong>{book.title}</strong>
                          <span>{book.authors?.map((author) => author.name).join(', ') || 'Author'} · {book.categories?.map((category) => category.name).join(', ') || 'Uncategorised'}</span>
                        </div>
                        <span className={`status-pill ${book.isArchived ? 'cancelled' : 'active'}`}>{book.isArchived ? 'Archived' : 'Active'}</span>
                        <span className="muted">{book.hasDigitalEdition ? (book.digitalKind === 'pdf' ? 'PDF available' : 'Online edition') : 'No digital file attached'}</span>
                        {!book.isArchived && book.hasDigitalEdition && <button className="button button-secondary" type="button" disabled={openingBookId === book._id} onClick={() => openAdminBook(book)}>{openingBookId === book._id ? 'Opening...' : (book.digitalKind === 'pdf' ? 'Open PDF' : 'Open digital edition')}</button>}
                        {!book.isArchived && <Link className="button button-secondary" to={`/books/${book.slug || book._id}`}>Open book</Link>}
                      </article>
                    ))}
                  </div>
                ) : (
                  <EmptyState title="No books in the catalog" message="Add a book from Inventory to make it available here." />
                )}
              </>
            ) : tab === 'orders' ? (
              <>
                {orderMessage && <p className="success-banner">{orderMessage}</p>}
                {orderError && <p className="form-error">{orderError}</p>}
                {orders.length ? (
                  <div className="simple-list">
                    {orders.map((order) => (
                      <article className="simple-row" key={order._id}>
                        <ShoppingBag size={20} />
                        <div>
                          <strong>{order.orderNumber}</strong>
                          <span>
                            {order.user?.fullName || 'Customer'} • {order.items?.length || 0} item{order.items?.length === 1 ? '' : 's'} • {formatDate(order.createdAt)}
                          </span>
                          <span className="muted">
                            {order.orderStatus === 'pending'
                              ? 'Placed by customer — waiting for owner confirmation.'
                              : order.orderStatus === 'confirmed'
                                ? 'Accepted by store — customer has been notified.'
                                : `Current status: ${order.orderStatus}`}
                          </span>
                        </div>
                        <strong>{formatCurrency(order.grandTotal)}</strong>
                        <span className="status-pill">{order.orderStatus === 'pending' ? 'Needs acceptance' : order.orderStatus}</span>
                        {order.orderStatus === 'pending' ? (
                          <button className="button button-primary" type="button" disabled={updatingOrderId === order._id} onClick={() => acceptOrder(order)}>
                            {updatingOrderId === order._id ? 'Accepting...' : 'Accept order'}
                          </button>
                        ) : null}
                      </article>
                    ))}
                  </div>
                ) : (
                  <EmptyState title="No orders yet" message="Customer orders will appear here for owner confirmation." />
                )}
              </>
            ) : tab === 'payments' ? (
              <AdminPayments payments={payments} token={token} onCleared={(paymentId) => setPayments((current) => paymentId === 'all' ? [] : current.filter((payment) => payment._id !== paymentId))} />
            ) : tab === 'rentals' ? (
              <AdminHistoryPanel type="rentals" records={adminRentals} token={token} onCleared={() => setAdminRentals((current) => current.filter((rental) => !['returned', 'cancelled'].includes(rental.status)))} />
            ) : tab === 'digital' ? (
              <AdminHistoryPanel type="digital" records={adminDigitalAccess} token={token} onCleared={() => setAdminDigitalAccess((current) => current.filter((access) => access.status === 'active'))} />
            ) : tab === 'inventory' ? (
              <>
                {inventoryMessage && <p className="success-banner">{inventoryMessage}</p>}
                {inventoryError && <p className="form-error">{inventoryError}</p>}
                <div className="admin-tools-grid">
                  <form className="admin-mini-form" onSubmit={submitBranch}>
                    <div className="form-section-title">
                      <PlusCircle size={18} />
                      <strong>Create branch</strong>
                    </div>
                    <label>
                      Branch name
                      <input required value={branchForm.name} onChange={(event) => setBranchForm({ ...branchForm, name: event.target.value })} placeholder="Book Hub Rewari" />
                    </label>
                    <label>
                      Phone optional
                      <input value={branchForm.phone} onChange={(event) => setBranchForm({ ...branchForm, phone: event.target.value })} placeholder="+91..." />
                    </label>
                    <label>
                      Email optional
                      <input type="email" value={branchForm.email} onChange={(event) => setBranchForm({ ...branchForm, email: event.target.value })} placeholder="store@bookhub.in" />
                    </label>
                    <label>
                      Address optional
                      <input value={branchForm.line1} onChange={(event) => setBranchForm({ ...branchForm, line1: event.target.value })} placeholder="Main market, Rewari" />
                    </label>
                    <div className="mini-form-row">
                      <label>
                        City
                        <input value={branchForm.city} onChange={(event) => setBranchForm({ ...branchForm, city: event.target.value })} />
                      </label>
                      <label>
                        State
                        <input value={branchForm.state} onChange={(event) => setBranchForm({ ...branchForm, state: event.target.value })} />
                      </label>
                    </div>
                    <button className="button button-secondary" type="submit" disabled={savingBranch}>
                      {savingBranch ? 'Creating branch...' : 'Create branch'}
                    </button>
                  </form>

                  <form className="admin-mini-form" onSubmit={submitLocation}>
                    <div className="form-section-title">
                      <PlusCircle size={18} />
                      <strong>Create shelf location</strong>
                    </div>
                    <label>
                      Branch
                      <select required value={locationForm.branch} onChange={(event) => setLocationForm({ ...locationForm, branch: event.target.value })}>
                        <option value="">Select branch</option>
                        {branches.map((branch) => <option key={branch._id} value={branch._id}>{branch.name}</option>)}
                      </select>
                    </label>
                    <label>
                      Floor
                      <input required value={locationForm.floor} onChange={(event) => setLocationForm({ ...locationForm, floor: event.target.value })} placeholder="Ground Floor" />
                    </label>
                    <div className="mini-form-row">
                      <label>
                        Section
                        <input required value={locationForm.section} onChange={(event) => setLocationForm({ ...locationForm, section: event.target.value })} placeholder="Fiction" />
                      </label>
                      <label>
                        Rack
                        <input required value={locationForm.rack} onChange={(event) => setLocationForm({ ...locationForm, rack: event.target.value })} placeholder="Rack A4" />
                      </label>
                    </div>
                    <label>
                      Shelf
                      <input required value={locationForm.shelf} onChange={(event) => setLocationForm({ ...locationForm, shelf: event.target.value })} placeholder="Shelf 3" />
                    </label>
                    <button className="button button-secondary" type="submit" disabled={savingLocation || !branches.length}>
                      {savingLocation ? 'Creating shelf...' : 'Create shelf location'}
                    </button>
                  </form>

                  <form className="admin-mini-form" onSubmit={submitCategory}>
                    <div className="form-section-title">
                      <PlusCircle size={18} />
                      <strong>Create book section</strong>
                    </div>
                    <label>
                      Section name
                      <input required value={categoryForm.name} onChange={(event) => setCategoryForm({ ...categoryForm, name: event.target.value })} placeholder="Science Fiction" />
                    </label>
                    <label>
                      Description optional
                      <input value={categoryForm.description} onChange={(event) => setCategoryForm({ ...categoryForm, description: event.target.value })} placeholder="Future worlds and bold ideas" />
                    </label>
                    <label>
                      Thumbnail URL optional
                      <input type="url" value={categoryForm.imageUrl} onChange={(event) => setCategoryForm({ ...categoryForm, imageUrl: event.target.value })} placeholder="https://example.com/section.jpg" />
                    </label>
                    <label>
                      Display order optional
                      <input min="0" type="number" value={categoryForm.sortOrder} onChange={(event) => setCategoryForm({ ...categoryForm, sortOrder: event.target.value })} placeholder="1" />
                    </label>
                    <button className="button button-secondary" type="submit" disabled={savingCategory}>
                      {savingCategory ? 'Creating section...' : 'Create book section'}
                    </button>
                  </form>
                </div>

                <form className="admin-form" onSubmit={submitBook}>
                  <div className="form-section-title">
                    <PlusCircle size={20} />
                    <strong>Add a new book</strong>
                  </div>
                  <label>
                    Book title
                    <input required value={bookForm.title} onChange={(event) => setBookForm({ ...bookForm, title: event.target.value })} placeholder="Example: Operating System Concepts" />
                  </label>
                  <label>
                    Author
                    <input required value={bookForm.authorName} onChange={(event) => setBookForm({ ...bookForm, authorName: event.target.value })} placeholder="Example: Abraham Silberschatz" />
                  </label>
                  <label>
                    Book section
                    <select required value={bookForm.categoryId} onChange={(event) => setBookForm({ ...bookForm, categoryId: event.target.value })}>
                      <option value="">Choose a section</option>
                      {categories.map((category) => <option key={category._id} value={category._id}>{category.name}</option>)}
                    </select>
                    <small className="field-help">Create a new section above before adding a book to it.</small>
                  </label>
                  <label>
                    ISBN-13 optional
                    <input value={bookForm.isbn13} onChange={(event) => setBookForm({ ...bookForm, isbn13: event.target.value })} placeholder="13 digit ISBN" />
                  </label>
                  <label>
                    Cover image URL optional
                    <input type="url" value={bookForm.coverUrl} onChange={(event) => setBookForm({ ...bookForm, coverUrl: event.target.value })} placeholder="https://example.com/book-cover.jpg" />
                  </label>
                  <label>
                    Digital file URL optional
                    <input type="url" value={bookForm.pdfUrl} onChange={(event) => setBookForm({ ...bookForm, pdfUrl: event.target.value })} placeholder="https://example.com/book.pdf" />
                    <small className="field-help">Paste a direct, public .pdf link. The app opens it in a new tab and labels non-PDF reading links as online editions.</small>
                  </label>
                  <label className="wide-field">
                    Description
                    <textarea required minLength="20" value={bookForm.description} onChange={(event) => setBookForm({ ...bookForm, description: event.target.value })} placeholder="Write a useful book description for customers..." />
                  </label>
                  <div className="form-section-heading wide-field">
                    <span>Pricing and access</span>
                    <small>Set the customer prices and rental windows for this title.</small>
                  </div>
                  <label>
                    Purchase price
                    <input required min="0" type="number" value={bookForm.purchasePrice} onChange={(event) => setBookForm({ ...bookForm, purchasePrice: event.target.value })} placeholder="499" />
                  </label>
                  <label>
                    Physical rental price
                    <input min="0" type="number" value={bookForm.physicalRentalPrice} onChange={(event) => setBookForm({ ...bookForm, physicalRentalPrice: event.target.value })} placeholder="Auto: 5% of price" />
                  </label>
                  <label>
                    Physical rental days
                    <input required min="1" type="number" value={bookForm.physicalRentalDays} onChange={(event) => setBookForm({ ...bookForm, physicalRentalDays: event.target.value })} />
                  </label>
                  <label>
                    Digital rental price
                    <input min="0" type="number" value={bookForm.digitalRentalPrice} onChange={(event) => setBookForm({ ...bookForm, digitalRentalPrice: event.target.value })} placeholder="Auto: 2% of price" />
                  </label>
                  <label>
                    Digital rental days
                    <input required min="1" max="365" type="number" value={bookForm.digitalRentalDays} onChange={(event) => setBookForm({ ...bookForm, digitalRentalDays: event.target.value })} />
                    <small className="field-help">Customers can open the digital file during this access period.</small>
                  </label>
                  <label>
                    Number of physical copies
                    <input required min="1" max="50" type="number" value={bookForm.copies} onChange={(event) => setBookForm({ ...bookForm, copies: event.target.value })} />
                  </label>
                  <div className="form-section-heading wide-field">
                    <span>Store placement</span>
                    <small>Choose where every physical copy will be shelved.</small>
                  </div>
                  <label className="location-field">
                    Branch
                    <select required value={bookForm.branch} onChange={(event) => handleBookBranchChange(event.target.value)}>
                      <option value="">Select branch</option>
                      {branches.map((branch) => <option key={branch._id} value={branch._id}>{branch.name}</option>)}
                    </select>
                  </label>
                  <label className="location-field location-field-shelf">
                    Shelf location
                    <select required value={bookForm.location} onChange={(event) => setBookForm({ ...bookForm, location: event.target.value })}>
                      <option value="">Select location</option>
                      {locationsForSelectedBranch.map((location) => <option key={location._id} value={location._id}>{location.label}</option>)}
                    </select>
                    <small className="field-help">{bookForm.branch && !locationsForSelectedBranch.length ? 'No shelf exists for this branch yet. Create one above first.' : 'Choose the exact floor, section, rack, and shelf for these copies.'}</small>
                  </label>
                  <button className="button button-primary wide-field" type="submit" disabled={savingBook || !branches.length || !locationsForSelectedBranch.length}>
                    {savingBook ? 'Adding book...' : !branches.length || !locationsForSelectedBranch.length ? 'Create branch and shelf first' : 'Add book to inventory'}
                  </button>
                </form>

                <div className="admin-table-heading">
                  <h3>Current catalog</h3>
                  <span>{books.length} active books</span>
                </div>
                <div className="simple-list">
                  {books.map((book) => (
                    <article className="simple-row" key={book._id}>
                      <BookCopy size={20} />
                      <div>
                        <strong>{book.title}</strong>
                        <span>{book.authors?.map((author) => author.name).join(', ') || 'Author'} • {formatCurrency(book.purchasePrice)}</span>
                      </div>
                      <Link className="button button-secondary" to={`/books/${book.slug || book._id}`}>View</Link>
                      <button className="button button-danger" type="button" onClick={() => archiveBook(book)}>
                        <Trash2 size={16} />
                        Remove
                      </button>
                    </article>
                  ))}
                </div>
              </>
            ) : (
              <p className="muted">Use this section to review bookstore records connected with {tab}. Advanced editing controls can be added here as the store workflow grows.</p>
            )}
          </section>
        )}
      </div>
    </section>
  )
}

export default AdminPage
