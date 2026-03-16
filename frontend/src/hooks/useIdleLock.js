import { useEffect, useRef } from 'react'
import { useAuthStore } from '../store/authStore'

const IDLE_TIMEOUT = 5 * 60 * 1000 // 5 minutes

export function useIdleLock() {
  const { vaultKey, setVaultKey } = useAuthStore()
  const timer = useRef(null)

  const resetTimer = () => {
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      setVaultKey(null) // wipes key from memory → vault locked
    }, IDLE_TIMEOUT)
  }

  useEffect(() => {
    if (!vaultKey) return // don't track if already locked

    const events = ['mousemove', 'mousedown', 'keypress', 'scroll', 'touchstart']
    events.forEach(e => window.addEventListener(e, resetTimer))
    resetTimer()

    return () => {
      clearTimeout(timer.current)
      events.forEach(e => window.removeEventListener(e, resetTimer))
    }
  }, [vaultKey])
}