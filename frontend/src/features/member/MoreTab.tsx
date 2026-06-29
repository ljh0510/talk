import {
  Mail,
  Calendar,
  Cloud,
  Smile,
  Gift,
  Percent,
  FlaskConical,
  CreditCard,
  Megaphone,
  Settings,
  HelpCircle
} from 'lucide-react'

interface MoreTabProps {
  onSelectSettings: () => void
  triggerToast: (msg: string) => void
}

export function MoreTab({ onSelectSettings, triggerToast }: MoreTabProps) {
  interface AppItem {
    id: string
    label: string
    icon: any
    isDemo: boolean
    hasBadge?: boolean
  }

  const appList: AppItem[] = [
    { id: 'mail', label: '메일', icon: Mail, isDemo: true },
    { id: 'calendar', label: '캘린더', icon: Calendar, isDemo: true },
    { id: 'cloud', label: '톡클라우드', icon: Cloud, isDemo: true },
    { id: 'emoticon', label: '이모티콘', icon: Smile, isDemo: true },

    { id: 'gift', label: '선물하기', icon: Gift, isDemo: true },
    { id: 'deal', label: '톡딜', icon: Percent, isDemo: true },
    { id: 'lab', label: '실험실', icon: FlaskConical, isDemo: true },
    { id: 'payment', label: '내 결제', icon: CreditCard, isDemo: true },

    { id: 'notice', label: '공지사항', icon: Megaphone, isDemo: true, hasBadge: true },
    { id: 'settings', label: '환경설정', icon: Settings, isDemo: false },
    { id: 'help', label: '도움말', icon: HelpCircle, isDemo: true },
  ]

  const handleAppClick = (app: AppItem) => {
    if (app.isDemo) {
      triggerToast(`'${app.label}' 서비스는 준비 중입니다.`)
      return
    }
    if (app.id === 'settings') {
      onSelectSettings()
    }
  }

  return (
    <div className="flex flex-col h-full space-y-5 overflow-y-auto">
      {/* Grid Apps List */}
      <div className="grid grid-cols-4 gap-x-2 gap-y-3 p-1">
        {appList.map(app => {
          const Icon = app.icon
          return (
            <button
              key={app.id}
              onClick={() => handleAppClick(app)}
              className="flex flex-col items-center p-2 rounded-xl transition-all duration-200 focus:outline-none hover:bg-slate-200/40 dark:hover:bg-zinc-850/40 cursor-pointer"
            >
              <div className="relative w-10 h-10 flex items-center justify-center text-slate-700 dark:text-zinc-300 mb-1">
                <Icon size={22} strokeWidth={1.5} />
                {app.hasBadge && (
                  <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full" />
                )}
              </div>
              <span className="text-[10px] font-medium text-slate-600 dark:text-zinc-400 text-center tracking-tight truncate w-full">
                {app.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
