/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from 'react'
import { useChatStore } from '../../store/useChatStore'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../components/ui/Dialog'
import { Sliders, Sun, Moon, Bell, BellOff } from 'lucide-react'

interface PreferencesModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  darkMode: boolean
  setDarkMode: (dark: boolean) => void
}

export function PreferencesModal({ open, onOpenChange, darkMode, setDarkMode }: PreferencesModalProps) {
  const { currentUser } = useChatStore()
  
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    return localStorage.getItem('notificationsEnabled') !== 'false'
  })

  useEffect(() => {
    if (open) {
      setNotificationsEnabled(localStorage.getItem('notificationsEnabled') !== 'false')
    }
  }, [open])

  const handleToggleNotifications = () => {
    const newVal = !notificationsEnabled
    setNotificationsEnabled(newVal)
    localStorage.setItem('notificationsEnabled', String(newVal))
  }

  if (!currentUser) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm select-none">
        <DialogHeader className="border-b border-slate-100 dark:border-zinc-800 pb-3">
          <DialogTitle className="text-sm font-extrabold text-slate-800 dark:text-zinc-100 flex items-center space-x-1.5">
            <Sliders size={18} className="text-slate-500" />
            <span>환경설정</span>
          </DialogTitle>
          <DialogDescription className="text-[11px] text-slate-400">
            앱의 알림 및 화면 설정을 조정할 수 있습니다.
          </DialogDescription>
        </DialogHeader>

        <div className="p-5 space-y-5 pt-2">
          {/* Account Overview */}
          <div className="p-3 bg-slate-50 dark:bg-zinc-955 rounded-xl border border-slate-200/50 dark:border-zinc-800/40 flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-400 dark:bg-zinc-800 flex items-center justify-center text-white text-xs font-bold shadow-sm shrink-0">
              {currentUser.profile_image_url ? (
                <img src={currentUser.profile_image_url} alt={currentUser.nickname} className="w-full h-full object-cover" />
              ) : (
                currentUser.nickname[0]
              )}
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-700 dark:text-zinc-300">{currentUser.nickname}</h4>
              <p className="text-[9px] text-slate-400 mt-0.5">@{currentUser.username}</p>
            </div>
          </div>

          <div className="space-y-3">
            <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">일반 설정</h5>

            {/* Dark Mode Switch Row */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-100/50 dark:bg-zinc-900/40 border border-slate-200/30 dark:border-zinc-800/40">
              <div className="flex items-center space-x-2.5">
                {darkMode ? <Moon size={16} className="text-yellow-400" /> : <Sun size={16} className="text-orange-500" />}
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-700 dark:text-zinc-200">다크 모드</span>
                  <span className="text-[9px] text-slate-400 mt-0.5">어두운 테마로 눈 보호</span>
                </div>
              </div>
              
              {/* Switch component */}
              <button
                type="button"
                onClick={() => setDarkMode(!darkMode)}
                className={`w-11 h-6 rounded-full p-0.5 transition-colors focus:outline-none ${
                  darkMode ? 'bg-yellow-500' : 'bg-slate-300 dark:bg-zinc-700'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                    darkMode ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Notification Switch Row */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-100/50 dark:bg-zinc-900/40 border border-slate-200/30 dark:border-zinc-800/40">
              <div className="flex items-center space-x-2.5">
                {notificationsEnabled ? <Bell size={16} className="text-slate-600 dark:text-zinc-300" /> : <BellOff size={16} className="text-red-500" />}
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-700 dark:text-zinc-200">데스크톱 알림</span>
                  <span className="text-[9px] text-slate-400 mt-0.5">새 메시지 수신 시 알림 표시</span>
                </div>
              </div>

              {/* Switch component */}
              <button
                type="button"
                onClick={handleToggleNotifications}
                className={`w-11 h-6 rounded-full p-0.5 transition-colors focus:outline-none ${
                  notificationsEnabled ? 'bg-kakao-yellow' : 'bg-slate-300 dark:bg-zinc-700'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                    notificationsEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="pt-2 text-center select-none">
            <button
              onClick={() => onOpenChange(false)}
              className="px-6 py-2 rounded-xl bg-slate-200 dark:bg-zinc-800 hover:bg-slate-300/80 dark:hover:bg-zinc-700/80 text-slate-700 dark:text-zinc-300 font-bold text-xs transition-colors"
            >
              닫기
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
