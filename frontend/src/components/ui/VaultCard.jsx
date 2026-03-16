import { useState, useCallback } from 'react'
import { useAuthStore } from '../../store/authStore'
import { decryptData } from '../../crypto/vault'
import client from '../../api/client'

const CATEGORY_ICON = { login: '🔑', card: '💳', note: '📝', identity: '🪪' }

function Row({ label, value, onCopy, mask, canToggleMask = false }) {
  const [copied, setCopied] = useState(false)
  const [visible, setVisible] = useState(false)

  const handleCopy = async () => {
    const ok = await onCopy(value)
    if (!ok) return
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-xs text-gray-500 w-24 shrink-0">{label}</span>
      <div className="flex items-center gap-2 flex-1 justify-end">
        <span className="text-xs text-gray-300 font-mono truncate max-w-[180px]">
          {mask && !visible ? '••••••••' : value}
        </span>
        {canToggleMask && mask && (
          <button type="button" onClick={() => setVisible(v => !v)} className="text-xs text-gray-400 hover:text-white shrink-0 transition">
            {visible ? 'Hide' : 'Show'}
          </button>
        )}
        <button onClick={handleCopy} className="text-xs text-violet-400 hover:text-violet-300 shrink-0 transition">
          {copied ? '✓' : 'Copy'}
        </button>
      </div>
    </div>
  )
}

function UrlRow({ url }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-xs text-gray-500 w-24 shrink-0">URL</span>
      <a href={url} target="_blank" rel="noreferrer" className="text-xs text-violet-400 hover:underline truncate max-w-[220px]">{url}</a>
    </div>
  )
}

export default function VaultCard({ entry, decryptedTitle, onEdit, onDelete }) {
  const { vaultKey } = useAuthStore()
  const [plain, setPlain]           = useState(null)
  const [expanded, setExpanded]     = useState(false)
  const [decrypting, setDecrypting] = useState(false)
  const [error, setError]           = useState(false)

  // Title comes from parent (Vault.jsx decrypts all titles upfront)
  const title = decryptedTitle || 'Decrypting...'

  const handleView = async () => {
    if (expanded) { setExpanded(false); return }
    if (!plain) {
      setDecrypting(true)
      setError(false)
      try {
        const { data: fullEntry } = await client.get(`/vault/${entry.id}`)
        const data = await decryptData(vaultKey, fullEntry.data_encrypted, fullEntry.iv)
        setPlain(data)
      } catch (err) {
        console.error('[VaultCard] decrypt failed:', err.message)
        setError(true)
      } finally {
        setDecrypting(false)
      }
    }
    setExpanded(true)
  }

  const copy = useCallback(async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      setTimeout(() => navigator.clipboard.writeText(''), 30000)
      return true
    } catch {
      return false
    }
  }, [])

  const viewBtnClass = expanded
    ? 'bg-violet-600/20 text-violet-400 hover:bg-violet-600/30'
    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className="text-2xl">{CATEGORY_ICON[entry.category] || '🔑'}</span>
          <div className="min-w-0">
            <p className="text-white font-medium text-sm truncate">{title}</p>
            <p className="text-gray-500 text-xs capitalize">{entry.category}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0 ml-2">
          <button onClick={handleView} className={`text-xs px-3 py-1.5 rounded-lg transition font-medium ${viewBtnClass}`}>
            {decrypting ? '...' : expanded ? 'Hide' : 'View'}
          </button>
          <button onClick={() => onEdit(entry)} className="text-xs px-3 py-1.5 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 transition">
            Edit
          </button>
          <button onClick={() => onDelete(entry.id)} className="text-xs px-3 py-1.5 rounded-lg bg-gray-800 text-gray-300 hover:text-red-400 hover:bg-red-500/10 transition">
            Delete
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-gray-800">
          {error && <p className="text-xs text-red-400">Failed to decrypt entry. Try locking and unlocking your vault.</p>}
          {plain && (
            <div className="space-y-0.5">
              {entry.category === 'login' && (
                <>
                  {plain.username && <Row label="Username" value={plain.username} onCopy={copy} />}
                  {plain.password && <Row label="Password" value={plain.password} onCopy={copy} mask canToggleMask />}
                  {plain.url && <UrlRow url={plain.url} />}
                </>
              )}
              {entry.category === 'card' && (
                <>
                  {plain.cardholder && <Row label="Cardholder" value={plain.cardholder} onCopy={copy} />}
                  {plain.number && <Row label="Number" value={plain.number} onCopy={copy} mask canToggleMask />}
                  {plain.expiry && <Row label="Expiry" value={plain.expiry} onCopy={copy} />}
                  {plain.cvv && <Row label="CVV" value={plain.cvv} onCopy={copy} mask canToggleMask />}
                </>
              )}
              {entry.category === 'identity' && (
                <>
                  {plain.full_name && <Row label="Full Name" value={plain.full_name} onCopy={copy} />}
                  {plain.email && <Row label="Email" value={plain.email} onCopy={copy} />}
                  {plain.phone && <Row label="Phone" value={plain.phone} onCopy={copy} />}
                  {plain.address && <Row label="Address" value={plain.address} onCopy={copy} />}
                </>
              )}
              {plain.note && (
                <div className="pt-1">
                  <span className="text-xs text-gray-500 block mb-1">Note</span>
                  <p className="text-xs text-gray-300 bg-gray-800 rounded-lg p-2 leading-relaxed">{plain.note}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}