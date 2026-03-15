import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import client from '../api/client'

export default function AppLayout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await client.post('/auth/logout')
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Navbar */}
      <nav className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-violet-400 text-xl">🔐</span>
          <span className="font-bold text-lg tracking-tight">VaultLock</span>
        </div>
        <div className="flex items-center gap-6">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `text-sm transition ${isActive ? 'text-violet-400' : 'text-gray-400 hover:text-white'}`
            }
          >
            Vault
          </NavLink>
          <NavLink
            to="/generate"
            className={({ isActive }) =>
              `text-sm transition ${isActive ? 'text-violet-400' : 'text-gray-400 hover:text-white'}`
            }
          >
            Generator
          </NavLink>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">{user?.email}</span>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-400 hover:text-red-400 transition"
          >
            Logout
          </button>
        </div>
      </nav>

      {/* Page content */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        <Outlet />
      </main>
    </div>
  )
}