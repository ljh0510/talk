import { useState } from 'react'
import { useChatStore } from '../../store/useChatStore'
import { Sidebar } from './Sidebar'
import { FriendsTab } from '../../features/friend/FriendsTab'
import { ChatsTab } from '../../features/chat/ChatsTab'
import { SettingsTab } from '../../features/friend/SettingsTab'
import { SettingsDetail } from '../../features/friend/SettingsDetail'
import { ChatArea } from '../../features/chat/ChatArea'
import { CreateRoomModal } from '../../features/chat/CreateRoomModal'
import { AddFriendModal } from '../../features/friend/AddFriendModal'
import { ProfileCardModal } from '../../features/friend/ProfileCardModal'
import { ProfileEditModal } from '../../features/friend/ProfileEditModal'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../components/ui/Dialog'
import { LockScreen } from '../ui/LockScreen'
import { Search, Plus, UserPlus, LogOut, XSquare } from 'lucide-react'
import type { User } from '../../types'

interface MainLayoutProps {
  darkMode: boolean
  setDarkMode: (dark: boolean) => void
}

type SubTabType = 'general' | 'style' | 'security'

export function MainLayout({ darkMode, setDarkMode }: MainLayoutProps) {
  const { currentUser, chatRooms, setActiveRoomId, createChatRoom, logout } = useChatStore()
  const [activeTab, setActiveTab] = useState<'friends' | 'chats' | 'settings'>('chats')
  const [activeSettingsSubTab, setActiveSettingsSubTab] = useState<SubTabType>('general')
  const [searchQuery, setSearchQuery] = useState('')

  // Modals visibility state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isAddFriendOpen, setIsAddFriendOpen] = useState(false)
  const [selectedProfileUser, setSelectedProfileUser] = useState<User | null>(null)
  const [isProfileCardOpen, setIsProfileCardOpen] = useState(false)
  const [isMyProfileEditOpen, setIsMyProfileEditOpen] = useState(false)
  const [isLocked, setIsLocked] = useState(false)

  // Confirmation Modals (Logout & Exit)
  const [confirmModalOpen, setConfirmModalOpen] = useState(false)
  const [confirmType, setConfirmType] = useState<'logout' | 'exit'>('logout')

  if (!currentUser) return null

  // Handle starting/joining 1:1 chat
  const handleStartChat = async (targetUser: User) => {
    setIsProfileCardOpen(false)
    
    const existingRoom = chatRooms.find(
      room => !room.is_group && room.members.some(m => m.id === targetUser.id)
    )

    if (existingRoom) {
      setActiveRoomId(existingRoom.id)
      setActiveTab('chats')
    } else {
      const newRoomId = await createChatRoom(undefined, [targetUser.id])
      if (newRoomId) {
        setActiveRoomId(newRoomId)
        setActiveTab('chats')
      }
    }
  }

  const handleConfirmAction = () => {
    setConfirmModalOpen(false)
    if (confirmType === 'logout') {
      logout()
    } else {
      logout()
      window.close()
      alert('프로그램이 완전히 종료되었습니다. 이 브라우저 탭을 안전하게 닫으셔도 좋습니다.')
    }
  }

  return (
    <div className={`h-screen flex overflow-hidden ${darkMode ? 'dark' : ''}`}>
      {/* 1. Global Left Navigation Sidebar */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        onOpenProfileEdit={() => setIsMyProfileEditOpen(true)}
        onTriggerLogout={() => {
          setConfirmType('logout')
          setConfirmModalOpen(true)
        }}
        onTriggerExit={() => {
          setConfirmType('exit')
          setConfirmModalOpen(true)
        }}
      />

      {/* 2. Middle Panel: Scrollable Lists (Friends, Chats, or Settings menu) */}
      <div className="w-[320px] bg-slate-100 dark:bg-zinc-950 border-r border-slate-300 dark:border-zinc-800 flex flex-col h-full select-none shrink-0">
        {/* Header */}
        <div className="p-5 pb-3">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-extrabold text-slate-800 dark:text-zinc-100 tracking-tight">
              {activeTab === 'friends' && '친구'}
              {activeTab === 'chats' && '채팅'}
              {activeTab === 'settings' && '설정'}
            </h2>
            <div className="flex items-center space-x-1">
              {activeTab === 'friends' && (
                <button
                  onClick={() => setIsAddFriendOpen(true)}
                  className="p-1.5 rounded-lg bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-300/70 dark:hover:bg-zinc-700/70 transition-colors"
                  title="친구 추가"
                >
                  <UserPlus size={16} />
                </button>
              )}
              {activeTab === 'chats' && (
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="p-1.5 rounded-lg bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-300/70 dark:hover:bg-zinc-700/70 transition-colors"
                  title="새로운 채팅방 개설"
                >
                  <Plus size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Search Box (Hide on settings tab) */}
          {activeTab !== 'settings' && (
            <div className="relative">
              <Search className="absolute left-3 top-3 text-slate-400" size={16} />
              <input
                type="text"
                placeholder={activeTab === 'friends' ? '이름 또는 아이디 검색' : '채팅방 검색'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 text-xs focus:outline-none focus:ring-1 focus:ring-slate-400 dark:focus:ring-zinc-700"
              />
            </div>
          )}
        </div>

        {/* Scrollable list content */}
        <div className="flex-1 overflow-y-auto px-3">
          <div className="space-y-1 pb-4 h-full">
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
          </div>
        </div>
      </div>

      {/* 3. Right Panel: Active Chat Room Window OR Settings Detail Page */}
      {activeTab === 'settings' ? (
        <SettingsDetail 
          activeSubTab={activeSettingsSubTab}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
        />
      ) : (
        <ChatArea />
      )}

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
                className={`flex-1 py-2.5 rounded-xl text-white font-bold text-xs transition-colors shadow-md ${
                  confirmType === 'logout' ? 'bg-kakao-brown hover:bg-neutral-800' : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {confirmType === 'logout' ? '로그아웃' : '종료하기'}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
