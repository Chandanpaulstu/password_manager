import { useState, useMemo } from 'react'
import { useVaultEntries, useCreateEntry, useUpdateEntry, useDeleteEntry } from '../hooks/useVault'
import VaultCard from '../components/ui/VaultCard'
import VaultModal from '../components/ui/VaultModal'
import { useAuthStore } from '../store/authStore'
import { deriveKey } from '../crypto/vault'
import client from '../api/client'

export default function Vault() {
  const { vaultKey, setVaultKey } = useAuthStore()
  const { data: entries = [], isLoading } = useVaultEntries()
  const createEntry = useCreateEntry()
  const updateEntry = useUpdateEntry()
  const deleteEntry = useDeleteEntry()

  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [filter, setFilter] = useState('all')

  // Unlock state
  const [masterPassword, setMasterPassword] = useState('')
  const [keyError, setKeyError] = useState('')
  const [keyLoading, setKeyLoading] = useState(false)

  const unlockVault = async (e) => {
    e.preventDefault()
    setKeyError('')
    setKeyLoading(true)
    try {
      const { data } = await client.get('/auth/kdf-salt')
      const key = await deriveKey(masterPassword, data.kdf_salt)
      setVaultKey(key)
      setMasterPassword('')
    } catch {
      setKeyError('Wrong master password or session expired.')
    } finally {
      setKeyLoading(false)
    }
  }

  const openEdit  = async (entry) => {
    const { data: fullEntry } = await client.get(`/vault/${entry.id}`)
    setEditing(fullEntry)
    setModal(true)
  }
  const openNew   = () => { setEditing(null); setModal(true) }
  const closeModal = () => { setModal(false); setEditing(null) }

  const handleDelete = async (id) => {
    if (confirm('Delete this entry? This cannot be undone.')) {
      await deleteEntry.mutateAsync(id)
    }
  }

  const filtered = useMemo(() => {
    if (filter === 'all') return entries
    return entries.filter(e => e.category === filter)
  }, [entries, filter])

  // Vault locked screen
  if (!vaultKey) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 w-full max-w-sm shadow-xl">
          <div className="text-center mb-6">
            <span className="text-4xl">🔐</span>
            <h2 className="text-lg font-bold text-white mt-3">Vault Locked</h2>
            <p className="text-gray-500 text-sm mt-1">Enter your master password to unlock</p>
          </div>

          {keyError && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3 mb-4">
              {keyError}
            </div>
          )}

          <form onSubmit={unlockVault} className="space-y-3">
            <input
              type="password"
              value={masterPassword}
              onChange={e => setMasterPassword(e.target.value)}
              required
              autoFocus
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-violet-500 transition"
              placeholder="Master password"
            />
            <button
              type="submit"
              disabled={keyLoading}
              className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg transition text-sm"
            >
              {keyLoading ? 'Unlocking...' : 'Unlock Vault'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">My Vault</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {entries.length} encrypted {entries.length === 1 ? 'entry' : 'entries'}
          </p>
        </div>
        <button
          onClick={openNew}
          className="bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
        >
          + New Entry
        </button>
      </div>

      {/* Category filter tabs */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {['all', 'login', 'card', 'note', 'identity'].map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`text-xs px-3 py-1.5 rounded-full capitalize transition ${
              filter === cat
                ? 'bg-violet-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {cat === 'all' ? 'All' : cat === 'login' ? '🔑 Login' : cat === 'card' ? '💳 Card' : cat === 'note' ? '📝 Note' : '🪪 Identity'}
          </button>
        ))}
      </div>

      {/* Entries */}
      {isLoading ? (
        <div className="text-center py-20 text-gray-500 text-sm">Loading vault...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <span className="text-5xl">🔒</span>
          <p className="text-gray-500 text-sm mt-4">
            {filter === 'all' ? 'No entries yet.' : `No ${filter} entries.`}
          </p>
          {filter === 'all' && (
            <button
              onClick={openNew}
              className="mt-3 text-violet-400 text-sm hover:underline"
            >
              Add your first entry
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map(entry => (
            <VaultCard
              key={entry.id}
              entry={entry}
              onEdit={openEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <VaultModal
          entry={editing}
          onClose={closeModal}
          onCreate={createEntry.mutateAsync}
          onUpdate={updateEntry.mutateAsync}
        />
      )}
    </div>
  )
}