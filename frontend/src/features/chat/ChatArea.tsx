import { useState, useEffect, useRef } from 'react'
import { useChatStore } from '../../store/useChatStore'
import { MessageSquare, Send } from 'lucide-react'
import { ScrollArea } from '../../components/ui/ScrollArea'
import { formatTime } from '../../utils/time'

export function ChatArea() {
  const { currentUser, activeRoomDetail, sendMessage, setActiveRoomId } = useChatStore()
  const [messageText, setMessageText] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom on new messages
  useEffect(() => {
    if (activeRoomDetail?.messages) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [activeRoomDetail?.messages])

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!messageText.trim() || !activeRoomDetail) return
    sendMessage(activeRoomDetail.id, messageText.trim())
    setMessageText('')
  }

  if (!currentUser) return null

  return (
    <div className="flex-1 bg-kakao-chatBg dark:bg-zinc-900 flex flex-col h-full relative">
      {activeRoomDetail ? (
        <>
          {/* Chat Room Header */}
          <div className="h-[64px] px-6 bg-white/95 dark:bg-zinc-900/95 flex items-center justify-between select-none glass-panel z-10">
            <div className="flex items-center space-x-3">
              <div className="flex flex-col">
                <h2 className="text-sm font-bold text-slate-800 dark:text-zinc-100">
                  {activeRoomDetail.name || (activeRoomDetail.is_group
                    ? activeRoomDetail.members.map(m => m.user.nickname).join(', ')
                    : activeRoomDetail.members.filter(m => m.user_id !== currentUser.id)[0]?.user.nickname || '대화 상대 없음')}
                </h2>
                <span className="text-[9px] text-slate-400 dark:text-zinc-550">
                  참여 멤버 {activeRoomDetail.members.length}명
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setActiveRoomId(null)}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors text-xs font-bold"
              >
                닫기
              </button>
            </div>
          </div>

          {/* Chat Room Messages List */}
          <ScrollArea className="flex-1 p-6">
            <div className="space-y-4">
              {activeRoomDetail.messages.length === 0 ? (
                <div className="text-center py-12 text-xs text-slate-400 dark:text-zinc-650">
                  대화의 시작입니다. 첫 메시지를 보내보세요!
                </div>
              ) : (
                activeRoomDetail.messages.map((msg) => {
                  const isMe = msg.sender_id === currentUser.id
                  
                  return (
                    <div key={msg.id} className={`flex items-start ${isMe ? 'justify-end' : 'justify-start'} space-x-2.5`}>
                      {/* Sender Avatar */}
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
                        {/* Sender name */}
                        {!isMe && (
                          <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 mb-1">
                            {msg.sender.nickname}
                          </span>
                        )}

                        {/* Message Content & Timestamp */}
                        <div className={`flex items-end space-x-1.5 ${isMe ? 'flex-row-reverse space-x-reverse' : ''}`}>
                          {/* Message bubble */}
                          <div className={`px-3.5 py-2 rounded-2xl text-xs font-medium leading-relaxed shadow-sm break-words
                            ${isMe 
                              ? 'bg-kakao-yellow text-kakao-brown rounded-tr-none' 
                              : 'bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-100 rounded-tl-none border border-slate-200/55 dark:border-zinc-800'}`}>
                            {msg.content}
                          </div>
                          
                          {/* Timestamp */}
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

          {/* Chat Room Input Area */}
          <form onSubmit={handleSendMessage} className="p-4 bg-white dark:bg-zinc-900 border-t border-slate-200 dark:border-zinc-800/80 flex items-center space-x-2.5 z-10 glass-panel">
            <input
              type="text"
              placeholder="메시지를 입력하세요..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-100 text-xs focus:outline-none focus:ring-1 focus:ring-slate-400 dark:focus:ring-zinc-700"
            />
            <button
              type="submit"
              disabled={!messageText.trim()}
              className="p-2.5 rounded-xl bg-kakao-yellow hover:bg-yellow-400 disabled:opacity-50 disabled:hover:bg-kakao-yellow text-kakao-brown transition-colors shadow-sm"
            >
              <Send size={15} />
            </button>
          </form>
        </>
      ) : (
        // Unselected Room View
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-zinc-650 select-none">
          <div className="bg-slate-200/50 dark:bg-zinc-800/30 p-5 rounded-3xl mb-4 border border-slate-300/30 dark:border-zinc-800/40">
            <MessageSquare size={36} className="text-slate-400/80 dark:text-zinc-600/80" />
          </div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-400">대화방이 선택되지 않았습니다.</h3>
          <p className="text-[11px] text-slate-400 dark:text-zinc-550 mt-1">왼쪽 대화 목록을 더블 클릭하거나 새 대화를 개설하세요.</p>
        </div>
      )}
    </div>
  )
}
