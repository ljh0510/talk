/* eslint-disable react-hooks/set-state-in-effect */
import React, { useEffect, useState } from 'react'
import { useChatStore } from '../../store/useChatStore'
import { Sun, Moon, Bell, BellOff, Lock, Palette, HelpCircle, CheckCircle, Info } from 'lucide-react'

type SubTabType = 'general' | 'style' | 'security'

interface SettingsDetailProps {
  activeSubTab: SubTabType
  darkMode: boolean
  setDarkMode: (dark: boolean) => void
}

export function SettingsDetail({ activeSubTab, darkMode, setDarkMode }: SettingsDetailProps) {
  const { currentUser } = useChatStore()

  // General configurations
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    return localStorage.getItem('notificationsEnabled') !== 'false'
  })

  // Style configurations
  const [accentColor, setAccentColor] = useState(() => {
    return localStorage.getItem('accentColor') || 'yellow'
  })

  // Security configurations
  const [currentPinInput, setCurrentPinInput] = useState('')
  const [newPinInput, setNewPinInput] = useState('')
  const [confirmNewPinInput, setConfirmNewPinInput] = useState('')
  const [pinChangeMessage, setPinChangeMessage] = useState({ text: '', isError: false })
  const [autoLockMinutes, setAutoLockMinutes] = useState(() => {
    return localStorage.getItem('autoLockMinutes') || 'off'
  })

  // Toast Alert states
  const [toastText, setToastText] = useState('')
  const [toastOpen, setToastOpen] = useState(false)

  const triggerToast = (msg: string) => {
    setToastText(msg)
    setToastOpen(true)
  }

  // Auto-hide toast after 2.5 seconds
  useEffect(() => {
    if (!toastOpen) return
    const timer = setTimeout(() => {
      setToastOpen(false)
    }, 2500)
    return () => clearTimeout(timer)
  }, [toastOpen])

  useEffect(() => {
    setNotificationsEnabled(localStorage.getItem('notificationsEnabled') !== 'false')
    setAccentColor(localStorage.getItem('accentColor') || 'yellow')
    setAutoLockMinutes(localStorage.getItem('autoLockMinutes') || 'off')
    setCurrentPinInput('')
    setNewPinInput('')
    setConfirmNewPinInput('')
    setPinChangeMessage({ text: '', isError: false })
  }, [activeSubTab])

  const handleToggleNotifications = () => {
    const newVal = !notificationsEnabled
    setNotificationsEnabled(newVal)
    localStorage.setItem('notificationsEnabled', String(newVal))
    triggerToast(newVal ? '데스크톱 푸시 알림이 활성화되었습니다.' : '데스크톱 푸시 알림이 비활성화되었습니다.')
  }

  const handleDarkModeToggle = () => {
    const nextMode = !darkMode
    setDarkMode(nextMode)
    triggerToast(nextMode ? '다크 모드가 적용되었습니다.' : '라이트 모드가 적용되었습니다.')
  }

  const handleAccentColorChange = (color: string) => {
    setAccentColor(color)
    localStorage.setItem('accentColor', color)
    
    const root = document.documentElement
    if (color === 'yellow') {
      root.style.setProperty('--primary-accent', '#fee500')
    } else if (color === 'blue') {
      root.style.setProperty('--primary-accent', '#1d4ed8')
    } else if (color === 'emerald') {
      root.style.setProperty('--primary-accent', '#059669')
    } else if (color === 'purple') {
      root.style.setProperty('--primary-accent', '#7c3aed')
    }

    const colorLabels: Record<string, string> = {
      yellow: '카카오 옐로우',
      blue: '클래식 블루',
      emerald: '에메랄드 그린',
      purple: '딥 퍼플'
    }
    triggerToast(`브랜드 컬러가 ${colorLabels[color] || color}로 변경되었습니다.`)
  }

  const handlePinChangeSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPinChangeMessage({ text: '', isError: false })

    const activePin = localStorage.getItem('lockPin') || '0000'

    if (currentPinInput !== activePin) {
      setPinChangeMessage({ text: '현재 비밀번호가 일치하지 않습니다.', isError: true })
      triggerToast('비밀번호 변경 실패: 현재 비밀번호 불일치')
      return
    }

    if (newPinInput.length !== 4 || !/^\d+$/.test(newPinInput)) {
      setPinChangeMessage({ text: '새 비밀번호는 숫자 4자리여야 합니다.', isError: true })
      triggerToast('비밀번호 변경 실패: 유효하지 않은 형식')
      return
    }

    if (newPinInput !== confirmNewPinInput) {
      setPinChangeMessage({ text: '새 비밀번호 확인이 일치하지 않습니다.', isError: true })
      triggerToast('비밀번호 변경 실패: 새 비밀번호 확인 불일치')
      return
    }

    localStorage.setItem('lockPin', newPinInput)
    setPinChangeMessage({ text: '잠금 비밀번호가 성공적으로 변경되었습니다.', isError: false })
    triggerToast('잠금 비밀번호가 안전하게 변경되었습니다.')
    setCurrentPinInput('')
    setNewPinInput('')
    setConfirmNewPinInput('')
  }

  if (!currentUser) return null

  return (
    <div className="flex-1 bg-slate-50 dark:bg-zinc-955 flex flex-col h-full select-none overflow-y-auto relative">
      
      {/* Flat Content Layout Container */}
      <div className="max-w-xl w-full mx-auto p-8 space-y-6">

        {/* 1. GENERAL TAB PAGE */}
        {activeSubTab === 'general' && (
          <div className="space-y-6">
            {/* Minimal Header */}
            <div className="border-b border-slate-200 dark:border-zinc-800 pb-3 flex items-center space-x-2">
              <Info size={16} className="text-slate-500" />
              <h2 className="text-xs font-extrabold text-slate-800 dark:text-zinc-200">일반 및 계정 설정</h2>
            </div>

            {/* Account Information Details */}
            <div className="p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200/50 dark:border-zinc-800/80 flex items-center space-x-4">
              <div className="w-12 h-12 rounded-2xl overflow-hidden bg-slate-400 dark:bg-zinc-850 flex items-center justify-center text-white text-sm font-bold shadow shrink-0">
                {currentUser.profile_image_url ? (
                  <img src={currentUser.profile_image_url} alt={currentUser.nickname} className="w-full h-full object-cover" />
                ) : (
                  currentUser.nickname[0]
                )}
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-slate-800 dark:text-zinc-200">{currentUser.nickname}</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">계정 아이디: @{currentUser.username}</p>
                <p className="text-[9px] text-slate-400 mt-0.5">상태 메시지: {currentUser.status_message || '사용 중'}</p>
              </div>
            </div>

            {/* Desktop Notification Switch */}
            <div className="flex items-center justify-between p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200/50 dark:border-zinc-800/80 shadow-sm">
              <div className="flex items-center space-x-3">
                {notificationsEnabled ? (
                  <Bell size={18} className="text-slate-600 dark:text-zinc-300" />
                ) : (
                  <BellOff size={18} className="text-red-500" />
                )}
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-700 dark:text-zinc-200">데스크톱 알림</span>
                  <span className="text-[9px] text-slate-400 mt-0.5">실시간 메시지 수신 시 알림 허용</span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleToggleNotifications}
                className={`w-11 h-6 rounded-full p-0.5 transition-colors focus:outline-none shrink-0 ${
                  notificationsEnabled ? 'bg-kakao-yellow' : 'bg-slate-200 dark:bg-zinc-800'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                    notificationsEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        )}

        {/* 2. STYLE TAB PAGE */}
        {activeSubTab === 'style' && (
          <div className="space-y-6">
            {/* Minimal Header */}
            <div className="border-b border-slate-200 dark:border-zinc-800 pb-3 flex items-center space-x-2">
              <Palette size={16} className="text-slate-500" />
              <h2 className="text-xs font-extrabold text-slate-800 dark:text-zinc-200">스타일 및 테마 설정</h2>
            </div>

            {/* Theme Switch Row */}
            <div className="flex items-center justify-between p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200/50 dark:border-zinc-800/80 shadow-sm">
              <div className="flex items-center space-x-3">
                {darkMode ? <Moon size={18} className="text-yellow-400" /> : <Sun size={18} className="text-orange-500" />}
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-700 dark:text-zinc-200">다크 모드</span>
                  <span className="text-[9px] text-slate-400 mt-0.5">화면 색상을 어두운 모드로 변경</span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleDarkModeToggle}
                className={`w-11 h-6 rounded-full p-0.5 transition-colors focus:outline-none shrink-0 ${
                  darkMode ? 'bg-yellow-500' : 'bg-slate-200 dark:bg-zinc-800'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                    darkMode ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Accent Color picker */}
            <div className="p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200/50 dark:border-zinc-800/80 shadow-sm space-y-4">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-700 dark:text-zinc-200">액센트 브랜드 컬러</span>
                <span className="text-[9px] text-slate-400 mt-0.5">인터페이스의 하이라이트 포인트 색상을 지정합니다.</span>
              </div>
              
              <div className="flex space-x-3.5 justify-start pt-1">
                {[
                  { name: 'yellow', hex: '#fee500', title: '카카오' },
                  { name: 'blue', hex: '#1d4ed8', title: '블루' },
                  { name: 'emerald', hex: '#059669', title: '그린' },
                  { name: 'purple', hex: '#7c3aed', title: '퍼플' },
                ].map(colorOpt => (
                  <button
                    key={colorOpt.name}
                    onClick={() => handleAccentColorChange(colorOpt.name)}
                    className={`w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center text-[9px] font-bold text-white shadow-md ${
                      accentColor === colorOpt.name
                        ? 'border-slate-800 dark:border-white scale-110'
                        : 'border-transparent opacity-85 hover:scale-105'
                    }`}
                    style={{ backgroundColor: colorOpt.hex }}
                    title={colorOpt.title}
                  >
                    {accentColor === colorOpt.name ? '✓' : ''}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 3. SECURITY TAB PAGE */}
        {activeSubTab === 'security' && (
          <div className="space-y-6">
            {/* Minimal Header */}
            <div className="border-b border-slate-200 dark:border-zinc-800 pb-3 flex items-center space-x-2">
              <Lock size={16} className="text-slate-500" />
              <h2 className="text-xs font-extrabold text-slate-800 dark:text-zinc-200">화면 잠금 및 보안 설정</h2>
            </div>

            <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-slate-200/50 dark:border-zinc-800/80 shadow-sm space-y-5">
              {/* Auto-Lock Settings Row */}
              <div className="flex flex-col space-y-2 border-b border-slate-100 dark:border-zinc-850 pb-4">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-700 dark:text-zinc-200">자동 잠금 대기 시간</span>
                  <span className="text-[9px] text-slate-400 mt-0.5">사용자 미활동 감지 시 자동으로 잠금 모드 활성화</span>
                </div>
                <select
                  value={autoLockMinutes}
                  onChange={(e) => {
                    const val = e.target.value
                    setAutoLockMinutes(val)
                    localStorage.setItem('autoLockMinutes', val)
                    const label = val === 'off' ? '사용 안 함' : `${val}분`
                    triggerToast(`자동 잠금 대기시간이 ${label}으로 변경되었습니다.`)
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-955 text-slate-750 dark:text-zinc-300 text-xs focus:outline-none focus:ring-1 focus:ring-slate-400 dark:focus:ring-zinc-700"
                >
                  <option value="off">사용 안 함</option>
                  <option value="1">1분</option>
                  <option value="5">5분</option>
                  <option value="10">10분</option>
                  <option value="30">30분</option>
                </select>
              </div>

              <div className="flex items-center space-x-2 text-[10px] text-amber-600 dark:text-amber-500 font-bold bg-amber-50 dark:bg-amber-955/20 p-2.5 rounded-lg border border-amber-200/50 dark:border-amber-900/40">
                <HelpCircle size={13} />
                <span>잠금 화면을 실행하기 위한 4자리 숫자 비밀번호를 설정하십시오.</span>
              </div>

              <form onSubmit={handlePinChangeSubmit} className="space-y-4">
                {pinChangeMessage.text && (
                  <div className={`p-3 rounded-xl text-xs font-bold border shadow-sm ${
                    pinChangeMessage.isError
                      ? 'bg-red-50 dark:bg-red-955 text-red-600 dark:text-red-400 border-red-200/55 dark:border-red-900/50'
                      : 'bg-emerald-50 dark:bg-emerald-955 text-emerald-600 dark:text-emerald-400 border-emerald-200/55 dark:border-emerald-900/50'
                  }`}>
                    {pinChangeMessage.text}
                  </div>
                )}
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">현재 비밀번호</label>
                    <input
                      type="password"
                      maxLength={4}
                      required
                      placeholder="기본: 0000"
                      value={currentPinInput}
                      onChange={(e) => setCurrentPinInput(e.target.value.replace(/\D/g, ''))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-100 text-xs focus:outline-none focus:ring-1 focus:ring-slate-400 dark:focus:ring-zinc-700"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">새 비밀번호</label>
                      <input
                        type="password"
                        maxLength={4}
                        required
                        placeholder="숫자 4자리"
                        value={newPinInput}
                        onChange={(e) => setNewPinInput(e.target.value.replace(/\D/g, ''))}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-100 text-xs focus:outline-none focus:ring-1 focus:ring-slate-400 dark:focus:ring-zinc-700"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">비밀번호 확인</label>
                      <input
                        type="password"
                        maxLength={4}
                        required
                        placeholder="한번 더 입력"
                        value={confirmNewPinInput}
                        onChange={(e) => setConfirmNewPinInput(e.target.value.replace(/\D/g, ''))}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-100 text-xs focus:outline-none focus:ring-1 focus:ring-slate-400 dark:focus:ring-zinc-700"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white dark:bg-zinc-800 dark:hover:bg-zinc-750 font-bold text-xs shadow flex items-center justify-center space-x-1.5 transition-colors border border-transparent"
                  >
                    <CheckCircle size={13} />
                    <span>비밀번호 변경</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>

      {/* Floating In-App Toast Alert Feedback */}
      {toastOpen && (
        <div className="fixed bottom-6 right-6 bg-slate-900/90 dark:bg-zinc-900/95 backdrop-blur text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-2xl border border-slate-700/50 dark:border-zinc-800/80 flex items-center space-x-2 animate-bounce-in z-50">
          <CheckCircle size={14} className="text-kakao-yellow dark:text-yellow-400" />
          <span>{toastText}</span>
        </div>
      )}
    </div>
  )
}
