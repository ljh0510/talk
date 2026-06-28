import { useState } from 'react'
import { ShieldAlert, Unlock } from 'lucide-react'

interface LockScreenProps {
  onUnlock: () => void
}

export function LockScreen({ onUnlock }: LockScreenProps) {
  const [passcode, setPasscode] = useState<string>('')
  const [error, setError] = useState<boolean>(false)

  const DEFAULT_PIN = '0000'

  const handleKeyPress = (num: string) => {
    setError(false)
    if (passcode.length >= 4) return
    const newPasscode = passcode + num
    setPasscode(newPasscode)

    if (newPasscode.length === 4) {
      if (newPasscode === DEFAULT_PIN) {
        // Unlock success
        setTimeout(() => {
          onUnlock()
        }, 150)
      } else {
        // Unlock failure
        setTimeout(() => {
          setError(true)
          setPasscode('')
        }, 200)
      }
    }
  }

  const handleClear = () => {
    setPasscode('')
    setError(false)
  }

  const handleBackspace = () => {
    setPasscode(prev => prev.slice(0, -1))
    setError(false)
  }

  return (
    <div className="fixed inset-0 bg-slate-900/98 dark:bg-zinc-950/98 backdrop-blur-md flex flex-col items-center justify-center z-[9999] select-none scale-in-center">
      <div className="w-full max-w-xs flex flex-col items-center text-center space-y-6">
        
        {/* Shield Icon / Lock Status Indicator */}
        <div className={`p-5 rounded-3xl bg-slate-800 dark:bg-zinc-900 border border-slate-700/50 dark:border-zinc-800/80 shadow-md ${error ? 'animate-shake' : ''}`}>
          <ShieldAlert size={36} className={error ? 'text-red-500' : 'text-kakao-yellow dark:text-yellow-400'} />
        </div>

        <div>
          <h2 className="text-md font-extrabold text-white">KokoaTalk 잠금모드</h2>
          <p className="text-[10px] text-slate-400 mt-1">
            {error ? (
              <span className="text-red-500 font-semibold">비밀번호가 올바르지 않습니다.</span>
            ) : (
              '보안을 위해 비밀번호 4자리를 입력하세요. (초기: 0000)'
            )}
          </p>
        </div>

        {/* Passcode indicator dots */}
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

        {/* PinPad grid layout */}
        <div className="grid grid-cols-3 gap-3 w-full max-w-[240px] pt-4">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
            <button
              key={num}
              onClick={() => handleKeyPress(num)}
              className="w-16 h-16 rounded-full bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-white font-extrabold text-base transition-colors flex items-center justify-center shadow-sm"
            >
              {num}
            </button>
          ))}
          
          {/* Backspace Button */}
          <button
            onClick={handleBackspace}
            className="w-16 h-16 rounded-full text-slate-400 hover:text-white font-bold text-xs transition-colors flex items-center justify-center"
          >
            지우기
          </button>
          
          {/* Number 0 Button */}
          <button
            onClick={() => handleKeyPress('0')}
            className="w-16 h-16 rounded-full bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-white font-extrabold text-base transition-colors flex items-center justify-center shadow-sm"
          >
            0
          </button>

          {/* Reset / Cancel Button */}
          <button
            onClick={handleClear}
            className="w-16 h-16 rounded-full text-slate-400 hover:text-white font-bold text-xs transition-colors flex items-center justify-center"
          >
            재입력
          </button>
        </div>
        
        {/* Bottom unlock tips */}
        <div className="flex items-center space-x-1.5 text-[10px] text-slate-500 font-medium pt-4">
          <Unlock size={11} />
          <span>보안이 유지되는 엔터프라이즈 모드</span>
        </div>

      </div>
    </div>
  )
}
