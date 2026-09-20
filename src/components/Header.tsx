import React from 'react';
import { Settings, Zap, Award, BookOpen, LogOut, Mic, MicOff } from 'lucide-react';
import { getGodzillaEvolution } from '../types';

interface HeaderProps {
  level: number;
  exp: number; // 0 ~ 99
  streak?: number;
  wrongCount?: number;
  isReviewMode?: boolean;
  stageLabel?: string;
  onOpenParentModal: () => void;
  onOpenReviewModal: () => void;
  onOpenMonsterBook: () => void;
  onOpenAttendanceModal?: () => void;
  onOpenCouponModal?: () => void;
  unusedCouponCount?: number;
  attendanceStreak?: number;
  isTodayAttended?: boolean;
  unlockedMonsterCount?: number;
  totalMonsterCount?: number;
  onExitReviewMode?: () => void;
  isVoiceAttackEnabled?: boolean;
  onToggleVoiceAttack?: () => void;
  eggCount?: number;
  onOpenGacha?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  level,
  exp,
  streak = 0,
  wrongCount = 0,
  isReviewMode = false,
  stageLabel,
  onOpenParentModal,
  onOpenReviewModal,
  onOpenMonsterBook,
  onOpenAttendanceModal,
  onOpenCouponModal,
  unusedCouponCount = 0,
  attendanceStreak = 0,
  isTodayAttended = false,
  unlockedMonsterCount = 0,
  totalMonsterCount = 10,
  onExitReviewMode,
  isVoiceAttackEnabled = true,
  onToggleVoiceAttack,
  eggCount = 0,
  onOpenGacha,
}) => {
  const expProgress = Math.min(100, Math.max(0, exp));
  const evo = getGodzillaEvolution(level);

  const renderStatusSection = (isMobile: boolean) => (
    <div className={`flex items-center ${isMobile ? 'gap-1' : 'gap-1.5 sm:gap-2'} flex-shrink-0`}>
      {/* LV. & EXP 컴팩트 게이지 */}
      <div className={`flex items-center gap-1.5 sm:gap-2 bg-slate-900/90 border border-cyan-500/40 rounded-lg sm:rounded-xl ${isMobile ? 'px-1.5 py-0.5' : 'px-2 md:px-2.5 py-0.5 sm:py-1'} shadow-sm whitespace-nowrap`}>
        <div className="flex items-center gap-0.5 sm:gap-1 text-cyan-300 font-black text-[10px] sm:text-xs">
          <Award className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-amber-400" />
          <span>LV.{level}</span>
        </div>

        <div className={`flex flex-col ${isMobile ? 'w-12 xs:w-16' : 'w-16 sm:w-20 md:w-22'}`}>
          <div className="flex justify-between text-[7px] xs:text-[8px] sm:text-[9px] text-slate-400 font-bold mb-0.5 leading-none">
            <span className="flex items-center gap-0.5 text-cyan-400">
              <Zap className="w-1.5 h-1.5 sm:w-2 sm:h-2 fill-cyan-400 text-cyan-400" /> EXP
            </span>
            <span>{expProgress}%</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1 sm:h-1.5 overflow-hidden border border-slate-700">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 to-amber-400 rounded-full transition-all duration-300"
              style={{ width: `${expProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* 장착 괴수 스킨 배지 */}
      <div
        title={`${evo.name} (${evo.beamName})`}
        className={`${isMobile ? 'hidden xs:flex' : 'flex'} items-center gap-1 px-1.5 sm:px-2 md:px-2.5 py-0.5 sm:py-1 rounded-lg sm:rounded-xl text-white font-black text-[10px] sm:text-xs whitespace-nowrap select-none shadow-sm cursor-default`}
        style={{
          background: evo.badgeBg,
          border: `1.5px solid ${evo.themeColor}`,
          boxShadow: `0 0 10px ${evo.themeColor}55`,
        }}
      >
        <span className="text-xs sm:text-sm leading-none">{evo.icon}</span>
        <span className="truncate max-w-[65px] sm:max-w-none">{evo.shortName}</span>
      </div>
    </div>
  );

  return (
    <header className="w-full flex-none bg-slate-950/85 border-b border-slate-800/80 backdrop-blur-md px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 z-40 shadow-sm">
      <div className="w-full max-w-5xl lg:max-w-6xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-1.5 md:gap-3">
        {/* ─── [모바일 1행 / 데스크톱 좌측]: 로고 + 타이틀 + 배지 (모바일은 우측에 LV+EXP) ─── */}
        <div className="w-full md:w-auto flex items-center justify-between md:justify-start gap-1.5 sm:gap-2.5 min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
            <div
              className="w-7 h-7 xs:w-8 xs:h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 select-none shadow-md"
              style={{
                background: 'linear-gradient(135deg, #06b6d4 0%, #2563eb 100%)',
                border: '1.5px solid rgba(165, 243, 252, 0.8)',
                boxShadow: '0 0 10px rgba(6, 182, 212, 0.4)',
              }}
            >
              <span className="text-base xs:text-lg sm:text-xl md:text-2xl leading-none">🦖</span>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-wrap">
              <h1 className="text-xs xs:text-sm sm:text-base md:text-lg lg:text-xl font-black tracking-tight text-amber-300 drop-shadow-sm whitespace-nowrap">
                고질라 언어 모험
              </h1>

              {/* 현재 스테이지 / 모드 배지 */}
              {stageLabel && (
                <span
                  className={`inline-flex items-center text-[9px] sm:text-[11px] font-black px-1.5 sm:px-2 py-0.5 rounded-full whitespace-nowrap shadow-sm border ${
                    isReviewMode
                      ? 'bg-amber-900/40 text-amber-300 border-amber-500/60'
                      : 'bg-cyan-950/60 text-cyan-300 border-cyan-500/50'
                  }`}
                >
                  {stageLabel}
                </span>
              )}

              {/* 연속 정답 스트릭 배지 */}
              {streak > 1 && (
                <span className="inline-flex items-center gap-0.5 text-[9px] sm:text-[10px] font-black px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40 whitespace-nowrap shadow-sm">
                  🔥 {streak}연승
                </span>
              )}
            </div>
          </div>

          {/* 모바일 1행 우측: LV + EXP + 스킨 (화면 폭 < 768px일 때만 표시) */}
          <div className="flex md:hidden items-center flex-shrink-0">
            {renderStatusSection(true)}
          </div>
        </div>

        {/* ─── [모바일 2행 / 데스크톱 우측 전체 한 줄]: 컨트롤 및 기능 버튼 영역 ─── */}
        <div className="w-full md:w-auto flex items-center justify-start md:justify-end gap-1 sm:gap-1.5 md:gap-2 flex-wrap md:flex-nowrap min-w-0">
          {/* 데스크톱 전용 (md:flex): LV + EXP + 스킨 한 줄 정렬 */}
          <div className="hidden md:flex items-center flex-shrink-0 mr-0.5">
            {renderStatusSection(false)}
          </div>

          {/* [1] 고질라 주간 출석부 */}
          {onOpenAttendanceModal && (
            <button
              type="button"
              onClick={onOpenAttendanceModal}
              title={`고질라 주간 출석부 (${attendanceStreak}일 연속 출석)`}
              className={`relative flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 md:px-2.5 md:py-1 rounded-lg text-[10px] sm:text-xs font-black whitespace-nowrap transition-all active:scale-95 border shadow-sm cursor-pointer ${
                isTodayAttended
                  ? 'bg-emerald-950/40 border-emerald-500/70 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.25)]'
                  : 'bg-slate-900 border-amber-500/60 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
              }`}
            >
              <span className="leading-none">🐾</span>
              <span>출석부</span>
              {attendanceStreak > 0 && (
                <span className="text-[9px] sm:text-[10px] text-rose-300 font-black">
                  🔥{attendanceStreak}
                </span>
              )}

              {/* 오늘 미출석 시 빨간 알림 점 */}
              {!isTodayAttended && (
                <span className="absolute -top-1 -right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
                </span>
              )}
            </button>
          )}

          {/* [2] 괴수 알 보유 수량 & 가챠 버튼 */}
          {onOpenGacha && (
            <button
              type="button"
              onClick={onOpenGacha}
              title={`보유 중인 괴수 알: ${eggCount}개 (클릭 시 알 깨기 가챠)`}
              className={`flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 md:px-2.5 md:py-1 rounded-lg text-[10px] sm:text-xs font-black whitespace-nowrap transition-all active:scale-95 border shadow-sm cursor-pointer ${
                eggCount > 0
                  ? 'bg-amber-950/40 border-amber-500/70 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                  : 'bg-slate-900 border-slate-700 text-slate-400'
              }`}
            >
              <span className="leading-none">🥚</span>
              <span>알</span>
              <span
                className={`px-1 py-0 rounded-full text-[9px] sm:text-[10px] font-black ${
                  eggCount > 0 ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {eggCount}
              </span>
            </button>
          )}

          {/* [3] 괴수 도감 버튼 */}
          <button
            type="button"
            onClick={onOpenMonsterBook}
            title={`괴수 카드 도감 (${unlockedMonsterCount}/${totalMonsterCount})`}
            className="flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 md:px-2.5 md:py-1 rounded-lg bg-slate-900 border border-amber-500/60 text-amber-300 text-[10px] sm:text-xs font-black whitespace-nowrap transition-all active:scale-95 shadow-[0_0_10px_rgba(245,158,11,0.2)] cursor-pointer"
          >
            <span className="leading-none">📖</span>
            <span>도감</span>
            <span className="px-1 py-0 rounded-full text-[9px] sm:text-[10px] font-black bg-amber-700 text-white">
              {unlockedMonsterCount}/{totalMonsterCount}
            </span>
          </button>

          {/* [4] 보관된 쿠폰함 버튼 */}
          {onOpenCouponModal && (
            <button
              type="button"
              onClick={onOpenCouponModal}
              title={`보관된 쿠폰함 (${unusedCouponCount}개 사용 가능)`}
              className={`flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 md:px-2.5 md:py-1 rounded-lg text-[10px] sm:text-xs font-black whitespace-nowrap transition-all active:scale-95 border shadow-sm cursor-pointer ${
                unusedCouponCount > 0
                  ? 'bg-amber-950/40 border-amber-500/70 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                  : 'bg-slate-900 border-slate-700 text-slate-400'
              }`}
            >
              <span className="leading-none">🎟️</span>
              <span>쿠폰함</span>
              {unusedCouponCount > 0 && (
                <span className="px-1 py-0 rounded-full text-[9px] sm:text-[10px] font-black bg-rose-600 text-white">
                  {unusedCouponCount}
                </span>
              )}
            </button>
          )}

          {/* [5] 오답노트 버튼 */}
          <button
            type="button"
            onClick={onOpenReviewModal}
            title={wrongCount > 0 ? `오답 단어 ${wrongCount}개 복습하기` : '오답노트'}
            className={`flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 md:px-2.5 md:py-1 rounded-lg text-[10px] sm:text-xs font-black whitespace-nowrap transition-all active:scale-95 border shadow-sm cursor-pointer ${
              isReviewMode
                ? 'bg-amber-900/40 border-amber-500 text-amber-200'
                : wrongCount > 0
                ? 'bg-rose-950/40 border-rose-500/70 text-rose-200 shadow-[0_0_10px_rgba(244,63,94,0.3)]'
                : 'bg-slate-900 border-slate-700 text-slate-300'
            }`}
          >
            <BookOpen
              className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${
                isReviewMode
                  ? 'text-amber-400'
                  : wrongCount > 0
                  ? 'text-rose-400'
                  : 'text-slate-400'
              }`}
            />
            <span>오답</span>
            <span
              className={`px-1 py-0 rounded-full text-[9px] sm:text-[10px] font-black ${
                isReviewMode
                  ? 'bg-amber-600 text-white'
                  : wrongCount > 0
                  ? 'bg-rose-600 text-white'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {wrongCount}
            </span>
          </button>

          {/* [6] 복습 모드 나가기 버튼 */}
          {isReviewMode && onExitReviewMode && (
            <button
              type="button"
              onClick={onExitReviewMode}
              title="오답 복습 특훈 종료 → 일반 모드로 복귀"
              className="flex items-center gap-0.5 px-2 py-0.5 sm:px-2.5 sm:py-1 md:px-2.5 md:py-1 rounded-lg bg-amber-900/60 border border-amber-500 text-amber-300 text-[10px] sm:text-xs font-black whitespace-nowrap transition-all active:scale-95 shadow-sm cursor-pointer"
            >
              <LogOut className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400" />
              <span>✕나가기</span>
            </button>
          )}

          {/* [7] 학부모 숙제 설정 버튼 */}
          {!isReviewMode && (
            <button
              type="button"
              onClick={onOpenParentModal}
              title="알림장 단어 숙제 관리"
              className="flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 md:px-2.5 md:py-1 rounded-lg bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-300 text-[10px] sm:text-xs font-bold whitespace-nowrap transition-all active:scale-95 shadow-sm cursor-pointer"
            >
              <Settings className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-cyan-400" />
              <span>숙제</span>
            </button>
          )}

          {/* [8] 포효 ON/OFF 토글 버튼 */}
          {onToggleVoiceAttack && (
            <button
              type="button"
              onClick={onToggleVoiceAttack}
              title={
                isVoiceAttackEnabled
                  ? '🎙️ 음성 인식 포효 공격 켜짐 (클릭 시 조용한 모드로 전환)'
                  : '🔇 음성 인식 꺼짐 (조용한 모드 / 클릭 시 포효 모드 켜기)'
              }
              className={`flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 md:px-2.5 md:py-1 rounded-lg text-[10px] sm:text-xs font-extrabold whitespace-nowrap transition-all active:scale-95 border shadow-sm cursor-pointer ${
                isVoiceAttackEnabled
                  ? 'bg-rose-950/40 border-rose-500/70 text-rose-300 shadow-[0_0_10px_rgba(244,63,94,0.3)]'
                  : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              {isVoiceAttackEnabled ? (
                <>
                  <Mic className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-rose-400 animate-pulse" />
                  <span>포효ON</span>
                </>
              ) : (
                <>
                  <MicOff className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-500" />
                  <span>포효OFF</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
