import React from 'react';
import { Download, X, Share2, PlusSquare, Smartphone, CheckCircle, Sparkles, Tablet } from 'lucide-react';

interface InstallAppBannerProps {
  onInstall: () => void;
  onDismiss: () => void;
  isIOS: boolean;
  isStandalone: boolean;
  isDismissed: boolean;
}

export const InstallAppBanner: React.FC<InstallAppBannerProps> = ({
  onInstall,
  onDismiss,
  isStandalone,
  isDismissed,
}) => {
  // 이미 독립 앱(홈화면 설치 상태)이거나 이번 세션에서 닫았으면 배너 숨김
  if (isStandalone || isDismissed) {
    return null;
  }

  return (
    <div
      className="fixed left-3 right-3 sm:left-auto sm:right-4 z-50 sm:max-w-md animate-bounce-subtle"
      style={{
        bottom: 'max(12px, env(safe-area-inset-bottom, 12px))',
      }}
    >
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-2 border-cyan-500/60 shadow-2xl shadow-cyan-900/40 p-3.5 sm:p-4 text-white backdrop-blur-xl">
        {/* 장식용 네온 백그라운드 발광 */}
        <div className="absolute -top-10 -right-10 w-28 h-28 bg-cyan-500/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-28 h-28 bg-purple-500/20 rounded-full blur-2xl pointer-events-none" />

        {/* 닫기 버튼 */}
        <button
          onClick={onDismiss}
          className="absolute top-2.5 right-2.5 p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors z-10"
          aria-label="닫기"
        >
          <X size={18} />
        </button>

        <div className="flex items-start gap-3">
          {/* 앱 아이콘 */}
          <div className="relative shrink-0">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden border-2 border-cyan-400 shadow-md shadow-cyan-500/30 bg-slate-950 flex items-center justify-center">
              <img
                src="/icons/icon-192.png"
                alt="Godzilla Quest 앱 아이콘"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/images/godzilla.png';
                }}
              />
            </div>
            <span className="absolute -bottom-1 -right-1 bg-gradient-to-r from-cyan-500 to-blue-500 text-[10px] font-black px-1.5 py-0.2 rounded-full border border-slate-900 shadow">
              APP
            </span>
          </div>

          {/* 문구 및 설치 버튼 */}
          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h4 className="font-black text-sm sm:text-base text-cyan-300 flex items-center gap-1">
                <Sparkles size={15} className="text-yellow-400 shrink-0" />
                Godzilla Quest 앱 다운로드
              </h4>
            </div>
            <p className="text-xs text-slate-300 mt-0.5 leading-snug">
              태블릿·스마트폰 홈 화면에 아이콘을 추가하여 <strong>브라우저 주소창 없는 전체 화면</strong>으로 실행하세요!
            </p>

            <div className="mt-2.5 flex items-center gap-2">
              <button
                onClick={onInstall}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-cyan-500/30 active:scale-95 transition-transform"
              >
                <Download size={15} />
                어플 다운로드 (홈 화면 추가)
              </button>
              <button
                onClick={onDismiss}
                className="px-2.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-400 hover:text-slate-200 text-xs font-semibold transition-colors"
              >
                다음에
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface InstallGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  isIOS: boolean;
  onTriggerNativePrompt?: () => void;
}

