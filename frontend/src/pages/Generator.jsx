import { useState, useCallback } from 'react'

const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz'
const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const NUMBERS   = '0123456789'
const SYMBOLS   = '!@#$%^&*()_+-=[]{}|;:,.<>?'

function generatePassword(length, opts) {
  let charset = ''
  if (opts.lowercase) charset += LOWERCASE
  if (opts.uppercase) charset += UPPERCASE
  if (opts.numbers)   charset += NUMBERS
  if (opts.symbols)   charset += SYMBOLS
  if (!charset)       charset = LOWERCASE

  // Cryptographically secure random via Web Crypto
  const array = new Uint32Array(length)
  crypto.getRandomValues(array)
  return Array.from(array, n => charset[n % charset.length]).join('')
}

function calcEntropy(length, opts) {
  let poolSize = 0
  if (opts.lowercase) poolSize += 26
  if (opts.uppercase) poolSize += 26
  if (opts.numbers)   poolSize += 10
  if (opts.symbols)   poolSize += 28
  if (!poolSize)      poolSize = 26
  return Math.floor(length * Math.log2(poolSize))
}

function strengthFromEntropy(entropy) {
  if (entropy < 40)  return { label: 'Weak',    color: 'bg-red-500',    width: 'w-1/4' }
  if (entropy < 60)  return { label: 'Fair',    color: 'bg-yellow-500', width: 'w-2/4' }
  if (entropy < 80)  return { label: 'Strong',  color: 'bg-blue-500',   width: 'w-3/4' }
  return              { label: 'Very Strong', color: 'bg-green-500',  width: 'w-full' }
}

export default function Generator() {
  const [length, setLength] = useState(16)
  const [opts, setOpts] = useState({
    lowercase: true, uppercase: true,
    numbers: true,   symbols: false
  })
  const [password, setPassword] = useState(() =>
    generatePassword(16, { lowercase: true, uppercase: true, numbers: true, symbols: false })
  )
  const [copied, setCopied] = useState(false)
  const [history, setHistory] = useState([])

  const entropy  = calcEntropy(length, opts)
  const strength = strengthFromEntropy(entropy)

  const generate = useCallback(() => {
    const p = generatePassword(length, opts)
    setPassword(p)
    setCopied(false)
    setHistory(prev => [p, ...prev].slice(0, 5))
  }, [length, opts])

  const copy = async (text) => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    setTimeout(() => navigator.clipboard.writeText(''), 30000)
  }

  const toggle = key => setOpts(p => ({ ...p, [key]: !p[key] }))

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Password Generator</h1>
        <p className="text-gray-500 text-sm">Cryptographically secure via Web Crypto API</p>
      </div>

      {/* Password Output */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-4">
        <div className="flex items-center justify-between gap-3 mb-3">
          <span className="font-mono text-violet-300 text-sm break-all flex-1">{password}</span>
          <button
            onClick={() => copy(password)}
            className="shrink-0 text-xs bg-violet-600 hover:bg-violet-700 text-white px-3 py-1.5 rounded-lg transition"
          >
            {copied ? '✓ Copied' : 'Copy'}
          </button>
        </div>

        {/* Strength bar */}
        <div className="space-y-1">
          <div className="w-full bg-gray-800 rounded-full h-1.5">
            <div className={`${strength.color} ${strength.width} h-1.5 rounded-full transition-all duration-300`} />
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>{strength.label}</span>
            <span>{entropy} bits of entropy</span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-4 space-y-4">
        {/* Length slider */}
        <div>
          <div className="flex justify-between mb-2">
            <label className="text-sm text-gray-400">Length</label>
            <span className="text-sm font-mono text-violet-400">{length}</span>
          </div>
          <input
            type="range" min={8} max={64} value={length}
            onChange={e => setLength(Number(e.target.value))}
            className="w-full accent-violet-500"
          />
          <div className="flex justify-between text-xs text-gray-600 mt-1">
            <span>8</span><span>64</span>
          </div>
        </div>

        {/* Checkboxes */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { key: 'lowercase', label: 'Lowercase', example: 'abc' },
            { key: 'uppercase', label: 'Uppercase', example: 'ABC' },
            { key: 'numbers',   label: 'Numbers',   example: '123' },
            { key: 'symbols',   label: 'Symbols',   example: '@#$' },
          ].map(({ key, label, example }) => (
            <label
              key={key}
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${
                opts[key]
                  ? 'border-violet-500 bg-violet-500/10'
                  : 'border-gray-700 bg-gray-800 hover:border-gray-600'
              }`}
            >
              <input
                type="checkbox" checked={opts[key]}
                onChange={() => toggle(key)}
                className="accent-violet-500"
              />
              <div>
                <p className="text-sm text-white">{label}</p>
                <p className="text-xs text-gray-500 font-mono">{example}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Generate button */}
      <button
        onClick={generate}
        className="w-full bg-violet-600 hover:bg-violet-700 text-white font-medium py-3 rounded-xl transition text-sm mb-6"
      >
        ↻ Generate New Password
      </button>

      {/* History */}
      {history.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="text-sm font-medium text-gray-400 mb-3">Recent (this session only)</h3>
          <div className="space-y-2">
            {history.map((p, i) => (
              <div key={i} className="flex items-center justify-between gap-3">
                <span className="font-mono text-xs text-gray-400 truncate">{p}</span>
                <button
                  onClick={() => copy(p)}
                  className="text-xs text-violet-400 hover:underline shrink-0"
                >
                  Copy
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}