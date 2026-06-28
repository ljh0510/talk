import { useState, useEffect } from 'react'
import { useChatStore } from './store/useChatStore'
import { AuthCard } from './features/auth/AuthCard'
import { MainLayout } from './components/layout/MainLayout'

export default function App() {
  const { currentUser, fetchChatRooms, fetchFriends, fetchUsers, setupWebSocket } = useChatStore()
  const [darkMode, setDarkMode] = useState(false)

  // Fetch initial data on login / reload
  useEffect(() => {
    if (currentUser) {
      setupWebSocket()
      fetchChatRooms()
      fetchFriends()
      fetchUsers()
    }
  }, [currentUser, fetchChatRooms, fetchFriends, fetchUsers, setupWebSocket])

  // Dark Mode Toggle
  useEffect(() => {
    const root = window.document.documentElement
    if (darkMode) {
      root.classList.add('dark')
      document.body.classList.add('dark')
    } else {
      root.classList.remove('dark')
      document.body.classList.remove('dark')
    }
  }, [darkMode])

function getContrastColor(hex: string): string {
  const cleanHex = hex.replace('#', '')
  if (cleanHex.length !== 6) return '#ffffff'
  const r = parseInt(cleanHex.substring(0, 2), 16)
  const g = parseInt(cleanHex.substring(2, 4), 16)
  const b = parseInt(cleanHex.substring(4, 6), 16)
  const yiq = (r * 299 + g * 587 + b * 114) / 1000
  return yiq >= 180 ? '#3c1e1e' : '#ffffff'
}

function getHoverColor(hex: string): string {
  const cleanHex = hex.replace('#', '')
  if (cleanHex.length !== 6) return hex
  let r = parseInt(cleanHex.substring(0, 2), 16)
  let g = parseInt(cleanHex.substring(2, 4), 16)
  let b = parseInt(cleanHex.substring(4, 6), 16)
  r = Math.max(0, Math.floor(r * 0.85))
  g = Math.max(0, Math.floor(g * 0.85))
  b = Math.max(0, Math.floor(b * 0.85))
  const rHex = r.toString(16).padStart(2, '0')
  const gHex = g.toString(16).padStart(2, '0')
  const bHex = b.toString(16).padStart(2, '0')
  return `#${rHex}${gHex}${bHex}`
}

  // Restore Accent Color Theme
  useEffect(() => {
    let color = localStorage.getItem('accentColor') || '#fee500'
    if (color === 'yellow') color = '#fee500'
    else if (color === 'blue') color = '#1d4ed8'
    else if (color === 'emerald') color = '#059669'
    else if (color === 'purple') color = '#7c3aed'

    const root = document.documentElement
    root.style.setProperty('--primary-accent', color)
    root.style.setProperty('--primary-accent-hover', getHoverColor(color))
    root.style.setProperty('--primary-accent-text', getContrastColor(color))
  }, [])

  if (!currentUser) {
    return <AuthCard darkMode={darkMode} setDarkMode={setDarkMode} />
  }

  return <MainLayout darkMode={darkMode} setDarkMode={setDarkMode} />
}
