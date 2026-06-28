import { useChatStore } from '../../store/useChatStore'
import type { User } from '../../types'

interface FriendsTabProps {
  searchQuery: string
  onOpenProfileEdit: () => void
  onSelectProfileUser: (user: User) => void
}

export function FriendsTab({ searchQuery, onOpenProfileEdit, onSelectProfileUser }: FriendsTabProps) {
  const { currentUser, friends } = useChatStore()

  if (!currentUser) return null

  const activeFriendships = friends.filter(f => f.status === 'FRIEND')

  const filteredFriends = activeFriendships.filter(f => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return true
    return (
      f.friend.nickname.toLowerCase().includes(q) ||
      f.friend.username.toLowerCase().includes(q)
    )
  })

  return (
    <>
      {/* My Profile Row */}
      <div 
        onClick={onOpenProfileEdit}
        className="p-3 mb-3 bg-white dark:bg-zinc-900/60 rounded-xl border border-slate-200/50 dark:border-zinc-800/40 flex items-center space-x-3 cursor-pointer hover:bg-white/80 dark:hover:bg-zinc-900 transition-colors"
      >
        <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-400 dark:bg-zinc-800 flex items-center justify-center text-white font-bold shrink-0">
          {currentUser.profile_image_url ? (
            <img src={currentUser.profile_image_url} alt={currentUser.nickname} className="w-full h-full object-cover" />
          ) : (
            currentUser.nickname[0]
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-100">{currentUser.nickname}</h3>
          <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate mt-0.5">
            {currentUser.status_message || '상태 메시지가 없습니다.'}
          </p>
        </div>
      </div>

      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">친구 리스트 ({filteredFriends.length})</h4>
      
      {filteredFriends.length === 0 ? (
        <div className="text-center py-8 text-xs text-slate-400">검색된 친구가 없습니다.</div>
      ) : (
        filteredFriends.map(f => (
          <div
            key={f.friend_id}
            onClick={() => onSelectProfileUser(f.friend)}
            className="p-2.5 rounded-xl hover:bg-slate-200/50 dark:hover:bg-zinc-800/30 flex items-center justify-between transition-colors group cursor-pointer"
          >
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-300 dark:bg-zinc-800 flex items-center justify-center text-slate-700 dark:text-zinc-300 font-bold border border-slate-200 dark:border-zinc-800 shrink-0">
                {f.friend.profile_image_url ? (
                  <img src={f.friend.profile_image_url} alt={f.friend.nickname} className="w-full h-full object-cover" />
                ) : (
                  f.friend.nickname[0]
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-xs font-bold text-slate-800 dark:text-zinc-100">{f.friend.nickname}</h3>
                <p className="text-[10px] text-slate-400 truncate mt-0.5">
                  {f.friend.status_message || ''}
                </p>
              </div>
            </div>
          </div>
        ))
      )}
    </>
  )
}
