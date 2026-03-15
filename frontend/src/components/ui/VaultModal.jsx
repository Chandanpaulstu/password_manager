import { useState, useEffect } from 'react'
import { useAuthStore } from '../../store/authStore'
import { encryptData, encryptTitle, decryptData } from '../../crypto/vault'

const EMPTY = { title: '', category: 'login', username: '', password: '', url: '', note: '' }

export default function VaultModal({ entry, onClose, onCreate, onUpdate }) {
  const { vaultKey } = useAuthStore()
  const [form, setForm] = useState(EMPTY)
  const [loading, setLoading] = useState(false)
  const [show, setShow] = useState(false)
  const isEdit = !!entry

  // If editing, decrypt existing entry
  useEffect(() => {
    if (!entry || !vaultKey) return
    decryptData(vaultKey, entry.data_encrypted, entry.iv)
      .then(plain => setForm({ title: plain.title, ...plain }))
      .catch(() => {})
  }, [entry, vaultKey])

  const handle = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }))

  const submit = async e => {
    e.preventDefault()
    if (!vaultKey) return
    setLoading(true)
    try {
      const { title, ...rest } = form
      const { data_encrypted, iv } = await encryptData(vaultKey, { title, ...rest })
      const title_encrypted = await encryptTitle(vaultKey, title)

      const payload = {
        title_encrypted,
        data_encrypted,
        iv,
        category: form.category
      }

      if (isEdit) {
        await onUpdate({ id: entry.id, ...payload })
      } else {
        await onCreate(payload)
      }
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-white">
            {isEdit ? 'Edit Entry' : 'New Entry'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl">✕</button>
        </div>

        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs text-gray-400 mb-1 block">Title</label>
              <input
                name="title" required value={form.title} onChange={handle}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500"
                placeholder="e.g. Gmail"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Category</label>
              <select
                name="category" value={form.category} onChange={handle}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500"
              >
                <option value="login">Login</option>
                <option value="card">Card</option>
                <option value="note">Note</option>
                <option value="identity">Identity</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">URL</label>
              <input
                name="url" value={form.url} onChange={handle}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500"
                placeholder="https://"
              />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-gray-400 mb-1 block">Username / Email</label>
              <input
                name="username" value={form.username} onChange={handle}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500"
                placeholder="username@example.com"
              />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-gray-400 mb-1 block">Password</label>
              <div className="relative">
                <input
                  name="password"
                  type={show ? 'text' : 'password'}
                  value={form.password} onChange={handle}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500 pr-16"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShow(p => !p)}
                  className="absolute right-3 top-2 text-xs text-gray-400 hover:text-white"
                >
                  {show ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
            <div className="col-span-2">
              <label className="text-xs text-gray-400 mb-1 block">Note</label>
              <textarea
                name="note" value={form.note} onChange={handle} rows={2}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500 resize-none"
                placeholder="Optional note..."
              />
            </div>
          </div>

          <button
            type="submit" disabled={loading}
            className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg transition text-sm mt-2"
          >
            {loading ? 'Saving...' : isEdit ? 'Update Entry' : 'Save Entry'}
          </button>
        </form>
      </div>
    </div>
  )
}