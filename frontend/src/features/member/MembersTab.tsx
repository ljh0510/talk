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

  const activeRelations = members

  const filteredMembers = activeRelations.filter(m => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return true
    return (
      m.member.nickname.toLowerCase().includes(q) ||
      m.member.username.toLowerCase().includes(q)
    )
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

      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">멤버 리스트 ({filteredMembers.length})</h4>
      
      {filteredMembers.length === 0 ? (
        <div className="text-center py-8 text-xs text-slate-400">검색된 멤버가 없습니다.</div>
      ) : (
        [...filteredMembers].sort((a, b) => {
          const aDept = a.member.department_sort_order ?? 9999
          const bDept = b.member.department_sort_order ?? 9999
          if (aDept !== bDept) return aDept - bDept

          const aPos = a.member.position_sort_order ?? 9999
          const bPos = b.member.position_sort_order ?? 9999
          if (aPos !== bPos) return aPos - bPos

          const aDuty = a.member.duty_sort_order ?? 9999
          const bDuty = b.member.duty_sort_order ?? 9999
          if (aDuty !== bDuty) return aDuty - bDuty

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
                <h3 className="text-xs font-bold text-slate-800 dark:text-zinc-100">{m.member.nickname}</h3>
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
