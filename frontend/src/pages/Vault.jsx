import { useState, useMemo } from 'react'
import { useVaultEntries, useCreateEntry, useUpdateEntry, useDeleteEntry } from '../hooks/useVault'
import VaultCard from '../components/ui/VaultCard'
import VaultModal from '../components/ui/VaultModal'
import { useAuthStore } from '../store/authStore'

export default function Vault() {
  const { vaultKey } = useAuthStore()
  const { data: entries = [], isLoading } = useVaultEntries()
  const createEntry = useCreateEntry()
  const updateEntry = useUpdateEntry()
  const deleteEntry = useDeleteEntry()

  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  const filtered = useMemo(() => {
    return entries.filter(e => {
      const matchCat = filter === 'all' || e.category === filter
      // Search is client-side on category only (titles are encrypted)
      return matchCat
    })
  }, [entries, filter])

  const openEdit = (entry) => { setEditing(entry); setModal(true) }
  const openNew  = () => { setEditing(null); setModal(true) }
  const closeModal = () => { setModal(false); setEditing(null) }

  const handleDelete = async (id) => {
    if (confirm('Delete this entry?')) {
      await deleteEntry.mutateAsync(id)
    }
  }

  if (!vaultKey) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400">Session expired. Please <a href="/login" className="text-violet-400 hover:underline">log in again</a>.</p>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">My Vault</h1>
          <p className="text-gray-500 text-sm">{entries.length} encrypted entries</p>
        </div>
        <button
          onClick={openNew}
          className="bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
        >
          + New Entry
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {['all','login','card','note','identity'].map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`text-xs px-3 py-1.5 rounded-full capitalize transition ${
              filter === cat
                ? 'bg-violet-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Entries */}
      {isLoading ? (
        <div className="text-center py-20 text-gray-500">Loading vault...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-500 text-sm">No entries yet.</p>
          <button onClick={openNew} className="mt-3 text-violet-400 text-sm hover:underline">
            Add your first entry
          </button>
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