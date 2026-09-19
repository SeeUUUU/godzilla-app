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

  return (
    <header className="w-full flex-none flex justify-center bg-slate-950/80 border-b border-slate-800/80 backdrop-blur-md py-2 z-40 shadow-sm">
      <div
        className="w-full max-w-5xl mx-auto px-1.5 sm:px-2 flex items-center justify-between gap-3 sm:gap-4"
        style={{
          width: '100%',
          maxWidth: '1024px',
          margin: '0 auto',
        }}
      >
        {/* ─── [1] 좌측 타이틀 영역 (단일 행 시원한 표시) ─── */}
        <div className="flex items-center gap-3 sm:gap-3.5 flex-shrink-0">
          {/* 치비 고질라 로고 아이콘 */}
          <div
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center flex-shrink-0 select-none shadow-md transition-transform hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, #06b6d4 0%, #2563eb 100%)',
              border: '2px solid rgba(165, 243, 252, 0.8)',
              boxShadow: '0 0 16px rgba(6, 182, 212, 0.45)',
            }}
          >
            <span className="text-2xl sm:text-3xl leading-none">🦖</span>
          </div>

          <div className="flex flex-col justify-center min-w-0">
            {/* 타이틀 및 연승/모드 배지 (단일 행) */}
            <div className="flex items-center gap-2 sm:gap-2.5 flex-nowrap">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-amber-300 drop-shadow-md whitespace-nowrap">
                고질라 언어 모험
              </h1>

              {/* 연속 정답 스트릭 배지 */}
              {streak > 1 && (
                <span className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40 whitespace-nowrap shadow-sm">
                  🔥 {streak}연승
                </span>
              )}

              {/* 현재 스테이지 / 모드 배지 */}
              {stageLabel && (
                <span
                  className={`inline-flex items-center text-[10px] sm:text-[11px] font-black px-2.5 py-0.5 rounded-full whitespace-nowrap shadow-sm border ${
                    isReviewMode
                      ? 'bg-amber-900/40 text-amber-300 border-amber-500/60'
                      : 'bg-cyan-950/60 text-cyan-300 border-cyan-500/50'
                  }`}
                >
                  {stageLabel}
                </span>
              )}
            </div>

            {/* 영문/일문 서브타이틀 */}
            <p className="text-[11px] sm:text-xs text-slate-400 font-medium whitespace-nowrap tracking-wide mt-0.5">
              Godzilla Adventure · ゴジラのことばの大冒険
            </p>
          </div>
        </div>

        {/* ─── [2] 우측 2단 버튼 및 컨트롤 영역 ─── */}
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          {/* 1번 줄 (상단 행: 상태 & 성장 정보) */}
          <div className="flex items-center gap-2 flex-nowrap">
            {/* LV. & EXP 컴팩트 게이지 */}
            <div className="flex items-center gap-2.5 bg-slate-900/90 border border-cyan-500/40 rounded-xl px-2.5 py-1 shadow-sm whitespace-nowrap">
              <div className="flex items-center gap-1 text-cyan-300 font-black text-xs">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                <span>LV.{level}</span>
              </div>

              <div className="flex flex-col w-20 sm:w-24">
                <div className="flex justify-between text-[9px] text-slate-400 font-bold mb-0.5">
                  <span className="flex items-center gap-0.5 text-cyan-400">
                    <Zap className="w-2.5 h-2.5 fill-cyan-400 text-cyan-400" /> EXP
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

            {/* 장착 괴수 스킨 배지 */}
            <div
              title={`${evo.name} (${evo.beamName})`}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-white font-black text-xs whitespace-nowrap select-none shadow-sm transition-transform hover:scale-105 cursor-default"
              style={{
                background: evo.badgeBg,
                border: `1.5px solid ${evo.themeColor}`,
                boxShadow: `0 0 10px ${evo.themeColor}55`,
              }}
            >
              <span className="text-sm leading-none">{evo.icon}</span>
              <span>{evo.shortName}</span>
            </div>

            {/* 음성 인식 포효 ON/OFF 토글 버튼 */}
            {onToggleVoiceAttack && (
              <button
                type="button"
                onClick={onToggleVoiceAttack}
                title={
                  isVoiceAttackEnabled
                    ? '🎙️ 음성 인식 포효 공격 켜짐 (클릭 시 조용한 모드로 전환)'
                    : '🔇 음성 인식 꺼짐 (조용한 모드 / 클릭 시 포효 모드 켜기)'
                }
                className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all active:scale-95 border shadow-sm ${
                  isVoiceAttackEnabled
                    ? 'bg-rose-950/40 border-rose-500/70 text-rose-300 shadow-[0_0_10px_rgba(244,63,94,0.3)]'
                    : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                {isVoiceAttackEnabled ? (
                  <>
                    <Mic className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                    <span>포효 ON</span>
                  </>
                ) : (
                  <>
                    <MicOff className="w-3.5 h-3.5 text-slate-500" />
                    <span>포효 OFF</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* 2번 줄 (하단 행: 주요 기능 & 모달 버튼) */}
          <div className="flex items-center gap-1.5 flex-nowrap">
            {/* [1] 고질라 주간 출석부 버튼 */}
            {onOpenAttendanceModal && (
              <button
                type="button"
                onClick={onOpenAttendanceModal}
                title={`고질라 주간 출석부 (${attendanceStreak}일 연속 출석)`}
                className={`relative flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-black whitespace-nowrap transition-all active:scale-95 border shadow-sm ${
                  isTodayAttended
                    ? 'bg-emerald-950/40 border-emerald-500/70 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.25)]'
                    : 'bg-slate-900 border-amber-500/60 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                }`}
              >
                <span className="text-xs leading-none">🐾</span>
                <span>출석부</span>
                {attendanceStreak > 0 && (
                  <span className="text-[10px] text-rose-300 font-black">
                    🔥{attendanceStreak}일
                  </span>
                )}

                {/* 오늘 미출석 시 빨간색 알림 점 (ping 애니메이션) */}
                {!isTodayAttended && (
                  <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500" />
                  </span>
                )}
              </button>
            )}

            {/* [2] 괴수 알 보유 수량 & 가챠 바로가기 버튼 */}
            {onOpenGacha && (
              <button
                type="button"
                onClick={onOpenGacha}
                title={`보유 중인 괴수 알: ${eggCount}개 (클릭 시 알 깨기 가챠)`}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-black whitespace-nowrap transition-all active:scale-95 border shadow-sm ${
                  eggCount > 0
                    ? 'bg-amber-950/40 border-amber-500/70 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                    : 'bg-slate-900 border-slate-700 text-slate-400'
                }`}
              >
                <span className="text-xs leading-none">🥚</span>
                <span>알</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
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
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900 border border-amber-500/60 text-amber-300 text-xs font-black whitespace-nowrap transition-all active:scale-95 shadow-[0_0_10px_rgba(245,158,11,0.2)]"
            >
              <span className="text-xs leading-none">📖</span>
              <span>도감</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-amber-700 text-white">
                {unlockedMonsterCount}/{totalMonsterCount}
              </span>
            </button>

            {/* [4] 오답노트 버튼 */}
            <button
              type="button"
              onClick={onOpenReviewModal}
              title={wrongCount > 0 ? `오답 단어 ${wrongCount}개 복습하기` : '오답노트'}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-black whitespace-nowrap transition-all active:scale-95 border shadow-sm ${
                isReviewMode
                  ? 'bg-amber-900/40 border-amber-500 text-amber-200'
                  : wrongCount > 0
                  ? 'bg-rose-950/40 border-rose-500/70 text-rose-200 shadow-[0_0_10px_rgba(244,63,94,0.3)]'
                  : 'bg-slate-900 border-slate-700 text-slate-300'
              }`}
            >
              <BookOpen
                className={`w-3.5 h-3.5 ${
                  isReviewMode
                    ? 'text-amber-400'
                    : wrongCount > 0
                    ? 'text-rose-400'
                    : 'text-slate-400'
                }`}
              />
              <span>오답노트</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
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

            {/* [5] 복습 모드 나가기 버튼 (복습 모드일 때만 표시) */}
            {isReviewMode && onExitReviewMode && (
              <button
                type="button"
                onClick={onExitReviewMode}
                title="오답 복습 특훈 종료 → 일반 모드로 복귀"
                className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-900/60 border border-amber-500 text-amber-300 text-xs font-black whitespace-nowrap transition-all active:scale-95 shadow-[0_0_10px_rgba(245,158,11,0.35)]"
              >
                <LogOut className="w-3.5 h-3.5 text-amber-400" />
                <span>✕ 나가기</span>
              </button>
            )}

            {/* [6] 학부모 숙제 설정 버튼 (복습 모드 아닐 때 표시) */}
            {!isReviewMode && (
              <button
                type="button"
                onClick={onOpenParentModal}
                title="알림장 단어 숙제 관리"
                className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-300 text-xs font-bold whitespace-nowrap transition-all active:scale-95 shadow-sm"
              >
                <Settings className="w-3.5 h-3.5 text-cyan-400" />
                <span>숙제</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
