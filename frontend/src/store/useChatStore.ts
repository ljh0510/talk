/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from 'zustand'
import type { User, MemberRelation, Message, ChatRoom, ChatRoomDetail } from '../types'

const API_BASE = 'http://localhost:8080/api'
const WS_BASE = 'ws://localhost:8080/ws'

// Client-side adapter to normalize backend nested models into a backward-compatible flat object structure
export function normalizeUser(user: any): User {
  if (!user) return user
  const active = user.active_membership
  return {
    ...user,
    nickname: active?.nickname || user.username,
    profile_image_url: active?.profile_image_url || undefined,
    status_message: active?.status_message || undefined,
    phone_number: active?.phone_number || undefined,
    office_phone: active?.office_phone || undefined,
    birthday: active?.birthday || undefined,
    birthday_type: active?.birthday_type || undefined,
    workspace: active?.workspace_name || undefined,
    workspace_code: active?.workspace_code || undefined,
    workspace_domain: active?.workspace_domain || undefined,
    workspace_logo: active?.workspace_logo || undefined,
    zioyou_company_code: active?.zioyou_company_code || undefined,
    member_type: active?.member_type || undefined,
    member_status: active?.status || undefined,
    department: active?.department?.name || undefined,
    department_code: active?.department?.code || undefined,
    department_sort_order: active?.department?.sort_order || undefined,
    department_manager_id: active?.department?.manager_id || undefined,
    position: active?.department?.position?.name || undefined,
    position_code: active?.department?.position?.code || undefined,
    position_sort_order: active?.department?.position?.sort_order || undefined,
    duty: active?.department?.duty?.name || undefined,
    duty_code: active?.department?.duty?.code || undefined,
    duty_sort_order: active?.department?.duty?.sort_order || undefined,
  }
}

export function normalizeMemberRelation(f: any): MemberRelation {
  if (!f) return f
  return {
    ...f,
    member: normalizeUser(f.member)
  }
}

interface ChatStore {
  currentUser: User | null
  accessToken: string | null
  activeWorkspaceId: number | null
  users: User[]
  friends: any // Deprecated, keep for safety during compilation or replace if not needed. But we renamed to members:
  members: MemberRelation[]
  chatRooms: ChatRoom[]
  activeRoomId: number | null
  activeRoomDetail: ChatRoomDetail | null
  ws: WebSocket | null
  error: string | null
  isLoading: boolean

  // Auth actions
  login: (email: string, password: string) => Promise<boolean>
  register: (username: string, email: string, password: string, nickname: string) => Promise<boolean>
  logout: () => void
  switchWorkspace: (workspaceId: number) => Promise<void>

  // Users action
  fetchUsers: () => Promise<void>
  
  // Friends actions
  fetchMembers: () => Promise<void>
  addMemberRelation: (email: string) => Promise<{ success: boolean; error?: string }>
  updateMyProfile: (nickname: string, statusMessage: string, profileImageUrl?: string, phoneNumber?: string, officePhone?: string, birthday?: string, birthdayType?: 'SOLAR' | 'LUNAR') => Promise<boolean>

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

export const useChatStore = create<ChatStore>((set, get) => ({
  currentUser: (() => {
    const user = localStorage.getItem('currentUser')
    try {
      return user ? normalizeUser(JSON.parse(user)) : null
    } catch {
      return null
    }
  })(),
  accessToken: localStorage.getItem('accessToken'),
  activeWorkspaceId: (() => {
    const wsId = localStorage.getItem('activeWorkspaceId')
    if (wsId) return Number(wsId)
    const user = localStorage.getItem('currentUser')
    try {
      return user ? (JSON.parse(user).active_membership?.workspace_id || null) : null
    } catch {
      return null
    }
  })(),
  users: [],
  friends: [], // Deprecated
  members: [],
  chatRooms: [],
  activeRoomId: null,
  activeRoomDetail: null,
  ws: null,
  error: null,
  isLoading: false,

  login: async (email, password) => {
    set({ isLoading: true, error: null })
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
        body: JSON.stringify({ email, password }),
      })
      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData.detail || 'Login failed')
      }
      const data = await response.json()
      const memberships = data.user.memberships || []
      
      let wsIdToSet: number | null = null
      
      if (memberships.length === 1) {
        wsIdToSet = memberships[0].workspace_id
      } else if (memberships.length > 1) {
        // If multiple workspaces, check if there is a previously saved selection
        const savedWsId = localStorage.getItem('activeWorkspaceId')
        if (savedWsId) {
          const parsed = Number(savedWsId)
          if (memberships.some((m: any) => m.workspace_id === parsed)) {
            wsIdToSet = parsed
          }
        }
        // If no valid saved selection, wsIdToSet remains null to trigger selection page
      }
      
      localStorage.setItem('accessToken', data.access_token)
      localStorage.setItem('currentUser', JSON.stringify(data.user)) // store raw
      
