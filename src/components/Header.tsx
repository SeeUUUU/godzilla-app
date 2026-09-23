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
  treasureBoxCount?: number;
  onOpenTreasureBox?: () => void;
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
  treasureBoxCount = 0,
  onOpenTreasureBox,
}) => {
  const expProgress = Math.min(100, Math.max(0, exp));
  const evo = getGodzillaEvolution(level);

  return (
    <header className="w-full flex-none bg-slate-950/90 border-b border-slate-800/80 backdrop-blur-md px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 z-40 shadow-sm overflow-x-hidden">
      <div className="w-full max-w-5xl lg:max-w-6xl mx-auto flex items-center justify-between gap-2 overflow-x-hidden">
        {/* ─── 좌측 그룹: 로고 + 큰 타이틀 + 배틀 스테이지 뱃지 + Lv/EXP 바 ─── */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 min-w-0">
          <div
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 select-none shadow-md"
            style={{
              background: 'linear-gradient(135deg, #06b6d4 0%, #2563eb 100%)',
              border: '1.5px solid rgba(165, 243, 252, 0.8)',
              boxShadow: '0 0 10px rgba(6, 182, 212, 0.45)',
            }}
          >
            <span className="text-xl sm:text-2xl leading-none">🦖</span>
          </div>

          <div className="flex flex-col justify-center min-w-0">
            {/* 1행: 타이틀 + 모드/스트릭 뱃지 */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <h1 className="text-sm sm:text-base font-black tracking-tight text-amber-300 drop-shadow-sm whitespace-nowrap">
                고질라 언어 모험
              </h1>

              {stageLabel && (
                <span
                  className={`inline-flex items-center text-[9px] sm:text-[10px] font-black px-1.5 py-0.5 rounded-full whitespace-nowrap shadow-sm border shrink-0 ${
                    isReviewMode
                      ? 'bg-amber-900/40 text-amber-300 border-amber-500/60'
                      : stageLabel.includes('마스터') || stageLabel.includes('👑')
                      ? 'bg-gradient-to-r from-amber-950/80 via-purple-950/80 to-amber-950/80 text-yellow-300 border-amber-400 shadow-amber-500/20'
                      : 'bg-cyan-950/60 text-cyan-300 border-cyan-500/50'
                  }`}
                >
                  {stageLabel}
                </span>
              )}

              {streak > 1 && (
                <span className="inline-flex items-center gap-0.5 text-[8px] sm:text-[9px] font-black px-1 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40 whitespace-nowrap shadow-sm shrink-0">
                  🔥 {streak}연승
                </span>
              )}
            </div>

            {/* 2행: Lv / EXP 프로그레스 바 */}
            <div className="flex items-center gap-1.5 mt-1 bg-slate-900/90 border border-cyan-500/40 rounded-lg px-2 py-0.5 shadow-sm whitespace-nowrap w-fit">
              <div className="flex items-center gap-0.5 text-cyan-300 font-black text-[11px] sm:text-xs">
                <Award className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>LV.{level}</span>
              </div>

              <div className="flex flex-col w-16 sm:w-20">
                <div className="flex justify-between text-[8px] text-slate-400 font-bold mb-0.5 leading-none">
                  <span className="flex items-center gap-0.5 text-cyan-400">
                    <Zap className="w-2 h-2 fill-cyan-400 text-cyan-400 shrink-0" /> EXP
                  </span>
                  <span>{expProgress}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden border border-slate-700">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-400 to-amber-400 rounded-full transition-all duration-300"
                    style={{ width: `${expProgress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── 우측 그룹: 2줄 정돈 레이아웃 ─── */}
        <div className="flex flex-col items-end gap-1 sm:gap-1.5 shrink-0 overflow-x-hidden">
          {/* [1번 줄] 윗줄: 고질라 폼 + 보물상자 + 알 + 도감 + 쿠폰함 */}
          <div className="flex items-center gap-1 sm:gap-1.5 whitespace-nowrap">
            {/* 현재 고질라 폼 뱃지 */}
            <div
              title={`${evo.name} (${evo.beamName})`}
              className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-lg text-white font-black text-[11px] sm:text-xs whitespace-nowrap select-none shadow-sm cursor-default shrink-0"
              style={{
                background: evo.badgeBg,
                border: `1.5px solid ${evo.themeColor}`,
                boxShadow: `0 0 8px ${evo.themeColor}55`,
              }}
            >
              <span className="text-xs sm:text-sm leading-none">{evo.icon}</span>
              <span className="truncate max-w-[65px] sm:max-w-none">{evo.shortName}</span>
            </div>

            {/* 🎁 황금 보물상자 카운터 버튼 */}
            {onOpenTreasureBox && (
              <button
                type="button"
                onClick={onOpenTreasureBox}
                title={`보유 중인 황금 보물상자: ${treasureBoxCount}개 (클릭 시 상자 개봉!)`}
                className={`flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-lg text-[11px] sm:text-xs font-black whitespace-nowrap transition-all active:scale-95 border shadow-sm cursor-pointer shrink-0 ${
                  treasureBoxCount > 0
                    ? 'bg-amber-950/50 border-amber-400/80 text-amber-300 shadow-[0_0_10px_rgba(251,191,36,0.35)]'
                    : 'bg-slate-900 border-slate-700 text-slate-400'
                }`}
              >
                <span className="leading-none text-xs sm:text-sm">🎁</span>
                <span>보물상자</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[9px] sm:text-[10px] font-black ${
                    treasureBoxCount > 0 ? 'bg-amber-500 text-slate-950 font-black' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {treasureBoxCount}
                </span>
              </button>
            )}

            {/* 🥚 괴수 알 카운터 버튼 */}
            {onOpenGacha && (
              <button
                type="button"
                onClick={onOpenGacha}
                title={`보유 중인 괴수 알: ${eggCount}개 (클릭 시 알 깨기 가챠)`}
                className={`flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-lg text-[11px] sm:text-xs font-black whitespace-nowrap transition-all active:scale-95 border shadow-sm cursor-pointer shrink-0 ${
                  eggCount > 0
                    ? 'bg-amber-950/40 border-amber-500/70 text-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.3)]'
                    : 'bg-slate-900 border-slate-700 text-slate-400'
                }`}
              >
                <span className="leading-none text-xs sm:text-sm">🥚</span>
                <span>알</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[9px] sm:text-[10px] font-black ${
                    eggCount > 0 ? 'bg-amber-600 text-white font-black' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {eggCount}
                </span>
              </button>
            )}

            {/* 📖 괴수 카드 도감 */}
            <button
              type="button"
              onClick={onOpenMonsterBook}
              title={`괴수 카드 도감 (${unlockedMonsterCount}/${totalMonsterCount})`}
              className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-lg bg-slate-900 border border-amber-500/60 text-amber-300 text-[11px] sm:text-xs font-black whitespace-nowrap transition-all active:scale-95 shadow-[0_0_8px_rgba(245,158,11,0.2)] cursor-pointer shrink-0"
            >
              <span className="leading-none text-xs sm:text-sm">📖</span>
              <span>도감</span>
              <span className="px-1.5 py-0.2 rounded-full text-[9px] sm:text-[10px] font-black bg-amber-700 text-white">
                {unlockedMonsterCount}/{totalMonsterCount}
              </span>
            </button>

            {/* 🎟️ 보관된 쿠폰함 */}
            {onOpenCouponModal && (
              <button
                type="button"
                onClick={onOpenCouponModal}
                title={`보관된 쿠폰함 (${unusedCouponCount}개 사용 가능)`}
                className={`flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-lg text-[11px] sm:text-xs font-black whitespace-nowrap transition-all active:scale-95 border shadow-sm cursor-pointer shrink-0 ${
                  unusedCouponCount > 0
                    ? 'bg-amber-950/40 border-amber-500/70 text-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.3)]'
                    : 'bg-slate-900 border-slate-700 text-slate-400'
                }`}
              >
                <span className="leading-none text-xs sm:text-sm">🎟️</span>
                <span>쿠폰함</span>
                {unusedCouponCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] sm:text-[10px] font-black bg-rose-600 text-white">
                    {unusedCouponCount}
                  </span>
                )}
              </button>
            )}
          </div>

          {/* [2번 줄] 아랫줄: 오답 + 출석부 + 숙제 + 포효 ON/OFF */}
          <div className="flex items-center gap-1 sm:gap-1.5 whitespace-nowrap">
            {/* 📕 오답노트 */}
            <button
              type="button"
              onClick={onOpenReviewModal}
              title={wrongCount > 0 ? `오답 단어 ${wrongCount}개 복습하기` : '오답노트'}
              className={`flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-lg text-[11px] sm:text-xs font-black whitespace-nowrap transition-all active:scale-95 border shadow-sm cursor-pointer shrink-0 ${
                isReviewMode
                  ? 'bg-amber-900/40 border-amber-500 text-amber-200'
                  : wrongCount > 0
                  ? 'bg-rose-950/40 border-rose-500/70 text-rose-200 shadow-[0_0_8px_rgba(244,63,94,0.3)]'
                  : 'bg-slate-900 border-slate-700 text-slate-300'
              }`}
            >
              <BookOpen
                className={`w-3.5 h-3.5 shrink-0 ${
                  isReviewMode
                    ? 'text-amber-400'
                    : wrongCount > 0
                    ? 'text-rose-400'
                    : 'text-slate-400'
                }`}
              />
              <span>오답</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[9px] sm:text-[10px] font-black ${
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

            {/* 복습 모드 나가기 */}
            {isReviewMode && onExitReviewMode && (
              <button
                type="button"
                onClick={onExitReviewMode}
                title="오답 복습 특훈 종료 → 일반 모드로 복귀"
                className="flex items-center gap-0.5 px-1.5 sm:px-2 py-0.5 rounded-lg bg-amber-900/60 border border-amber-500 text-amber-300 text-[11px] sm:text-xs font-black whitespace-nowrap transition-all active:scale-95 shadow-sm cursor-pointer shrink-0"
              >
                <LogOut className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>✕나가기</span>
              </button>
            )}

            {/* 🐾 고질라 주간 출석부 */}
            {onOpenAttendanceModal && (
              <button
                type="button"
                onClick={onOpenAttendanceModal}
                title={`고질라 주간 출석부 (${attendanceStreak}일 연속 출석)`}
                className={`relative flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-lg text-[11px] sm:text-xs font-black whitespace-nowrap transition-all active:scale-95 border shadow-sm cursor-pointer shrink-0 ${
                  isTodayAttended
                    ? 'bg-emerald-950/40 border-emerald-500/70 text-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.25)]'
                    : 'bg-slate-900 border-amber-500/60 text-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.2)]'
                }`}
              >
                <span className="leading-none text-xs sm:text-sm">🐾</span>
                <span>출석부</span>
                {attendanceStreak > 0 && (
                  <span className="text-[9px] sm:text-[10px] text-rose-300 font-black">
                    🔥{attendanceStreak}
                  </span>
                )}
                {!isTodayAttended && (
                  <span className="absolute -top-1 -right-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
                  </span>
                )}
              </button>
            )}

            {/* ⚙️ 학부모 숙제 설정 */}
            {!isReviewMode && (
              <button
                type="button"
                onClick={onOpenParentModal}
                title="알림장 단어 숙제 관리"
                className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-300 text-[11px] sm:text-xs font-bold whitespace-nowrap transition-all active:scale-95 shadow-sm cursor-pointer shrink-0"
              >
                <Settings className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>숙제</span>
              </button>
            )}

            {/* 🎙️ 음성 포효 ON/OFF */}
            {onToggleVoiceAttack && (
              <button
                type="button"
                onClick={onToggleVoiceAttack}
                title={
                  isVoiceAttackEnabled
                    ? '🎙️ 음성 인식 포효 공격 켜짐 (클릭 시 조용한 모드로 전환)'
                    : '🔇 음성 인식 꺼짐 (조용한 모드 / 클릭 시 포효 모드 켜기)'
                }
                className={`flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-lg text-[11px] sm:text-xs font-extrabold whitespace-nowrap transition-all active:scale-95 border shadow-sm cursor-pointer shrink-0 ${
                  isVoiceAttackEnabled
                    ? 'bg-rose-950/40 border-rose-500/70 text-rose-300 shadow-[0_0_8px_rgba(244,63,94,0.3)]'
                    : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                {isVoiceAttackEnabled ? (
                  <>
                    <Mic className="w-3.5 h-3.5 text-rose-400 animate-pulse shrink-0" />
                    <span>포효ON</span>
                  </>
                ) : (
                  <>
                    <MicOff className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>포효OFF</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
