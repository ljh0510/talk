import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/Dialog'
import { LogOut, XSquare } from 'lucide-react'

interface ConfirmModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  confirmType: 'logout' | 'exit'
  onConfirm: () => void
}

export function ConfirmModal({
  open,
  onOpenChange,
  confirmType,
  onConfirm
}: ConfirmModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm select-none">
        <DialogHeader className="border-b border-slate-100 dark:border-zinc-800 pb-3">
          <DialogTitle className="text-sm font-extrabold text-slate-800 dark:text-zinc-100 flex items-center space-x-1.5">
            {confirmType === 'logout' ? (
              <LogOut size={18} className="text-slate-500" />
            ) : (
              <XSquare size={18} className="text-red-500" />
            )}
            <span>{confirmType === 'logout' ? '로그아웃' : '프로그램 종료'}</span>
          </DialogTitle>
          <DialogDescription className="text-[11px] text-slate-400">
            KokoaTalk Enterprise 안전 확인
          </DialogDescription>
        </DialogHeader>

        <div className="p-5 space-y-4 pt-2 text-center">
          <p className="text-xs text-slate-600 dark:text-zinc-300 font-medium whitespace-pre-line">
            {confirmType === 'logout'
              ? '현재 계정에서 로그아웃하시겠습니까?'
              : '메신저를 종료하고 완전히 로그아웃하시겠습니까?\n종료 후에는 대화 알림을 받을 수 없습니다.'}
          </p>

          <div className="flex space-x-2.5 pt-2">
            <button
              onClick={() => onOpenChange(false)}
              className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 font-bold text-xs transition-colors"
            >
              취소
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 py-2.5 rounded-xl text-white font-bold text-xs transition-colors shadow-md ${
                confirmType === 'logout'
                  ? 'bg-kakao-brown hover:bg-neutral-800'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {confirmType === 'logout' ? '로그아웃' : '종료하기'}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
