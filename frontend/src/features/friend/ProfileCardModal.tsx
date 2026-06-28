import { useChatStore } from '../../store/useChatStore'
import type { User } from '../../types'
import { Dialog, DialogContent } from '../../components/ui/Dialog'
import { Ban, MessageSquare } from 'lucide-react'

interface ProfileCardModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: User | null
  onStartChat: (user: User) => void
}

export function ProfileCardModal({ open, onOpenChange, user, onStartChat }: ProfileCardModalProps) {
  const { updateFriendStatus, fetchFriends } = useChatStore()

  if (!user) return null

  const handleBlockUser = async () => {
    if (confirm(`${user.nickname}님을 차단하시겠습니까?`)) {
      await updateFriendStatus(user.id, 'BLOCKED')
      onOpenChange(false)
      fetchFriends()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xs p-0 overflow-hidden border-none rounded-2xl bg-zinc-900 dark:bg-zinc-955 select-none shadow-2xl">
        <div className="flex flex-col h-[420px] relative text-white">
          {/* Background gradient / Cover Photo */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-700/50 via-zinc-900/80 to-zinc-955 z-0" />
          
          {/* Top Bar with actions */}
          <div className="relative z-10 flex justify-end p-4">
            <button
              onClick={handleBlockUser}
              className="p-1.5 rounded-lg bg-black/30 hover:bg-black/50 transition-colors text-slate-300 hover:text-red-400"
              title="친구 차단"
            >
              <Ban size={15} />
            </button>
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
            <span className="text-[10px] text-zinc-400 font-semibold mb-4">@{user.username}</span>

            {/* Status Message */}
            <p className="text-xs text-zinc-300 text-center font-medium max-w-full truncate px-2 py-1 bg-white/5 dark:bg-black/10 rounded-lg min-h-[26px]">
              {user.status_message || '상태 메시지가 없습니다.'}
            </p>
          </div>

          {/* Bottom Action Section */}
          <div className="relative z-10 p-6 border-t border-white/5 flex flex-col items-center justify-center space-y-3 bg-zinc-955/80 backdrop-blur-md">
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
