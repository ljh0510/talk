import { useState, useRef, useEffect } from 'react'
import { useChatStore } from '../../store/useChatStore'
import { Users, MessageCircle, Bell, BellOff, Settings, Sliders, ShieldAlert, LogOut, XSquare } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../components/ui/Dialog'

interface SidebarProps {
  activeTab: 'friends' | 'chats'
  setActiveTab: (tab: 'friends' | 'chats') => void
  darkMode: boolean
  setDarkMode: (dark: boolean) => void
  onOpenProfileEdit: () => void
  onOpenPreferences: () => void
  onLock: () => void
}

export function Sidebar({
  activeTab,
  setActiveTab,
  onOpenProfileEdit,
  onOpenPreferences,
  onLock
}: SidebarProps) {
  const { currentUser, chatRooms, logout } = useChatStore()
  
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    return localStorage.getItem('notificationsEnabled') !== 'false'
  })
  
  const [showSettingsMenu, setShowSettingsMenu] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Modals for confirmation
  const [confirmModalOpen, setConfirmModalOpen] = useState(false)
  const [confirmType, setConfirmType] = useState<'logout' | 'exit'>('logout')

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowSettingsMenu(false)
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

      {/* Bottom section */}
      <div className="flex flex-col items-center space-y-4 w-full relative">
        {/* Notification Bell ON/OFF Toggle */}
        <button
          onClick={handleToggleNotifications}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
            notificationsEnabled 
              ? 'text-slate-600 dark:text-zinc-300 hover:bg-slate-300/50 dark:hover:bg-zinc-800/40' 
              : 'text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20'
          }`}
          title={notificationsEnabled ? '알림 켜짐 (클릭하여 끄기)' : '알림 꺼짐 (클릭하여 켜기)'}
        >
          {notificationsEnabled ? <Bell size={20} /> : <BellOff size={20} />}
        </button>

        {/* Settings Button */}
        <div className="relative w-full flex justify-center" ref={dropdownRef}>
          <button
            onClick={() => setShowSettingsMenu(!showSettingsMenu)}
            className={`w-10 h-10 rounded-xl flex items-center justify-center text-slate-500 dark:text-zinc-400 hover:bg-slate-300/50 dark:hover:bg-zinc-800/40 hover:text-slate-800 dark:hover:text-zinc-200 transition-colors ${
              showSettingsMenu ? 'bg-slate-300/50 dark:bg-zinc-800/60 text-slate-800 dark:text-zinc-200 shadow-sm' : ''
            }`}
            title="설정"
          >
            <Settings size={20} />
          </button>

          {/* Settings Popup Menu */}
          {showSettingsMenu && (
            <div className="absolute bottom-12 left-16 w-36 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-xl py-2 z-50 flex flex-col scale-in-center">
              <button
                onClick={() => {
                  setShowSettingsMenu(false)
                  onOpenPreferences()
                }}
                className="w-full px-4 py-2 text-left text-xs font-bold text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-900 flex items-center space-x-2"
              >
                <Sliders size={13} />
                <span>환경설정</span>
              </button>

              <button
                onClick={() => {
                  setShowSettingsMenu(false)
                  onLock()
                }}
                className="w-full px-4 py-2 text-left text-xs font-bold text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-900 flex items-center space-x-2"
              >
                <ShieldAlert size={13} />
                <span>잠금모드</span>
              </button>

              <button
                onClick={() => {
                  setShowSettingsMenu(false)
                  setConfirmType('logout')
                  setConfirmModalOpen(true)
                }}
                className="w-full px-4 py-2 text-left text-xs font-bold text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-900 flex items-center space-x-2"
              >
                <LogOut size={13} />
                <span>로그아웃</span>
              </button>

              <div className="border-t border-slate-100 dark:border-zinc-900 my-1" />

              <button
                onClick={() => {
                  setShowSettingsMenu(false)
                  setConfirmType('exit')
                  setConfirmModalOpen(true)
                }}
                className="w-full px-4 py-2 text-left text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 flex items-center space-x-2"
              >
                <XSquare size={13} />
                <span>종료</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Logout / Exit Confirmation Dialog */}
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
