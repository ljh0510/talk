import { useState } from 'react'
import { useChatStore } from '../../store/useChatStore'
import { Sidebar } from './Sidebar'
import { FriendsTab } from '../../features/friend/FriendsTab'
import { ChatsTab } from '../../features/chat/ChatsTab'
import { ChatArea } from '../../features/chat/ChatArea'
import { CreateRoomModal } from '../../features/chat/CreateRoomModal'
import { AddFriendModal } from '../../features/friend/AddFriendModal'
import { ProfileCardModal } from '../../features/friend/ProfileCardModal'
import { ProfileEditModal } from '../../features/friend/ProfileEditModal'
import { Search, Plus, UserPlus } from 'lucide-react'
import type { User } from '../../types'

interface MainLayoutProps {
  darkMode: boolean
  setDarkMode: (dark: boolean) => void
}

export function MainLayout({ darkMode, setDarkMode }: MainLayoutProps) {
  const { currentUser, chatRooms, setActiveRoomId, createChatRoom } = useChatStore()
  const [activeTab, setActiveTab] = useState<'friends' | 'chats'>('chats')
  const [searchQuery, setSearchQuery] = useState('')

  // Modals visibility state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isAddFriendOpen, setIsAddFriendOpen] = useState(false)
  const [selectedProfileUser, setSelectedProfileUser] = useState<User | null>(null)
  const [isProfileCardOpen, setIsProfileCardOpen] = useState(false)
  const [isMyProfileEditOpen, setIsMyProfileEditOpen] = useState(false)

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

  return (
    <div className={`h-screen flex overflow-hidden ${darkMode ? 'dark' : ''}`}>
      {/* 1. Global Left Navigation Sidebar */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        darkMode={darkMode} 
        setDarkMode={setDarkMode} 
        onOpenProfileEdit={() => setIsMyProfileEditOpen(true)}
      />

      {/* 2. Middle Panel: Scrollable Lists (Friends or Chats) */}
      <div className="w-[320px] bg-slate-100 dark:bg-zinc-950 border-r border-slate-300 dark:border-zinc-800 flex flex-col h-full select-none">
        {/* Header */}
        <div className="p-5 pb-3">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-extrabold text-slate-800 dark:text-zinc-100 tracking-tight">
              {activeTab === 'friends' ? '친구' : '채팅'}
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

          {/* Search Box */}
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
        </div>

        {/* Scrollable list content */}
        <div className="flex-1 overflow-y-auto px-3">
          <div className="space-y-1 pb-4">
            {activeTab === 'friends' ? (
              <FriendsTab 
                searchQuery={searchQuery} 
                onOpenProfileEdit={() => setIsMyProfileEditOpen(true)}
                onSelectProfileUser={(user) => {
                  setSelectedProfileUser(user)
                  setIsProfileCardOpen(true)
                }}
              />
            ) : (
              <ChatsTab searchQuery={searchQuery} />
            )}
          </div>
        </div>
      </div>

      {/* 3. Right Panel: Active Chat Room Window */}
      <ChatArea />

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
    </div>
  )
}
