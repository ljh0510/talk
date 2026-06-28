/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from 'react'
import { useChatStore } from '../../store/useChatStore'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../components/ui/Dialog'
import { UserPlus } from 'lucide-react'

interface AddFriendModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddFriendModal({ open, onOpenChange }: AddFriendModalProps) {
  const { addFriend, fetchFriends } = useChatStore()
  const [friendUsernameInput, setFriendUsernameInput] = useState('')
  const [addFriendError, setAddFriendError] = useState('')
  const [addFriendSuccess, setAddFriendSuccess] = useState('')

  useEffect(() => {
    if (!open) {
      setFriendUsernameInput('')
      setAddFriendError('')
      setAddFriendSuccess('')
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddFriendError('')
    setAddFriendSuccess('')
    if (!friendUsernameInput.trim()) return

    const res = await addFriend(friendUsernameInput.trim())
    if (res.success) {
      setAddFriendSuccess('친구 추가에 성공했습니다!')
      setFriendUsernameInput('')
      fetchFriends() // reload friends list
    } else {
      setAddFriendError(res.error || '친구 추가에 실패했습니다.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm select-none">
        <DialogHeader className="border-b border-slate-100 dark:border-zinc-800 pb-3">
          <DialogTitle className="text-sm font-extrabold text-slate-800 dark:text-zinc-100 flex items-center space-x-1.5">
            <UserPlus size={18} className="text-slate-500" />
            <span>친구 추가</span>
          </DialogTitle>
          <DialogDescription className="text-[11px] text-slate-400">
            상대방의 아이디로 친구를 추가할 수 있습니다.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 pt-2">
          {addFriendError && (
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-xs font-semibold border border-red-200 dark:border-red-900/50">
              {addFriendError}
            </div>
          )}
          {addFriendSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold border border-emerald-200 dark:border-emerald-900/50">
              {addFriendSuccess}
            </div>
          )}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">친구 아이디 (Username)</label>
            <input
              type="text"
              required
              placeholder="상대방 아이디를 입력하세요."
              value={friendUsernameInput}
              onChange={(e) => setFriendUsernameInput(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-100 text-xs focus:outline-none focus:ring-1 focus:ring-slate-400 dark:focus:ring-zinc-700"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-kakao-yellow hover:bg-yellow-400 text-kakao-brown font-bold text-xs shadow transition-colors"
          >
            친구로 추가하기
          </button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
