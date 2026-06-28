import { useState } from 'react'
import { Search, Plus, UserPlus } from 'lucide-react'
import { FriendsTab } from '../../features/friend/FriendsTab'
import { ChatsTab } from '../../features/chat/ChatsTab'
import { SettingsTab } from '../../features/friend/SettingsTab'
import { MoreTab } from '../../features/friend/MoreTab'
import { CreateRoomModal } from '../../features/chat/CreateRoomModal'
import { AddFriendModal } from '../../features/friend/AddFriendModal'
import { useChatStore } from '../../store/useChatStore'

type TabType = 'friends' | 'chats' | 'settings' | 'more'
type SubTabType = 'general' | 'style' | 'security'
type MoreAppType = 'profile' | 'style' | 'security' | 'info' | 'notifications'

interface MiddlePanelProps {
  activeTab: TabType
  setActiveTab: (tab: TabType) => void
  activeSettingsSubTab: SubTabType
  setActiveSettingsSubTab: (sub: SubTabType) => void
  activeMoreApp: MoreAppType
  setActiveMoreApp: (app: MoreAppType) => void
  searchQuery: string
  setSearchQuery: (query: string) => void
  onTriggerLogout: () => void
  onTriggerExit: () => void
  onTriggerLock: () => void
  triggerToast: (msg: string) => void
}

export function MiddlePanel({
  activeTab,
  setActiveTab,
  activeSettingsSubTab,
  setActiveSettingsSubTab,
  activeMoreApp,
  setActiveMoreApp,
  searchQuery,
  setSearchQuery,
  onTriggerLogout,
  onTriggerExit,
  onTriggerLock,
  triggerToast
}: MiddlePanelProps) {
  const { setActiveRoomId } = useChatStore()

  // Local Modal visibility state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isAddFriendOpen, setIsAddFriendOpen] = useState(false)

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
    <div className="w-[320px] bg-slate-100 dark:bg-zinc-955 border-r border-slate-300 dark:border-zinc-800 flex flex-col h-full select-none shrink-0">
      {/* Header - Fixed 64px height to prevent vertical shifts */}
      <div className="h-[64px] px-5 flex items-center justify-between shrink-0">
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
        <div className="px-5 py-2.5 shrink-0 bg-slate-100 dark:bg-zinc-955">
          <div className="relative flex items-center">
            <Search className="absolute left-3 text-slate-400" size={14} />
            <input
              type="text"
              placeholder={activeTab === 'friends' ? '이름 또는 아이디 검색' : '대화방 또는 참가자 검색'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-[11px] rounded-lg border border-slate-250 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-200 placeholder-slate-405 focus:outline-none focus:ring-1 focus:ring-slate-400 dark:focus:ring-zinc-750 transition-all"
            />
          </div>
        </div>
      )}

      {/* Scrollable Sub Tabs Panels */}
      <div className="flex-1 overflow-y-auto px-4 py-2">
        {activeTab === 'friends' && (
          <FriendsTab
            searchQuery={searchQuery}
            setActiveTab={setActiveTab}
          />
        )}
        {activeTab === 'chats' && (
          <ChatsTab searchQuery={searchQuery} />
        )}
        {activeTab === 'settings' && (
          <SettingsTab
            activeSubTab={activeSettingsSubTab}
            setActiveSubTab={setActiveSettingsSubTab}
            onTriggerLogout={onTriggerLogout}
            onTriggerExit={onTriggerExit}
            onTriggerLock={onTriggerLock}
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

      {/* Internal Modals */}
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
    </div>
  )
}
