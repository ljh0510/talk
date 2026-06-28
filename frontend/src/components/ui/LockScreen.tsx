import { useState, useEffect } from 'react'
import { useChatStore } from '../../store/useChatStore'
import { ShieldAlert, Unlock, Lock, Key, RefreshCw } from 'lucide-react'

interface LockScreenProps {
  onUnlock: () => void
}

export function LockScreen({ onUnlock }: LockScreenProps) {
  const { currentUser } = useChatStore()
  
  const [passcode, setPasscode] = useState<string>('')
  const [error, setError] = useState<boolean>(false)
  
  // Hardening states
  const [failedAttempts, setFailedAttempts] = useState<number>(0)
  const [lockoutSeconds, setLockoutSeconds] = useState<number>(0)
  
  // Recovery states
  const [isRecoveryMode, setIsRecoveryMode] = useState<boolean>(false)
  const [accountPassword, setAccountPassword] = useState<string>('')
  const [recoveryError, setRecoveryError] = useState<string>('')
  const [isRecovering, setIsRecovering] = useState<boolean>(false)

  const DEFAULT_PIN = localStorage.getItem('lockPin') || '0000'

  // Lockout Timer countdown
  useEffect(() => {
    if (lockoutSeconds <= 0) return
    
    const timer = setInterval(() => {
      setLockoutSeconds(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    
    return () => clearInterval(timer)
  }, [lockoutSeconds])

  const handleKeyPress = (num: string) => {
    if (lockoutSeconds > 0) return
    setError(false)
    if (passcode.length >= 4) return
    
    const newPasscode = passcode + num
    setPasscode(newPasscode)

    if (newPasscode.length === 4) {
      if (newPasscode === DEFAULT_PIN) {
        setFailedAttempts(0)
        setTimeout(() => {
          onUnlock()
        }, 150)
      } else {
        const nextAttempts = failedAttempts + 1
        setFailedAttempts(nextAttempts)
        
        setTimeout(() => {
          setError(true)
          setPasscode('')
          
          if (nextAttempts >= 5) {
            setLockoutSeconds(30)
            setFailedAttempts(0)
          }
        }, 200)
      }
    }
  }

  const handleClear = () => {
    if (lockoutSeconds > 0) return
    setPasscode('')
    setError(false)
  }

  const handleBackspace = () => {
    if (lockoutSeconds > 0) return
    setPasscode(prev => prev.slice(0, -1))
    setError(false)
  }

  const handleRecoverySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser || isRecovering) return
    setRecoveryError('')
    setIsRecovering(true)

    try {
      const response = await fetch('http://localhost:8080/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: currentUser.username, 
          password: accountPassword 
        }),
      })

      if (response.ok) {
        // Recovery success: Reset pin to 0000 and unlock
        localStorage.setItem('lockPin', '0000')
        setFailedAttempts(0)
        setLockoutSeconds(0)
        setIsRecoveryMode(false)
        setAccountPassword('')
        onUnlock()
      } else {
        setRecoveryError('계정 비밀번호가 올바르지 않습니다.')
      }
    } catch {
      setRecoveryError('네트워크 오류가 발생했습니다.')
    } finally {
      setIsRecovering(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/98 dark:bg-zinc-950/98 backdrop-blur-md flex flex-col items-center justify-center z-[9999] select-none scale-in-center">
      <div className="w-full max-w-xs flex flex-col items-center text-center space-y-6">
        
        {/* Shield Icon / Status Indicator */}
        <div className={`p-5 rounded-3xl bg-slate-800 dark:bg-zinc-900 border border-slate-700/50 dark:border-zinc-800/80 shadow-md ${error ? 'animate-shake' : ''}`}>
          {isRecoveryMode ? (
            <Key size={36} className="text-amber-500" />
          ) : (
            <ShieldAlert size={36} className={error || lockoutSeconds > 0 ? 'text-red-500' : 'text-kakao-yellow dark:text-yellow-400'} />
          )}
        </div>

        {/* Lock Info */}
        {!isRecoveryMode ? (
          <>
            <div>
              <h2 className="text-md font-extrabold text-white">KokoaTalk 잠금모드</h2>
              <p className="text-[10px] text-slate-400 mt-1 whitespace-pre-line leading-relaxed">
                {lockoutSeconds > 0 ? (
                  <span className="text-red-500 font-extrabold animate-pulse">
                    보안 정책에 따라 입력이 제한됩니다.{"\n"}({lockoutSeconds}초 대기)
                  </span>
                ) : error ? (
                  <span className="text-red-500 font-semibold">비밀번호가 올바르지 않습니다. (실패: {failedAttempts}/5)</span>
                ) : (
                  `보안을 위해 비밀번호 4자리를 입력하세요. ${DEFAULT_PIN === '0000' ? '(초기: 0000)' : ''}`
                )}
              </p>
            </div>

            {/* Indicator dots */}
            <div className="flex space-x-4 py-2">
              {[0, 1, 2, 3].map(index => {
                const filled = passcode.length > index
                return (
                  <div
                    key={index}
                    className={`w-3.5 h-3.5 rounded-full border transition-all duration-150 ${
                      filled
                        ? 'bg-kakao-yellow dark:bg-yellow-400 border-kakao-yellow dark:border-yellow-400 scale-110 shadow'
                        : 'border-slate-600 dark:border-zinc-850 bg-transparent'
                    }`}
                  />
                )
              })}
            </div>

            {/* PinPad */}
            <div className="grid grid-cols-3 gap-3 w-full max-w-[240px] pt-2">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
                <button
                  key={num}
                  disabled={lockoutSeconds > 0}
                  onClick={() => handleKeyPress(num)}
                  className="w-16 h-16 rounded-full bg-slate-800 hover:bg-slate-700 active:bg-slate-600 disabled:opacity-30 disabled:hover:bg-slate-800 text-white font-extrabold text-base transition-colors flex items-center justify-center shadow-sm"
                >
                  {num}
                </button>
              ))}
              
              <button
                disabled={lockoutSeconds > 0}
                onClick={handleBackspace}
                className="w-16 h-16 rounded-full text-slate-400 hover:text-white disabled:opacity-30 font-bold text-xs transition-colors flex items-center justify-center"
              >
                지우기
              </button>
              
              <button
                disabled={lockoutSeconds > 0}
                onClick={() => handleKeyPress('0')}
                className="w-16 h-16 rounded-full bg-slate-800 hover:bg-slate-700 active:bg-slate-600 disabled:opacity-30 disabled:hover:bg-slate-800 text-white font-extrabold text-base transition-colors flex items-center justify-center shadow-sm"
              >
                0
              </button>

              <button
                disabled={lockoutSeconds > 0}
                onClick={handleClear}
                className="w-16 h-16 rounded-full text-slate-400 hover:text-white disabled:opacity-30 font-bold text-xs transition-colors flex items-center justify-center"
              >
                재입력
              </button>
            </div>

            {/* Recovery switch link */}
            <button
              onClick={() => {
                setRecoveryError('')
                setIsRecoveryMode(true)
              }}
              className="text-[10px] text-slate-500 dark:text-zinc-500 hover:text-slate-350 hover:underline transition-colors mt-2"
            >
              잠금 비밀번호를 분실하셨나요?
            </button>
          </>
        ) : (
          /* RECOVERY FORM */
          <form onSubmit={handleRecoverySubmit} className="w-full space-y-4 pt-2">
            <div>
              <h2 className="text-md font-extrabold text-white">잠금 해제 본인 인증</h2>
              <p className="text-[10px] text-slate-400 mt-1">
                KokoaTalk 로그인 시 사용하는 계정 비밀번호를 입력하십시오. 인증 완료 시 잠금이 해제되고 PIN이 0000으로 리셋됩니다.
              </p>
            </div>

            {recoveryError && (
              <div className="p-2.5 rounded-lg bg-red-950/30 text-red-400 border border-red-900/50 text-[10px] font-bold">
                ⚠️ {recoveryError}
              </div>
            )}

            <div className="space-y-1.5 text-left">
              <label className="block text-[9px] font-bold text-slate-500 uppercase">계정 아이디 (Username)</label>
              <input
                type="text"
                disabled
                value={currentUser?.username || ''}
                className="w-full px-3 py-2 rounded-xl bg-slate-850 border border-slate-700 text-slate-400 text-xs focus:outline-none"
              />
            </div>

            <div className="space-y-1.5 text-left">
              <label className="block text-[9px] font-bold text-slate-400 uppercase">계정 비밀번호 (Password)</label>
              <input
                type="password"
                required
                placeholder="비밀번호를 입력하세요"
                value={accountPassword}
                onChange={(e) => setAccountPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:ring-1 focus:ring-kakao-yellow"
              />
            </div>

            <div className="flex space-x-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsRecoveryMode(false)
                  setAccountPassword('')
                }}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors"
              >
                돌아가기
              </button>
              <button
                type="submit"
                disabled={isRecovering}
                className="flex-1 py-2.5 rounded-xl bg-kakao-yellow hover:bg-yellow-400 text-kakao-brown font-bold text-xs shadow flex items-center justify-center space-x-1.5 transition-colors disabled:opacity-50"
              >
                {isRecovering ? (
                  <RefreshCw size={12} className="animate-spin" />
                ) : (
                  <>
                    <Unlock size={12} />
                    <span>본인 인증</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Footer info */}
        <div className="flex items-center space-x-1.5 text-[10px] text-slate-500 font-medium pt-4 select-none">
          <Lock size={11} />
          <span>보안이 유지되는 엔터프라이즈 모드</span>
        </div>

      </div>
    </div>
  )
}
