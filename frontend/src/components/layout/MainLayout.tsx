import { useState, useEffect } from 'react'
import { Sidebar } from './Sidebar'
import { MiddlePanel } from './MiddlePanel'
import { ChatArea } from '../../features/chat/ChatArea'
import { SettingsDetail } from '../../features/member/SettingsDetail'
import { LockScreen } from '../ui/LockScreen'
import { ConfirmModal } from '../modal/ConfirmModal'
import { useChatStore } from '../../store/useChatStore'
import { CheckCircle } from 'lucide-react'

interface MainLayoutProps {
  darkMode: boolean
  setDarkMode: (dark: boolean) => void
}

type SubTabType = 'general' | 'style' | 'security'

export function MainLayout({ darkMode, setDarkMode }: MainLayoutProps) {
  const { currentUser, logout, activeRoomId, chatLayout } = useChatStore()
  const [activeTab, setActiveTab] = useState<'members' | 'chats' | 'settings' | 'more' | 'workspaces'>('chats')

  const isOverlayMode = chatLayout === 'overlay'
  const [activeSettingsSubTab, setActiveSettingsSubTab] = useState<SubTabType>('general')
  const [searchQuery, setSearchQuery] = useState('')

  // UI state
  const [isLocked, setIsLocked] = useState(false)

  // Global Confirmation states
  const [confirmModalOpen, setConfirmModalOpen] = useState(false)
  const [confirmType, setConfirmType] = useState<'logout' | 'exit'>('logout')

  // Toast Alert states
  const [toastText, setToastText] = useState('')
  const [toastOpen, setToastOpen] = useState(false)

  const triggerToast = (msg: string) => {
    setToastText(msg)
    setToastOpen(true)
  }

  // Auto-hide toast after 2.5 seconds
  useEffect(() => {
    if (!toastOpen) return
    const timer = setTimeout(() => {
      setToastOpen(false)
    }, 2500)
    return () => clearTimeout(timer)
  }, [toastOpen])

  // Auto-Lock Idle Detection
  useEffect(() => {
    if (isLocked) return

    const getAutoLockMinutes = () => {
      const val = localStorage.getItem('autoLockMinutes')
      if (!val || val === 'off') return null
      return parseInt(val, 10)
    }

    let idleTimeout: number | null = null

    const resetIdleTimer = () => {
      if (idleTimeout) window.clearTimeout(idleTimeout)

      const minutes = getAutoLockMinutes()
      if (minutes === null) return

      idleTimeout = window.setTimeout(() => {
        setIsLocked(true)
      }, minutes * 60 * 1000)
    }

    const events = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'click']
    events.forEach(evt => window.addEventListener(evt, resetIdleTimer))

    resetIdleTimer()

    return () => {
      if (idleTimeout) window.clearTimeout(idleTimeout)
      events.forEach(evt => window.removeEventListener(evt, resetIdleTimer))
    }
  }, [isLocked])

  const handleConfirmAction = () => {
    setConfirmModalOpen(false)
    if (confirmType === 'logout') {
      logout()
    } else {
      logout()
      setTimeout(() => {
        window.close()
      }, 300)
    }
  }

  if (!currentUser) return null

  return (
    <div className={`h-screen flex overflow-hidden min-w-[360px] ${darkMode ? 'dark' : ''}`}>
      {/* 1. Global Left Navigation Sidebar */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        onTriggerLogout={() => {
          setConfirmType('logout')
          setConfirmModalOpen(true)
        }}
        onTriggerExit={() => {
          setConfirmType('exit')
          setConfirmModalOpen(true)
        }}
        isHidden={isOverlayMode && activeRoomId !== null && activeTab !== 'settings'}
      />

      {/* 2. Middle Panel: Scrollable Lists (Friends, Chats, Settings, or More) */}
      <div className={`${isOverlayMode && activeRoomId !== null && activeTab !== 'settings' ? 'hidden' : 'flex'} h-full ${isOverlayMode && activeRoomId === null && activeTab !== 'settings' ? 'flex-1' : 'shrink-0'}`}>
        <MiddlePanel
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          activeSettingsSubTab={activeSettingsSubTab}
          setActiveSettingsSubTab={setActiveSettingsSubTab}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onTriggerLogout={() => {
            setConfirmType('logout')
            setConfirmModalOpen(true)
          }}
          onTriggerExit={() => {
            setConfirmType('exit')
            setConfirmModalOpen(true)
          }}
          onTriggerLock={() => setIsLocked(true)}
          triggerToast={triggerToast}
          isFullWidth={isOverlayMode && activeRoomId === null && activeTab !== 'settings'}
        />
      </div>

      {/* 3. Right Panel: Active Chat Room Window OR Settings Detail Page */}
      {(!isOverlayMode || activeRoomId !== null || activeTab === 'settings') && (
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {(() => {
            if (activeTab === 'settings') {
              return (
                <SettingsDetail
                  activeSubTab={activeSettingsSubTab}
                  darkMode={darkMode}
                  setDarkMode={setDarkMode}
                />
              )
            } else {
              return <ChatArea />
            }
          })()}
        </div>
      )}

      {isLocked && <LockScreen onUnlock={() => setIsLocked(false)} />}

      {/* Global Logout / Exit Confirmation Dialog */}
      <ConfirmModal
        open={confirmModalOpen}
        onOpenChange={setConfirmModalOpen}
        confirmType={confirmType}
        onConfirm={handleConfirmAction}
      />

      {/* Floating In-App Toast Alert Feedback */}
      {toastOpen && (
        <div className="fixed bottom-6 right-6 bg-slate-900/90 dark:bg-zinc-900/95 backdrop-blur text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-2xl border border-slate-700/50 dark:border-zinc-800/80 flex items-center space-x-2 animate-bounce-in z-50">
          <CheckCircle size={14} className="text-kakao-yellow dark:text-yellow-400" />
          <span>{toastText}</span>
        </div>
      )}
    </div>
  )
}
