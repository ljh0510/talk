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
