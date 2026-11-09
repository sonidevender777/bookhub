import { UserPlus } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ fullName: '', email: '', password: '' })
  const [error, setError] = useState('')

  const formatAuthError = (apiError) => {
    const errors = apiError.response?.data?.errors
    if (errors?.length) return errors.map((item) => item.message).join(' ')
    return apiError.response?.data?.message || 'Registration failed.'
  }

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    try {
      await register(form)
      navigate('/', { replace: true })
    } catch (apiError) {
      setError(formatAuthError(apiError))
    }
  }

  return (
    <section className="auth-page">
      <form className="auth-form" onSubmit={submit}>
        <span className="eyebrow">Join Book Hub</span>
        <h1>Create account</h1>
        {error && <p className="form-error">{error}</p>}
        <label>
          Full name
          <input type="text" placeholder="Your name" autoComplete="name" value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} />
        </label>
        <label>
          Email
          <input type="email" placeholder="you@example.com" autoComplete="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
        </label>
        <label>
          Password
          <input type="password" placeholder="Minimum 8 characters" autoComplete="new-password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
          <small className="field-help">Use at least 8 characters with uppercase, lowercase, and a number. Example: Customer123</small>
        </label>
        <button className="button button-primary" type="submit">
          <UserPlus size={18} />
          Create account
        </button>
        <p>
          Already registered? <Link to="/login">Sign in</Link>
        </p>
      </form>
    </section>
  )
}

export default RegisterPage
