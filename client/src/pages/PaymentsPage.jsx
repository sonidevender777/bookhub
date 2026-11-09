import { CreditCard, Download, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import EmptyState from '../components/EmptyState.jsx'
import LoadingState from '../components/LoadingState.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { paymentApi } from '../services/api.js'
import { formatCurrency, formatDate } from '../utils/formatters.js'

const getOrderStatusLabel = (status) => {
  if (status === 'pending') return 'Waiting for owner confirmation'
  if (status === 'confirmed') return 'Confirmed by Book Hub'
  if (status === 'processing') return 'Being prepared'
  if (status === 'ready') return 'Ready for pickup'
  if (status === 'completed') return 'Completed'
  if (status === 'cancelled') return 'Cancelled'
  return status || 'Order created'
}

const escapeHtml = (value) => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;')

function PaymentsPage() {
  const { isAuthenticated, token } = useAuth()
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false)
      return
    }
    paymentApi
      .mine(token)
      .then((response) => setPayments(response.data || []))
      .finally(() => setLoading(false))
  }, [isAuthenticated, token])

  const clearPayment = async (paymentId) => {
    if (!window.confirm('Clear this payment record from your payment history? The related order will remain unchanged.')) return
    setMessage('')
    setError('')
    try {
      await paymentApi.clear(token, paymentId)
      setPayments((current) => current.filter((payment) => payment._id !== paymentId))
      setMessage('Payment record cleared from your history.')
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Payment could not be cleared.')
    }
  }

  const clearAllPayments = async () => {
    if (!window.confirm('Clear all payment records from your payment history? Related orders will remain unchanged.')) return
    setMessage('')
    setError('')
    try {
      const response = await paymentApi.clearAll(token)
      setPayments([])
      setMessage(response.message || 'All payment records cleared.')
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Payment history could not be cleared.')
    }
  }

  const downloadReceipt = (payment) => {
    const orderNumber = payment.order?.orderNumber || 'Order record'
    const receiptHtml = `<!doctype html>
<html><head><meta charset="utf-8"><title>BookHub payment receipt ${escapeHtml(payment.paymentNumber)}</title>
<style>body{font-family:Arial,sans-serif;background:#f7f3ed;color:#241c17;padding:40px}.receipt{max-width:680px;margin:auto;background:#fffdf8;border:1px solid #e5d3bc;border-radius:18px;padding:36px}.brand{color:#0a6b64;font-size:14px;font-weight:700;letter-spacing:2px;text-transform:uppercase}.title{font-size:32px;margin:12px 0 28px}.row{display:flex;justify-content:space-between;gap:24px;padding:13px 0;border-bottom:1px solid #eadfce}.label{color:#6f645b}.total{font-size:22px;font-weight:700;color:#064c48;border-bottom:0}</style></head>
<body><main class="receipt"><div class="brand">BookHub Rewari</div><h1 class="title">Payment receipt</h1>
<div class="row"><span class="label">Receipt number</span><strong>${escapeHtml(payment.paymentNumber)}</strong></div>
<div class="row"><span class="label">Order number</span><strong>${escapeHtml(orderNumber)}</strong></div>
<div class="row"><span class="label">Date</span><strong>${escapeHtml(formatDate(payment.createdAt))}</strong></div>
<div class="row"><span class="label">Status</span><strong>${escapeHtml(getOrderStatusLabel(payment.order?.orderStatus))}</strong></div>
<div class="row total"><span>Total paid</span><strong>${escapeHtml(formatCurrency(payment.amount))}</strong></div>
<p class="label">This receipt confirms the payment record created by BookHub. The related order remains subject to the bookstore's confirmation workflow.</p></main></body></html>`
    const blob = new Blob([receiptHtml], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `BookHub-${payment.paymentNumber}-receipt.html`
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    setMessage('Payment receipt downloaded. Open the HTML file to print or save it as PDF.')
  }

  if (!isAuthenticated) {
    return (
      <section className="page-section">
        <EmptyState title="Sign in required" message="Payment history appears after login." />
        <div className="center-actions"><Link className="button button-primary" to="/login">Sign in</Link></div>
      </section>
    )
  }

  return (
    <section className="page-section">
      <div className="page-heading page-heading-with-action">
        <div>
          <span className="eyebrow">Payments</span>
          <h1>Payment history</h1>
          <p>Track order payment records and bookstore confirmation status in one place.</p>
        </div>
        {payments.some((payment) => payment.provider === 'demo') && (
          <button className="button button-secondary" type="button" onClick={clearAllPayments}>
            <Trash2 size={17} /> Clear all
          </button>
        )}
      </div>
      {message && <p className="success-banner">{message}</p>}
      {error && <p className="form-error">{error}</p>}
      {loading ? <LoadingState /> : payments.length ? (
        <div className="simple-list">
          {payments.map((payment) => (
            <article className="simple-row" key={payment._id}>
              <CreditCard size={22} />
              <div>
                <strong>{payment.paymentNumber}</strong>
                <span>{payment.order?.orderNumber} · {getOrderStatusLabel(payment.order?.orderStatus)} · {formatDate(payment.createdAt)}</span>
                <span className="muted">{payment.status === 'demo_pending' ? 'Payment recorded for owner review.' : payment.status}</span>
              </div>
              <strong>{formatCurrency(payment.amount)}</strong>
              <button className="button button-secondary receipt-button" type="button" onClick={() => downloadReceipt(payment)}>
                <Download size={16} /> Receipt
              </button>
              {payment.provider === 'demo' && (
                  <button className="icon-button" type="button" aria-label={`Clear ${payment.paymentNumber}`} title="Clear payment record" onClick={() => clearPayment(payment._id)}>
                  <Trash2 size={17} />
                </button>
              )}
            </article>
          ))}
        </div>
      ) : <EmptyState title="No payments yet" message="Place an order to create a payment record." />}
    </section>
  )
}

export default PaymentsPage
