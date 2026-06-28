import { useState } from 'react'
import { Search, Plus, UserPlus, ChevronDown, Check } from 'lucide-react'
import { FriendsTab } from '../../features/friend/FriendsTab'
import { ChatsTab } from '../../features/chat/ChatsTab'
import { SettingsTab } from '../../features/friend/SettingsTab'
import { MoreTab } from '../../features/friend/MoreTab'
import { CreateRoomModal } from '../../features/chat/CreateRoomModal'
import { AddFriendModal } from '../../features/friend/AddFriendModal'
import { FolderManageModal } from '../modal/FolderManageModal'
import type { ChatFolder } from '../modal/FolderManageModal'
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
  const { chatRooms, markAsRead, setActiveRoomId } = useChatStore()

  // Local Modal visibility state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isAddFriendOpen, setIsAddFriendOpen] = useState(false)

  // Local state to toggle search input box visibility
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  // Sorting and folder management states
  const [sortType, setSortType] = useState<'latest' | 'unread' | 'favorite'>('latest')
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false)
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false)

  // Retrieve folders from localStorage (for synced counts in headers if needed)
  const [folders, setFolders] = useState(() => {
    const saved = localStorage.getItem('chatFolders')
    return saved ? JSON.parse(saved) : []
  })

  const getPanelTitle = () => {
    switch (activeTab) {
      case 'friends': return '친구'
      case 'chats': return '채팅'
      case 'settings': return '설정'
      case 'more': return '더보기'
      default: return ''
    }
  }

  // Handle Mark All chat rooms as read
  const handleMarkAllAsRead = async () => {
    const unreadRooms = chatRooms.filter(r => r.unread_count > 0)
    if (unreadRooms.length === 0) {
      triggerToast('읽지 않은 메시지가 없습니다.')
      return
    }

    // Optimistic store update
    useChatStore.setState({
      chatRooms: chatRooms.map(r => ({ ...r, unread_count: 0 }))
    })

    try {
      await Promise.all(unreadRooms.map(r => markAsRead(r.id)))
      triggerToast('모든 대화방이 읽음 처리되었습니다.')
    } catch {
      triggerToast('일부 대화방 읽음 처리 중 오류가 발생했습니다.')
    }
  }

  return (
    <div className="w-[320px] bg-slate-100 dark:bg-zinc-955 border-r border-slate-300 dark:border-zinc-800 flex flex-col h-full select-none shrink-0">
      {/* Header - Fixed 64px height to prevent vertical shifts */}
      <div className="h-[64px] px-5 flex items-center justify-between shrink-0">
        
        {/* Title / Sorting Dropdown Trigger */}
        {activeTab === 'chats' ? (
          <div className="relative">
            <button
              onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
              className="flex items-center space-x-1 text-sm font-extrabold text-slate-800 dark:text-zinc-100 hover:text-slate-900 dark:hover:text-white transition-colors focus:outline-none"
            >
              <span>채팅</span>
              <ChevronDown size={14} className="mt-0.5 text-slate-500" />
            </button>

            {sortDropdownOpen && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setSortDropdownOpen(false)} />
                <div className="absolute left-0 mt-2 w-44 bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-2xl shadow-2xl p-1.5 z-30 animate-fade-in text-xs">
                  <button
                    onClick={() => {
                      setSortType('latest')
                      setSortDropdownOpen(false)
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between transition-colors ${
                      sortType === 'latest'
                        ? 'bg-slate-100 dark:bg-zinc-800 font-bold text-slate-800 dark:text-zinc-200'
                        : 'hover:bg-slate-50 dark:hover:bg-zinc-950 text-slate-550 dark:text-zinc-400'
                    }`}
                  >
                    <span>최신 메시지 순</span>
                    {sortType === 'latest' && <Check size={13} strokeWidth={2.5} />}
                  </button>

                  <button
                    onClick={() => {
                      setSortType('unread')
                      setSortDropdownOpen(false)
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between transition-colors ${
                      sortType === 'unread'
                        ? 'bg-slate-100 dark:bg-zinc-800 font-bold text-slate-800 dark:text-zinc-200'
                        : 'hover:bg-slate-50 dark:hover:bg-zinc-950 text-slate-550 dark:text-zinc-400'
                    }`}
                  >
                    <span>안 읽은 메시지 순</span>
                    {sortType === 'unread' && <Check size={13} strokeWidth={2.5} />}
                  </button>

                  <button
                    onClick={() => {
                      setSortType('favorite')
                      setSortDropdownOpen(false)
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between transition-colors ${
                      sortType === 'favorite'
                        ? 'bg-slate-100 dark:bg-zinc-800 font-bold text-slate-800 dark:text-zinc-200'
                        : 'hover:bg-slate-50 dark:hover:bg-zinc-950 text-slate-550 dark:text-zinc-400'
                    }`}
                  >
                    <span>즐겨찾기 순</span>
                    {sortType === 'favorite' && <Check size={13} strokeWidth={2.5} />}
                  </button>

                  <div className="border-t border-slate-100 dark:border-zinc-850 my-1" />

                  <button
                    onClick={() => {
                      handleMarkAllAsRead()
                      setSortDropdownOpen(false)
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-slate-600 dark:text-zinc-350 hover:bg-slate-50 dark:hover:bg-zinc-950 transition-colors font-medium"
                  >
                    모두 읽음 처리
                  </button>

                  <div className="border-t border-slate-100 dark:border-zinc-850 my-1" />

                  <button
                    onClick={() => {
                      setIsFolderModalOpen(true)
                      setSortDropdownOpen(false)
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-slate-600 dark:text-zinc-350 hover:bg-slate-50 dark:hover:bg-zinc-950 transition-colors font-medium"
                  >
                    채팅방 폴더 관리
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <h1 className="text-sm font-extrabold text-slate-800 dark:text-zinc-100">{getPanelTitle()}</h1>
        )}
        
        {/* Navigation Action Buttons (Aligned like KakaoTalk header) */}
        <div className="flex items-center space-x-2">
          {activeTab === 'friends' && (
            <>
              {/* Search Toggle Icon */}
              <button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className={`p-1.5 rounded-lg transition-colors ${
                  isSearchOpen 
                    ? 'bg-slate-300 dark:bg-zinc-700 text-slate-800 dark:text-zinc-150' 
                    : 'bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-zinc-355 hover:bg-slate-300/60 dark:hover:bg-zinc-700/50'
                }`}
                title="검색"
              >
                <Search size={15} />
              </button>
              {/* Add Friend Icon */}
              <button
                onClick={() => setIsAddFriendOpen(true)}
                className="p-1.5 rounded-lg bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-zinc-355 hover:bg-slate-300/60 dark:hover:bg-zinc-700/50 transition-colors"
                title="친구 추가"
              >
                <UserPlus size={15} />
              </button>
            </>
          )}
          {activeTab === 'chats' && (
            <>
              {/* Search Toggle Icon */}
              <button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className={`p-1.5 rounded-lg transition-colors ${
                  isSearchOpen 
                    ? 'bg-slate-300 dark:bg-zinc-700 text-slate-800 dark:text-zinc-150' 
                    : 'bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-zinc-355 hover:bg-slate-300/60 dark:hover:bg-zinc-700/50'
                }`}
                title="검색"
              >
                <Search size={15} />
              </button>
              {/* Create Room Icon */}
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="p-1.5 rounded-lg bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-zinc-355 hover:bg-slate-300/60 dark:hover:bg-zinc-700/50 transition-colors"
                title="새로운 채팅방 생성"
              >
                <Plus size={15} />
              </button>
            </>
          )}
          {(activeTab === 'settings' || activeTab === 'more') && (
            <div className="flex items-center space-x-2 opacity-0 pointer-events-none select-none">
              <div className="p-1.5">
                <Search size={15} />
              </div>
              <div className="p-1.5">
                <Plus size={15} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Global Search box (only for friends/chats and when isSearchOpen is true) */}
      {(activeTab === 'friends' || activeTab === 'chats') && isSearchOpen && (
        <div className="px-5 py-2.5 shrink-0 bg-slate-100 dark:bg-zinc-955 transition-all duration-200">
          <div className="relative flex items-center">
            <Search className="absolute left-3 text-slate-400" size={14} />
            <input
              type="text"
              placeholder={activeTab === 'friends' ? '이름 또는 아이디 검색' : '대화방 또는 참가자 검색'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-[11px] rounded-lg border border-slate-250 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-200 placeholder-slate-405 focus:outline-none focus:ring-1 focus:ring-slate-400 dark:focus:ring-zinc-750 transition-all"
              autoFocus
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
          <ChatsTab searchQuery={searchQuery} sortType={sortType} />
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
      <FolderManageModal
        open={isFolderModalOpen}
        onOpenChange={setIsFolderModalOpen}
        folders={folders}
        chatRooms={chatRooms}
        onSaveFolders={(updated: ChatFolder[]) => {
          setFolders(updated)
          localStorage.setItem('chatFolders', JSON.stringify(updated))
        }}
      />
    </div>
  )
}
