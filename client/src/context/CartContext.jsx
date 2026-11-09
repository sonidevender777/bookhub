import { createContext, useContext, useEffect, useState } from 'react'
import { orderApi } from '../services/api.js'
import { useAuth } from './AuthContext.jsx'

const CartContext = createContext(null)
const emptySummary = { items: [], totals: { subtotal: 0, discountTotal: 0, taxTotal: 0, grandTotal: 0 } }

export function CartProvider({ children }) {
  const { token } = useAuth()
  const [cart, setCart] = useState(null)
  const [summary, setSummary] = useState(emptySummary)
  const [message, setMessage] = useState('')

  const resetCart = () => {
    setCart(null)
    setSummary(emptySummary)
  }

  const applyCart = (payload) => {
    setCart(payload.cart)
    setSummary(payload.summary)
  }

  const loadCart = async () => {
    if (!token) return
    const response = await orderApi.getCart(token)
    applyCart(response.data)
  }

  useEffect(() => {
    resetCart()
    if (!token) return
    loadCart().catch(() => resetCart())
  }, [token])

  const addItem = async (book, itemType) => {
    if (!token) {
      setMessage('Please sign in before adding books to cart.')
      return false
    }
    try {
      const response = await orderApi.addCartItem(token, { book: book._id, itemType, quantity: 1 })
      applyCart(response.data)
      const actionLabel = itemType === 'purchase' ? 'hardcopy purchase' : itemType === 'physical_rental' ? 'physical rental' : 'digital rental'
      setMessage(`Added to cart: ${book.title} (${actionLabel}).`)
      return true
    } catch (error) {
      setMessage(error.response?.data?.message || 'This book could not be added to cart. Please try again.')
      return false
    }
  }

  const updateItem = async (itemId, quantity) => {
    const response = await orderApi.updateCartItem(token, itemId, { quantity })
    applyCart(response.data)
  }

  const removeItem = async (itemId) => {
    const response = await orderApi.removeCartItem(token, itemId)
    applyCart(response.data)
  }

  const checkout = async () => {
    const response = await orderApi.checkout(token, { fulfillmentMethod: 'store_pickup', notes: 'BookHub checkout request.' })
    resetCart()
    const rentalCount = response.data.rentals?.length || 0
    setMessage(`Order placed: ${response.data.order.orderNumber}${rentalCount ? ` with ${rentalCount} rental` : ''}. Waiting for owner confirmation.`)
    return response.data.order
  }

  const value = { cart, summary, message, setMessage, loadCart, addItem, updateItem, removeItem, checkout }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export const useCart = () => useContext(CartContext)
