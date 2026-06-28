export interface PositionInfo {
  name: string
  code: string
  sort_order: number
}

export interface DutyInfo {
  name: string
  code: string
  sort_order: number
}

export interface DepartmentInfo {
  id: number
  name: string
  code: string
  sort_order: number
  manager_id?: number
  position?: PositionInfo
  duty?: DutyInfo
}

export interface WorkspaceMembership {
  workspace_id: number
  workspace_name: string
  workspace_code: string
  workspace_domain?: string
  workspace_logo?: string
  zioyou_company_code?: string
  member_type: string
  status: string
  nickname: string
  profile_image_url?: string
  status_message?: string
  is_representative: boolean
  department?: DepartmentInfo
}

export interface User {
  id: number
  username: string
  email: string
  created_at: string
  memberships: WorkspaceMembership[]
  active_membership?: WorkspaceMembership
  
  // Flat proxy properties parsed at client level for backward compatibility
  nickname: string // Made required to guarantee compatibility across UI components
  profile_image_url?: string
  status_message?: string
  workspace?: string
  workspace_code?: string
  workspace_domain?: string
  workspace_logo?: string
  zioyou_company_code?: string
  member_type?: string
  member_status?: string
  department?: string
  department_code?: string
  department_sort_order?: number
  department_manager_id?: number
  position?: string
  position_code?: string
  position_sort_order?: number
  duty?: string
  duty_code?: string
  duty_sort_order?: number
}

export interface Friendship {
  friend_id: number
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
