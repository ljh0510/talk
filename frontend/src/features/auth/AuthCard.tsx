import { useState } from 'react'
import { useChatStore } from '../../store/useChatStore'
import { MessageSquare, Sun, Moon } from 'lucide-react'

interface AuthCardProps {
  darkMode: boolean
  setDarkMode: (dark: boolean) => void
}

export function AuthCard({ darkMode, setDarkMode }: AuthCardProps) {
  const { login, register, isLoading, error } = useChatStore()

  const [isRegisterMode, setIsRegisterMode] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [authSuccessMsg, setAuthSuccessMsg] = useState('')

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    useChatStore.setState({ error: null })
    setAuthSuccessMsg('')

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
