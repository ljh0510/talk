import { useChatStore } from '../../store/useChatStore'
import { MessageSquare } from 'lucide-react'
import { formatRoomTime } from '../../utils/time'

interface ChatsTabProps {
  searchQuery: string
}

export function ChatsTab({ searchQuery }: ChatsTabProps) {
  const { currentUser, chatRooms, activeRoomId, setActiveRoomId } = useChatStore()

  if (!currentUser) return null

  // Apply search query filter to chat rooms
  const filteredRooms = chatRooms.filter(room => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return true

    if (room.name && room.name.toLowerCase().includes(q)) return true

    return room.members.some(
      m => m.nickname.toLowerCase().includes(q) || m.username.toLowerCase().includes(q)
    )
  })

  return (
    <>
      {filteredRooms.length === 0 ? (
        <div className="text-center py-12 text-xs text-slate-400 flex flex-col items-center justify-center space-y-2">
          <MessageSquare size={24} className="text-slate-300 dark:text-zinc-700" />
          <span>개설된 대화방이 없습니다.</span>
        </div>
      ) : (
        filteredRooms.map(room => {
          const otherMembers = room.members.filter(m => m.id !== currentUser.id)
          const roomName = room.name || (room.is_group 
            ? room.members.map(m => m.nickname).join(', ')
            : (otherMembers[0]?.nickname || '대화 상대 없음'))
          
          const memberCount = room.members.length
          
          const displayAvatar = room.is_group 
            ? (otherMembers[0]?.profile_image_url || '') 
            : (otherMembers[0]?.profile_image_url || '')
          
          const displayAvatarInitial = room.is_group
            ? 'G'
            : (otherMembers[0]?.nickname[0] || '?')

          const isActive = activeRoomId === room.id

          return (
            <div
              key={room.id}
              onClick={() => setActiveRoomId(room.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setActiveRoomId(room.id)
                }
              }}
              tabIndex={0}
              role="button"
              aria-selected={isActive}
              className={`p-3 rounded-xl flex items-center justify-between cursor-pointer transition-all border outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:focus-visible:ring-zinc-700
                ${isActive 
                  ? 'bg-white dark:bg-zinc-800/80 border-slate-300/40 dark:border-zinc-700/60 shadow-sm' 
                  : 'hover:bg-slate-200/50 dark:hover:bg-zinc-900/40 border-transparent'}`}
            >
              <div className="flex items-center space-x-3 min-w-0 flex-1">
                {/* Avatar */}
                <div className={`w-11 h-11 rounded-2xl overflow-hidden flex items-center justify-center font-bold text-white border border-slate-200 dark:border-zinc-800 shadow-sm shrink-0
                  ${room.is_group ? 'bg-gradient-to-tr from-purple-500 to-indigo-500' : 'bg-slate-400 dark:bg-zinc-800'}`}>
                  {displayAvatar ? (
                    <img src={displayAvatar} alt={roomName} className="w-full h-full object-cover" />
                  ) : (
                    displayAvatarInitial
                  )}
                </div>
                
                {/* Room Name, Member count & Latest Message */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-1.5">
                    <h3 className="text-xs font-bold text-slate-800 dark:text-zinc-100 truncate max-w-[150px]">
                      {roomName}
                    </h3>
                    {room.is_group && (
                      <span className="text-[10px] text-slate-400 dark:text-zinc-550 font-extrabold">
                        {memberCount}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate mt-1">
                    {room.latest_message ? room.latest_message.content : '대화가 없습니다.'}
                  </p>
                </div>
              </div>

              {/* Timestamp & Unread count Badge */}
              <div className="flex flex-col items-end space-y-1.5 ml-2 select-none shrink-0">
                <span className="text-[9px] text-slate-400">
                  {formatRoomTime(room.latest_message?.created_at || room.created_at)}
                </span>
                {room.unread_count > 0 && (
                  <span className="bg-red-500 text-white text-[9px] font-extrabold min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center animate-bounce-short">
                    {room.unread_count}
                  </span>
                )}
              </div>
            </div>
          )
        })
      )}
    </>
  )
}
