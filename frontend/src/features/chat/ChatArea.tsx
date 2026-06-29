import { useState, useEffect, useRef } from 'react'
import { useChatStore } from '../../store/useChatStore'
import { MessageSquare, Send, ChevronLeft } from 'lucide-react'
import { ScrollArea } from '../../components/ui/ScrollArea'
import { formatTime } from '../../utils/time'
import type { ChatRoomDetail } from '../../types'

interface ChatAreaProps {
  roomId?: number | null
  onClose?: () => void
  isMobile?: boolean
}

export function ChatArea({ roomId, onClose, isMobile: forceMobile }: ChatAreaProps) {
  const { currentUser, activeRoomId, activeRoomDetail, sendMessage, setActiveRoomId, chatLayout } = useChatStore()
  const [messageText, setMessageText] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const targetRoomId = roomId !== undefined ? roomId : activeRoomId
  const [localRoomDetail, setLocalRoomDetail] = useState<ChatRoomDetail | null>(null)
  const isOverlayMode = forceMobile !== undefined ? forceMobile : chatLayout === 'overlay'

  useEffect(() => {
    if (targetRoomId === null) {
      setLocalRoomDetail(null)
      return
    }

    if (targetRoomId === activeRoomId) {
      setLocalRoomDetail(activeRoomDetail)
    } else {
      const loadIndependentRoom = async () => {
        try {
          const API_BASE = 'http://localhost:8080/api'
          const token = localStorage.getItem('accessToken')
          const wsId = localStorage.getItem('activeWorkspaceId')
          const response = await fetch(`${API_BASE}/rooms/${targetRoomId}`, {
            headers: { 
              'Authorization': `Bearer ${token}`,
              'X-Workspace-ID': wsId ? String(wsId) : ''
            }
          })
          if (response.ok) {
            const detail = await response.json()
            const normalizedDetail: ChatRoomDetail = {
              ...detail,
              members: detail.members.map((m: any) => ({
                ...m,
                user: {
                  ...m.user,
                  nickname: m.user.active_membership?.nickname || m.user.username,
                  profile_image_url: m.user.active_membership?.profile_image_url || undefined
                }
              })),
              messages: detail.messages.map((msg: any) => ({
                ...msg,
                sender: {
                  ...msg.sender,
                  nickname: msg.sender.active_membership?.nickname || msg.sender.username,
                  profile_image_url: msg.sender.active_membership?.profile_image_url || undefined
                }
              }))
            }
            setLocalRoomDetail(normalizedDetail)
          }
        } catch (err) {
          console.error("Failed to load independent room", err)
        }
      }
      loadIndependentRoom()
    }
  }, [targetRoomId, activeRoomId, activeRoomDetail])

  const latestMessage = useChatStore(state => {
    if (!targetRoomId) return null
    const room = state.chatRooms.find(r => r.id === targetRoomId)
    return room?.latest_message
  })

  useEffect(() => {
    if (latestMessage && localRoomDetail && targetRoomId) {
      const exists = localRoomDetail.messages.some(m => m.id === latestMessage.id)
      if (!exists && latestMessage.room_id === targetRoomId) {
        setLocalRoomDetail(prev => {
          if (!prev) return null
          return {
            ...prev,
            messages: [...prev.messages, latestMessage]
          }
        })
      }
    }
  }, [latestMessage, targetRoomId])

  useEffect(() => {
    if (localRoomDetail?.messages) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [localRoomDetail?.messages])

  const handleClose = () => {
    if (onClose) {
      onClose()
    } else {
      setActiveRoomId(null)
    }
  }

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!messageText.trim() || !targetRoomId) return
    sendMessage(targetRoomId, messageText.trim())
    setMessageText('')
  }

  if (!currentUser) return null

  return (
    <div className="flex-1 bg-kakao-chatBg dark:bg-zinc-900 flex flex-col h-full relative">
      {localRoomDetail ? (
        <>
          <div className="h-[64px] px-6 bg-white/95 dark:bg-zinc-900/95 flex items-center justify-between select-none glass-panel z-10">
            <div className="flex items-center space-x-3">
              {isOverlayMode && (
                <button
                  onClick={handleClose}
                  className="p-1 -ml-1 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-800 dark:hover:text-zinc-200 transition-colors cursor-pointer mr-1"
                  title="목록으로 돌아가기"
                >
                  <ChevronLeft size={20} />
                </button>
              )}
              <div className="flex flex-col">
                <h2 className="text-sm font-bold text-slate-800 dark:text-zinc-100">
                  {localRoomDetail.name || (localRoomDetail.is_group
                    ? localRoomDetail.members.map(m => m.user.nickname).join(', ')
                    : localRoomDetail.members.filter(m => m.user_id !== currentUser.id)[0]?.user.nickname || '대화 상대 없음')}
                </h2>
                <span className="text-[9px] text-slate-400 dark:text-zinc-550">
                  참여 멤버 {localRoomDetail.members.length}명
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {!isOverlayMode && (
                <button
                  onClick={handleClose}
                  className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors text-xs font-bold"
                >
                  닫기
                </button>
              )}
            </div>
          </div>

          <ScrollArea className="flex-1 p-6">
            <div className="space-y-4">
              {localRoomDetail.messages.length === 0 ? (
                <div className="text-center py-12 text-xs text-slate-400 dark:text-zinc-650">
                  대화의 시작입니다. 첫 메시지를 보내보세요!
                </div>
              ) : (
                localRoomDetail.messages.map((msg) => {
                  const isMe = msg.sender_id === currentUser.id
                  return (
                    <div key={msg.id} className={`flex items-start ${isMe ? 'justify-end' : 'justify-start'} space-x-2.5`}>
                      {!isMe && (
                        <div className="w-9 h-9 rounded-xl overflow-hidden bg-slate-400 dark:bg-zinc-800 flex items-center justify-center text-white text-xs font-bold border border-slate-300 dark:border-zinc-800 shadow-sm shrink-0">
                          {msg.sender.profile_image_url ? (
                            <img src={msg.sender.profile_image_url} alt={msg.sender.nickname} className="w-full h-full object-cover" />
                          ) : (
                            msg.sender.nickname[0]
                          )}
                        </div>
                      )}
                      <div className={`flex flex-col max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
                        {!isMe && (
                          <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 mb-1">
                            {msg.sender.nickname}
                          </span>
                        )}
                        <div className={`flex items-end space-x-1.5 ${isMe ? 'flex-row-reverse space-x-reverse' : ''}`}>
                          <div className={`px-3.5 py-2 rounded-2xl text-xs font-medium leading-relaxed shadow-sm break-words
                            ${isMe 
                              ? 'bg-kakao-yellow text-kakao-brown rounded-tr-none' 
                              : 'bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-100 rounded-tl-none border border-slate-200/55 dark:border-zinc-800'}`}>
                            {msg.content}
                          </div>
                          <span className="text-[8px] text-slate-400 dark:text-zinc-550 pb-0.5 shrink-0 select-none">
                            {formatTime(msg.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          <div className="p-4 bg-white/95 dark:bg-zinc-900/95 border-t border-slate-200/55 dark:border-zinc-800/80 glass-panel">
            <form onSubmit={handleSendMessage} className="flex space-x-3.5">
              <input
                type="text"
                placeholder="메시지를 입력하세요..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                className="flex-1 px-4 py-2.5 text-xs rounded-xl border border-slate-250 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 dark:focus:ring-zinc-700 transition-all"
              />
              <button
                type="submit"
                className="p-2.5 rounded-xl bg-kakao-yellow hover:bg-yellow-400 text-kakao-brown transition-colors shadow-md flex items-center justify-center shrink-0"
              >
                <Send size={15} />
              </button>
            </form>
          </div>
        </>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-zinc-600 select-none space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-white dark:bg-zinc-950/20 border border-slate-200/50 dark:border-zinc-800/60 flex items-center justify-center shadow-sm">
            <MessageSquare size={28} className="text-slate-350 dark:text-zinc-750" />
          </div>
          <div className="text-center">
            <h3 className="text-xs font-bold text-slate-700 dark:text-zinc-400">선택된 대화방이 없습니다</h3>
            <p className="text-[10px] text-slate-400 mt-1">대화방 목록에서 방을 선택하거나 새로운 방을 만드세요.</p>
          </div>
        </div>
      )}
    </div>
  )
}
