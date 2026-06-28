/**
 * Formats an ISO string to a Korean local time string (e.g., "오전 10:20").
 */
export const formatTime = (isoString: string): string => {
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

/**
 * Formats an ISO string for a chat room list item.
 * If the date is today, shows HH:MM. Otherwise, shows MM월 DD일.
 */
export const formatRoomTime = (isoString?: string): string => {
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
