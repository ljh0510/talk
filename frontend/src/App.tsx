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

  if (!currentUser) {
    return <AuthCard darkMode={darkMode} setDarkMode={setDarkMode} />
  }

  return <MainLayout darkMode={darkMode} setDarkMode={setDarkMode} />
}
