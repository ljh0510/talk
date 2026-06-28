import { useChatStore } from '../../store/useChatStore'
import { User, Palette, Lock, Info, Mail, Calendar, HardDrive, Bell } from 'lucide-react'

type MoreAppType = 'profile' | 'style' | 'security' | 'info' | 'notifications'

interface MoreTabProps {
  activeMoreApp: MoreAppType
  setActiveMoreApp: (app: MoreAppType) => void
  triggerToast: (msg: string) => void
}

export function MoreTab({ activeMoreApp, setActiveMoreApp, triggerToast }: MoreTabProps) {
  const { currentUser } = useChatStore()

  if (!currentUser) return null

  // 8 Premium App Icons
  const appList = [
    { id: 'profile', label: '프로필 편집', icon: User, color: 'bg-indigo-500 text-white' },
    { id: 'style', label: '스타일 테마', icon: Palette, color: 'bg-pink-500 text-white' },
    { id: 'security', label: '화면 잠금', icon: Lock, color: 'bg-emerald-500 text-white' },
    { id: 'notifications', label: '알림 설정', icon: Bell, color: 'bg-amber-500 text-white' },
    { id: 'info', label: '서비스 정보', icon: Info, color: 'bg-sky-500 text-white' },
    // Demo inactive apps
    { id: 'mail', label: '메일', icon: Mail, color: 'bg-slate-400 text-white', isDemo: true },
    { id: 'calendar', label: '캘린더', icon: Calendar, color: 'bg-slate-400 text-white', isDemo: true },
    { id: 'drive', label: '드라이브', icon: HardDrive, color: 'bg-slate-400 text-white', isDemo: true },
  ] as const

  const handleAppClick = (appId: string, isDemo?: boolean, label?: string) => {
    if (isDemo) {
      triggerToast(`'${label}' 서비스는 사내 연동 준비 중입니다.`)
      return
    }
    setActiveMoreApp(appId as MoreAppType)
  }

  return (
    <div className="flex flex-col h-full space-y-5 pt-1 overflow-y-auto">
      {/* 1. Header Profil Summary Card */}
      <div className="p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200/50 dark:border-zinc-800/80 shadow-sm flex items-center space-x-3.5">
        <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-350 dark:bg-zinc-800 flex items-center justify-center text-white text-base font-extrabold shadow-md shrink-0">
          {currentUser.profile_image_url ? (
            <img src={currentUser.profile_image_url} alt={currentUser.nickname} className="w-full h-full object-cover" />
          ) : (
            currentUser.nickname[0]
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-xs font-extrabold text-slate-800 dark:text-zinc-100 truncate">{currentUser.nickname}</h3>
          <p className="text-[10px] text-slate-400 mt-0.5 truncate">@{currentUser.username}</p>
          <p className="text-[9px] text-slate-450 dark:text-zinc-500 mt-0.5 truncate">{currentUser.status_message || '상태메시지 없음'}</p>
        </div>
      </div>

      {/* 2. Grid Apps List Title */}
      <div className="space-y-3">
        <h4 className="text-[10px] font-extrabold text-slate-450 dark:text-zinc-500 uppercase tracking-wider px-1">앱 목록</h4>
        
        {/* 4x2 Grid Layout */}
        <div className="grid grid-cols-4 gap-2">
          {appList.map(app => {
            const Icon = app.icon
            const isActive = activeMoreApp === app.id && !app.isDemo
            
            return (
              <button
                key={app.id}
                onClick={() => handleAppClick(app.id, app.isDemo, app.label)}
                className={`flex flex-col items-center p-2 rounded-xl transition-all duration-200 focus:outline-none ${
                  isActive 
                    ? 'bg-white dark:bg-zinc-850 shadow-sm border border-slate-200/40 dark:border-zinc-700/60 scale-105' 
                    : 'hover:bg-slate-200/40 dark:hover:bg-zinc-900/30 border border-transparent hover:scale-102'
                }`}
              >
                {/* Icon wrapper rounded-2xl */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-md mb-1.5 transition-all ${app.color}`}>
                  <Icon size={18} />
                </div>
                <span className="text-[9px] font-bold text-slate-700 dark:text-zinc-300 text-center tracking-tight truncate w-full">
                  {app.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
