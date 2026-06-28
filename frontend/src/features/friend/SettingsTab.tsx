import { Sliders, Palette, Lock, LogOut, XSquare, ShieldAlert } from 'lucide-react'

type SubTabType = 'general' | 'style' | 'security'

interface SettingsTabProps {
  activeSubTab: SubTabType
  setActiveSubTab: (sub: SubTabType) => void
  onTriggerLogout: () => void
  onTriggerExit: () => void
  onTriggerLock: () => void
}

export function SettingsTab({
  activeSubTab,
  setActiveSubTab,
  onTriggerLogout,
  onTriggerExit,
  onTriggerLock
}: SettingsTabProps) {
  const menuItems = [
    { id: 'general', label: '일반 설정', description: '알림 및 프로필 요약', icon: Sliders },
    { id: 'style', label: '스타일 설정', description: '다크모드 및 액센트 테마', icon: Palette },
    { id: 'security', label: '잠금/보안 설정', description: '비밀번호 암호 변경', icon: Lock },
  ] as const

  return (
    <div className="flex flex-col h-full space-y-4 pt-2">
      <div className="space-y-1">
        {menuItems.map(item => {
          const Icon = item.icon
          const isActive = activeSubTab === item.id
          
          return (
            <div
              key={item.id}
              onClick={() => setActiveSubTab(item.id)}
              className={`p-3 rounded-xl flex items-center space-x-3 cursor-pointer transition-all border
                ${isActive
                  ? 'bg-white dark:bg-zinc-800/80 border-slate-300/40 dark:border-zinc-700/60 shadow-sm'
                  : 'hover:bg-slate-200/50 dark:hover:bg-zinc-900/40 border-transparent'}`}
            >
              <div className={`p-2 rounded-lg shrink-0 ${isActive ? 'bg-primary-accent text-primary-accent-text' : 'bg-slate-200 dark:bg-zinc-800 text-slate-500'}`}>
                <Icon size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-xs font-bold text-slate-800 dark:text-zinc-100">{item.label}</h3>
                <p className="text-[10px] text-slate-400 mt-0.5 truncate">{item.description}</p>
              </div>
            </div>
          )
        })}
      </div>

      <div className="border-t border-slate-200 dark:border-zinc-800/60 my-2" />

      {/* Direct System Actions */}
      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">시스템 도구</h4>

      <div className="space-y-1">
        <button
          onClick={onTriggerLock}
          className="w-full p-3 rounded-xl flex items-center space-x-3 hover:bg-slate-200/50 dark:hover:bg-zinc-900/40 text-left transition-colors"
        >
          <div className="p-2 rounded-lg bg-slate-200 dark:bg-zinc-800 text-slate-500 shrink-0">
            <ShieldAlert size={16} />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-700 dark:text-zinc-300">잠금모드 바로 시작</h3>
            <p className="text-[9px] text-slate-400 mt-0.5">화면을 일시적으로 보안 차단</p>
          </div>
        </button>

        <button
          onClick={onTriggerLogout}
          className="w-full p-3 rounded-xl flex items-center space-x-3 hover:bg-slate-200/50 dark:hover:bg-zinc-900/40 text-left transition-colors"
        >
          <div className="p-2 rounded-lg bg-slate-200 dark:bg-zinc-800 text-slate-500 shrink-0">
            <LogOut size={16} />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-700 dark:text-zinc-300">로그아웃</h3>
            <p className="text-[9px] text-slate-400 mt-0.5">계정 세션 해제</p>
          </div>
        </button>

        <button
          onClick={onTriggerExit}
          className="w-full p-3 rounded-xl flex items-center space-x-3 hover:bg-red-50 dark:hover:bg-red-950/20 text-left transition-colors group"
        >
          <div className="p-2 rounded-lg bg-slate-200 dark:bg-zinc-800 text-slate-500 group-hover:bg-red-100 dark:group-hover:bg-red-900/20 group-hover:text-red-500 shrink-0">
            <XSquare size={16} />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-700 dark:text-zinc-300 group-hover:text-red-500">메신저 종료</h3>
            <p className="text-[9px] text-slate-400 mt-0.5">완전 로그아웃 및 창 닫기</p>
          </div>
        </button>
      </div>
    </div>
  )
}
