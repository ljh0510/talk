import { useState, useEffect } from 'react'
import type { User } from '../../types'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/Dialog'
import { MessageSquare, Phone } from 'lucide-react'

interface ProfileCardModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: User | null
  onStartChat: (user: User) => void
}

export function ProfileCardModal({ open, onOpenChange, user, onStartChat }: ProfileCardModalProps) {
  const [showCallModal, setShowCallModal] = useState(false)

  useEffect(() => {
    if (!open) {
      setShowCallModal(false)
    }
  }, [open])

  if (!user) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[360px] max-w-sm !p-0 overflow-hidden border-none rounded-2xl bg-white dark:bg-zinc-900 select-none shadow-2xl h-fit">
        <div className="flex flex-col relative text-slate-800 dark:text-zinc-100 h-fit w-full">
          {/* Background gradient / Cover Photo */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-100/70 via-slate-50/90 to-white dark:from-zinc-800/50 dark:via-zinc-900/80 dark:to-zinc-900 z-0" />
          
          {/* Top Bar with actions */}
          <div className="relative z-10 flex justify-end p-4">
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col items-center justify-start relative z-10 pt-8 pb-4 px-5 w-full">
            {/* Avatar & Basic Info */}
            <div className="flex flex-col items-center mb-4 shrink-0 w-full">
              <div className="w-20 h-20 rounded-2xl bg-slate-200 dark:bg-zinc-700 border border-slate-200/50 dark:border-zinc-700/60 shadow-md mb-3 hover:scale-105 transition-transform duration-300">
                {user.profile_image_url ? (
                  <img src={user.profile_image_url} alt={user.nickname} className="w-full h-full object-cover rounded-2xl" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl font-extrabold bg-slate-300 dark:bg-zinc-650 text-slate-700 dark:text-zinc-300 rounded-2xl">
                    {user.nickname ? user.nickname[0] : '?'}
                  </div>
                )}
              </div>
              <h3 className="text-base font-extrabold tracking-tight mb-0.5 text-slate-800 dark:text-zinc-100">{user.nickname}</h3>
              <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-bold mb-1.5">@{user.username}</span>

              {user.birthday && (
                <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-rose-50/80 dark:bg-rose-950/20 text-rose-500 dark:text-rose-400 text-[10px] font-extrabold border border-rose-100/50 dark:border-rose-950/30 mb-2.5 shadow-sm">
                  <span>🎂</span>
                  <span>{user.birthday} ({user.birthday_type === 'SOLAR' ? '양력' : '음력'})</span>
                </div>
              )}

              {/* Status Message (Under name for cleaner look) */}
              <p className="text-[11px] text-slate-600 dark:text-zinc-350 text-center font-medium max-w-[240px] truncate px-3 py-1.5 bg-slate-50/80 dark:bg-zinc-950/40 rounded-xl border border-slate-100 dark:border-zinc-800/30">
                {user.status_message || '상태 메시지가 없습니다.'}
              </p>
            </div>
            {/* Unified Info Card */}
            {(user.workspace || user.phone_number || user.office_phone || user.email || user.birthday) && (
              <div className="w-full px-1">
                <div className="p-4 rounded-2xl bg-slate-50/60 dark:bg-zinc-800/20 border border-slate-100/80 dark:border-zinc-800/40 w-full flex flex-col space-y-3.5 text-xs text-slate-600 dark:text-zinc-300">
                  
                  {/* Part 1: Organization Details */}
                  {user.workspace && (
                    <div className="flex flex-col space-y-2">
                      <div className="flex items-center space-x-2">
                        {user.workspace_logo ? (
                          <img src={user.workspace_logo} className="w-4 h-4 rounded-full object-cover shrink-0" alt="" />
                        ) : (
                          <span className="text-sm">🏢</span>
                        )}
                        <span className="font-extrabold text-slate-800 dark:text-zinc-200">{user.workspace}</span>
                      </div>

                      {user.department && (
                        <div className="flex items-center space-x-2 font-medium">
                          <span className="text-slate-400 dark:text-zinc-500 w-4 text-center text-[10px]">📂</span>
                          <span>{user.department}</span>
                        </div>
                      )}

                      {(user.position || user.duty) && (
                        <div className="flex items-center space-x-2 font-medium">
                          <span className="text-slate-400 dark:text-zinc-500 w-4 text-center text-[10px]">💼</span>
                          <span>{user.position || ''}{user.duty ? ` (${user.duty})` : ''}</span>
                        </div>
                      )}

                      {/* Status Badges */}
                      {(user.member_type || user.member_status) && (
                        <div className="flex items-center space-x-1.5 pt-1">
                          {user.member_type && (
                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold ${
                              user.member_type === 'ADMIN' ? 'bg-amber-100 dark:bg-amber-950/85 text-amber-700 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/50' : 'bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400'
                            }`}>
                              {user.member_type === 'ADMIN' ? '관리자' : '일반'}
                            </span>
                          )}
                          {user.member_status && (
                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold ${
                              user.member_status === 'ACTIVE' ? 'bg-emerald-100 dark:bg-emerald-950/85 text-emerald-700 dark:text-emerald-400' :
                              user.member_status === 'LEAVE' ? 'bg-amber-100 dark:bg-amber-950/85 text-amber-700 dark:text-amber-400' :
                              'bg-rose-100 dark:bg-rose-950/85 text-rose-700 dark:text-rose-400'
                            }`}>
                              {user.member_status === 'ACTIVE' ? '재직' :
                               user.member_status === 'LEAVE' ? '휴직' : '퇴사'}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Divider Line (Only if both sections exist) */}
                  {user.workspace && (user.phone_number || user.office_phone || user.email || user.birthday) && (
                    <div className="border-t border-slate-200/50 dark:border-zinc-800/40 my-0.5" />
                  )}

                  {/* Part 2: Contact & Personal Details */}
                  {(user.phone_number || user.office_phone || user.email || user.birthday) && (
                    <div className="flex flex-col space-y-2">
                      {user.phone_number && (
                        <div className="flex items-center space-x-2 font-medium">
                          <span className="text-slate-400 dark:text-zinc-500 w-4 text-center">📞</span>
                          <span>{user.phone_number}</span>
                        </div>
                      )}
                      {user.office_phone && (
                        <div className="flex items-center space-x-2 font-medium">
                          <span className="text-slate-400 dark:text-zinc-500 w-4 text-center">🏢</span>
                          <span>{user.office_phone}</span>
                        </div>
                      )}
                      {user.email && (
                        <div className="flex items-center space-x-2 font-medium">
                          <span className="text-slate-400 dark:text-zinc-500 w-4 text-center">✉️</span>
                          <span className="break-all">{user.email}</span>
                        </div>
                      )}
                      {user.birthday && (
                        <div className="flex items-center space-x-2 font-medium">
                          <span className="text-slate-400 dark:text-zinc-500 w-4 text-center">🎂</span>
                          <span>
                            {user.birthday}
                            {user.birthday_type ? ` (${user.birthday_type === 'SOLAR' ? '양력' : '음력'})` : ''}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                </div>
              </div>
            )}
          </div>

          {/* Bottom Action Section */}
          <div className="relative z-10 p-5 border-t border-slate-100 dark:border-zinc-800/40 flex items-center justify-between space-x-2 bg-slate-50/90 dark:bg-zinc-955/60 backdrop-blur-md w-full">
            {/* Chat Action (Main) */}
            <button
              onClick={() => onStartChat(user)}
              className="flex-1 py-3 rounded-xl bg-primary-accent hover:bg-primary-accent-hover text-primary-accent-text font-bold text-xs shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            >
              <MessageSquare size={14} fill="currentColor" />
              <span>1:1 채팅하기</span>
            </button>

            {/* Phone Quick Call Action */}
            {(user.phone_number || user.office_phone) && (
              <button
                onClick={() => setShowCallModal(true)}
                className="py-3 px-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-sm transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center border border-emerald-600/10 shrink-0"
                title="전화 걸기"
              >
                <Phone size={14} fill="currentColor" />
              </button>
            )}
          </div>
        </div>
      </DialogContent>

      {/* Nested Dial Selector Modal (Mobile-friendly) */}
      <Dialog open={showCallModal} onOpenChange={setShowCallModal}>
        <DialogContent className="w-72 max-w-xs p-5 rounded-2xl bg-white dark:bg-zinc-900 select-none shadow-2xl border border-slate-100 dark:border-zinc-800/60 h-fit">
          <DialogHeader className="pb-3 border-b border-slate-100 dark:border-zinc-800/60">
            <DialogTitle className="text-sm font-extrabold text-slate-800 dark:text-zinc-100 flex items-center space-x-1.5">
              <Phone size={15} className="text-emerald-500 animate-pulse" />
              <span>전화 대상 선택</span>
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 flex flex-col space-y-2">
            {user.phone_number && (
              <a
                href={`tel:${user.phone_number}`}
                onClick={() => setShowCallModal(false)}
                className="w-full py-3 rounded-xl bg-slate-50 dark:bg-zinc-800/60 hover:bg-slate-100 dark:hover:bg-zinc-700/60 text-slate-700 dark:text-zinc-200 text-xs font-bold transition-all flex items-center justify-center space-x-1.5 border border-slate-200/40 dark:border-zinc-700/30 cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
              >
                <span>📞 {user.phone_number}</span>
              </a>
            )}
            {user.office_phone && (
              <a
                href={`tel:${user.office_phone}`}
                onClick={() => setShowCallModal(false)}
                className="w-full py-3 rounded-xl bg-slate-50 dark:bg-zinc-800/60 hover:bg-slate-100 dark:hover:bg-zinc-700/60 text-slate-700 dark:text-zinc-200 text-xs font-bold transition-all flex items-center justify-center space-x-1.5 border border-slate-200/40 dark:border-zinc-700/30 cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
              >
                <span>🏢 {user.office_phone}</span>
              </a>
            )}
          </div>
          <button
            onClick={() => setShowCallModal(false)}
            className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700/60 text-slate-700 dark:text-zinc-355 text-xs font-bold transition-all cursor-pointer"
          >
            취소
          </button>
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}
