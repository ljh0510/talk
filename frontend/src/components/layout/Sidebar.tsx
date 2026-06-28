import { useChatStore } from '../../store/useChatStore'
import { Users, MessageCircle, Sun, Moon, LogOut } from 'lucide-react'

interface SidebarProps {
  activeTab: 'friends' | 'chats'
  setActiveTab: (tab: 'friends' | 'chats') => void
  darkMode: boolean
  setDarkMode: (dark: boolean) => void
  onOpenProfileEdit: () => void
}

export function Sidebar({ activeTab, setActiveTab, darkMode, setDarkMode, onOpenProfileEdit }: SidebarProps) {
  const { currentUser, chatRooms, logout } = useChatStore()

  if (!currentUser) return null

  const unreadTotal = chatRooms.reduce((acc, r) => acc + r.unread_count, 0)

  return (
    <div className="w-[72px] bg-slate-200 dark:bg-zinc-900 border-r border-slate-300 dark:border-zinc-800 flex flex-col items-center py-6 justify-between select-none">
      <div className="flex flex-col items-center space-y-6 w-full">
        {/* My Profile Icon */}
        <div className="relative group cursor-pointer" onClick={onOpenProfileEdit}>
          <div className="w-11 h-11 rounded-2xl overflow-hidden bg-slate-400 dark:bg-zinc-800 flex items-center justify-center text-white border border-slate-300 dark:border-zinc-700 font-bold hover:scale-105 transition-transform shadow">
            {currentUser.profile_image_url ? (
              <img src={currentUser.profile_image_url} alt={currentUser.nickname} className="w-full h-full object-cover" />
            ) : (
              currentUser.nickname[0]
            )}
          </div>
          <div className="absolute left-16 top-2.5 hidden group-hover:block bg-zinc-950 text-white text-xs px-2 py-1 rounded shadow whitespace-nowrap z-[100]">
            {currentUser.nickname} (나 - 클릭하여 편집)
          </div>
        </div>

        <div className="w-8 border-b border-slate-300 dark:border-zinc-800" />

        {/* Friends List Tab Button */}
        <button
          onClick={() => setActiveTab('friends')}
          className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all relative ${activeTab === 'friends' ? 'bg-white dark:bg-zinc-800 text-kakao-brown dark:text-yellow-400 shadow' : 'text-slate-500 hover:bg-slate-300/50 dark:hover:bg-zinc-800/40 hover:text-slate-800 dark:hover:text-zinc-200'}`}
        >
          <Users size={24} fill={activeTab === 'friends' ? 'currentColor' : 'none'} />
        </button>

        {/* Chat List Tab Button */}
        <button
          onClick={() => setActiveTab('chats')}
          className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all relative ${activeTab === 'chats' ? 'bg-white dark:bg-zinc-800 text-kakao-brown dark:text-yellow-400 shadow' : 'text-slate-500 hover:bg-slate-300/50 dark:hover:bg-zinc-800/40 hover:text-slate-800 dark:hover:text-zinc-200'}`}
        >
          <MessageCircle size={24} fill={activeTab === 'chats' ? 'currentColor' : 'none'} />
          {unreadTotal > 0 && (
            <div className="absolute top-1 right-1 bg-red-500 text-white text-[9px] font-bold min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center border border-white dark:border-zinc-900 shadow">
              {unreadTotal}
            </div>
          )}
        </button>
      </div>

      <div className="flex flex-col items-center space-y-4 w-full">
        {/* Dark Mode Toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-500 dark:text-zinc-400 hover:bg-slate-300/50 dark:hover:bg-zinc-800/40 hover:text-slate-800 dark:hover:text-zinc-200 transition-colors"
        >
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {/* Log Out */}
        <button
          onClick={() => logout()}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-500 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-600 transition-colors"
        >
          <LogOut size={20} />
        </button>
      </div>
    </div>
  )
}
