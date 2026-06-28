

import { create } from 'zustand'

export interface User {
  id: number
  username: string
  nickname: string
  profile_image_url?: string
  status_message?: string
  created_at: string
}

export interface Friendship {
  friend_id: number
  status: string
  friend: User
}

export interface Message {
  id: number
  room_id: number
  sender_id: number
  sender: User
  content: string
  message_type: string
  created_at: string
}

export interface ChatRoom {
  id: number
  name?: string
  is_group: boolean
  created_at: string
  members: User[]
  latest_message?: Message
  unread_count: number
}

export interface ChatRoomMemberDetail {
  user_id: number
  user: User
  joined_at: string
  last_read_at: string
}

export interface ChatRoomDetail {
  id: number
  name?: string
  is_group: boolean
  created_at: string
  members: ChatRoomMemberDetail[]
  messages: Message[]
}

interface ChatStore {
  currentUser: User | null
  accessToken: string | null
  users: User[]
  friends: Friendship[]
  chatRooms: ChatRoom[]
  activeRoomId: number | null
  activeRoomDetail: ChatRoomDetail | null
  ws: WebSocket | null
  error: string | null
  isLoading: boolean

  // Auth actions
  login: (username: string, password: string) => Promise<boolean>
  register: (username: string, password: string, nickname: string) => Promise<boolean>
  logout: () => void

  // Users action
  fetchUsers: () => Promise<void>
  
  // Friends actions
  fetchFriends: () => Promise<void>
  addFriend: (username: string) => Promise<{ success: boolean; error?: string }>
  updateFriendStatus: (friendId: number, status: string) => Promise<void>
  updateMyProfile: (nickname: string, statusMessage: string, profileImageUrl?: string) => Promise<boolean>

  // Rooms and Messages actions
  fetchChatRooms: () => Promise<void>
  fetchRoomDetail: (roomId: number) => Promise<void>
  createChatRoom: (name: string | undefined, memberIds: number[]) => Promise<number | null>
  sendMessage: (roomId: number, content: string) => Promise<void>
  markAsRead: (roomId: number) => Promise<void>
  setActiveRoomId: (roomId: number | null) => void

  // WebSocket action
  setupWebSocket: () => void
}

const API_BASE = 'http://localhost:8080/api'
const WS_BASE = 'ws://localhost:8080/ws'

