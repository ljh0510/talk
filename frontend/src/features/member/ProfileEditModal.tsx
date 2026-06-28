/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from 'react'
import { useChatStore } from '../../store/useChatStore'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../components/ui/Dialog'
import { Smile } from 'lucide-react'

interface ProfileEditModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProfileEditModal({ open, onOpenChange }: ProfileEditModalProps) {
  const { currentUser, updateMyProfile } = useChatStore()
  const [editNickname, setEditNickname] = useState('')
  const [editStatusMessage, setEditStatusMessage] = useState('')
  const [editProfileImageUrl, setEditProfileImageUrl] = useState('')

  useEffect(() => {
    if (open && currentUser) {
      setEditNickname(currentUser.nickname)
      setEditStatusMessage(currentUser.status_message || '')
      setEditProfileImageUrl(currentUser.profile_image_url || '')
    }
  }, [open, currentUser])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const success = await updateMyProfile(
      editNickname.trim(),
      editStatusMessage.trim(),
      editProfileImageUrl.trim() || undefined
    )
    if (success) {
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm select-none">
        <DialogHeader className="border-b border-slate-100 dark:border-zinc-800 pb-3">
          <DialogTitle className="text-sm font-extrabold text-slate-800 dark:text-zinc-100 flex items-center space-x-1.5">
            <Smile size={18} className="text-slate-500" />
            <span>내 프로필 편집</span>
          </DialogTitle>
          <DialogDescription className="text-[11px] text-slate-400">
            내 닉네임과 상태메시지, 프로필 이미지 URL을 변경할 수 있습니다.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 pt-2">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">닉네임</label>
            <input
              type="text"
              required
              value={editNickname}
              onChange={(e) => setEditNickname(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-100 text-xs focus:outline-none focus:ring-1 focus:ring-slate-400 dark:focus:ring-zinc-700"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">상태 메시지</label>
            <input
              type="text"
              value={editStatusMessage}
              onChange={(e) => setEditStatusMessage(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-100 text-xs focus:outline-none focus:ring-1 focus:ring-slate-400 dark:focus:ring-zinc-700"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">프로필 이미지 URL</label>
            <input
              type="text"
              value={editProfileImageUrl}
              onChange={(e) => setEditProfileImageUrl(e.target.value)}
              placeholder="https://example.com/image.png"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-100 text-xs focus:outline-none focus:ring-1 focus:ring-slate-400 dark:focus:ring-zinc-700"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-kakao-yellow hover:bg-yellow-400 text-kakao-brown font-bold text-xs shadow transition-colors"
          >
            프로필 변경사항 저장
          </button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
