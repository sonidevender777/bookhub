import { Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from './layouts/AppLayout.jsx'
import AdminPage from './pages/AdminPage.jsx'
import BookDetailsPage from './pages/BookDetailsPage.jsx'
import CartPage from './pages/CartPage.jsx'
import CatalogPage from './pages/CatalogPage.jsx'
import DigitalLibraryPage from './pages/DigitalLibraryPage.jsx'
import HomePage from './pages/HomePage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import NotificationsPage from './pages/NotificationsPage.jsx'
import PaymentsPage from './pages/PaymentsPage.jsx'
import ProfilePage from './pages/ProfilePage.jsx'
import RentalsPage from './pages/RentalsPage.jsx'
import ReservationsPage from './pages/ReservationsPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import WishlistPage from './pages/WishlistPage.jsx'
import SectionPage from './pages/SectionPage.jsx'

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route path="books" element={<CatalogPage />} />
        <Route path="sections/:slug" element={<SectionPage />} />
        <Route path="books/:slugOrId" element={<BookDetailsPage />} />
        <Route path="cart" element={<CartPage />} />
        <Route path="rentals" element={<RentalsPage />} />
        <Route path="digital-library" element={<DigitalLibraryPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="payments" element={<PaymentsPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="wishlist" element={<WishlistPage />} />
        <Route path="reservations" element={<ReservationsPage />} />
        <Route path="admin" element={<AdminPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default App