export const InstallGuideModal: React.FC<InstallGuideModalProps> = ({
  isOpen,
  onClose,
  isIOS,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-cyan-500/60 rounded-3xl p-5 sm:p-6 text-white shadow-2xl shadow-cyan-950/80 overflow-hidden">
        {/* 배경 네온 글로우 */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors z-10"
        >
          <X size={20} />
        </button>

        {/* 헤더 */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-cyan-400 shadow-md shadow-cyan-500/30 bg-slate-900 shrink-0">
            <img
              src="/icons/icon-192.png"
              alt="Godzilla Quest 앱 아이콘"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = '/images/godzilla.png';
              }}
            />
          </div>
          <div>
            <div className="flex items-center gap-1 text-cyan-400 text-xs font-bold">
              <Smartphone size={14} />
              <Tablet size={14} />
              <span>태블릿 & 스마트폰 앱 설치</span>
            </div>
            <h3 className="text-lg font-black text-white">홈 화면에 Godzilla Quest 설치</h3>
          </div>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-3.5 mb-4 text-xs sm:text-sm text-slate-200 leading-relaxed">
          💡 설치 후 홈 화면의 <strong>Godzilla Quest 앱 아이콘</strong>을 누르면 브라우저의 <strong>주소창과 툴바가 사라진 깔끔한 전체 화면</strong>으로 실행됩니다!
        </div>

        {/* iOS vs 안드로이드/일반 가이드 */}
        {isIOS ? (
          <div className="space-y-3 my-4">
            <h4 className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
              <span>🍎 iPad / iPhone (Safari) 설치 방법</span>
            </h4>

            <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-900/90 border border-slate-800">
              <div className="w-8 h-8 rounded-xl bg-blue-600/30 border border-blue-500/50 flex items-center justify-center shrink-0 text-blue-400 font-black">
                1
              </div>
              <div className="text-xs sm:text-sm text-slate-300">
                Safari 하단(아이패드는 상단)의 <br />
                <strong className="text-cyan-300 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-800">
                  <Share2 size={13} /> [공유] 버튼
                </strong>
                을 누릅니다.
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-900/90 border border-slate-800">
              <div className="w-8 h-8 rounded-xl bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center shrink-0 text-indigo-400 font-black">
                2
              </div>
              <div className="text-xs sm:text-sm text-slate-300">
                메뉴 목록을 아래로 스크롤하여 <br />
                <strong className="text-indigo-300 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-indigo-950/80 border border-indigo-800">
                  <PlusSquare size={13} /> [홈 화면에 추가]
                </strong>
                를 선택합니다.
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-900/90 border border-slate-800">
              <div className="w-8 h-8 rounded-xl bg-emerald-600/30 border border-emerald-500/50 flex items-center justify-center shrink-0 text-emerald-400 font-black">
                3
              </div>
              <div className="text-xs sm:text-sm text-slate-300">
                우측 상단의 <strong className="text-emerald-300 font-bold">[추가]</strong>를 누르면 바탕화면에 Godzilla Quest 앱 아이콘이 생성됩니다!
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3 my-4">
            <h4 className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
              <span>🤖 Android (Chrome/삼성 인터넷) / 태블릿 설치</span>
            </h4>

            <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-900/90 border border-slate-800">
              <div className="w-8 h-8 rounded-xl bg-blue-600/30 border border-blue-500/50 flex items-center justify-center shrink-0 text-blue-400 font-black">
                1
              </div>
              <div className="text-xs sm:text-sm text-slate-300">
                브라우저 우측 상단(또는 하단)의 <strong>[메뉴(⋮)]</strong>를 누릅니다.
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-900/90 border border-slate-800">
              <div className="w-8 h-8 rounded-xl bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center shrink-0 text-indigo-400 font-black">
                2
              </div>
              <div className="text-xs sm:text-sm text-slate-300">
                메뉴에서 <strong className="text-cyan-300">[홈 화면에 추가]</strong> 또는 <strong className="text-cyan-300">[앱 설치]</strong>를 누릅니다.
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-900/90 border border-slate-800">
              <div className="w-8 h-8 rounded-xl bg-emerald-600/30 border border-emerald-500/50 flex items-center justify-center shrink-0 text-emerald-400 font-black">
                3
              </div>
              <div className="text-xs sm:text-sm text-slate-300">
                홈 화면에 추가된 Godzilla Quest 아이콘을 실행하면 전체 화면 앱으로 작동합니다!
              </div>
            </div>
          </div>
        )}

        <div className="mt-5">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-extrabold text-sm shadow-lg shadow-cyan-600/30 flex items-center justify-center gap-2 active:scale-98 transition-transform"
          >
            <CheckCircle size={18} />
            확인했습니다
          </button>
        </div>
      </div>
    </div>
  );
};
