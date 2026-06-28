import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/Dialog'
import { FolderPlus, Trash2, Folder, Check } from 'lucide-react'
import type { ChatRoom } from '../../types'

export interface ChatFolder {
  id: string
  name: string
  roomIds: number[]
}

interface FolderManageModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  folders: ChatFolder[]
  chatRooms: ChatRoom[]
  onSaveFolders: (updatedFolders: ChatFolder[]) => void
}

export function FolderManageModal({
  open,
  onOpenChange,
  folders,
  chatRooms,
  onSaveFolders
}: FolderManageModalProps) {
  const [newFolderName, setNewFolderName] = useState('')
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(
    folders.length > 0 ? folders[0].id : null
  )

  const handleAddFolder = () => {
    if (!newFolderName.trim()) return
    const newFolder: ChatFolder = {
      id: `folder-${Date.now()}`,
      name: newFolderName.trim(),
      roomIds: []
    }
    const updated = [...folders, newFolder]
    onSaveFolders(updated)
    setNewFolderName('')
    setSelectedFolderId(newFolder.id)
  }

  const handleDeleteFolder = (folderId: string) => {
    const updated = folders.filter(f => f.id !== folderId)
    onSaveFolders(updated)
    if (selectedFolderId === folderId) {
      setSelectedFolderId(updated.length > 0 ? updated[0].id : null)
    }
  }

  const handleToggleRoomInFolder = (folderId: string, roomId: number) => {
    const updated = folders.map(f => {
      if (f.id !== folderId) return f
      const exists = f.roomIds.includes(roomId)
      const nextRoomIds = exists
        ? f.roomIds.filter(id => id !== roomId)
        : [...f.roomIds, roomId]
      return { ...f, roomIds: nextRoomIds }
    })
    onSaveFolders(updated)
  }

  const activeFolder = folders.find(f => f.id === selectedFolderId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md select-none max-h-[85vh] flex flex-col p-6">
        <DialogHeader className="border-b border-slate-100 dark:border-zinc-800 pb-3 shrink-0">
          <DialogTitle className="text-sm font-extrabold text-slate-800 dark:text-zinc-100 flex items-center space-x-1.5">
            <Folder size={18} className="text-slate-500" />
            <span>채팅방 폴더 관리</span>
          </DialogTitle>
          <DialogDescription className="text-[11px] text-slate-400">
            나만의 커스텀 폴더를 생성하고 채팅방들을 나누어 관리해 보세요.
          </DialogDescription>
        </DialogHeader>

        {/* Add New Folder Input */}
        <div className="mt-4 shrink-0 flex items-center space-x-2">
          <input
            type="text"
            placeholder="새 폴더 이름 입력 (예: 가족, 업무)"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-slate-400 dark:focus:ring-zinc-700"
          />
          <button
            onClick={handleAddFolder}
            className="px-4 py-2 rounded-xl bg-slate-800 dark:bg-zinc-700 text-white font-bold text-xs hover:bg-slate-700 dark:hover:bg-zinc-600 transition-colors flex items-center space-x-1 shadow"
          >
            <FolderPlus size={13} />
            <span>폴더 추가</span>
          </button>
        </div>

        {folders.length === 0 ? (
          <div className="flex-1 py-12 text-center text-xs text-slate-400">
            생성된 커스텀 폴더가 없습니다. 새 폴더를 추가해 보세요!
          </div>
        ) : (
          <div className="flex-1 flex flex-col md:flex-row gap-4 mt-4 overflow-hidden min-h-[300px]">
            {/* Folder Left Column List */}
            <div className="w-full md:w-[150px] border-r border-slate-100 dark:border-zinc-850 pr-2 overflow-y-auto space-y-1.5 max-h-[160px] md:max-h-full shrink-0">
              <span className="text-[10px] font-bold text-slate-455 uppercase block mb-1">폴더 목록</span>
              {folders.map(f => (
                <div
                  key={f.id}
                  onClick={() => setSelectedFolderId(f.id)}
                  className={`p-2 rounded-lg cursor-pointer flex items-center justify-between text-xs transition-colors ${
                    selectedFolderId === f.id
                      ? 'bg-slate-200 dark:bg-zinc-800 font-bold text-slate-800 dark:text-zinc-200'
                      : 'hover:bg-slate-100 dark:hover:bg-zinc-900/60 text-slate-550 dark:text-zinc-400'
                  }`}
                >
                  <span className="truncate max-w-[90px]">{f.name}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteFolder(f.id)
                    }}
                    className="text-slate-400 hover:text-red-500 p-0.5 rounded transition-colors"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>

            {/* Folder Right Column Room Selector */}
            {activeFolder ? (
              <div className="flex-1 flex flex-col overflow-hidden">
                <span className="text-[10px] font-bold text-slate-455 uppercase block mb-2 shrink-0">
                  {activeFolder.name} 폴더에 담을 채팅방 ({activeFolder.roomIds.length})
                </span>
                
                <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 max-h-[180px] md:max-h-full">
                  {chatRooms.map(room => {
                    const isChecked = activeFolder.roomIds.includes(room.id)
                    const roomName = room.name || (room.is_group
                      ? room.members.map(m => m.nickname).join(', ')
                      : room.members[0]?.nickname || '대화방')
                    return (
                      <div
                        key={room.id}
                        onClick={() => handleToggleRoomInFolder(activeFolder.id, room.id)}
                        className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                          isChecked
                            ? 'bg-slate-50 dark:bg-zinc-900/40 border-slate-350 dark:border-zinc-700/80 font-semibold'
                            : 'border-slate-100 dark:border-zinc-850 hover:bg-slate-100/50 dark:hover:bg-zinc-900/20'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5 min-w-0">
                          <div className={`w-6 h-6 rounded-lg bg-slate-300 dark:bg-zinc-800 flex items-center justify-center text-[10px] text-white shrink-0`}>
                            {room.name ? room.name[0] : '💬'}
                          </div>
                          <span className="text-xs text-slate-700 dark:text-zinc-300 truncate max-w-[150px]">{roomName}</span>
                        </div>
                        <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all shrink-0 ${
                          isChecked
                            ? 'bg-primary-accent border-primary-accent text-primary-accent-text'
                            : 'border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-950'
                        }`}>
                          {isChecked && <Check size={11} strokeWidth={3} />}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              <div className="flex-1 py-12 text-center text-xs text-slate-400">
                선택된 폴더가 없습니다.
              </div>
            )}
          </div>
        )}

        <div className="mt-6 border-t border-slate-100 dark:border-zinc-850 pt-4 flex justify-end shrink-0">
          <button
            onClick={() => onOpenChange(false)}
            className="px-5 py-2 rounded-xl bg-slate-800 dark:bg-zinc-700 text-white font-bold text-xs hover:bg-slate-700 dark:hover:bg-zinc-600 transition-colors shadow"
          >
            확인
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
