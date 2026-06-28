import type { User } from '../../types'
import { Dialog, DialogContent } from '../../components/ui/Dialog'
import { MessageSquare } from 'lucide-react'

interface ProfileCardModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: User | null
  onStartChat: (user: User) => void
}

export function ProfileCardModal({ open, onOpenChange, user, onStartChat }: ProfileCardModalProps) {
  if (!user) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xs p-0 overflow-hidden border-none rounded-2xl bg-zinc-900 dark:bg-zinc-950 select-none shadow-2xl">
        <div className="flex flex-col h-[420px] relative text-white">
          {/* Background gradient / Cover Photo */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-700/50 via-zinc-900/80 to-zinc-950 z-0" />
          
          {/* Top Bar with actions */}
          <div className="relative z-10 flex justify-end p-4">
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col items-center justify-center relative z-10 pt-10 px-6">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-3xl overflow-hidden bg-slate-500 border-2 border-white/20 shadow-lg mb-4 hover:scale-105 transition-transform duration-300">
              {user.profile_image_url ? (
                <img src={user.profile_image_url} alt={user.nickname} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl font-extrabold bg-slate-600 text-white">
                  {user.nickname[0]}
                </div>
              )}
            </div>

            {/* Nickname & Username */}
            <h3 className="text-lg font-bold tracking-tight mb-1">{user.nickname}</h3>
            <span className="text-[10px] text-zinc-400 font-semibold mb-2">@{user.username}</span>

            {/* Corporate structure (Read-only lookup) */}
            {user.workspace && (
              <div className="flex flex-col items-center mb-4 space-y-1 text-[10px] text-zinc-400 font-semibold select-none shrink-0 w-full">
                <div className="flex flex-col items-center space-y-1 w-full">
                  <span className="bg-zinc-800/80 px-2 py-0.5 rounded text-[9px] text-zinc-300 max-w-[240px] truncate text-center flex items-center justify-center">
                    {user.workspace_logo ? (
                      <img src={user.workspace_logo} className="w-3 h-3 rounded-full object-cover shrink-0 mr-1" alt="" />
                    ) : (
                      <span className="mr-0.5">🏢</span>
                    )}
                    <span>
                      {user.workspace} 
                      {user.workspace_code ? ` (${user.workspace_code})` : ''}
                      {user.zioyou_company_code ? ` [지오유: ${user.zioyou_company_code}]` : ''}
                    </span>
                  </span>
                  {user.department && (
                    <span className="bg-zinc-800/80 px-2 py-0.5 rounded text-[9px] text-zinc-300 max-w-[200px] truncate text-center">
                      📂 {user.department} {user.department_code ? `(${user.department_code})` : ''}
                    </span>
                  )}
                  {/* Member Type & Status badges */}
                  {(user.member_type || user.member_status) && (
                    <div className="flex items-center space-x-1 mt-0.5">
                      {user.member_type && (
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                          user.member_type === 'ADMIN' ? 'bg-amber-950/85 text-amber-400 border border-amber-800' : 'bg-zinc-800 text-zinc-400'
                        }`}>
                          {user.member_type === 'ADMIN' ? '관리자' : '일반'}
                        </span>
                      )}
                      {user.member_status && (
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                          user.member_status === 'ACTIVE' ? 'bg-emerald-950/85 text-emerald-400' :
                          user.member_status === 'LEAVE' ? 'bg-amber-950/85 text-amber-400' :
                          'bg-rose-950/85 text-rose-400'
                        }`}>
                          {user.member_status === 'ACTIVE' ? '재직' :
                           user.member_status === 'LEAVE' ? '휴직' : '퇴사'}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                {(user.position || user.duty) && (
                  <span className="text-[9px] text-zinc-500 font-bold">
                    {user.position || ''}{user.position_code ? ` [${user.position_code}]` : ''}
                    {user.duty ? ` (${user.duty}${user.duty_code ? ` [${user.duty_code}]` : ''})` : ''}
                  </span>
                )}
              </div>
            )}

            {/* Status Message */}
            <p className="text-xs text-zinc-300 text-center font-medium max-w-full truncate px-2 py-1 bg-white/5 dark:bg-black/10 rounded-lg min-h-[26px]">
              {user.status_message || '상태 메시지가 없습니다.'}
            </p>
          </div>

          {/* Bottom Action Section */}
          <div className="relative z-10 p-6 border-t border-white/5 flex flex-col items-center justify-center space-y-3 bg-zinc-950/80 backdrop-blur-md">
            <button
              onClick={() => onStartChat(user)}
              className="w-full py-3 rounded-xl bg-kakao-yellow hover:bg-yellow-400 text-kakao-brown font-bold text-xs shadow-md transition-all flex items-center justify-center space-x-2"
            >
              <MessageSquare size={14} fill="currentColor" />
              <span>1:1 채팅하기</span>
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
