import { useState, useEffect, useCallback } from 'react'
import { useAuthStore } from '../../store/authStore'
import { decryptData, decryptTitle } from '../../crypto/vault'

const CATEGORY_ICON = {
  login: '🔑', card: '💳', note: '📝', identity: '🪪'
}

export default function VaultCard({ entry, onEdit, onDelete }) {
  const { vaultKey } = useAuthStore()
  const [plain, setPlain] = useState(null)
  const [title, setTitle] = useState('...')
  const [copied, setCopied] = useState(false)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    if (!vaultKey) return
    decryptTitle(vaultKey, entry.title_encrypted)
      .then(setTitle).catch(() => setTitle('(error)'))
  }, [entry, vaultKey])

  const expand = async () => {
    if (!expanded && !plain && vaultKey) {
      const data = await decryptData(vaultKey, entry.data_encrypted, entry.iv)
      setPlain(data)
    }
    setExpanded(p => !p)
  }

  const copy = useCallback(async (text) => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    // Auto-clear clipboard after 30s
    setTimeout(() => navigator.clipboard.writeText(''), 30000)
  }, [])

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer flex-1" onClick={expand}>
          <span className="text-xl">{CATEGORY_ICON[entry.category] || '🔑'}</span>
          <div>
            <p className="text-white font-medium text-sm">{title}</p>
            <p className="text-gray-500 text-xs capitalize">{entry.category}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(entry)}
            className="text-xs text-gray-400 hover:text-violet-400 transition px-2 py-1"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(entry.id)}
            className="text-xs text-gray-400 hover:text-red-400 transition px-2 py-1"
          >
            Delete
          </button>
        </div>
      </div>

      {expanded && plain && (
        <div className="mt-3 pt-3 border-t border-gray-800 space-y-2">
          {plain.username && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Username</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-300">{plain.username}</span>
                <button onClick={() => copy(plain.username)} className="text-xs text-violet-400 hover:underline">Copy</button>
              </div>
            </div>
          )}
          {plain.password && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Password</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-300 font-mono">••••••••</span>
                <button
                  onClick={() => copy(plain.password)}
                  className="text-xs text-violet-400 hover:underline"
                >
                  {copied ? '✓ Copied' : 'Copy'}
                </button>
              </div>
            </div>
          )}
          {plain.url && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">URL</span>
              <a href={plain.url} target="_blank" rel="noreferrer"
                className="text-xs text-violet-400 hover:underline truncate max-w-[200px]">
                {plain.url}
              </a>
            </div>
          )}
          {plain.note && (
            <div>
              <span className="text-xs text-gray-500 block mb-1">Note</span>
              <p className="text-xs text-gray-300 bg-gray-800 rounded p-2">{plain.note}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}