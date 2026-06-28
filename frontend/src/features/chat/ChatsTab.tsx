import { useState, useEffect } from 'react'
import { useChatStore } from '../../store/useChatStore'
import { MessageSquare, ListPlus, Calendar, Gift } from 'lucide-react'
import { formatRoomTime } from '../../utils/time'
import { FolderManageModal } from '../../components/modal/FolderManageModal'
import type { ChatFolder } from '../../components/modal/FolderManageModal'
import type { ChatRoom } from '../../types'

interface ChatsTabProps {
  searchQuery: string
  sortType: 'latest' | 'unread' | 'favorite'
}

export function ChatsTab({ searchQuery, sortType }: ChatsTabProps) {
  const { currentUser, chatRooms, activeRoomId, setActiveRoomId, friends } = useChatStore()
  
  // Custom chat folders configuration stored in localStorage
  const [folders, setFolders] = useState<ChatFolder[]>(() => {
    const saved = localStorage.getItem('chatFolders')
    return saved ? JSON.parse(saved) : []
  })

  // Selected folder tab id ('all' | 'unread' | folderId)
  const [activeFolderTab, setActiveFolderTab] = useState<string>('all')

  // Folder management modal visibility
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false)

  // Listen to folder updates in localStorage if modified externally (e.g. from MiddlePanel)
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('chatFolders')
      if (saved) setFolders(JSON.parse(saved))
    }
    window.addEventListener('storage', handleStorageChange)
    
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  // Sync folder states to localStorage
  useEffect(() => {
    localStorage.setItem('chatFolders', JSON.stringify(folders))
  }, [folders])

  if (!currentUser) return null

  // 1. Calculate unread counts dynamically
  const unreadTotal = chatRooms.reduce((acc, r) => acc + r.unread_count, 0)

  // 2. Filter rooms based on active folder tab
  let folderFilteredRooms = [...chatRooms]
  if (activeFolderTab === 'unread') {
    folderFilteredRooms = chatRooms.filter(r => r.unread_count > 0)
  } else if (activeFolderTab !== 'all') {
    const targetFolder = folders.find(f => f.id === activeFolderTab)
    if (targetFolder) {
      folderFilteredRooms = chatRooms.filter(r => targetFolder.roomIds.includes(r.id))
    }
  }

  // 3. Apply search query filtering
  const searchedRooms = folderFilteredRooms.filter(room => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return true

    if (room.name && room.name.toLowerCase().includes(q)) return true

    return room.members.some(
      m => m.nickname.toLowerCase().includes(q) || m.username.toLowerCase().includes(q)
    )
  })

  // Helper to identify if a room belongs to a favorite friend
  const isFavoriteRoom = (room: ChatRoom): boolean => {
    if (room.is_group) return false
    const otherMember = room.members.find(m => m.id !== currentUser.id)
    if (!otherMember) return false
    const friendship = friends.find(f => f.friend_id === otherMember.id)
    return !!friendship
  }

  // 4. Sort rooms based on sortType
  const sortedRooms = [...searchedRooms].sort((a, b) => {
    // 4a. Priority Sorting: Favorite Room First
    if (sortType === 'favorite') {
      const aFav = isFavoriteRoom(a)
      const bFav = isFavoriteRoom(b)
      if (aFav !== bFav) return bFav ? 1 : -1
    }

    // 4b. Priority Sorting: Unread Room First
    if (sortType === 'unread') {
      if (b.unread_count !== a.unread_count) {
        return b.unread_count - a.unread_count
      }
    }
    
    // Default: Sort by latest message timestamp
    const aTime = a.latest_message ? new Date(a.latest_message.created_at).getTime() : new Date(a.created_at).getTime()
    const bTime = b.latest_message ? new Date(b.latest_message.created_at).getTime() : new Date(b.created_at).getTime()
    return bTime - aTime
  })

  // Render icons for custom built-in options
  const getAvatarIcon = (roomName: string) => {
    if (roomName.includes('캘린더')) {
      return <Calendar size={22} className="text-yellow-600 dark:text-yellow-400" />
    }
    if (roomName.includes('선물')) {
      return <Gift size={22} className="text-yellow-600 dark:text-yellow-400" />
    }
    return null
  }

  return (
    <div className="flex flex-col h-full space-y-1 relative">
      {/* Horizontally Scrollable Folder Filter Tabs (aligned like KakaoTalk) */}
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-1.5 scrollbar-none shrink-0 pr-1 select-none">
        
        {/* All Tab */}
        <button
          onClick={() => setActiveFolderTab('all')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap shrink-0 shadow-sm ${
            activeFolderTab === 'all'
              ? 'bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
              : 'bg-white dark:bg-zinc-900 text-slate-500 dark:text-zinc-400 hover:bg-slate-200/50 dark:hover:bg-zinc-800'
          }`}
        >
          전체
        </button>

        {/* Unread Tab */}
        <button
          onClick={() => setActiveFolderTab('unread')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap shrink-0 shadow-sm flex items-center space-x-1.5 ${
            activeFolderTab === 'unread'
              ? 'bg-blue-600 text-white'
              : 'bg-white dark:bg-zinc-900 text-slate-500 dark:text-zinc-400 hover:bg-slate-200/50 dark:hover:bg-zinc-800'
          }`}
        >
          <span className="text-[10px]">💬</span>
          <span>안읽음</span>
          <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-extrabold ${
            activeFolderTab === 'unread' ? 'bg-white text-blue-600' : 'bg-red-500 text-white'
          }`}>
            {unreadTotal}
          </span>
        </button>

        {/* Custom Folder Tabs */}
        {folders.map(f => {
          const isSelected = activeFolderTab === f.id
          const unreadCount = chatRooms
            .filter(r => f.roomIds.includes(r.id))
            .reduce((sum, r) => sum + r.unread_count, 0)
          return (
            <button
              key={f.id}
              onClick={() => setActiveFolderTab(f.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap shrink-0 shadow-sm flex items-center space-x-1.5 ${
                isSelected
                  ? 'bg-primary-accent text-primary-accent-text'
                  : 'bg-white dark:bg-zinc-900 text-slate-500 dark:text-zinc-400 hover:bg-slate-200/50 dark:hover:bg-zinc-800'
              }`}
            >
              <span>{f.name}</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[9px] font-extrabold bg-red-500 text-white">
                  {unreadCount}
                </span>
              )}
            </button>
          )
        })}

        {/* Add/Manage Folders Button */}
        <button
          onClick={() => setIsFolderModalOpen(true)}
          className="p-2 bg-white dark:bg-zinc-900 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 rounded-full transition-all shrink-0 shadow-sm border border-slate-100 dark:border-zinc-800/80 hover:scale-105"
          title="폴더 관리"
        >
          <ListPlus size={14} />
        </button>
      </div>

      {/* Scrollable Room List Container */}
      <div className="flex-1 space-y-1.5 pr-0.5">
        {sortedRooms.length === 0 ? (
          <div className="text-center py-16 text-xs text-slate-400 flex flex-col items-center justify-center space-y-2 select-none">
            <MessageSquare size={24} className="text-slate-300 dark:text-zinc-800" />
            <span>대화방이 비어 있습니다.</span>
          </div>
        ) : (
          sortedRooms.map(room => {
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

            // Determine if this room is ad-styled in list (e.g. KakaoPay yellow)
            const isKakaoPay = roomName.toLowerCase().includes('페이')
            const isGift = roomName.toLowerCase().includes('선물')

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
                className={`p-3 rounded-2xl flex items-center justify-between cursor-pointer transition-all border outline-none focus-visible:ring-1 focus-visible:ring-slate-400 dark:focus-visible:ring-zinc-700
                  ${isActive 
                    ? 'bg-white dark:bg-zinc-900 border-slate-200/50 dark:border-zinc-800/80 shadow-sm scale-[1.01]' 
                    : 'hover:bg-white/60 dark:hover:bg-zinc-900/40 border-transparent'}`}
              >
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  {/* Avatar Frame - specific branding support */}
                  <div className={`w-11 h-11 rounded-2xl overflow-hidden flex items-center justify-center font-bold text-white border border-slate-200/80 dark:border-zinc-800/80 shadow-sm shrink-0
                    ${isKakaoPay 
                      ? 'bg-[#fee500] text-black border-transparent' 
                      : isGift 
                        ? 'bg-yellow-500'
                        : room.is_group 
                          ? 'bg-gradient-to-tr from-sky-400 to-blue-500' 
                          : 'bg-slate-400 dark:bg-zinc-800'}`}>
                    {getAvatarIcon(roomName) ? (
                      getAvatarIcon(roomName)
                    ) : displayAvatar ? (
                      <img src={displayAvatar} alt={roomName} className="w-full h-full object-cover" />
                    ) : (
                      <span className={isKakaoPay ? 'text-black' : 'text-white'}>
                        {displayAvatarInitial}
                      </span>
                    )}
                  </div>
                  
                  {/* Room Name, Member count & Latest Message */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-1.5">
                      <h3 className="text-xs font-bold text-slate-800 dark:text-zinc-150 truncate max-w-[130px]">
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
                    <span className="bg-red-500 text-white text-[9px] font-extrabold min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center shadow-inner animate-bounce-short">
                      {room.unread_count}
                    </span>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Custom Folder LifeCycle Manager modal */}
      <FolderManageModal
        open={isFolderModalOpen}
        onOpenChange={setIsFolderModalOpen}
        folders={folders}
        chatRooms={chatRooms}
        onSaveFolders={(updated) => setFolders(updated)}
      />
    </div>
  )
}
