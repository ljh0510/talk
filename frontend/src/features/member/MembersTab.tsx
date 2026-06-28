import { useState } from 'react'
import { useChatStore } from '../../store/useChatStore'
import { ProfileCardModal } from './ProfileCardModal'
import { ProfileEditModal } from './ProfileEditModal'
import type { User } from '../../types'

interface MembersTabProps {
  searchQuery: string
  setActiveTab: (tab: 'members' | 'chats' | 'settings' | 'more') => void
}

export function MembersTab({ searchQuery, setActiveTab }: MembersTabProps) {
  const { currentUser, members, chatRooms, setActiveRoomId, createChatRoom } = useChatStore()
  
  const [isMyProfileEditOpen, setIsMyProfileEditOpen] = useState(false)
  const [isProfileCardOpen, setIsProfileCardOpen] = useState(false)
  const [selectedProfileUser, setSelectedProfileUser] = useState<User | null>(null)
  const [sortBy, setSortBy] = useState<'name' | 'date'>('name')

  if (!currentUser) return null

  const handleStartChat = async (user: User) => {
    setIsProfileCardOpen(false)
    const active = chatRooms.find(r => !r.is_group && r.members.some(m => m.id === user.id))
    if (active) {
      setActiveRoomId(active.id)
    } else {
      const newId = await createChatRoom(undefined, [user.id])
      if (newId) setActiveRoomId(newId)
    }
    setActiveTab('chats')
  }

  const getTodayMMDD = () => {
    const d = new Date()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${month}-${day}`
  }

  const todayMMDD = getTodayMMDD()
  const activeRelations = members

  const filteredMembers = activeRelations.filter(m => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return true
    return (
      m.member.nickname.toLowerCase().includes(q) ||
      m.member.username.toLowerCase().includes(q)
    )
  })

  // 오늘 생일인 사람 필터
  const birthdayMembers = filteredMembers.filter(m => {
    if (!m.member.birthday) return false
    return m.member.birthday.substring(5, 10) === todayMMDD
  })

  return (
    <>
      {/* My Profile Row */}
      <div 
        onClick={() => setIsMyProfileEditOpen(true)}
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

      {/* Birthday Members Section (Only show if there are birthday members today) */}
      {birthdayMembers.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between px-2 py-1.5 mb-1">
            <h4 className="text-[10px] font-bold text-rose-500 dark:text-rose-400 uppercase tracking-wider flex items-center space-x-1">
              <span>🎂</span>
              <span>오늘 생일인 친구 ({birthdayMembers.length})</span>
            </h4>
          </div>
          <div className="space-y-0.5">
            {birthdayMembers.map(m => (
              <div
                key={`bday-${m.member_id}`}
                onClick={() => {
                  setSelectedProfileUser(m.member)
                  setIsProfileCardOpen(true)
                }}
                className="p-2.5 rounded-xl hover:bg-slate-200/50 dark:hover:bg-zinc-800/30 flex items-center justify-between transition-colors cursor-pointer group"
              >
                <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                  <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-300 dark:bg-zinc-800 flex items-center justify-center text-slate-700 dark:text-zinc-300 font-bold border border-slate-200 dark:border-zinc-800 shrink-0">
                    {m.member.profile_image_url ? (
                      <img src={m.member.profile_image_url} alt={m.member.nickname} className="w-full h-full object-cover" />
                    ) : (
                      m.member.nickname[0]
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-1 flex-wrap">
                      <span className="text-xs font-bold text-slate-800 dark:text-zinc-100">{m.member.nickname}</span>
                      {m.member.position && (
                        <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-semibold">
                          {m.member.position}
                        </span>
                      )}
                      <span className="text-[9px] px-1 py-0.2 bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 rounded font-bold shrink-0">생일</span>
                    </div>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">
                      {m.member.status_message || '생일 축하 메시지를 남겨보세요! 🎉'}
                    </p>
                  </div>
                </div>
                {/* Gift Link / Icon Decoration */}
                <div className="flex items-center space-x-2 shrink-0">
                  <span className="text-xs animate-bounce" title="선물하기">🎁</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between px-2 py-1.5 mb-1.5 border-b border-slate-100 dark:border-zinc-800/40 pb-2">
        <h4 className="text-[11px] font-extrabold text-slate-500 dark:text-zinc-400 tracking-tight flex items-center space-x-1.5">
          <span>전체 멤버</span>
          <span className="px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500 text-[9px] font-bold">
            {filteredMembers.length}
          </span>
        </h4>

        {/* Sort Selector Dropdown */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'name' | 'date')}
          className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 bg-transparent border-none cursor-pointer hover:text-slate-600 dark:hover:text-zinc-300 focus:outline-none dark:bg-zinc-900/80"
        >
          <option value="name" className="dark:bg-zinc-900 dark:text-zinc-200">이름순</option>
          <option value="date" className="dark:bg-zinc-900 dark:text-zinc-200">등록일 순</option>
        </select>
      </div>
      
      {filteredMembers.length === 0 ? (
        <div className="text-center py-8 text-xs text-slate-400">검색된 멤버가 없습니다.</div>
      ) : (
        [...filteredMembers].sort((a, b) => {
          if (sortBy === 'date') {
            const aTime = a.member.created_at ? new Date(a.member.created_at).getTime() : 0
            const bTime = b.member.created_at ? new Date(b.member.created_at).getTime() : 0
            if (aTime !== bTime) return aTime - bTime
          }
          return a.member.nickname.localeCompare(b.member.nickname)
        }).map(m => (
          <div
            key={m.member_id}
            onClick={() => {
              setSelectedProfileUser(m.member)
              setIsProfileCardOpen(true)
            }}
            className="p-2.5 rounded-xl hover:bg-slate-200/50 dark:hover:bg-zinc-800/30 flex items-center justify-between transition-colors group cursor-pointer"
          >
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-300 dark:bg-zinc-800 flex items-center justify-center text-slate-700 dark:text-zinc-300 font-bold border border-slate-200 dark:border-zinc-800 shrink-0">
                {m.member.profile_image_url ? (
                  <img src={m.member.profile_image_url} alt={m.member.nickname} className="w-full h-full object-cover" />
                ) : (
                  m.member.nickname[0]
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center space-x-1 flex-wrap">
                  <span className="text-xs font-bold text-slate-800 dark:text-zinc-100">{m.member.nickname}</span>
                  {m.member.position && (
                    <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-semibold">
                      {m.member.position}
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 truncate mt-0.5">
                  {m.member.status_message || ''}
                </p>
              </div>
            </div>
          </div>
        ))
      )}

      {/* Internal Modals */}
      <ProfileCardModal
        open={isProfileCardOpen}
        onOpenChange={setIsProfileCardOpen}
        user={selectedProfileUser}
        onStartChat={handleStartChat}
      />
      <ProfileEditModal
        open={isMyProfileEditOpen}
        onOpenChange={setIsMyProfileEditOpen}
      />
    </>
  )
}
