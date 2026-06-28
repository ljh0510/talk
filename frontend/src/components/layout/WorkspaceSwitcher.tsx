import { useState, useRef, useEffect } from 'react'
import { useChatStore } from '../../store/useChatStore'
import { ChevronDown, RefreshCw } from 'lucide-react'

export function WorkspaceSwitcher() {
  const { currentUser, activeWorkspaceId, switchWorkspace } = useChatStore()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (!currentUser || !currentUser.memberships || currentUser.memberships.length === 0) {
    return null
  }

  // Find active membership
  const activeMembership = currentUser.memberships.find(m => m.workspace_id === activeWorkspaceId) 
    || currentUser.memberships[0]

  const otherMemberships = currentUser.memberships.filter(m => m.workspace_id !== activeWorkspaceId)

  const handleSwitch = async (workspaceId: number) => {
    setIsOpen(false)
    await switchWorkspace(workspaceId)
  }

  return (
    <div className="relative select-none" ref={dropdownRef}>
      {/* Target Trigger Header Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-950/40 hover:bg-slate-50 dark:hover:bg-zinc-900/60 transition-all cursor-pointer shadow-sm hover:scale-[1.01]"
      >
        <div className="flex items-center space-x-2.5 min-w-0">
          {activeMembership.workspace_logo ? (
            <img
              src={activeMembership.workspace_logo}
              alt={activeMembership.workspace_name}
              className="w-8 h-8 rounded-lg object-cover border border-slate-100 dark:border-zinc-800 shadow-sm flex-shrink-0"
            />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-kakao-yellow/20 dark:bg-yellow-500/10 flex items-center justify-center text-kakao-yellow dark:text-yellow-400 text-xs font-bold border border-kakao-yellow/30 flex-shrink-0">
              {activeMembership.workspace_name.substring(0, 2)}
            </div>
          )}
          <div className="text-left min-w-0">
            <h2 className="text-xs font-extrabold text-slate-800 dark:text-zinc-100 truncate">
              {activeMembership.workspace_name}
            </h2>
            <p className="text-[10px] text-slate-400 font-semibold truncate mt-0.5">
              {activeMembership.nickname} · {activeMembership.department?.position?.name || '멤버'}
            </p>
          </div>
        </div>
        <ChevronDown size={14} className={`text-slate-400 dark:text-zinc-500 transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Popover Dropdown Overlay */}
      {isOpen && (
        <div className="absolute left-0 right-0 mt-1.5 bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-slate-200/80 dark:border-zinc-800 z-50 overflow-hidden animate-in fade-in-50 slide-in-from-top-1 duration-150">
          <div className="p-1.5 max-h-[220px] overflow-y-auto space-y-1">
            <div className="px-3 py-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
              내 워크스페이스 목록
            </div>
            
            {/* Active (Selected) Workspace item highlighted */}
            <div className="flex items-center space-x-2.5 p-2.5 rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800/80">
              {activeMembership.workspace_logo ? (
                <img
                  src={activeMembership.workspace_logo}
                  alt={activeMembership.workspace_name}
                  className="w-7 h-7 rounded-md object-cover border border-slate-100 dark:border-zinc-800"
                />
              ) : (
                <div className="w-7 h-7 rounded-md bg-kakao-yellow/20 dark:bg-yellow-500/10 flex items-center justify-center text-kakao-yellow dark:text-yellow-400 text-[10px] font-bold border border-kakao-yellow/30">
                  {activeMembership.workspace_name.substring(0, 2)}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-slate-800 dark:text-zinc-200 truncate flex items-center gap-1.5">
                  <span className="truncate">{activeMembership.workspace_name}</span>
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                </div>
                <p className="text-[9px] text-slate-400 font-semibold truncate mt-0.5">
                  {activeMembership.nickname}
                </p>
              </div>
            </div>

            {/* Other Switchable Workspaces */}
            {otherMemberships.length > 0 ? (
              otherMemberships.map((m) => (
                <button
                  key={m.workspace_id}
                  onClick={() => handleSwitch(m.workspace_id)}
                  className="w-full flex items-center space-x-2.5 p-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-950/60 text-left transition-colors cursor-pointer group"
                >
                  {m.workspace_logo ? (
                    <img
                      src={m.workspace_logo}
                      alt={m.workspace_name}
                      className="w-7 h-7 rounded-md object-cover border border-slate-100 dark:border-zinc-800 group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-md bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-500 dark:text-zinc-400 text-[10px] font-bold border border-slate-200 dark:border-zinc-700">
                      {m.workspace_name.substring(0, 2)}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-slate-700 dark:text-zinc-300 group-hover:text-kakao-yellow dark:group-hover:text-yellow-400 transition-colors truncate flex items-center justify-between">
                      <span className="truncate">{m.workspace_name}</span>
                      <RefreshCw size={10} className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <p className="text-[9px] text-slate-400 font-semibold truncate mt-0.5">
                      {m.nickname} · {m.department?.position?.name || '멤버'}
                    </p>
                  </div>
                </button>
              ))
            ) : (
              <div className="px-3 py-2 text-[10px] text-slate-400 italic">
                겸직 중인 타 워크스페이스가 없습니다.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
