import { create } from 'zustand'

export const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('vault_token') || null,
  vaultKey: null, // CryptoKey — never leaves memory

  setAuth: (user, token) => {
    localStorage.setItem('vault_token', token)
    set({ user, token })
  },

  setVaultKey: (key) => set({ vaultKey: key }),

  logout: () => {
    localStorage.removeItem('vault_token')
    set({ user: null, token: null, vaultKey: null })
  }
}))