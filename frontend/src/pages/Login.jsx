import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { deriveKey } from '../crypto/vault'
import client from '../api/client'

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { setAuth, setVaultKey } = useAuthStore()
  const navigate = useNavigate()

  const handle = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }))

  const submit = async e => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      // 1. Login → get token
      const { data } = await client.post('/auth/login', form)
      setAuth(data.user, data.token)

      // 2. Fetch kdf_salt
      const { data: saltData } = await client.get('/auth/kdf-salt')

      // 3. Derive AES key in browser — never sent to server
      const key = await deriveKey(form.password, saltData.kdf_salt)
      setVaultKey(key)

      navigate('/')
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-gray-900 rounded-2xl p-8 shadow-xl border border-gray-800">
        <h1 className="text-2xl font-bold text-white mb-1">Welcome back</h1>
        <p className="text-gray-400 text-sm mb-6">Unlock your vault</p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3 mb-4">
            {error}
          </div>
        )}

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Email</label>
            <input
              name="email" type="email" required
              value={form.email} onChange={handle}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-violet-500 transition"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Master Password</label>
            <input
              name="password" type="password" required
              value={form.password} onChange={handle}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-violet-500 transition"
              placeholder="••••••••••••"
            />
          </div>

          <button
            type="submit" disabled={loading}
            className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg transition text-sm"
          >
            {loading ? 'Unlocking...' : 'Unlock Vault'}
          </button>
        </form>

        <p className="text-sm text-gray-500 text-center mt-6">
          No account?{' '}
          <Link to="/register" className="text-violet-400 hover:underline">Create one</Link>
        </p>
      </div>
    </div>
  )
}