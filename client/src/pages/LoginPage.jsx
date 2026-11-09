import { LogIn } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')

  const formatAuthError = (apiError) => {
    const errors = apiError.response?.data?.errors
    if (errors?.length) return errors.map((item) => item.message).join(' ')
    return apiError.response?.data?.message || 'Sign in failed.'
  }

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    try {
      const response = await login(form)
      const role = response.data.user?.role
      navigate(['owner', 'manager'].includes(role) ? '/admin' : '/', { replace: true })
    } catch (apiError) {
      setError(formatAuthError(apiError))
    }
  }

  return (
    <section className="auth-page">
      <form className="auth-form" onSubmit={submit}>
        <span className="eyebrow">Customer portal</span>
        <h1>Welcome back</h1>
        {error && <p className="form-error">{error}</p>}
        <label>
          Email
          <input type="email" placeholder="you@example.com" autoComplete="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
        </label>
        <label>
          Password
          <input type="password" placeholder="Your password" autoComplete="current-password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
        </label>
        <button className="button button-primary" type="submit">
          <LogIn size={18} />
          Sign in
        </button>
        <p>
          New to Book Hub? <Link to="/register">Create an account</Link>
        </p>
      </form>
    </section>
  )
}

export default LoginPage
