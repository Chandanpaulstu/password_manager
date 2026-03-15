import { useState, useEffect } from 'react'
import { useAuthStore } from '../../store/authStore'
import { encryptData, encryptTitle, decryptData } from '../../crypto/vault'

const DEFAULTS = {
  login:    { title: '', url: '', username: '', password: '', note: '' },
  card:     { title: '', cardholder: '', number: '', expiry: '', cvv: '', note: '' },
  note:     { title: '', note: '' },
  identity: { title: '', full_name: '', email: '', phone: '', address: '', note: '' },
}

export default function VaultModal({ entry, onClose, onCreate, onUpdate }) {
  const { vaultKey } = useAuthStore()
  const isEdit = !!entry
  const [category, setCategory] = useState(entry?.category || 'login')
  const [form, setForm] = useState(DEFAULTS[entry?.category || 'login'])
  const [loading, setLoading] = useState(false)
  const [hydrating, setHydrating] = useState(isEdit)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    if (!entry || !vaultKey) {
      setHydrating(false)
      return
    }
    setHydrating(true)
    decryptData(vaultKey, entry.data_encrypted, entry.iv)
      .then(plain => {
        setCategory(entry.category)
        setForm({ ...DEFAULTS[entry.category], ...plain })
      })
      .catch(() => {})
      .finally(() => setHydrating(false))
  }, [entry, vaultKey])

  const handle = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }))

  const formatCardNumber = (value) => {
    const digits = value.replace(/\D/g, '').slice(0, 16)
    return digits.replace(/(.{4})/g, '$1 ').trim()
  }

  const formatExpiry = (value) => {
    const digits = value.replace(/\D/g, '').slice(0, 4)
    if (digits.length <= 2) return digits
    return `${digits.slice(0, 2)}/${digits.slice(2)}`
  }

  const handleCardNumber = (e) => setForm(p => ({ ...p, number: formatCardNumber(e.target.value) }))
  const handleCardExpiry = (e) => setForm(p => ({ ...p, expiry: formatExpiry(e.target.value) }))
  const handleCardCvv = (e) => setForm(p => ({ ...p, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) }))

  const handleCategoryChange = (e) => {
    const cat = e.target.value
    setCategory(cat)
    setForm(DEFAULTS[cat])
  }

  const submit = async e => {
    e.preventDefault()
    if (!vaultKey) return
    setLoading(true)
    try {
      const { data_encrypted, iv } = await encryptData(vaultKey, { ...form, category })
      const title_encrypted = await encryptTitle(vaultKey, form.title)
      const payload = { title_encrypted, data_encrypted, iv, category }
      isEdit ? await onUpdate({ id: entry.id, ...payload }) : await onCreate(payload)
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-white">
            {isEdit ? 'Edit Entry' : 'New Entry'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl">✕</button>
        </div>

        <form onSubmit={submit} className="space-y-3">
          {hydrating && (
            <div className="text-xs text-gray-400 bg-gray-800/70 border border-gray-700 rounded-lg px-3 py-2">
              Loading encrypted entry...
            </div>
          )}

          {/* Category selector — disable in edit mode */}
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Category</label>
            <select
              value={category}
              onChange={handleCategoryChange}
              disabled={isEdit || hydrating}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500 disabled:opacity-50"
            >
              <option value="login">🔑 Login</option>
              <option value="card">💳 Card</option>
              <option value="note">📝 Secure Note</option>
              <option value="identity">🪪 Identity</option>
            </select>
          </div>

          {/* Title — all categories */}
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Title</label>
            <input
              name="title" required value={form.title} onChange={handle} disabled={hydrating}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500"
              placeholder={
                category === 'login' ? 'e.g. Gmail' :
                category === 'card' ? 'e.g. Visa Debit' :
                category === 'note' ? 'e.g. WiFi Password' :
                'e.g. My Passport'
              }
            />
          </div>

          {/* LOGIN fields */}
          {category === 'login' && <>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">URL</label>
              <input
                name="url" value={form.url} onChange={handle} disabled={hydrating}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500"
                placeholder="https://gmail.com"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Username / Email</label>
              <input
                name="username" value={form.username} onChange={handle} disabled={hydrating}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500"
                placeholder="you@gmail.com"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Password</label>
              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password} onChange={handle} disabled={hydrating}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500 pr-16"
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowPassword(p => !p)}
                  className="absolute right-3 top-2 text-xs text-gray-400 hover:text-white">
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
          </>}

          {/* CARD fields */}
          {category === 'card' && <>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Cardholder Name</label>
              <input
                name="cardholder" value={form.cardholder} onChange={handle} disabled={hydrating}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Card Number</label>
              <input
                name="number" value={form.number} onChange={handleCardNumber} disabled={hydrating}
                maxLength={19}
                inputMode="numeric"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500 font-mono"
                placeholder="1234 5678 9012 3456"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Expiry</label>
                <input
                  name="expiry" value={form.expiry} onChange={handleCardExpiry} disabled={hydrating}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500"
                  placeholder="MM/YY"
                  maxLength={5}
                  inputMode="numeric"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">CVV</label>
                <input
                  name="cvv" value={form.cvv} onChange={handleCardCvv} disabled={hydrating}
                  type="password" maxLength={4}
                  inputMode="numeric"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500"
                  placeholder="•••"
                />
              </div>
            </div>
          </>}

          {/* IDENTITY fields */}
          {category === 'identity' && <>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Full Name</label>
              <input
                name="full_name" value={form.full_name} onChange={handle} disabled={hydrating}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Email</label>
              <input
                name="email" type="email" value={form.email} onChange={handle} disabled={hydrating}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Phone</label>
              <input
                name="phone" value={form.phone} onChange={handle} disabled={hydrating}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500"
                placeholder="+1 555 000 0000"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Address</label>
              <textarea
                name="address" value={form.address} onChange={handle} rows={2} disabled={hydrating}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500 resize-none"
                placeholder="123 Main St, City, Country"
              />
            </div>
          </>}

          {/* Note — all categories */}
          <div>
            <label className="text-xs text-gray-400 mb-1 block">
              {category === 'note' ? 'Secure Note' : 'Note (optional)'}
            </label>
            <textarea
              name="note" value={form.note} onChange={handle} rows={3} disabled={hydrating}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500 resize-none"
              placeholder={category === 'note' ? 'Your secure note...' : 'Optional note...'}
            />
          </div>

          <button
            type="submit" disabled={loading || hydrating}
            className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg transition text-sm mt-2"
          >
            {loading ? 'Saving...' : isEdit ? 'Update Entry' : 'Save Entry'}
          </button>
        </form>
      </div>
    </div>
  )
}