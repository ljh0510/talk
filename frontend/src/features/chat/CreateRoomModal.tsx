/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from 'react'
import { useChatStore } from '../../store/useChatStore'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../components/ui/Dialog'
import { ScrollArea } from '../../components/ui/ScrollArea'
import { UserPlus } from 'lucide-react'

interface CreateRoomModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (roomId: number) => void
}

export function CreateRoomModal({ open, onOpenChange, onSuccess }: CreateRoomModalProps) {
  const { users, createChatRoom } = useChatStore()
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([])
  const [customRoomName, setCustomRoomName] = useState('')

  useEffect(() => {
    if (!open) {
      setSelectedUserIds([])
      setCustomRoomName('')
    }
  }, [open])

  const toggleSelectUser = (userId: number) => {
    setSelectedUserIds(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId) 
        : [...prev, userId]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedUserIds.length === 0) return
    
    const roomId = await createChatRoom(
      customRoomName.trim() || undefined,
      selectedUserIds
    )
    if (roomId) {
      onSuccess(roomId)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm select-none">
        <DialogHeader className="border-b border-slate-100 dark:border-zinc-800 pb-3">
          <DialogTitle className="text-sm font-extrabold text-slate-800 dark:text-zinc-100 flex items-center space-x-1.5">
            <UserPlus size={18} className="text-slate-500" />
            <span>대화방 만들기</span>
          </DialogTitle>
          <DialogDescription className="text-[11px] text-slate-400">
            초대할 대화상대를 선택하고 대화방을 만드세요.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 pt-2">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">채팅방 이름 (선택)</label>
            <input
              type="text"
              placeholder="대화방의 이름을 입력해주세요."
              value={customRoomName}
              onChange={(e) => setCustomRoomName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-100 text-xs focus:outline-none focus:ring-1 focus:ring-slate-400 dark:focus:ring-zinc-700"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">초대할 대화상대 선택 ({selectedUserIds.length}명)</label>
            <ScrollArea className="h-[150px] border border-slate-200 dark:border-zinc-800 rounded-lg p-2 bg-slate-50 dark:bg-zinc-950">
              <div className="space-y-1">
                {users.map(user => {
                  const isChecked = selectedUserIds.includes(user.id)
                  return (
                    <div
                      key={user.id}
                      onClick={() => toggleSelectUser(user.id)}
                      className={`flex items-center space-x-2.5 p-2 rounded-lg cursor-pointer transition-colors
                        ${isChecked ? 'bg-kakao-yellow/20 dark:bg-yellow-500/10' : 'hover:bg-slate-200/50 dark:hover:bg-zinc-850/40'}`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}} // toggled by parent div click
                        className="rounded border-slate-300 dark:border-zinc-700 text-yellow-500 focus:ring-0 cursor-pointer w-3.5 h-3.5"
                      />
                      <span className="text-xs font-bold text-slate-700 dark:text-zinc-300">{user.nickname}</span>
                      <span className="text-[10px] text-slate-400">({user.username})</span>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          </div>

          <button
            type="submit"
            disabled={selectedUserIds.length === 0}
            className="w-full py-2.5 rounded-xl bg-kakao-yellow hover:bg-yellow-400 text-kakao-brown font-bold text-xs shadow disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            채팅 시작하기
          </button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
