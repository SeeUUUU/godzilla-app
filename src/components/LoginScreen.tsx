import React, { useState } from 'react';
import { AlertTriangle, ShieldCheck } from 'lucide-react';
import { signInWithGoogle, signOutUser, isEmailAllowed } from '../firebase';
import type { User } from 'firebase/auth';

interface LoginScreenProps {
  onLoginSuccess: (user: User) => void;
  allowedEmails: string[];
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess, allowedEmails }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const user = await signInWithGoogle();
      if (!isEmailAllowed(user.email)) {
        await signOutUser();
        setErrorMessage("접속이 허용되지 않은 구글 계정입니다.");
        return;
      }
      onLoginSuccess(user);
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      console.error('[Google Login Error]:', error);
      if (error?.code === 'auth/popup-closed-by-user') {
        setErrorMessage('로그인 창이 닫혔습니다. 다시 시도해 주세요.');
      } else if (error?.code === 'auth/unauthorized-domain') {
        setErrorMessage('Firebase 콘솔의 [Authentication > Settings > 승인된 도메인]에 현재 도메인(localhost)을 추가해야 합니다.');
      } else {
        setErrorMessage(error?.message || '구글 로그인 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950 flex flex-col items-center justify-center p-4 select-none">
      {/* 배경 장식 발광 효과 */}
      <div className="absolute w-72 h-72 sm:w-96 sm:h-96 rounded-full bg-cyan-600/10 blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-20 w-80 h-80 rounded-full bg-blue-600/10 blur-[120px] pointer-events-none" />

      <div className="relative w-full max-w-sm sm:max-w-md bg-slate-900/90 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl flex flex-col items-center text-center">
        {/* 고질라 아바타 아이콘 */}
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-700 p-0.5 shadow-lg shadow-cyan-500/30 mb-4 animate-bounce">
          <div className="w-full h-full rounded-2xl bg-slate-950/40 flex items-center justify-center text-4xl">
            🦖
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/40 text-cyan-300 text-xs font-black mb-3">
          <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
          <span>보안 보호 모드 가동 중</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-teal-200 to-blue-400 mb-2">
          고질라 단어 배틀
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mb-6 leading-relaxed">
          지정된 허용 구글 계정으로 로그인하여<br />
          출석부, 괴수 도감, 학습 기록을 안전하게 보호하세요!
        </p>

        {/* 에러 메시지 알림 박스 */}
        {errorMessage && (
          <div className="w-full mb-5 p-3 rounded-xl bg-rose-950/70 border border-rose-500/60 text-rose-300 text-xs text-left flex items-start gap-2.5 animate-shake">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed break-all">{errorMessage}</div>
          </div>
        )}

        {/* 구글 로그인 버튼 */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="w-full py-3.5 px-4 rounded-xl bg-white hover:bg-slate-100 active:scale-98 text-slate-800 font-black text-sm sm:text-base transition-all cursor-pointer shadow-lg shadow-white/10 flex items-center justify-center gap-3 border border-slate-200 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-slate-400 border-t-slate-800 rounded-full animate-spin" />
          ) : (
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          )}
          <span>{isLoading ? '구글 인증 확인 중...' : 'Google 계정으로 로그인'}</span>
        </button>

        {/* 허용 계정 안내 */}
        <div className="mt-5 text-[11px] text-slate-500">
          {allowedEmails.length > 0 ? (
            <span>
              🔒 사전 등록된 관리자/학생 구글 계정({allowedEmails.length}개)만 접근 가능합니다.
            </span>
          ) : (
            <span>💡 구글 계정으로 로그인하여 클라우드 동기화를 시작하세요.</span>
          )}
        </div>
      </div>
    </div>
  );
};
