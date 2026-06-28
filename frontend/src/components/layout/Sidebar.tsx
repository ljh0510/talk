import { useState } from 'react'
import { useChatStore } from '../../store/useChatStore'
import { Users, MessageCircle, Bell, BellOff, Settings, XSquare, LogOut } from 'lucide-react'

interface SidebarProps {
  activeTab: 'friends' | 'chats' | 'settings'
  setActiveTab: (tab: 'friends' | 'chats' | 'settings') => void
  onTriggerLogout: () => void
  onTriggerExit: () => void
}

export function Sidebar({
  activeTab,
  setActiveTab,
  onTriggerLogout,
  onTriggerExit
}: SidebarProps) {
  const { currentUser, chatRooms } = useChatStore()
  
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    return localStorage.getItem('notificationsEnabled') !== 'false'
  })

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

        {/* Friends List Tab Button */}
        <button
          onClick={() => setActiveTab('friends')}
          className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all relative ${
            activeTab === 'friends'
              ? 'bg-white dark:bg-zinc-800 text-kakao-brown dark:text-yellow-400 shadow'
              : 'text-slate-500 hover:bg-slate-300/50 dark:hover:bg-zinc-800/40 hover:text-slate-800 dark:hover:text-zinc-200'
          }`}
          title="친구 목록"
        >
          <Users size={24} fill={activeTab === 'friends' ? 'currentColor' : 'none'} />
        </button>

        {/* Chat List Tab Button */}
        <button
          onClick={() => setActiveTab('chats')}
          className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all relative ${
            activeTab === 'chats'
              ? 'bg-white dark:bg-zinc-800 text-kakao-brown dark:text-yellow-400 shadow'
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

        {/* Settings Tab Button */}
        <button
          onClick={() => setActiveTab('settings')}
          className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all relative ${
            activeTab === 'settings'
              ? 'bg-white dark:bg-zinc-800 text-kakao-brown dark:text-yellow-400 shadow'
              : 'text-slate-500 hover:bg-slate-300/50 dark:hover:bg-zinc-800/40 hover:text-slate-800 dark:hover:text-zinc-200'
          }`}
          title="환경설정"
        >
          <Settings size={24} />
        </button>
      </div>

      {/* Bottom quick items */}
      <div className="flex flex-col items-center space-y-3 w-full relative">
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

        {/* Fast LogOut Button */}
        <button
          onClick={onTriggerLogout}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-500 hover:bg-red-50 dark:hover:bg-red-955/20 hover:text-red-650 transition-colors"
          title="로그아웃"
        >
          <LogOut size={20} />
        </button>

        {/* Exit Button */}
        <button
          onClick={onTriggerExit}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-500 hover:bg-red-50 dark:hover:bg-red-955/20 hover:text-red-650 transition-colors"
          title="종료"
        >
          <XSquare size={20} />
        </button>
      </div>
    </div>
  )
}
