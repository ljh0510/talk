import { useState, useRef, useEffect } from 'react'
import { useChatStore } from '../../store/useChatStore'
import { Users, MessageCircle, Search, Bell, BellOff, Settings, LogOut, XSquare, MoreHorizontal } from 'lucide-react'

interface SidebarProps {
  activeTab: 'members' | 'chats' | 'settings' | 'more' | 'workspaces'
  setActiveTab: (tab: 'members' | 'chats' | 'settings' | 'more' | 'workspaces') => void
  onTriggerLogout: () => void
  onTriggerExit: () => void
}

export function Sidebar({
  activeTab,
  setActiveTab,
  onTriggerLogout,
  onTriggerExit
}: SidebarProps) {
  const { currentUser, chatRooms, activeWorkspaceId } = useChatStore()
  
  const activeMembership = currentUser?.memberships?.find(m => m.workspace_id === activeWorkspaceId)
    || currentUser?.memberships?.[0]
  
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    return localStorage.getItem('notificationsEnabled') !== 'false'
  })

  // Grouped SignOut popup menu state
  const [showSignOutMenu, setShowSignOutMenu] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowSignOutMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (!currentUser) return null

  const unreadTotal = chatRooms.reduce((acc, r) => acc + r.unread_count, 0)

  const handleToggleNotifications = () => {
    const newVal = !notificationsEnabled
    setNotificationsEnabled(newVal)
    localStorage.setItem('notificationsEnabled', String(newVal))
  }

  return (
    <div className="w-[72px] bg-slate-200 dark:bg-zinc-900 border-r border-slate-300 dark:border-zinc-800 flex flex-col items-center py-6 justify-between select-none shrink-0">
      <div className="flex flex-col items-center space-y-4 w-full">

        {/* 1. Members List Tab Button */}
        <button
          onClick={() => setActiveTab('members')}
          className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all relative ${
            activeTab === 'members'
              ? 'bg-primary-accent text-primary-accent-text shadow'
              : 'text-slate-500 hover:bg-slate-300/50 dark:hover:bg-zinc-800/40 hover:text-slate-800 dark:hover:text-zinc-200'
          }`}
          title="멤버 목록"
        >
          <Users size={24} fill={activeTab === 'members' ? 'currentColor' : 'none'} />
        </button>

        {/* 2. Chat List Tab Button */}
        <button
          onClick={() => setActiveTab('chats')}
          className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all relative ${
            activeTab === 'chats'
              ? 'bg-primary-accent text-primary-accent-text shadow'
              : 'text-slate-500 hover:bg-slate-300/50 dark:hover:bg-zinc-800/40 hover:text-slate-800 dark:hover:text-zinc-200'
          }`}
          title="대화방 목록"
        >
          <MessageCircle size={24} fill={activeTab === 'chats' ? 'currentColor' : 'none'} />
          {unreadTotal > 0 && (
            <div className="absolute top-1 right-1 bg-red-500 text-white text-[9px] font-bold min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center border border-white dark:border-zinc-900 shadow">
              {unreadTotal}
            </div>
          )}
        </button>

        {/* 2.5. Search Button (Placeholder) */}
        <button
          type="button"
          className="w-12 h-12 rounded-xl flex items-center justify-center transition-all text-slate-500 hover:bg-slate-300/50 dark:hover:bg-zinc-800/40 hover:text-slate-800 dark:hover:text-zinc-200 cursor-not-allowed opacity-80"
          title="검색 (준비 중)"
          disabled
        >
          <Search size={24} />
        </button>

        {/* 3. Settings Tab Button */}
        <button
          onClick={() => setActiveTab('settings')}
          className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all relative ${
            activeTab === 'settings'
              ? 'bg-primary-accent text-primary-accent-text shadow'
              : 'text-slate-500 hover:bg-slate-300/50 dark:hover:bg-zinc-800/40 hover:text-slate-800 dark:hover:text-zinc-200'
          }`}
          title="환경설정"
        >
          <Settings size={24} />
        </button>

        {/* 4. More Tab Button (Added under Settings Tab) */}
        <button
          onClick={() => setActiveTab('more')}
          className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all relative ${
            activeTab === 'more'
              ? 'bg-primary-accent text-primary-accent-text shadow'
              : 'text-slate-500 hover:bg-slate-300/50 dark:hover:bg-zinc-800/40 hover:text-slate-800 dark:hover:text-zinc-200'
          }`}
          title="더보기"
        >
          <MoreHorizontal size={24} />
        </button>
      </div>

      {/* Bottom quick items */}
      <div className="flex flex-col items-center space-y-4 w-full relative">
        {/* Notification Bell ON/OFF Toggle */}
        <button
          onClick={handleToggleNotifications}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
            notificationsEnabled
              ? 'text-slate-600 dark:text-zinc-300 hover:bg-slate-300/50 dark:hover:bg-zinc-800/40'
              : 'text-red-500 hover:bg-red-50 dark:hover:bg-red-955/20'
          }`}
          title={notificationsEnabled ? '알림 켜짐 (클릭하여 끄기)' : '알림 꺼짐 (클릭하여 켜기)'}
        >
          {notificationsEnabled ? <Bell size={20} /> : <BellOff size={20} />}
        </button>

        {/* LogOut & Exit Trigger Menu Container */}
        <div className="relative w-full flex justify-center" ref={dropdownRef}>
          <button
            onClick={() => setShowSignOutMenu(!showSignOutMenu)}
            className={`w-10 h-10 rounded-xl flex items-center justify-center text-slate-500 hover:bg-red-50 dark:hover:bg-red-955/20 hover:text-red-650 transition-colors ${
              showSignOutMenu ? 'bg-red-50 dark:bg-red-955/20 text-red-600' : ''
            }`}
            title="종료 및 로그아웃"
          >
            <LogOut size={20} />
          </button>

          {/* Grouped SignOut Mini Popup Menu */}
          {showSignOutMenu && (
            <div className="absolute bottom-12 left-14 w-28 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-850 rounded-xl shadow-2xl py-1.5 z-55 flex flex-col scale-in-center">
              <button
                onClick={() => {
                  setShowSignOutMenu(false)
                  onTriggerLogout()
                }}
                className="w-full px-3 py-2 text-left text-[11px] font-bold text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-900 flex items-center space-x-2"
              >
                <LogOut size={13} className="text-slate-500" />
                <span>로그아웃</span>
              </button>

              <button
                onClick={() => {
                  setShowSignOutMenu(false)
                  onTriggerExit()
                }}
                className="w-full px-3 py-2 text-left text-[11px] font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-955/20 flex items-center space-x-2"
              >
                <XSquare size={13} className="text-red-500" />
                <span>종료</span>
              </button>
            </div>
          )}
        </div>

        {/* Workspace Selection Tab Button with safety bottom spacing */}
        <button
          onClick={() => setActiveTab('workspaces')}
          className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all relative overflow-hidden cursor-pointer mb-1 ${
            activeTab === 'workspaces'
              ? 'ring-2 ring-kakao-yellow shadow-md scale-105'
              : 'hover:scale-105 opacity-80 hover:opacity-100'
          }`}
          title="워크스페이스 목록"
        >
          {activeMembership?.workspace_logo ? (
            <img
              src={activeMembership.workspace_logo}
              alt={activeMembership.workspace_name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-kakao-yellow text-kakao-brown flex items-center justify-center font-black text-sm">
              {activeMembership?.workspace_name.substring(0, 2) || 'WS'}
            </div>
          )}
        </button>

      </div>
    </div>
  )
}
