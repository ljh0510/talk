import { useState } from 'react'
import { Search, Plus, UserPlus, ChevronDown, Check, ChevronLeft, ChevronRight } from 'lucide-react'
import { MembersTab } from '../../features/member/MembersTab'
import { ChatsTab } from '../../features/chat/ChatsTab'
import { SettingsTab } from '../../features/member/SettingsTab'
import { MoreTab } from '../../features/member/MoreTab'
import { CreateRoomModal } from '../../features/chat/CreateRoomModal'
import { AddMemberModal } from '../../features/member/AddMemberModal'
import { FolderManageModal } from '../modal/FolderManageModal'
import type { ChatFolder } from '../modal/FolderManageModal'
import { useChatStore } from '../../store/useChatStore'
import { WorkspaceSwitcher } from './WorkspaceSwitcher'

type TabType = 'members' | 'chats' | 'settings' | 'more' | 'workspaces'
type SubTabType = 'general' | 'style' | 'security'

interface MiddlePanelProps {
  activeTab: TabType
  setActiveTab: (tab: TabType) => void
  activeSettingsSubTab: SubTabType
  setActiveSettingsSubTab: (sub: SubTabType) => void
  searchQuery: string
  setSearchQuery: (query: string) => void
  onTriggerLogout: () => void
  onTriggerExit: () => void
  onTriggerLock: () => void
  triggerToast: (msg: string) => void
  isFullWidth?: boolean
}

export function MiddlePanel({
  activeTab,
  setActiveTab,
  activeSettingsSubTab,
  setActiveSettingsSubTab,
  searchQuery,
  setSearchQuery,
  onTriggerLogout,
  onTriggerExit,
  onTriggerLock,
  triggerToast,
  isFullWidth
}: MiddlePanelProps) {
  const { chatRooms, markAsRead, setActiveRoomId, currentUser, activeWorkspaceId, switchWorkspace } = useChatStore()

  // Local Modal visibility state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false)

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
      case 'members': return '멤버'
      case 'chats': return '채팅'
      case 'settings': return '환경설정'
      case 'more': return '더보기'
      case 'workspaces': return '워크스페이스'
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
    <div className={`bg-slate-100 dark:bg-zinc-955 border-r border-slate-300 dark:border-zinc-800 flex flex-col h-full select-none shrink-0 ${isFullWidth ? 'flex-1 border-r-0' : 'w-[320px]'}`}>
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
        ) : activeTab === 'settings' ? (
          <div className="flex items-center space-x-1.5 -ml-1">
            <button
              onClick={() => setActiveTab('more')}
              className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200 transition-colors cursor-pointer"
              title="더보기로 돌아가기"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="flex items-center space-x-1 text-[11px] font-bold text-slate-400">
              <span 
                onClick={() => setActiveTab('more')}
                className="cursor-pointer hover:text-slate-600 dark:hover:text-zinc-300 transition-colors"
              >
                더보기
              </span>
              <ChevronRight size={10} className="mt-0.5" />
              <span className="text-sm font-extrabold text-slate-800 dark:text-zinc-100">환경설정</span>
            </div>
          </div>
        ) : (
          <h1 className="text-sm font-extrabold text-slate-800 dark:text-zinc-100">{getPanelTitle()}</h1>
        )}
        
        {/* Navigation Action Buttons (Aligned like KakaoTalk header) */}
        <div className="flex items-center space-x-2">
          {activeTab === 'members' && (
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
              {/* Add Member Icon */}
              <button
                onClick={() => setIsAddMemberOpen(true)}
                className="p-1.5 rounded-lg bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-zinc-355 hover:bg-slate-300/60 dark:hover:bg-zinc-700/50 transition-colors"
                title="멤버 추가"
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
          {(activeTab === 'settings' || activeTab === 'more' || activeTab === 'workspaces') && (
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
      {(activeTab === 'members' || activeTab === 'chats') && isSearchOpen && (
        <div className="px-5 py-2.5 shrink-0 bg-slate-100 dark:bg-zinc-955 transition-all duration-200">
          <div className="relative flex items-center">
            <Search className="absolute left-3 text-slate-400" size={14} />
            <input
              type="text"
              placeholder={activeTab === 'members' ? '이름 또는 아이디 검색' : '대화방 또는 참가자 검색'}
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
        {activeTab === 'members' && (
          <MembersTab
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
            onSelectSettings={() => setActiveTab('settings')}
            triggerToast={triggerToast}
          />
        )}
        {activeTab === 'workspaces' && currentUser && (
          <div className="space-y-2.5">
            {currentUser.memberships?.map((m) => {
              const isActive = m.workspace_id === activeWorkspaceId
              return (
                <button
                  key={m.workspace_id}
                  onClick={() => switchWorkspace(m.workspace_id)}
                  className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition-all text-left cursor-pointer group ${
                    isActive
                      ? 'border-kakao-yellow/40 bg-white dark:bg-zinc-900 shadow-sm'
                      : 'border-transparent bg-slate-50/50 dark:bg-zinc-950/20 hover:bg-slate-50 dark:hover:bg-zinc-900/40 hover:border-slate-200 dark:hover:border-zinc-800'
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    {m.workspace_logo ? (
                      <img
                        src={m.workspace_logo}
                        alt={m.workspace_name}
                        className="w-9 h-9 rounded-xl object-cover border border-slate-100 dark:border-zinc-800 shadow-sm"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-xl bg-kakao-yellow/20 dark:bg-yellow-500/10 flex items-center justify-center text-kakao-yellow dark:text-yellow-400 text-xs font-bold border border-kakao-yellow/30">
                        {m.workspace_name.substring(0, 2)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-200 truncate group-hover:text-kakao-yellow dark:group-hover:text-yellow-400 transition-colors">
                        {m.workspace_name}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-semibold truncate mt-0.5">
                        {m.nickname} · {m.department?.name ? `${m.department.name} ` : ''}{m.department?.position?.name || '멤버'}
                      </p>
                    </div>
                  </div>
                  {isActive && (
                    <span className="flex-shrink-0 text-kakao-yellow dark:text-yellow-400 bg-kakao-yellow/10 dark:bg-yellow-500/10 p-1 rounded-lg">
                      <Check size={14} strokeWidth={2.5} />
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Bottom Workspace Switcher */}
      <div className="relative border-t border-slate-200 dark:border-zinc-800/80 bg-slate-50/20 dark:bg-zinc-950/20 shrink-0">
        <WorkspaceSwitcher />
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
      <AddMemberModal
        open={isAddMemberOpen}
        onOpenChange={setIsAddMemberOpen}
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
