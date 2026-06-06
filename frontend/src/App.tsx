
import React, { useState, useEffect, useRef } from 'react'
import { useChatStore } from './store/useChatStore'
import type { User, Message } from './store/useChatStore'
import { ScrollArea } from './components/ui/ScrollArea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './components/ui/Dialog'
import { 
  MessageSquare, 
  Users, 
  LogOut, 
  Sun, 
  Moon, 
  Search, 
  Plus, 
  Send, 
  MessageCircle,
  UserPlus,
  Ban,
  Smile
} from 'lucide-react'

export default function App() {
  const {
    currentUser,
    users,
    friends,
    chatRooms,
    activeRoomId,
    activeRoomDetail,
    isLoading,
    error,
    login,
    register,
    logout,
    fetchUsers,
    fetchFriends,
    fetchChatRooms,
    addFriend,
    updateFriendStatus,
    updateMyProfile,
    createChatRoom,
    sendMessage,
    setActiveRoomId,
  } = useChatStore()

  // App Layout States
  const [activeTab, setActiveTab] = useState<'friends' | 'chats'>('chats')
  const [searchQuery, setSearchQuery] = useState('')
  const [darkMode, setDarkMode] = useState(false)
  
  // Auth Form States
  const [isRegisterMode, setIsRegisterMode] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [authSuccessMsg, setAuthSuccessMsg] = useState('')

  // Create Chat Room States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([])
  const [customRoomName, setCustomRoomName] = useState('')

  // Friends and Profile Modal States
  const [isAddFriendOpen, setIsAddFriendOpen] = useState(false)
  const [friendUsernameInput, setFriendUsernameInput] = useState('')
  const [addFriendError, setAddFriendError] = useState('')
  const [addFriendSuccess, setAddFriendSuccess] = useState('')

  const [selectedProfileUser, setSelectedProfileUser] = useState<User | null>(null)
  const [isProfileCardOpen, setIsProfileCardOpen] = useState(false)

  const [isMyProfileEditOpen, setIsMyProfileEditOpen] = useState(false)
  const [editNickname, setEditNickname] = useState('')
  const [editStatusMessage, setEditStatusMessage] = useState('')
  const [editProfileImageUrl, setEditProfileImageUrl] = useState('')

  // Chat Window States
  const [messageText, setMessageText] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Fetch initial data on login
  useEffect(() => {
    if (currentUser) {
      fetchChatRooms()
      fetchFriends()
      fetchUsers()
    }
  }, [currentUser])

  // Scroll to bottom on new messages
  useEffect(() => {
    if (activeRoomDetail?.messages) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [activeRoomDetail?.messages])

  // Dark Mode Toggle
  useEffect(() => {
    const root = window.document.documentElement
    if (darkMode) {
      root.classList.add('dark')
      document.body.classList.add('dark')
    } else {
      root.classList.remove('dark')
      document.body.classList.remove('dark')
    }
  }, [darkMode])

  // Handle Auth submission
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isRegisterMode) {
      const success = await register(username, password, nickname)
      if (success) {
        setAuthSuccessMsg('회원가입이 완료되었습니다! 로그인 해주세요.')
        setIsRegisterMode(false)
        setPassword('')
      }
    } else {
      await login(username, password)
    }
  }

  // Handle Starting Chat Room
  const handleStartChat = async (targetUser: User) => {
    // Close profile card modal if open
    setIsProfileCardOpen(false)
    
    // Check if 1:1 room already exists
    const existingRoom = chatRooms.find(
      room => !room.is_group && room.members.some(m => m.id === targetUser.id)
    )

    if (existingRoom) {
      setActiveRoomId(existingRoom.id)
      setActiveTab('chats')
    } else {
      // Create new 1:1 room
      const newRoomId = await createChatRoom(undefined, [targetUser.id])
      if (newRoomId) {
        setActiveRoomId(newRoomId)
        setActiveTab('chats')
      }
    }
  }

  // Handle Add Friend Submission
  const handleAddFriendSubmit = async (e: React.FormEvent) => {
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

  // Handle My Profile Edit Submission
  const handleMyProfileEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const success = await updateMyProfile(
      editNickname.trim(),
      editStatusMessage.trim(),
      editProfileImageUrl.trim() || undefined
    )
    if (success) {
      setIsMyProfileEditOpen(false)
    }
  }

  // Helper to open my profile edit modal with initial values
  const openMyProfileEdit = () => {
    if (!currentUser) return
    setEditNickname(currentUser.nickname)
    setEditStatusMessage(currentUser.status_message || '')
    setEditProfileImageUrl(currentUser.profile_image_url || '')
    setIsMyProfileEditOpen(true)
  }

  // Handle Creating Group Chat Room
  const handleCreateGroupRoom = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedUserIds.length === 0) return
    
    const roomId = await createChatRoom(
      customRoomName.trim() || undefined,
      selectedUserIds
    )
    if (roomId) {
      setActiveRoomId(roomId)
      setIsCreateModalOpen(false)
      setSelectedUserIds([])
      setCustomRoomName('')
      setActiveTab('chats')
    }
  }

  // Toggle user selection for group chat
  const toggleSelectUser = (userId: number) => {
    setSelectedUserIds(prev => 
      prev.includes(userId) 
  	    ? prev.filter(id => id !== userId) 
        : [...prev, userId]
    )
  }

  // Handle Sending Message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!messageText.trim() || !activeRoomId) return
    sendMessage(activeRoomId, messageText.trim())
    setMessageText('')
  }

  // Render format time
  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString)
      return date.toLocaleTimeString('ko-KR', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      })
    } catch {
      return ''
    }
  }

  // Render format date/time for room item
  const formatRoomTime = (isoString?: string) => {
    if (!isoString) return ''
    try {
      const date = new Date(isoString)
      const now = new Date()
      if (date.toDateString() === now.toDateString()) {
        return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })
      }
      return `${date.getMonth() + 1}월 ${date.getDate()}일`
    } catch {
      return ''
    }
  }

  // Filter friends list (only active friendships, status = 'FRIEND')
  const activeFriends = friends.filter(f => f.status === 'FRIEND')
  
  const filteredFriends = activeFriends.filter(f => 
    f.friend.nickname.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.friend.username.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Filter chat rooms
  const filteredRooms = chatRooms.filter(room => {
    if (room.name) {
      return room.name.toLowerCase().includes(searchQuery.toLowerCase())
    }
    // Search room members names
    return room.members.some(m => 
      m.id !== currentUser?.id && 
      m.nickname.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })

  // Auth Screen
  if (!currentUser) {
    return (
      <div className={`min-h-screen flex items-center justify-center bg-slate-100 p-4 transition-colors duration-200 ${darkMode ? 'bg-zinc-950' : 'bg-slate-100'}`}>
        <div className="absolute top-4 right-4">
          <button 
            onClick={() => setDarkMode(!darkMode)}
            className="p-3 rounded-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-yellow-400 shadow-md hover:scale-105 transition-transform"
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
        
        <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-xl overflow-hidden border border-slate-200/50 dark:border-zinc-800/80 transition-all duration-300">
          <div className="bg-kakao-yellow p-8 text-center flex flex-col items-center border-b border-yellow-400">
            <div className="bg-kakao-brown text-kakao-yellow p-4 rounded-3xl shadow-md mb-3 hover:rotate-6 transition-transform cursor-default">
              <MessageSquare size={36} fill="currentColor" />
            </div>
            <h1 className="text-2xl font-bold text-kakao-brown tracking-tight">KokoaTalk Enterprise</h1>
            <p className="text-sm text-kakao-brown/80 font-medium mt-1">실시간 대화 및 협업 비즈니스 메신저</p>
          </div>

          <div className="p-8">
            {error && (
              <div className="mb-4 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-xs font-semibold border border-red-200 dark:border-red-900/50">
                ⚠️ {error}
              </div>
            )}
            {authSuccessMsg && (
              <div className="mb-4 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold border border-emerald-200 dark:border-emerald-900/50">
                🎉 {authSuccessMsg}
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">아이디</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="아이디를 입력하세요"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-kakao-yellow dark:focus:ring-yellow-500 transition-all text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">비밀번호</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="비밀번호를 입력하세요"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-kakao-yellow dark:focus:ring-yellow-500 transition-all text-sm"
                />
              </div>

              {isRegisterMode && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">이름 (닉네임)</label>
                  <input
                    type="text"
                    required
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="대화명으로 사용할 이름을 입력하세요"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-kakao-yellow dark:focus:ring-yellow-500 transition-all text-sm"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-xl bg-kakao-yellow hover:bg-yellow-400 text-kakao-brown font-bold text-sm shadow-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? '처리 중...' : isRegisterMode ? '회원가입' : '로그인'}
              </button>
            </form>

            <div className="mt-6 text-center text-xs">
              <button
                type="button"
                onClick={() => {
                  setIsRegisterMode(!isRegisterMode)
                  useChatStore.setState({ error: null })
                  setAuthSuccessMsg('')
                }}
                className="text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200 font-semibold underline underline-offset-4"
              >
                {isRegisterMode ? '이미 회원이신가요? 로그인하기' : '아직 계정이 없으신가요? 회원가입하기'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Dashboard Main Screen
  return (
    <div className={`h-screen flex overflow-hidden ${darkMode ? 'dark' : ''}`}>
      {/* 1. Global Left Navigation Sidebar */}
      <div className="w-[72px] bg-slate-200 dark:bg-zinc-900 border-r border-slate-300 dark:border-zinc-800 flex flex-col items-center py-6 justify-between select-none">
        <div className="flex flex-col items-center space-y-6 w-full">
          {/* My Profile Icon */}
          <div className="relative group cursor-pointer" onClick={openMyProfileEdit}>
            <div className="w-11 h-11 rounded-2xl overflow-hidden bg-slate-400 dark:bg-zinc-800 flex items-center justify-center text-white border border-slate-300 dark:border-zinc-700 font-bold hover:scale-105 transition-transform shadow">
              {currentUser.profile_image_url ? (
                <img src={currentUser.profile_image_url} alt={currentUser.nickname} className="w-full h-full object-cover" />
              ) : (
                currentUser.nickname[0]
              )}
            </div>
            <div className="absolute left-16 top-2.5 hidden group-hover:block bg-zinc-950 text-white text-xs px-2 py-1 rounded shadow whitespace-nowrap z-[100]">
              {currentUser.nickname} (나 - 클릭하여 편집)
            </div>
          </div>

          <div className="w-8 border-b border-slate-300 dark:border-zinc-800" />

          {/* Friends List Tab Button */}
          <button
            onClick={() => setActiveTab('friends')}
            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all relative ${activeTab === 'friends' ? 'bg-white dark:bg-zinc-800 text-kakao-brown dark:text-yellow-400 shadow' : 'text-slate-500 hover:bg-slate-300/50 dark:hover:bg-zinc-800/40 hover:text-slate-800 dark:hover:text-zinc-200'}`}
          >
            <Users size={22} fill={activeTab === 'friends' ? 'currentColor' : 'none'} />
            <span className="absolute bottom-1 text-[9px] font-bold">친구</span>
          </button>

          {/* Chat List Tab Button */}
          <button
            onClick={() => setActiveTab('chats')}
            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all relative ${activeTab === 'chats' ? 'bg-white dark:bg-zinc-800 text-kakao-brown dark:text-yellow-400 shadow' : 'text-slate-500 hover:bg-slate-300/50 dark:hover:bg-zinc-800/40 hover:text-slate-800 dark:hover:text-zinc-200'}`}
          >
            <MessageCircle size={22} fill={activeTab === 'chats' ? 'currentColor' : 'none'} />
            <span className="absolute bottom-1 text-[9px] font-bold">채팅</span>
            {chatRooms.reduce((acc, r) => acc + r.unread_count, 0) > 0 && (
              <div className="absolute top-1 right-1 bg-red-500 text-white text-[9px] font-bold min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center border border-white dark:border-zinc-900 shadow">
                {chatRooms.reduce((acc, r) => acc + r.unread_count, 0)}
              </div>
            )}
          </button>
        </div>

        <div className="flex flex-col items-center space-y-4 w-full">
          {/* Dark Mode Toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-500 dark:text-zinc-400 hover:bg-slate-300/50 dark:hover:bg-zinc-800/40 hover:text-slate-800 dark:hover:text-zinc-200 transition-colors"
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {/* Log Out */}
          <button
            onClick={() => logout()}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-500 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-600 transition-colors"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>

      {/* 2. Middle Panel: Scrollable Lists (Friends or Chats) */}
      <div className="w-[320px] bg-slate-100 dark:bg-zinc-950 border-r border-slate-300 dark:border-zinc-800 flex flex-col h-full select-none">
        {/* Header */}
        <div className="p-5 pb-3">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-extrabold text-slate-800 dark:text-zinc-100 tracking-tight">
              {activeTab === 'friends' ? '친구' : '채팅'}
            </h2>
            <div className="flex items-center space-x-1">
              {activeTab === 'friends' && (
                <button
                  onClick={() => setIsAddFriendOpen(true)}
                  className="p-1.5 rounded-lg bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-300/70 dark:hover:bg-zinc-700/70 transition-colors"
                  title="친구 추가"
                >
                  <UserPlus size={16} />
                </button>
              )}
              {activeTab === 'chats' && (
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="p-1.5 rounded-lg bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-300/70 dark:hover:bg-zinc-700/70 transition-colors"
                  title="새로운 채팅방 개설"
                >
                  <Plus size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3 top-3 text-slate-400" size={16} />
            <input
              type="text"
              placeholder={activeTab === 'friends' ? '이름 또는 아이디 검색' : '채팅방 검색'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 text-xs focus:outline-none focus:ring-1 focus:ring-slate-400 dark:focus:ring-zinc-700"
            />
          </div>
        </div>

        {/* Scrollable List */}
        <ScrollArea className="flex-1 px-3">
          <div className="space-y-1 pb-4">
            {activeTab === 'friends' ? (
              // FRIENDS LIST VIEW
              <>
                {/* My Profile Row */}
                <div 
                  onClick={openMyProfileEdit}
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

                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">친구 리스트 ({filteredFriends.length})</h4>
                
                {filteredFriends.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-400">검색된 친구가 없습니다.</div>
                ) : (
                  filteredFriends.map(f => (
                    <div
                      key={f.friend_id}
                      onClick={() => {
                        setSelectedProfileUser(f.friend)
                        setIsProfileCardOpen(true)
                      }}
                      className="p-2.5 rounded-xl hover:bg-slate-200/50 dark:hover:bg-zinc-800/30 flex items-center justify-between transition-colors group cursor-pointer"
                    >
                      <div className="flex items-center space-x-3 min-w-0 flex-1">
                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-300 dark:bg-zinc-800 flex items-center justify-center text-slate-700 dark:text-zinc-300 font-bold border border-slate-200 dark:border-zinc-800 shrink-0">
                          {f.friend.profile_image_url ? (
                            <img src={f.friend.profile_image_url} alt={f.friend.nickname} className="w-full h-full object-cover" />
                          ) : (
                            f.friend.nickname[0]
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-xs font-bold text-slate-800 dark:text-zinc-100">{f.friend.nickname}</h3>
                          <p className="text-[10px] text-slate-400 truncate mt-0.5">
                            {f.friend.status_message || ''}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </>
            ) : (
              // CHAT ROOMS LIST VIEW
              <>
                {filteredRooms.length === 0 ? (
                  <div className="text-center py-12 text-xs text-slate-400 flex flex-col items-center justify-center space-y-2">
                    <MessageSquare size={24} className="text-slate-300 dark:text-zinc-700" />
                    <span>개설된 대화방이 없습니다.</span>
                  </div>
                ) : (
                  filteredRooms.map(room => {
                    // Extract values for rendering
                    const otherMembers = room.members.filter(m => m.id !== currentUser.id)
                    const roomName = room.name || (room.is_group 
                      ? room.members.map(m => m.nickname).join(', ')
                      : (otherMembers[0]?.nickname || '대화 상대 없음'))
                    
                    const memberCount = room.members.length
                    
                    // Avatar image strategy:
                    // If group: use first member profile, if 1:1: use target member profile
                    const displayAvatar = room.is_group 
                      ? (otherMembers[0]?.profile_image_url || '') 
                      : (otherMembers[0]?.profile_image_url || '')
                    
                    const displayAvatarInitial = room.is_group
                      ? 'G'
                      : (otherMembers[0]?.nickname[0] || '?')

                    const isActive = activeRoomId === room.id

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
                        className={`p-3 rounded-xl flex items-center justify-between cursor-pointer transition-all border outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:focus-visible:ring-zinc-700
                          ${isActive 
                            ? 'bg-white dark:bg-zinc-800/80 border-slate-300/40 dark:border-zinc-700/60 shadow-sm' 
                            : 'hover:bg-slate-200/50 dark:hover:bg-zinc-900/40 border-transparent'}`}
                      >
                        <div className="flex items-center space-x-3 min-w-0 flex-1">
                          {/* Avatar */}
                          <div className={`w-11 h-11 rounded-2xl overflow-hidden flex items-center justify-center font-bold text-white border border-slate-200 dark:border-zinc-800 shadow-sm shrink-0
                            ${room.is_group ? 'bg-gradient-to-tr from-purple-500 to-indigo-500' : 'bg-slate-400 dark:bg-zinc-800'}`}>
                            {displayAvatar ? (
                              <img src={displayAvatar} alt={roomName} className="w-full h-full object-cover" />
                            ) : (
                              displayAvatarInitial
                            )}
                          </div>
                          
                          {/* Room Name, Member count & Latest Message */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center space-x-1.5">
                              <h3 className="text-xs font-bold text-slate-800 dark:text-zinc-100 truncate max-w-[150px]">
                                {roomName}
                              </h3>
                              {room.is_group && (
                                <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-extrabold">
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
                            <span className="bg-red-500 text-white text-[9px] font-extrabold min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center animate-bounce-short">
                              {room.unread_count}
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
              </>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* 3. Right Panel: Active Chat Room Window */}
      <div className="flex-1 bg-kakao-chatBg dark:bg-zinc-900 flex flex-col h-full relative">
        {activeRoomDetail ? (
          <>
            {/* Chat Room Header */}
            <div className="h-[64px] px-6 bg-white/95 dark:bg-zinc-900/95 border-b border-slate-200 dark:border-zinc-800/80 flex items-center justify-between select-none glass-panel z-10">
              <div className="flex items-center space-x-3">
                <div className="flex flex-col">
                  <h2 className="text-sm font-bold text-slate-800 dark:text-zinc-100">
                    {activeRoomDetail.name || (activeRoomDetail.is_group
                      ? activeRoomDetail.members.map(m => m.user.nickname).join(', ')
                      : activeRoomDetail.members.filter(m => m.user_id !== currentUser.id)[0]?.user.nickname || '대화 상대 없음')}
                  </h2>
                  <span className="text-[9px] text-slate-400 dark:text-zinc-500">
                    참여 멤버 {activeRoomDetail.members.length}명
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {/* Details / Close panel */}
                <button
                  onClick={() => setActiveRoomId(null)}
                  className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  닫기
                </button>
              </div>
            </div>

            {/* Chat Room Messages List */}
            <ScrollArea className="flex-1 p-6">
              <div className="space-y-4">
                {activeRoomDetail.messages.length === 0 ? (
                  <div className="text-center py-12 text-xs text-slate-400 dark:text-zinc-600">
                    대화의 시작입니다. 첫 메시지를 보내보세요!
                  </div>
                ) : (
                  activeRoomDetail.messages.map((msg: Message) => {
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
                            <span className="text-[8px] text-slate-400 dark:text-zinc-500 pb-0.5 shrink-0 select-none">
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
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-zinc-600 select-none">
            <div className="bg-slate-200/50 dark:bg-zinc-800/30 p-5 rounded-3xl mb-4 border border-slate-300/30 dark:border-zinc-800/40">
              <MessageSquare size={36} className="text-slate-400/80 dark:text-zinc-600/80" />
            </div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-400">대화방이 선택되지 않았습니다.</h3>
            <p className="text-[11px] text-slate-400 dark:text-zinc-550 mt-1">왼쪽 대화 목록을 더블 클릭하거나 새 대화를 개설하세요.</p>
          </div>
        )}
      </div>

      {/* 4. MODAL: Create Group Chat Room */}
      <Dialog open={isCreateModalOpen} onOpenChange={(open) => {
        setIsCreateModalOpen(open)
        if (!open) {
          setSelectedUserIds([])
          setCustomRoomName('')
        }
      }}>
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

          <form onSubmit={handleCreateGroupRoom} className="p-5 space-y-4 pt-2">
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
                          ${isChecked ? 'bg-kakao-yellow/20 dark:bg-yellow-500/10' : 'hover:bg-slate-200/50 dark:hover:bg-zinc-800/40'}`}
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

      {/* MODAL: Add Friend */}
      <Dialog open={isAddFriendOpen} onOpenChange={(open) => {
        setIsAddFriendOpen(open)
        if (!open) {
          setFriendUsernameInput('')
          setAddFriendError('')
          setAddFriendSuccess('')
        }
      }}>
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

          <form onSubmit={handleAddFriendSubmit} className="p-5 space-y-4 pt-2">
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

      {/* MODAL: Profile Card */}
      <Dialog open={isProfileCardOpen} onOpenChange={setIsProfileCardOpen}>
        <DialogContent className="max-w-xs p-0 overflow-hidden border-none rounded-2xl bg-zinc-900 dark:bg-zinc-955 select-none shadow-2xl">
          {selectedProfileUser && (
            <div className="flex flex-col h-[420px] relative text-white">
              {/* Background gradient / Cover Photo */}
              <div className="absolute inset-0 bg-gradient-to-b from-slate-700/50 via-zinc-900/80 to-zinc-950 z-0" />
              
              {/* Top Bar with actions */}
              <div className="relative z-10 flex justify-end p-4">
                <button
                  onClick={async () => {
                    if (confirm(`${selectedProfileUser.nickname}님을 차단하시겠습니까?`)) {
                      await updateFriendStatus(selectedProfileUser.id, 'BLOCKED')
                      setIsProfileCardOpen(false)
                      fetchFriends()
                    }
                  }}
                  className="p-1.5 rounded-lg bg-black/30 hover:bg-black/50 transition-colors text-slate-300 hover:text-red-400"
                  title="친구 차단"
                >
                  <Ban size={15} />
                </button>
              </div>

              {/* Main Content Area */}
              <div className="flex-1 flex flex-col items-center justify-center relative z-10 pt-10 px-6">
                {/* Avatar */}
                <div className="w-24 h-24 rounded-3xl overflow-hidden bg-slate-500 border-2 border-white/20 shadow-lg mb-4 hover:scale-105 transition-transform duration-300">
                  {selectedProfileUser.profile_image_url ? (
                    <img src={selectedProfileUser.profile_image_url} alt={selectedProfileUser.nickname} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl font-extrabold bg-slate-600 text-white">
                      {selectedProfileUser.nickname[0]}
                    </div>
                  )}
                </div>

                {/* Nickname & Username */}
                <h3 className="text-lg font-bold tracking-tight mb-1">{selectedProfileUser.nickname}</h3>
                <span className="text-[10px] text-zinc-400 font-semibold mb-4">@{selectedProfileUser.username}</span>

                {/* Status Message */}
                <p className="text-xs text-zinc-300 text-center font-medium max-w-full truncate px-2 py-1 bg-white/5 dark:bg-black/10 rounded-lg min-h-[26px]">
                  {selectedProfileUser.status_message || '상태 메시지가 없습니다.'}
                </p>
              </div>

              {/* Bottom Action Section */}
              <div className="relative z-10 p-6 border-t border-white/5 flex flex-col items-center justify-center space-y-3 bg-zinc-950/80 backdrop-blur-md">
                <button
                  onClick={() => handleStartChat(selectedProfileUser)}
                  className="w-full py-3 rounded-xl bg-kakao-yellow hover:bg-yellow-400 text-kakao-brown font-bold text-xs shadow-md transition-all flex items-center justify-center space-x-2"
                >
                  <MessageSquare size={14} fill="currentColor" />
                  <span>1:1 채팅하기</span>
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* MODAL: Edit My Profile */}
      <Dialog open={isMyProfileEditOpen} onOpenChange={setIsMyProfileEditOpen}>
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

          <form onSubmit={handleMyProfileEditSubmit} className="p-5 space-y-4 pt-2">
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
    </div>
  )
}
