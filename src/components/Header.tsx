import React from 'react';
import { Settings, Award, BookOpen, LogOut, Mic, MicOff } from 'lucide-react';
import { getGodzillaEvolution, getGodzillaAura } from '../types';
import { MONSTER_MAP } from '../data/monsterData';

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
  equippedPartnerId?: string | null;
  activeMode?: 'language' | 'math';
  onSelectMode?: (mode: 'language' | 'math') => void;
  dailyDualQuest?: { languageDone: boolean; mathDone: boolean };
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
  equippedPartnerId,
  activeMode = 'language',
  onSelectMode,
  dailyDualQuest,
}) => {
  const expProgress = Math.min(100, Math.max(0, exp));
  const evo = getGodzillaEvolution(level);
  const aura = getGodzillaAura(level);
  const partnerMonster = equippedPartnerId ? MONSTER_MAP.get(equippedPartnerId) : null;

  // 듀얼 퀘스트 완료 개수 계산
  const dualQuestCount = (dailyDualQuest?.languageDone ? 1 : 0) + (dailyDualQuest?.mathDone ? 1 : 0);

  return (
    <header className="w-full flex-none bg-slate-950/95 border-b border-slate-800/80 backdrop-blur-md px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 z-40 shadow-sm select-none">
      <div className="w-full max-w-6xl mx-auto flex flex-wrap md:flex-nowrap items-center justify-between gap-1 sm:gap-2">
        {/* ─── 1. 좌측: 캐릭터 아바타 + 고질라 레벨 & EXP HUD ─── */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 order-1">
          {/* 미니 렉스 아바타 (각성 아우라 테두리 발광) */}
          <div
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0 select-none shadow-sm transition-all"
            style={{
              background: 'linear-gradient(135deg, #06b6d4 0%, #2563eb 100%)',
              border:
                aura.tier !== 'none'
                  ? `1.5px solid ${aura.themeColor}`
                  : '1.2px solid rgba(165, 243, 252, 0.7)',
              boxShadow:
                aura.tier !== 'none'
                  ? aura.glowShadow
                  : '0 0 8px rgba(6, 182, 212, 0.35)',
            }}
          >
            <span className="text-base sm:text-lg leading-none">🦖</span>
          </div>

          <div className="flex flex-col justify-center min-w-0">
            {/* 타이틀 + 폼 뱃지 + 스트릭 */}
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-xs sm:text-sm font-black tracking-tight text-amber-300 whitespace-nowrap">
                고질라
              </span>

              {/* 현재 진화 폼 미니 뱃지 */}
              <span
                title={`${evo.name} (${evo.beamName})`}
                className="px-1 py-0.2 rounded text-[10px] font-black whitespace-nowrap shrink-0 text-white leading-tight"
                style={{
                  background: evo.badgeBg,
                  border: `1px solid ${evo.themeColor}`,
                }}
              >
                {evo.icon} {evo.shortName}
              </span>

              {stageLabel && (
                <span
                  className={`text-[9px] font-black px-1 py-0.2 rounded whitespace-nowrap border shrink-0 ${
                    isReviewMode
                      ? 'bg-amber-900/40 text-amber-300 border-amber-500/60'
                      : 'bg-cyan-950/60 text-cyan-300 border-cyan-500/50'
                  }`}
                >
                  {stageLabel}
                </span>
              )}

              {streak > 1 && (
                <span className="text-[9px] font-black px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-400/40 whitespace-nowrap shrink-0">
                  🔥{streak}
                </span>
              )}
            </div>

            {/* 레벨 (각성 아우라 테두리 & 글로우) & 슬림 EXP 게이지 */}
            <div className="flex items-center gap-1 mt-0.5 text-[10px] whitespace-nowrap">
              <span
                className="font-black flex items-center gap-0.5 px-1 py-0.2 rounded transition-all"
                style={{
                  color: aura.tier !== 'none' ? aura.themeColor : '#67e8f9',
                  border:
                    aura.tier !== 'none'
                      ? `1px solid ${aura.themeColor}aa`
                      : '1px solid rgba(6, 182, 212, 0.3)',
                  boxShadow:
                    aura.tier !== 'none'
                      ? `0 0 8px ${aura.themeColor}66`
                      : 'none',
                  backgroundColor:
                    aura.tier !== 'none'
                      ? `${aura.themeColor}1a`
                      : 'rgba(15, 23, 42, 0.6)',
                }}
                title={aura.tier !== 'none' ? `[각성 아우라] ${aura.name} (${aura.description})` : undefined}
              >
                <Award
                  className="w-3 h-3 shrink-0"
                  style={{ color: aura.tier !== 'none' ? aura.themeColor : '#fbbf24' }}
                />
                LV.{level}
                {aura.tier !== 'none' && (
                  <span className="text-[9px] ml-0.5" title={aura.name}>
                    {aura.icon}
                  </span>
                )}
              </span>
              <div
                className="w-12 sm:w-16 bg-slate-800 rounded-full h-1.5 overflow-hidden border border-slate-700 shrink-0"
                title={`경험치: ${expProgress}%`}
              >
                <div
                  className="h-full bg-gradient-to-r from-cyan-400 to-amber-400 rounded-full transition-all duration-300"
                  style={{ width: `${expProgress}%` }}
                />
              </div>
              <span className="text-[8px] text-slate-400 font-bold">{expProgress}%</span>
            </div>
          </div>
        </div>

        {/* ─── 2. 중앙: 과목 전환 및 일일 듀얼 퀘스트 통합 토글 탭 바 ─── */}
        {onSelectMode && (
          <div className="w-full md:w-auto order-3 md:order-2 flex justify-center py-0.5 md:py-0">
            <div className="flex items-center gap-1 bg-slate-900/90 p-0.5 rounded-lg border border-slate-800/90 shadow-inner">
              {/* 듀얼 퀘스트 완주 인디케이터 */}
              {dailyDualQuest && (
                <span
                  title={
                    dualQuestCount === 2
                      ? '일일 듀얼 퀘스트 2/2 완주! (출석+알 획득 완료)'
                      : dualQuestCount === 1
                      ? '일일 듀얼 퀘스트 1/2 완료! (남은 1과목 도전)'
                      : '일일 듀얼 퀘스트 0/2 시작'
                  }
                  className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-black shrink-0 transition-all ${
                    dualQuestCount === 2
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : dualQuestCount === 1
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-slate-800/80 text-slate-400 border border-slate-700/50'
                  }`}
                >
                  <span className="text-[9px]">⚡</span>
                  <span>{dualQuestCount === 2 ? '2/2 🎉' : `${dualQuestCount}/2`}</span>
                </span>
              )}

              {/* [ 🔤 언어 배틀 ] 토글 버튼 */}
              <button
                type="button"
                onClick={() => onSelectMode('language')}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-black transition-all cursor-pointer ${
                  activeMode === 'language'
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-400/80 shadow-[0_0_8px_rgba(6,182,212,0.35)] ring-1 ring-cyan-400/40'
                    : 'text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
              >
                <span>🔤</span>
                <span>언어 배틀</span>
                {dailyDualQuest?.languageDone && (
                  <span className="text-emerald-400 text-[10px] font-black" title="언어 훈련 완료">
                    ✓
                  </span>
                )}
              </button>

              {/* 구분선 */}
              <div className="w-px h-3 bg-slate-800" />

              {/* [ 🔢 산수 요격 ] 토글 버튼 */}
              <button
                type="button"
                onClick={() => onSelectMode('math')}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-black transition-all cursor-pointer ${
                  activeMode === 'math'
                    ? 'bg-amber-950 text-amber-300 border border-amber-400/80 shadow-[0_0_8px_rgba(245,158,11,0.35)] ring-1 ring-amber-400/40'
                    : 'text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
              >
                <span>🔢</span>
                <span>산수 요격</span>
                {dailyDualQuest?.mathDone && (
                  <span className="text-emerald-400 text-[10px] font-black" title="산수 훈련 완료">
                    ✓
                  </span>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ─── 3. 우측: 1줄 컴팩트 재화 뱃지 + 미니멀 유틸리티 버튼 ─── */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 order-2 md:order-3 overflow-x-auto no-scrollbar py-0.5">
          {/* [재화 1] 🥚 괴수 알 */}
          {onOpenGacha && (
            <button
              type="button"
              onClick={onOpenGacha}
              title={`보유 중인 괴수 알: ${eggCount}개 (클릭 시 알 깨기 가챠)`}
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[11px] font-black transition-all active:scale-95 border cursor-pointer shrink-0 ${
                eggCount > 0
                  ? 'bg-amber-950/40 border-amber-500/70 text-amber-300 shadow-[0_0_6px_rgba(245,158,11,0.25)]'
                  : 'bg-slate-900/80 border-slate-800 text-slate-400'
              }`}
            >
              <span className="leading-none text-xs">🥚</span>
              <span>{eggCount}</span>
            </button>
          )}

          {/* [재화 2] 🎁 황금 보물상자 */}
          {onOpenTreasureBox && (
            <button
              type="button"
              onClick={onOpenTreasureBox}
              title={`보유 중인 황금 보물상자: ${treasureBoxCount}개 (클릭 시 상자 개봉!)`}
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[11px] font-black transition-all active:scale-95 border cursor-pointer shrink-0 ${
                treasureBoxCount > 0
                  ? 'bg-amber-950/60 border-amber-400 text-amber-300 shadow-[0_0_8px_rgba(251,191,36,0.35)] animate-pulse'
                  : 'bg-slate-900/80 border-slate-800 text-slate-400'
              }`}
            >
              <span className="leading-none text-xs">🎁</span>
              <span>{treasureBoxCount}</span>
            </button>
          )}

          {/* [재화 3] 🎟️ 쿠폰 */}
          {onOpenCouponModal && (
            <button
              type="button"
              onClick={onOpenCouponModal}
              title={`보관된 쿠폰함 (${unusedCouponCount}장 보유)`}
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[11px] font-black transition-all active:scale-95 border cursor-pointer shrink-0 ${
                unusedCouponCount > 0
                  ? 'bg-rose-950/50 border-rose-500/70 text-rose-300 shadow-[0_0_6px_rgba(244,63,94,0.25)]'
                  : 'bg-slate-900/80 border-slate-800 text-slate-400'
              }`}
            >
              <span className="leading-none text-xs">🎟️</span>
              <span>{unusedCouponCount}</span>
            </button>
          )}

          {/* [재화 4] 📖 도감 */}
          <button
            type="button"
            onClick={onOpenMonsterBook}
            title={
              partnerMonster
                ? `도감 (${unlockedMonsterCount}/${totalMonsterCount}) - 파트너: ${partnerMonster.ko} [${partnerMonster.partnerSkill.name}]`
                : `괴수 카드 도감 (${unlockedMonsterCount}/${totalMonsterCount})`
            }
            className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-slate-900/80 border border-amber-500/50 text-amber-300 text-[11px] font-black transition-all active:scale-95 border cursor-pointer shrink-0 shadow-[0_0_6px_rgba(245,158,11,0.15)]"
          >
            <span className="leading-none text-xs">
              {partnerMonster ? partnerMonster.partnerSkill.icon : '📖'}
            </span>
            <span>
              {unlockedMonsterCount}/{totalMonsterCount}
            </span>
          </button>

          {/* 구분선 */}
          <div className="w-px h-3.5 bg-slate-800 mx-0.5 shrink-0" />

          {/* [유틸리티 1] 📅 출석부 */}
          {onOpenAttendanceModal && (
            <button
              type="button"
              onClick={onOpenAttendanceModal}
              title={`고질라 주간 출석부 (${attendanceStreak}일 연속 출석)`}
              className={`relative flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[11px] font-black transition-all active:scale-95 border cursor-pointer shrink-0 ${
                isTodayAttended
                  ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-300'
                  : 'bg-slate-900/90 border-amber-500/70 text-amber-300 shadow-[0_0_6px_rgba(245,158,11,0.2)]'
              }`}
            >
              <span className="leading-none text-xs">📅</span>
              <span>{attendanceStreak}일</span>
              {!isTodayAttended && (
                <span className="absolute -top-1 -right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
                </span>
              )}
            </button>
          )}

          {/* [유틸리티 2] 📕 오답노트 (숫자 뱃지형) */}
          <button
            type="button"
            onClick={onOpenReviewModal}
            title={wrongCount > 0 ? `오답 단어 ${wrongCount}개 복습하기` : '오답노트 (0개)'}
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[11px] font-black transition-all active:scale-95 border cursor-pointer shrink-0 ${
              isReviewMode
                ? 'bg-amber-900/50 border-amber-400 text-amber-200'
                : wrongCount > 0
                ? 'bg-rose-950/40 border-rose-500/70 text-rose-300 shadow-[0_0_6px_rgba(244,63,94,0.25)]'
                : 'bg-slate-900/80 border-slate-800 text-slate-400'
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
            {wrongCount > 0 && (
              <span className="px-1 py-0.2 rounded-full text-[9px] font-black bg-rose-600 text-white leading-none">
                {wrongCount}
              </span>
            )}
          </button>

          {/* [유틸리티 2-1] 복습 모드 나가기 버튼 */}
          {isReviewMode && onExitReviewMode && (
            <button
              type="button"
              onClick={onExitReviewMode}
              title="오답 복습 특훈 종료 → 일반 모드로 복귀"
              className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-amber-900/60 border border-amber-500 text-amber-300 text-[11px] font-black transition-all active:scale-95 cursor-pointer shrink-0"
            >
              <LogOut className="w-3 h-3 text-amber-400 shrink-0" />
              <span>종료</span>
            </button>
          )}

          {/* [유틸리티 3] ⚙️ 학부모 단어 숙제 설정 (Icon-only) */}
          {!isReviewMode && (
            <button
              type="button"
              onClick={onOpenParentModal}
              title="알림장 단어 숙제 관리"
              className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-md bg-slate-900/90 border border-slate-700/80 hover:border-cyan-500/60 text-slate-300 hover:text-cyan-300 transition-all active:scale-95 cursor-pointer shrink-0"
              aria-label="숙제 관리"
            >
              <Settings className="w-3.5 h-3.5 shrink-0" />
            </button>
          )}

          {/* [유틸리티 4] 🎙️ 음성 포효 ON/OFF (Icon-only) */}
          {onToggleVoiceAttack && (
            <button
              type="button"
              onClick={onToggleVoiceAttack}
              title={
                isVoiceAttackEnabled
                  ? '🎙️ 음성 인식 포효 공격 켜짐 (클릭 시 조용한 모드로 전환)'
                  : '🔇 조용한 모드 (클릭 시 포효 모드 켜기)'
              }
              className={`w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-md border transition-all active:scale-95 cursor-pointer shrink-0 ${
                isVoiceAttackEnabled
                  ? 'bg-rose-950/50 border-rose-500/70 text-rose-300 shadow-[0_0_8px_rgba(244,63,94,0.3)]'
                  : 'bg-slate-900/90 border-slate-800 text-slate-500 hover:text-slate-300'
              }`}
              aria-label={isVoiceAttackEnabled ? '포효 공격 끄기' : '포효 공격 켜기'}
            >
              {isVoiceAttackEnabled ? (
                <Mic className="w-3.5 h-3.5 text-rose-400 animate-pulse shrink-0" />
              ) : (
                <MicOff className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              )}
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
