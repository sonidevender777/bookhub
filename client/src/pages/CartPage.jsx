import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import EmptyState from '../components/EmptyState.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useCart } from '../context/CartContext.jsx'
import { formatCurrency } from '../utils/formatters.js'

const itemLabels = {
  purchase: 'Purchase',
  physical_rental: 'Physical rental',
  digital_rental: 'Digital PDF rental',
}

function CartPage() {
  const { isAuthenticated } = useAuth()
  const { summary, loadCart, updateItem, removeItem, checkout, setMessage } = useCart()
  const navigate = useNavigate()
  const [placingOrder, setPlacingOrder] = useState(false)
  const [order, setOrder] = useState(null)
  const [checkoutError, setCheckoutError] = useState('')

  useEffect(() => {
    if (isAuthenticated) loadCart()
  }, [isAuthenticated])

  if (!isAuthenticated) {
    return (
      <section className="page-section">
        <EmptyState title="Sign in required" message="Create an account or sign in to use the cart and checkout." />
        <div className="center-actions">
          <Link className="button button-primary" to="/login">Sign in</Link>
          <Link className="button button-secondary" to="/register">Create account</Link>
        </div>
      </section>
    )
  }

  const items = summary.items || []

  const placeOrder = async () => {
    setCheckoutError('')
    setPlacingOrder(true)
    try {
      const createdOrder = await checkout()
      setOrder(createdOrder)
      window.setTimeout(() => navigate('/payments', { replace: true }), 650)
    } catch (error) {
      const message = error.response?.data?.message || 'Order could not be placed. Please try again.'
      setCheckoutError(message)
      setMessage(message)
      await loadCart()
      setPlacingOrder(false)
      return
    }
  }

  return (
    <section className="page-section">
      <div className="page-heading">
        <span className="eyebrow">Secure checkout</span>
        <h1>Your cart</h1>
        <p>Review your selected books, rentals, and digital access before placing the order.</p>
      </div>

      {order && (
        <div className="success-banner">
          <ShoppingBag size={20} />
          <span>Order {order.orderNumber} placed successfully. It is waiting for store confirmation. Your payment record has been securely saved for checkout review.</span>
        </div>
      )}

      {checkoutError && <p className="form-error">{checkoutError}</p>}

      {placingOrder ? (
        <div className="checkout-progress">
          <ShoppingBag size={34} />
          <h2>Placing your order...</h2>
          <p>Your cart is being cleared. The owner will receive your request and confirm it from the admin portal.</p>
        </div>
      ) : !items.length ? (
        <EmptyState title="Your cart is empty" message="Browse the catalog and add a book to start checkout." />
      ) : (
        <div className="cart-layout">
          <div className="cart-items">
            {items.map((item) => (
              <article className="cart-item" key={item._id}>
                <div>
                  <strong>{item.book.title}</strong>
                  <span>{itemLabels[item.itemType]} · {formatCurrency(item.unitPrice)}</span>
                </div>
                <div className="quantity-controls">
                  <button type="button" aria-label="Decrease quantity" onClick={() => updateItem(item._id, Math.max(1, item.quantity - 1))}>
                    <Minus size={16} />
                  </button>
                  <span>{item.quantity}</span>
                  <button type="button" aria-label="Increase quantity" onClick={() => updateItem(item._id, item.quantity + 1)}>
                    <Plus size={16} />
                  </button>
                </div>
                <strong>{formatCurrency(item.lineTotal)}</strong>
                <button className="icon-button" type="button" aria-label="Remove item" onClick={() => removeItem(item._id)}>
                  <Trash2 size={17} />
                </button>
              </article>
            ))}
          </div>

          <aside className="order-summary">
            <h2>Order summary</h2>
            <p><span>Subtotal</span><strong>{formatCurrency(summary.totals?.subtotal)}</strong></p>
            <p><span>Discount</span><strong>{formatCurrency(summary.totals?.discountTotal)}</strong></p>
            <p><span>Tax</span><strong>{formatCurrency(summary.totals?.taxTotal)}</strong></p>
            <p className="grand-total"><span>Total</span><strong>{formatCurrency(summary.totals?.grandTotal)}</strong></p>
            <div className="payment-note">
              <strong>BookHub order mode</strong>
              <span>Your order request will be created instantly. The owner must accept it before it becomes confirmed.</span>
            </div>
            <button className="button button-primary" type="button" onClick={placeOrder} disabled={placingOrder}>
              {placingOrder ? 'Placing order...' : 'Place order'}
            </button>
          </aside>
        </div>
      )}
    </section>
  )
}

export default CartPage
