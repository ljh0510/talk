import { useState, useEffect } from 'react'
import { Sidebar } from './Sidebar'
import { FriendsTab } from '../../features/friend/FriendsTab'
import { ChatsTab } from '../../features/chat/ChatsTab'
import { SettingsTab } from '../../features/friend/SettingsTab'
import { MoreTab } from '../../features/friend/MoreTab'
import { ChatArea } from '../../features/chat/ChatArea'
import { SettingsDetail } from '../../features/friend/SettingsDetail'
import { MoreDetail } from '../../features/friend/MoreDetail'
import { CreateRoomModal } from '../../features/chat/CreateRoomModal'
import { AddFriendModal } from '../../features/friend/AddFriendModal'
import { ProfileCardModal } from '../../features/friend/ProfileCardModal'
import { ProfileEditModal } from '../../features/friend/ProfileEditModal'
import { LockScreen } from '../ui/LockScreen'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/Dialog'
import { useChatStore } from '../../store/useChatStore'
import { Search, Plus, UserPlus, LogOut, XSquare, CheckCircle } from 'lucide-react'
import type { User } from '../../types'

interface MainLayoutProps {
  darkMode: boolean
  setDarkMode: (dark: boolean) => void
}

type SubTabType = 'general' | 'style' | 'security'
type MoreAppType = 'profile' | 'style' | 'security' | 'info' | 'notifications'

