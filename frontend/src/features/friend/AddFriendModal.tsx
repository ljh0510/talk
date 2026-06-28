import { useState, useEffect, useRef } from 'react'
import { useChatStore } from '../../store/useChatStore'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../components/ui/Dialog'
import { ScrollArea } from '../../components/ui/ScrollArea'
import { UserPlus, Search, Check, Plus, Folder, Users, ChevronDown, ChevronRight, MapPin, Crown } from 'lucide-react'

interface AddFriendModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface DeptNode {
  id: string;
  name: string;
  path: string;
  children: DeptNode[];
}

export function AddFriendModal({ open, onOpenChange }: AddFriendModalProps) {
  const { users, friends, currentUser, addFriend } = useChatStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDept, setSelectedDept] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [expandedPaths, setExpandedPaths] = useState<string[]>([])
  
  // Resizing Panel States & Refs
  const [leftWidth, setLeftWidth] = useState(230)
  const [isResizing, setIsResizing] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) {
      // Expand all departments by default when the modal opens
      const allPaths: string[] = []
      departments.forEach((deptPath) => {
        const parts = deptPath.split('/')
        let currentPath = ''
        parts.forEach((part) => {
          currentPath = currentPath ? `${currentPath}/${part}` : part
          if (!allPaths.includes(currentPath)) {
            allPaths.push(currentPath)
          }
        })
      })
      setExpandedPaths(allPaths)
    } else {
      setSearchQuery('')
      setSelectedDept(null)
      setErrorMsg('')
      setExpandedPaths([])
      setLeftWidth(230) // reset panel width
    }
  }, [open, users])

  // Global mouse event listeners for panel resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const newWidth = e.clientX - rect.left
      // Lock left panel resizing between 160px and 340px to safeguard right panel spacing
      if (newWidth >= 160 && newWidth <= 340) {
        setLeftWidth(newWidth)
      }
    }

    const handleMouseUp = () => {
      if (isResizing) {
        setIsResizing(false)
      }
    }

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing])

  // Extract all unique departments
  const departments = Array.from(
    new Set(users.map((u) => u.department).filter(Boolean))
  ) as string[]

  // Build hierarchical department tree
  const buildDeptTree = (deptPaths: string[]): DeptNode[] => {
    const root: DeptNode[] = []
    
    deptPaths.forEach((deptPath) => {
      const parts = deptPath.split('/')
      let currentLevel = root
      let currentPath = ''
      
      parts.forEach((part) => {
        currentPath = currentPath ? `${currentPath}/${part}` : part
        let existingNode = currentLevel.find((n) => n.name === part)
        
        if (!existingNode) {
          existingNode = {
            id: currentPath,
            name: part,
            path: currentPath,
            children: []
          }
          currentLevel.push(existingNode)
        }
        currentLevel = existingNode.children
      })
    })
    
    const sortTree = (nodes: DeptNode[]) => {
      nodes.sort((a, b) => a.name.localeCompare(b.name))
      nodes.forEach((n) => sortTree(n.children))
    }
    sortTree(root)
    
    return root
  }

  const deptTree = buildDeptTree(departments)

  const toggleExpand = (path: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setExpandedPaths((prev) =>
      prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path]
    )
  }

  // Filter users based on selected department and search query
  const filteredUsers = users.filter((u) => {
    if (!currentUser || u.id === currentUser.id) return false

    // 1. Department hierarchy match
    if (selectedDept) {
      const uDept = u.department || ''
      const isExactMatch = uDept === selectedDept
      const isSubMatch = uDept.startsWith(selectedDept + '/')
      if (!isExactMatch && !isSubMatch) return false
    }

    // 2. Search query filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      const nameMatch = (u.nickname || u.username).toLowerCase().includes(query)
      const deptMatch = (u.department || '').toLowerCase().includes(query)
      const emailMatch = u.email.toLowerCase().includes(query)
      return nameMatch || deptMatch || emailMatch
    }

    return true
  })

  const handleAddFriend = async (email: string) => {
    setErrorMsg('')
    const res = await addFriend(email)
    if (!res.success) {
      setErrorMsg(res.error || '친구 추가에 실패했습니다.')
    }
  }

  // Recursive Tree Node Renderer
  const renderDeptNode = (node: DeptNode, depth: number = 0) => {
    const isExpanded = expandedPaths.includes(node.path)
    const isActive = selectedDept === node.path
    const hasChildren = node.children.length > 0
    
    const getDeptColleagueCount = (n: DeptNode): number => {
      const exactCount = users.filter(u => u.department === n.path && currentUser && u.id !== currentUser.id).length
      const childrenCount = n.children.reduce((acc, child) => acc + getDeptColleagueCount(child), 0)
      return exactCount + childrenCount
    }
    
    const colleagueCount = getDeptColleagueCount(node)

    return (
      <div key={node.id} className="space-y-0.5">
        <div
          onClick={() => setSelectedDept(node.path)}
          style={{ paddingLeft: `${depth * 14 + 6}px` }}
          className={`group flex items-center justify-between py-1.5 pr-2 rounded-lg text-xs font-semibold transition-all cursor-pointer select-none ${
            isActive
              ? 'bg-primary-accent text-primary-accent-text shadow-sm font-bold'
              : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-900'
          }`}
        >
          <div className="flex items-center space-x-1.5 min-w-0">
            <div className="w-5 h-5 flex items-center justify-center shrink-0">
              {hasChildren ? (
                <button
                  onClick={(e) => toggleExpand(node.path, e)}
                  className="p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors text-slate-400 dark:text-zinc-500 flex items-center justify-center"
                >
                  {isExpanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                </button>
              ) : null}
            </div>
            
            <Folder size={13} className={isActive ? 'text-primary-accent-text' : 'text-slate-400'} />
            <span className="truncate">{node.name}</span>
          </div>

          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${isActive ? 'bg-black/10 text-primary-accent-text' : 'bg-slate-200 dark:bg-zinc-800 text-slate-500'}`}>
            {colleagueCount}
          </span>
        </div>

        {hasChildren && isExpanded && (
          <div className="space-y-0.5">
            {node.children.map((child) => renderDeptNode(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[580px] flex flex-col p-0 gap-0 overflow-hidden select-none bg-white dark:bg-zinc-900">
        
        {/* Header - Fixed Height */}
        <DialogHeader className="p-5 border-b border-slate-100 dark:border-zinc-800 shrink-0">
          <DialogTitle className="text-sm font-extrabold text-slate-800 dark:text-zinc-100 flex items-center space-x-1.5">
            <UserPlus size={18} className="text-slate-500" />
            <span>조직도 친구 추가</span>
          </DialogTitle>
          <DialogDescription className="text-[11px] text-slate-400 mt-1">
            사내 조직도 트리에서 부서를 선택하고 임직원을 확인하여 편리하게 친구를 추가하세요.
          </DialogDescription>
        </DialogHeader>

        {errorMsg && (
          <div className="mx-5 mt-3 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-xs font-semibold border border-red-250 dark:border-red-900/40 shrink-0">
            {errorMsg}
          </div>
        )}

        {/* 2-Column Main Content Container with Resizing ref and mouse-select block */}
        <div
          ref={containerRef}
          className={`flex-1 min-h-0 flex bg-slate-50/50 dark:bg-zinc-950/20 relative ${
            isResizing ? 'select-none cursor-col-resize' : ''
          }`}
        >
          
          {/* Left Column: Search & Department Tree (Width bound dynamically to state) */}
          <div
            style={{ width: `${leftWidth}px` }}
            className="border-r border-slate-100 dark:border-zinc-800 p-4 flex flex-col min-h-0 shrink-0 bg-white dark:bg-zinc-900 relative transition-none"
          >
            <ScrollArea className="flex-1 min-h-0">
              <div className="space-y-1.5 pr-1 pb-4">
                {/* 1. All Employees Button */}
                <button
                  onClick={() => setSelectedDept(null)}
                  className={`w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-left text-xs font-bold transition-all cursor-pointer ${
                    selectedDept === null
                      ? 'bg-primary-accent text-primary-accent-text shadow-sm'
                      : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-900'
                  }`}
                >
                  <Users size={13} className={selectedDept === null ? 'text-primary-accent-text' : 'text-slate-400'} />
                  <span className="truncate flex-1">전체 임직원</span>
                  <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${selectedDept === null ? 'bg-black/10 text-primary-accent-text' : 'bg-slate-200 dark:bg-zinc-800 text-slate-500'}`}>
                    {users.filter(u => currentUser && u.id !== currentUser.id).length}
                  </span>
                </button>

                {/* 2. Hierarchical Departments Root nodes */}
                <div className="space-y-0.5">
                  {deptTree.map((node) => renderDeptNode(node, 0))}
                </div>
              </div>
            </ScrollArea>
          </div>

          {/* Interactive Draggable Resizer Bar Handle */}
          <div
            onMouseDown={() => setIsResizing(true)}
            className={`absolute top-0 bottom-0 w-[4px] -ml-[2px] z-50 cursor-col-resize transition-colors hover:bg-kakao-yellow/80 active:bg-kakao-yellow ${
              isResizing ? 'bg-kakao-yellow' : 'bg-transparent'
            }`}
            style={{ left: `${leftWidth}px` }}
            title="마우스로 드래그하여 패널 너비 조절"
          />

          {/* Right Column: Breadcrumb & List - Properly Contained */}
          <div className="flex-1 p-4 flex flex-col min-h-0">
            {/* Active Department Location Breadcrumb */}
            <div className="flex items-center space-x-1.5 text-[10px] text-slate-500 dark:text-zinc-400 font-bold mb-2 bg-slate-100 dark:bg-zinc-900/50 px-3 py-1.5 rounded-lg shrink-0">
              <MapPin size={11} className="text-slate-400 flex-shrink-0" />
              <span className="truncate">
                {selectedDept ? selectedDept.replace(/\//g, ' > ') : '전체 임직원'}
              </span>
            </div>

            {/* Search Input Box (Relocated to the Right side) */}
            <div className="relative flex items-center mb-3 shrink-0">
              <Search className="absolute left-3 text-slate-400" size={13} />
              <input
                type="text"
                placeholder="사원 이름, 직급, 부서 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8.5 pr-3 py-1.5 text-[10px] rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-kakao-yellow transition-all"
              />
            </div>

            {/* List Results with flex-1 and min-h-0 to lock scroll boundaries */}
            <ScrollArea className="flex-1 min-h-0">
              <div className="space-y-2 pr-2 pb-4">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((u) => {
                    const isFriend = friends.some((f) => f.friend.id === u.id)
                    const isLeader = selectedDept 
                      ? (u.department === selectedDept && u.id === u.department_manager_id)
                      : (u.id === u.department_manager_id)
                    
                    return (
                      <div
                        key={u.id}
                        className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-zinc-900 bg-white dark:bg-zinc-900 shadow-sm hover:shadow hover:border-slate-200 dark:hover:border-zinc-800 transition-all duration-200"
                      >
                        <div className="flex items-center space-x-3 min-w-0">
                          {u.profile_image_url ? (
                            <img
                              src={u.profile_image_url}
                              alt={u.nickname || u.username}
                              className="w-9 h-9 rounded-xl object-cover border border-slate-100/80 dark:border-zinc-800 shadow-sm"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-zinc-800 flex items-center justify-center text-slate-500 dark:text-zinc-400 text-xs font-bold border border-slate-200 dark:border-zinc-700">
                              {(u.nickname || u.username).substring(0, 2)}
                            </div>
                          )}
                          <div className="min-w-0 text-left">
                            <div className="flex items-center">
                              <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-200 truncate">
                                {u.nickname || u.username}
                              </h4>
                              {isLeader && (
                                <span className="inline-flex items-center space-x-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-extrabold bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-100/70 dark:border-amber-900/30 ml-1.5 flex-shrink-0 select-none">
                                  <Crown size={7} className="fill-current text-amber-500" />
                                  <span>팀장</span>
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-400 font-semibold truncate mt-0.5">
                              {u.department ? `${u.department.replace(/\//g, ' · ')} · ` : ''}
                              {u.position || '임직원'}
                            </p>
                          </div>
                        </div>

                        {/* Button with whitespace-nowrap and min-w to prevent text breaking */}
                        <div className="flex-shrink-0 ml-3">
                          {isFriend ? (
                            <span className="inline-flex items-center justify-center space-x-1 min-w-[56px] px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-zinc-900 text-slate-400 dark:text-zinc-500 text-[9px] font-bold border border-slate-100 dark:border-zinc-800/60 whitespace-nowrap">
                              <Check size={10} strokeWidth={3} />
                              <span>친구</span>
                            </span>
                          ) : (
                            <button
                              onClick={() => handleAddFriend(u.email)}
                              className="inline-flex items-center justify-center space-x-1 min-w-[56px] px-2.5 py-1.5 rounded-lg bg-kakao-yellow hover:bg-yellow-400 text-kakao-brown text-[9px] font-extrabold shadow-sm transition-all cursor-pointer hover:scale-[1.03] active:scale-[0.97] whitespace-nowrap"
                            >
                              <Plus size={10} strokeWidth={3} />
                              <span>추가</span>
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="py-16 text-center text-xs text-slate-400 italic">
                    선택한 부서 내에 조건과 일치하는 사원이 없습니다.
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

        </div>

        {/* Footer - Fixed Height */}
        <div className="p-4 border-t border-slate-100 dark:border-zinc-800 flex justify-end shrink-0 bg-white dark:bg-zinc-900">
          <button
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 text-xs font-bold text-slate-700 dark:text-zinc-350 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 rounded-xl transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
          >
            닫기
          </button>
        </div>

      </DialogContent>
    </Dialog>
  )
}