      if (wsIdToSet) {
        localStorage.setItem('activeWorkspaceId', String(wsIdToSet))
        // If workspace is active, set representative active_membership profile locally
        const targetMember = data.user.memberships?.find((m: any) => m.workspace_id === wsIdToSet)
        if (targetMember) {
          data.user.active_membership = targetMember
        }
      } else {
        localStorage.removeItem('activeWorkspaceId')
      }

      set({ 
        currentUser: normalizeUser(data.user), 
        accessToken: data.access_token,
        activeWorkspaceId: wsIdToSet,
        isLoading: false 
      })
      
      if (wsIdToSet) {
        get().setupWebSocket()
        get().fetchChatRooms()
        get().fetchMembers()
        get().fetchUsers()
      }
      
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed'
      set({ error: errorMessage, isLoading: false })
      return false
    }
  },

  register: async (username, email, password, nickname) => {
    set({ isLoading: true, error: null })
    try {
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password, nickname }),
      })
      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData.detail || 'Registration failed')
      }
      set({ isLoading: false })
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed'
      set({ error: errorMessage, isLoading: false })
      return false
    }
  },

  logout: () => {
    const { ws } = get()
    if (ws) {
      try {
        ws.close()
      } catch (e) {
        console.error(e)
      }
    }
    localStorage.removeItem('accessToken')
    localStorage.removeItem('currentUser')
    localStorage.removeItem('activeWorkspaceId')
    set({ 
      currentUser: null, 
      accessToken: null, 
      activeWorkspaceId: null,
      chatRooms: [], 
      friends: [], // Deprecated
      members: [],
      users: [],
      activeRoomId: null, 
      activeRoomDetail: null, 
      ws: null 
    })
  },

  switchWorkspace: async (workspaceId) => {
    const { currentUser } = get()
    if (!currentUser) return
    
    // Update local state and storage
    localStorage.setItem('activeWorkspaceId', String(workspaceId))
    
    // Find membership details to normalize current representative fields locally
    const rawUserStr = localStorage.getItem('currentUser')
    if (rawUserStr) {
      try {
        const rawUser = JSON.parse(rawUserStr)
        const targetMember = rawUser.memberships?.find((m: any) => m.workspace_id === workspaceId)
        if (targetMember) {
          rawUser.active_membership = targetMember
          set({ currentUser: normalizeUser(rawUser) })
        }
      } catch (e) {
        console.error(e)
      }
    }

    set({ 
      activeWorkspaceId: workspaceId,
      activeRoomId: null,
      activeRoomDetail: null,
      chatRooms: [],
      friends: [], // Deprecated
      members: [],
      users: []
    })

    // Reload workspace-isolated resources
    await Promise.all([
      get().fetchMembers(),
      get().fetchChatRooms(),
      get().fetchUsers()
    ])
  },

  fetchUsers: async () => {
    const { accessToken, activeWorkspaceId } = get()
    if (!accessToken) return
    try {
      const response = await fetch(`${API_BASE}/users`, {
        headers: { 
          'Authorization': `Bearer ${accessToken}`,
          'X-Workspace-ID': activeWorkspaceId ? String(activeWorkspaceId) : ''
        }
      })
      if (response.ok) {
        const users = await response.json()
        set({ users: users.map(normalizeUser) })
      }
    } catch (err) {
      console.error("Failed to fetch users", err)
    }
  },

  fetchMembers: async () => {
    const { accessToken, activeWorkspaceId } = get()
    if (!accessToken) return
    try {
      const response = await fetch(`${API_BASE}/members`, {
        headers: { 
          'Authorization': `Bearer ${accessToken}`,
          'X-Workspace-ID': activeWorkspaceId ? String(activeWorkspaceId) : ''
        }
      })
      if (response.ok) {
        const members = await response.json()
        set({ members: members.map(normalizeMemberRelation) })
      }
    } catch (err) {
      console.error("Failed to fetch members", err)
    }
  },

  addMemberRelation: async (email) => {
    const { accessToken, activeWorkspaceId } = get()
    if (!accessToken) return { success: false, error: '로그인이 필요합니다.' }
    try {
      const response = await fetch(`${API_BASE}/members`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'X-Workspace-ID': activeWorkspaceId ? String(activeWorkspaceId) : ''
        },
        body: JSON.stringify({ member_email: email }),
      })
      const data = await response.json()
      if (!response.ok) {
        return { success: false, error: data.detail || '멤버 추가에 실패했습니다.' }
      }
      
      const normalizedData = normalizeMemberRelation(data)
      set((state) => ({
        members: [...state.members, normalizedData]
      }))
      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '네트워크 오류가 발생했습니다.'
      return { success: false, error: errorMessage }
    }
  },

  updateMyProfile: async (nickname, statusMessage, profileImageUrl, phoneNumber, officePhone, birthday, birthdayType) => {
    const { accessToken, currentUser, activeWorkspaceId } = get()
    if (!accessToken || !currentUser) return false
    try {
      const response = await fetch(`${API_BASE}/users/me`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'X-Workspace-ID': activeWorkspaceId ? String(activeWorkspaceId) : ''
        },
        body: JSON.stringify({ 
          nickname, 
          status_message: statusMessage,
          profile_image_url: profileImageUrl,
          phone_number: phoneNumber,
          office_phone: officePhone,
          birthday,
          birthday_type: birthdayType
        }),
      })
      if (response.ok) {
        const updatedUser = await response.json()
        localStorage.setItem('currentUser', JSON.stringify(updatedUser)) // store raw
        set({ currentUser: normalizeUser(updatedUser) })
        return true
      }
      return false
    } catch (err) {
      console.error("Failed to update profile", err)
      return false
    }
  },

  fetchChatRooms: async () => {
    const { accessToken, activeWorkspaceId } = get()
    if (!accessToken) return
    try {
      const response = await fetch(`${API_BASE}/rooms`, {
        headers: { 
          'Authorization': `Bearer ${accessToken}`,
          'X-Workspace-ID': activeWorkspaceId ? String(activeWorkspaceId) : ''
        }
      })
      if (response.ok) {
        const rooms = await response.json()
        const normalizedRooms = rooms.map((room: any) => ({
          ...room,
          members: room.members.map(normalizeUser),
          latest_message: room.latest_message ? {
            ...room.latest_message,
            sender: normalizeUser(room.latest_message.sender)
          } : undefined
        }))
        set({ chatRooms: normalizedRooms })
      }
    } catch (err) {
      console.error("Failed to fetch chat rooms", err)
    }
  },

  fetchRoomDetail: async (roomId) => {
    const { accessToken, activeWorkspaceId } = get()
    if (!accessToken) return
    try {
      const response = await fetch(`${API_BASE}/rooms/${roomId}`, {
        headers: { 
          'Authorization': `Bearer ${accessToken}`,
          'X-Workspace-ID': activeWorkspaceId ? String(activeWorkspaceId) : ''
        }
      })
      if (response.ok) {
        const detail = await response.json()
        const normalizedDetail: ChatRoomDetail = {
          ...detail,
          members: detail.members.map((m: any) => ({
            ...m,
            user: normalizeUser(m.user)
          })),
          messages: detail.messages.map((msg: any) => ({
            ...msg,
            sender: normalizeUser(msg.sender)
          }))
        }
        set({ activeRoomDetail: normalizedDetail })
        get().markAsRead(roomId)
      }
    } catch (err) {
      console.error(`Failed to fetch room detail for ID: ${roomId}`, err)
    }
  },

  createChatRoom: async (name, memberIds) => {
    const { accessToken, activeWorkspaceId } = get()
    if (!accessToken) return null
    try {
      const response = await fetch(`${API_BASE}/rooms`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'X-Workspace-ID': activeWorkspaceId ? String(activeWorkspaceId) : ''
        },
        body: JSON.stringify({ name, member_ids: memberIds }),
      })
      if (response.ok) {
        const room = await response.json()
        await get().fetchChatRooms()
        return room.id
      }
      return null
    } catch (err) {
      console.error("Failed to create room", err)
      return null
    }
  },

  sendMessage: async (roomId, content) => {
    const { accessToken, activeWorkspaceId } = get()
    if (!accessToken) return
    try {
      await fetch(`${API_BASE}/rooms/${roomId}/messages`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'X-Workspace-ID': activeWorkspaceId ? String(activeWorkspaceId) : ''
        },
        body: JSON.stringify({ content }),
      })
    } catch (err) {
      console.error("Failed to send message", err)
    }
  },

  markAsRead: async (roomId) => {
    const { accessToken, chatRooms, activeWorkspaceId } = get()
    if (!accessToken) return
    try {
      await fetch(`${API_BASE}/rooms/${roomId}/read`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${accessToken}`,
          'X-Workspace-ID': activeWorkspaceId ? String(activeWorkspaceId) : ''
        }
      })
      
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
        const msg = {
          ...data,
          sender: normalizeUser(data.sender)
        } as Message
        const { activeRoomId, activeRoomDetail, chatRooms } = get()

        if (activeRoomId === room_id) {
          if (activeRoomDetail) {
            set({
              activeRoomDetail: {
                ...activeRoomDetail,
                messages: [...activeRoomDetail.messages, msg]
              }
            })
            get().markAsRead(room_id)
          }
        }

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
            return room
          }).sort((a, b) => {
            const timeA = a.latest_message ? new Date(a.latest_message.created_at).getTime() : new Date(a.created_at).getTime()
            const timeB = b.latest_message ? new Date(b.latest_message.created_at).getTime() : new Date(b.created_at).getTime()
            return timeB - timeA
          })
        })
      } else if (eventType === 'room_created') {
        get().fetchChatRooms()
      } else if (eventType === 'room_read') {
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
      setTimeout(() => {
        if (get().currentUser) {
          get().setupWebSocket()
        }
      }, 3000)
    }

    set({ ws: socket })
  }
}))