export function MainLayout({ darkMode, setDarkMode }: MainLayoutProps) {
  const { currentUser, chatRooms, setActiveRoomId, createChatRoom, logout } = useChatStore()
  const [activeTab, setActiveTab] = useState<'friends' | 'chats' | 'settings' | 'more'>('chats')
  const [activeSettingsSubTab, setActiveSettingsSubTab] = useState<SubTabType>('general')
  const [activeMoreApp, setActiveMoreApp] = useState<MoreAppType>('profile')
  const [searchQuery, setSearchQuery] = useState('')

  // Modals visibility state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isAddFriendOpen, setIsAddFriendOpen] = useState(false)
  const [selectedProfileUser, setSelectedProfileUser] = useState<User | null>(null)
  const [isProfileCardOpen, setIsProfileCardOpen] = useState(false)
  const [isMyProfileEditOpen, setIsMyProfileEditOpen] = useState(false)
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

  const handleStartChat = async (user: User) => {
    setIsProfileCardOpen(false)
    const active = chatRooms.find(r => !r.is_group && r.members.some(m => m.id === user.id))
    if (active) {
      setActiveRoomId(active.id)
    } else {
      const newId = await createChatRoom(undefined, [user.id])
      if (newId) setActiveRoomId(newId)
    }
    setActiveTab('chats')
  }

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

  // Middle Column panel titles
  const getPanelTitle = () => {
    switch (activeTab) {
      case 'friends': return '친구'
      case 'chats': return '채팅'
      case 'settings': return '설정'
      case 'more': return '더보기'
      default: return ''
    }
  }

  return (
    <div className={`h-screen flex overflow-hidden ${darkMode ? 'dark' : ''}`}>
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
      />

      {/* 2. Middle Panel: Scrollable Lists (Friends, Chats, Settings, or More) */}
      <div className="w-[320px] bg-slate-100 dark:bg-zinc-955 border-r border-slate-300 dark:border-zinc-800 flex flex-col h-full select-none shrink-0">
        {/* Header - Fixed 64px height to prevent vertical shifts */}
        <div className="h-[64px] px-5 border-b border-slate-200 dark:border-zinc-800/80 flex items-center justify-between shrink-0">
          <h1 className="text-sm font-extrabold text-slate-800 dark:text-zinc-100">{getPanelTitle()}</h1>
          
          <div className="flex items-center space-x-2">
            {activeTab === 'friends' && (
              <button
                onClick={() => setIsAddFriendOpen(true)}
                className="p-1.5 rounded-lg bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-zinc-350 hover:bg-slate-300/60 dark:hover:bg-zinc-700/50 transition-colors"
                title="친구 추가"
              >
                <UserPlus size={15} />
              </button>
            )}
            {activeTab === 'chats' && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="p-1.5 rounded-lg bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-zinc-350 hover:bg-slate-300/60 dark:hover:bg-zinc-700/50 transition-colors"
                title="새로운 채팅방 생성"
              >
                <Plus size={15} />
              </button>
            )}
            {(activeTab === 'settings' || activeTab === 'more') && (
              <div className="p-1.5 opacity-0 pointer-events-none select-none">
                <Plus size={15} />
              </div>
            )}
          </div>
        </div>

        {/* Global Search box (only for friends/chats) */}
        {(activeTab === 'friends' || activeTab === 'chats') && (
          <div className="px-5 py-2.5 shrink-0 bg-slate-100 dark:bg-zinc-955 border-b border-slate-200/50 dark:border-zinc-800/40">
            <div className="relative flex items-center">
              <Search className="absolute left-3 text-slate-400" size={14} />
              <input
                type="text"
                placeholder={activeTab === 'friends' ? '이름 또는 아이디 검색' : '대화방 또는 참가자 검색'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 text-[11px] rounded-lg border border-slate-250 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 dark:focus:ring-zinc-750 transition-all"
              />
            </div>
          </div>
        )}

        {/* Scrollable Sub Tabs Panels */}
        <div className="flex-1 overflow-y-auto px-4 py-2">
          {activeTab === 'friends' && (
            <FriendsTab
              searchQuery={searchQuery}
              onOpenProfileEdit={() => setIsMyProfileEditOpen(true)}
              onSelectProfileUser={(user) => {
                setSelectedProfileUser(user)
                setIsProfileCardOpen(true)
              }}
            />
          )}
          {activeTab === 'chats' && (
            <ChatsTab searchQuery={searchQuery} />
          )}
          {activeTab === 'settings' && (
            <SettingsTab
              activeSubTab={activeSettingsSubTab}
              setActiveSubTab={setActiveSettingsSubTab}
              onTriggerLogout={() => {
                setConfirmType('logout')
                setConfirmModalOpen(true)
              }}
              onTriggerExit={() => {
                setConfirmType('exit')
                setConfirmModalOpen(true)
              }}
              onTriggerLock={() => setIsLocked(true)}
            />
          )}
          {activeTab === 'more' && (
            <MoreTab
              activeMoreApp={activeMoreApp}
              setActiveMoreApp={setActiveMoreApp}
              triggerToast={triggerToast}
            />
          )}
        </div>
      </div>

      {/* 3. Right Panel: Active Chat Room Window OR Settings Detail Page OR More Detail Page */}
      {(() => {
        if (activeTab === 'settings') {
          return (
            <SettingsDetail
              activeSubTab={activeSettingsSubTab}
              darkMode={darkMode}
              setDarkMode={setDarkMode}
            />
          )
        } else if (activeTab === 'more') {
          return (
            <MoreDetail
              activeSubTab={activeMoreApp}
              darkMode={darkMode}
              setDarkMode={setDarkMode}
              triggerToast={triggerToast}
            />
          )
        } else {
          return <ChatArea />
        }
      })()}

      {/* Modals */}
      <CreateRoomModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onSuccess={(roomId) => {
          setActiveRoomId(roomId)
          setActiveTab('chats')
        }}
      />
      <AddFriendModal
        open={isAddFriendOpen}
        onOpenChange={setIsAddFriendOpen}
      />
      <ProfileCardModal
        open={isProfileCardOpen}
        onOpenChange={setIsProfileCardOpen}
        user={selectedProfileUser}
        onStartChat={handleStartChat}
      />
      <ProfileEditModal
        open={isMyProfileEditOpen}
        onOpenChange={setIsMyProfileEditOpen}
      />

      {isLocked && <LockScreen onUnlock={() => setIsLocked(false)} />}

      {/* Global Logout / Exit Confirmation Dialog */}
      <Dialog open={confirmModalOpen} onOpenChange={setConfirmModalOpen}>
        <DialogContent className="max-w-sm select-none">
          <DialogHeader className="border-b border-slate-100 dark:border-zinc-800 pb-3">
            <DialogTitle className="text-sm font-extrabold text-slate-800 dark:text-zinc-100 flex items-center space-x-1.5">
              {confirmType === 'logout' ? <LogOut size={18} className="text-slate-500" /> : <XSquare size={18} className="text-red-500" />}
              <span>{confirmType === 'logout' ? '로그아웃' : '프로그램 종료'}</span>
            </DialogTitle>
            <DialogDescription className="text-[11px] text-slate-400">
              KokoaTalk Enterprise 안전 확인
            </DialogDescription>
          </DialogHeader>

          <div className="p-5 space-y-4 pt-2 text-center">
            <p className="text-xs text-slate-600 dark:text-zinc-300 font-medium whitespace-pre-line">
              {confirmType === 'logout'
                ? '현재 계정에서 로그아웃하시겠습니까?'
                : '메신저를 종료하고 완전히 로그아웃하시겠습니까?\n종료 후에는 대화 알림을 받을 수 없습니다.'}
            </p>

            <div className="flex space-x-2.5 pt-2">
              <button
                onClick={() => setConfirmModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 font-bold text-xs transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleConfirmAction}
                className={`flex-1 py-2.5 rounded-xl text-white font-bold text-xs transition-colors shadow-md ${confirmType === 'logout' ? 'bg-kakao-brown hover:bg-neutral-800' : 'bg-red-600 hover:bg-red-700'
                  }`}
              >
                {confirmType === 'logout' ? '로그아웃' : '종료하기'}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
