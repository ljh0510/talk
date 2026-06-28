import type { WorkspaceMembership } from '../../types'
import { Briefcase, ArrowRight } from 'lucide-react'

interface WorkspaceSelectCardProps {
  memberships: WorkspaceMembership[]
  onSelect: (workspaceId: number) => void
  onBack: () => void
}

export function WorkspaceSelectCard({ memberships, onSelect, onBack }: WorkspaceSelectCardProps) {
  return (
    <div className="w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-200/60 dark:border-zinc-800/80 transition-all duration-300">
      <div className="bg-gradient-to-r from-yellow-400 via-kakao-yellow to-amber-300 p-8 text-center border-b border-yellow-400/50">
        <h1 className="text-xl font-extrabold text-kakao-brown tracking-tight flex items-center justify-center gap-2">
          <Briefcase size={22} fill="currentColor" />
          워크스페이스 선택
        </h1>
        <p className="text-xs text-kakao-brown/80 font-medium mt-1.5">
          진입하여 메시지를 수신하고 협업할 소속 워크스페이스를 선택하세요.
        </p>
      </div>

      <div className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[360px] overflow-y-auto pr-1">
          {memberships.map((m) => (
            <button
              key={m.workspace_id}
              onClick={() => onSelect(m.workspace_id)}
              className="group text-left p-5 rounded-xl border border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/40 hover:bg-slate-50 dark:hover:bg-zinc-900/60 hover:border-kakao-yellow dark:hover:border-yellow-500 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md flex flex-col justify-between h-[150px]"
            >
              <div className="flex items-start justify-between w-full">
                <div className="flex items-center space-x-3">
                  {m.workspace_logo ? (
                    <img
                      src={m.workspace_logo}
                      alt={m.workspace_name}
                      className="w-10 h-10 rounded-xl object-cover border border-slate-100 dark:border-zinc-800 shadow-sm"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-kakao-yellow/20 dark:bg-yellow-500/10 flex items-center justify-center text-kakao-yellow dark:text-yellow-400 text-sm font-bold border border-kakao-yellow/30">
                      {m.workspace_name.substring(0, 2)}
                    </div>
                  )}
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 dark:text-zinc-100 group-hover:text-kakao-yellow dark:group-hover:text-yellow-400 transition-colors">
                      {m.workspace_name}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-medium">
                      Code: {m.workspace_code}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 border-t border-slate-100 dark:border-zinc-800/80 pt-3 flex items-center justify-between w-full">
                <div>
                  <p className="text-[11px] font-extrabold text-slate-700 dark:text-zinc-300">
                    {m.nickname}
                  </p>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                    {m.department?.name ? `${m.department.name} · ` : ''}
                    {m.department?.position?.name || '멤버'}
                  </p>
                </div>
                <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800 group-hover:bg-kakao-yellow group-hover:text-kakao-brown transition-colors">
                  <ArrowRight size={14} className="transform group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-8 border-t border-slate-100 dark:border-zinc-800/80 pt-4 flex justify-center">
          <button
            onClick={onBack}
            className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 font-semibold text-xs hover:bg-slate-50 dark:hover:bg-zinc-950 transition-colors cursor-pointer"
          >
            이전 로그인 화면으로
          </button>
        </div>
      </div>
    </div>
  )
}