export const useChatStore = create<ChatStore>((set, get) => ({
  currentUser: null,
  accessToken: null,
  users: [],
  friends: [],
  chatRooms: [],
  activeRoomId: null,
  activeRoomDetail: null,
  ws: null,
  error: null,
  isLoading: false,

  login: async (username, password) => {
    set({ isLoading: true, error: null })
    // Proactively close and clear any old websocket connection
    const { ws } = get()
    if (ws) {
      try {
        ws.close()
      } catch (e) {
        console.error(e)
      }
      set({ ws: null })
    }
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData.detail || 'Login failed')
      }
      const data = await response.json()
      set({ 
        currentUser: data.user, 
        accessToken: data.access_token, 
        isLoading: false 
      })
      
      // Auto setup WebSocket & fetch rooms
      get().setupWebSocket()
      get().fetchChatRooms()
      get().fetchFriends()
      get().fetchUsers()
      
      return true
    } catch (err: any) {
      set({ error: err.message, isLoading: false })
      return false
    }
  },

  register: async (username, password, nickname) => {
    set({ isLoading: true, error: null })
    try {
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, nickname }),
      })
      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData.detail || 'Registration failed')
      }
      set({ isLoading: false })
      return true
    } catch (err: any) {
      set({ error: err.message, isLoading: false })
      return false
    }
  },

  logout: () => {
    const { ws } = get()
    if (ws) ws.close()
    set({ 
      currentUser: null, 
      accessToken: null, 
      chatRooms: [], 
      friends: [],
      users: [],
      activeRoomId: null, 
      activeRoomDetail: null, 
      ws: null 
    })
  },

  fetchUsers: async () => {
    const { accessToken } = get()
    if (!accessToken) return
    try {
      const response = await fetch(`${API_BASE}/users`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      })
      if (response.ok) {
        const users = await response.json()
        set({ users })
      }
    } catch (err) {
      console.error("Failed to fetch users", err)
    }
  },

  fetchFriends: async () => {
    const { accessToken } = get()
    if (!accessToken) return
    try {
      const response = await fetch(`${API_BASE}/friends`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      })
      if (response.ok) {
        const friends = await response.json()
        set({ friends })
      }
    } catch (err) {
      console.error("Failed to fetch friends", err)
    }
  },

  addFriend: async (username) => {
    const { accessToken } = get()
    if (!accessToken) return { success: false, error: '로그인이 필요합니다.' }
    try {
      const response = await fetch(`${API_BASE}/friends`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}` 
        },
        body: JSON.stringify({ friend_username: username }),
      })
      const data = await response.json()
      if (!response.ok) {
        return { success: false, error: data.detail || '친구 추가에 실패했습니다.' }
      }
      
      set((state) => ({
        friends: [...state.friends, data]
      }))
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message || '네트워크 오류가 발생했습니다.' }
    }
  },

  updateFriendStatus: async (friendId, status) => {
    const { accessToken, friends } = get()
    if (!accessToken) return
    try {
      const response = await fetch(`${API_BASE}/friends/${friendId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}` 
        },
        body: JSON.stringify({ status }),
      })
      if (response.ok) {
        const updatedFriendship = await response.json()
        set({
          friends: friends.map(f => f.friend_id === friendId ? updatedFriendship : f)
        })
      }
    } catch (err) {
      console.error("Failed to update friendship status", err)
    }
  },

  updateMyProfile: async (nickname, statusMessage, profileImageUrl) => {
    const { accessToken, currentUser } = get()
    if (!accessToken || !currentUser) return false
    try {
      const response = await fetch(`${API_BASE}/users/me`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}` 
        },
        body: JSON.stringify({ 
          nickname, 
          status_message: statusMessage,
          profile_image_url: profileImageUrl 
        }),
      })
      if (response.ok) {
        const updatedUser = await response.json()
        set({ currentUser: updatedUser })
        return true
      }
      return false
    } catch (err) {
      console.error("Failed to update profile", err)
      return false
    }
  },

  fetchChatRooms: async () => {
    const { accessToken } = get()
    if (!accessToken) return
    try {
      const response = await fetch(`${API_BASE}/rooms`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      })
      if (response.ok) {
        const rooms = await response.json()
        set({ chatRooms: rooms })
      }
    } catch (err) {
      console.error("Failed to fetch chat rooms", err)
    }
  },

  fetchRoomDetail: async (roomId) => {
    const { accessToken } = get()
    if (!accessToken) return
    try {
      const response = await fetch(`${API_BASE}/rooms/${roomId}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      })
      if (response.ok) {
        const detail = await response.json()
        set({ activeRoomDetail: detail })
        
        // Mark as read immediately when loading detail
        get().markAsRead(roomId)
      }
    } catch (err) {
      console.error(`Failed to fetch room detail for ID: ${roomId}`, err)
    }
  },

  createChatRoom: async (name, memberIds) => {
    const { accessToken } = get()
    if (!accessToken) return null
    try {
      const response = await fetch(`${API_BASE}/rooms`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}` 
        },
        body: JSON.stringify({ name, member_ids: memberIds }),
      })
      if (response.ok) {
        const room = await response.json()
        await get().fetchChatRooms() // refresh list
        return room.id
      }
      return null
    } catch (err) {
      console.error("Failed to create room", err)
      return null
    }
  },

  sendMessage: async (roomId, content) => {
    const { accessToken } = get()
    if (!accessToken) return
    try {
      await fetch(`${API_BASE}/rooms/${roomId}/messages`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}` 
        },
        body: JSON.stringify({ content }),
      })
      // The websocket will broadcast the message and trigger appends/updates.
    } catch (err) {
      console.error("Failed to send message", err)
    }
  },

  markAsRead: async (roomId) => {
    const { accessToken, chatRooms } = get()
    if (!accessToken) return
    try {
      await fetch(`${API_BASE}/rooms/${roomId}/read`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}` }
      })
      
      // Update local rooms unread count to 0
      set({
        chatRooms: chatRooms.map(r => r.id === roomId ? { ...r, unread_count: 0 } : r)
      })
    } catch (err) {
      console.error("Failed to mark room as read", err)
    }
  },

  setActiveRoomId: (roomId) => {
    set({ activeRoomId: roomId })
    if (roomId === null) {
      set({ activeRoomDetail: null })
    } else {
      get().fetchRoomDetail(roomId)
    }
  },

  setupWebSocket: () => {
    const { currentUser, ws } = get()
    if (!currentUser) return

    if (ws) {
      if (ws.url.endsWith(`/chat/${currentUser.id}`)) {
        return
      }
      try {
        ws.close()
      } catch (e) {
        console.error(e)
      }
    }

    const socket = new WebSocket(`${WS_BASE}/chat/${currentUser.id}`)

    socket.onopen = () => {
      console.log('Realtime WebSocket connection established.')
    }

    socket.onmessage = (event) => {
      const eventData = JSON.parse(event.data)
      const { event: eventType, room_id, data } = eventData

      if (eventType === 'new_message') {
        const msg = data as Message
        const { activeRoomId, activeRoomDetail, chatRooms } = get()

        // 1. If active room is this room, append message and mark read
        if (activeRoomId === room_id) {
          if (activeRoomDetail) {
            set({
              activeRoomDetail: {
                ...activeRoomDetail,
                messages: [...activeRoomDetail.messages, msg]
              }
            })
            // API call to mark as read
            get().markAsRead(room_id)
          }
        }

        // 2. Update chat room list with latest message and unread count
        set({
          chatRooms: chatRooms.map(room => {
            if (room.id === room_id) {
              const isCurrentActive = activeRoomId === room_id
              return {
                ...room,
                latest_message: msg,
                unread_count: isCurrentActive ? 0 : room.unread_count + 1
              }
            }
            return room;
          }).sort((a, b) => {
            const timeA = a.latest_message ? new Date(a.latest_message.created_at).getTime() : new Date(a.created_at).getTime()
            const timeB = b.latest_message ? new Date(b.latest_message.created_at).getTime() : new Date(b.created_at).getTime()
            return timeB - timeA
          })
        })
      } else if (eventType === 'room_created') {
        // Fetch rooms again to fetch complete payload
        get().fetchChatRooms()
      } else if (eventType === 'room_read') {
        // Clear unread counts for specific room
        if (eventData.user_id === currentUser.id) {
          set({
            chatRooms: get().chatRooms.map(r => r.id === room_id ? { ...r, unread_count: 0 } : r)
          })
        }
      }
    }

    socket.onclose = () => {
      console.log('Realtime WebSocket connection closed. Reconnecting...')
      set({ ws: null })
      // Reconnect after 3s if still logged in
      setTimeout(() => {
        if (get().currentUser) {
          get().setupWebSocket()
        }
      }, 3000)
    }

    set({ ws: socket })
  }
}))
