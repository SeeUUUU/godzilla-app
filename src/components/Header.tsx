import React, { useEffect, useState } from 'react';
import {
  Settings,
  Award,
  BookOpen,
  LogOut,
  Mic,
  MicOff,
  Menu,
  X,
} from 'lucide-react';
import { getGodzillaEvolution, getGodzillaAura } from '../types';
import { MONSTER_MAP } from '../data/monsterData';
import {
  ATOMIC_PARTS,
  ATOMIC_TITLES,
  type EquippedAtomicGear,
} from '../data/atomicPartsData';

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
  stampCount?: number;
  cumulativeAttendanceDays?: number;
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
  onOpenInstall?: () => void;
  isStandalone?: boolean;
  onOpenSpeedQuiz?: () => void;
  onOpenSchoolMission?: () => void;
  onOpenGeometryLab?: () => void;
  userEmail?: string | null;
  onSignOut?: () => void;
  /** 학부모 관리자 계정(s9230179@gmail.com) 로그인 시에만 true → [📊 학부모 관리] 버튼 노출 */
  isParentAdmin?: boolean;
  onOpenParentAdmin?: () => void;
  equippedAtomicGear?: EquippedAtomicGear;
}

export const Header: React.FC<HeaderProps> = ({
  level,
  exp,
  streak = 0,
  wrongCount = 0,
  isReviewMode = false,
  onOpenParentModal,
  onOpenReviewModal,
  onOpenMonsterBook,
  onOpenAttendanceModal,
  onOpenCouponModal,
  unusedCouponCount = 0,
  attendanceStreak = 0,
  stampCount,
  cumulativeAttendanceDays = 0,
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
  onOpenInstall,
  isStandalone = false,
  onOpenSpeedQuiz,
  onOpenSchoolMission,
  onOpenGeometryLab,
  userEmail,
  onSignOut,
  isParentAdmin = false,
  onOpenParentAdmin,
  equippedAtomicGear,
}) => {
  const expProgress = Math.min(100, Math.max(0, exp));
  const evo = getGodzillaEvolution(level);
  const aura = getGodzillaAura(level);
  const partnerMonster = equippedPartnerId ? MONSTER_MAP.get(equippedPartnerId) : null;
  const equippedTitle = equippedAtomicGear
    ? ATOMIC_TITLES.find((t) => t.id === equippedAtomicGear.title) || ATOMIC_TITLES[0]
    : null;
  const equippedHead = equippedAtomicGear?.head
    ? ATOMIC_PARTS.find((p) => p.id === equippedAtomicGear.head)
    : null;
  const equippedWeapon = equippedAtomicGear?.weapon
    ? ATOMIC_PARTS.find((p) => p.id === equippedAtomicGear.weapon)
    : null;
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // 듀얼 퀘스트 완료 개수 계산
  const dualQuestCount = (dailyDualQuest?.languageDone ? 1 : 0) + (dailyDualQuest?.mathDone ? 1 : 0);
  const hasMenuAlert = !isTodayAttended || wrongCount > 0;
  const displayStampProgress = stampCount !== undefined ? `${stampCount}/7일` : `${attendanceStreak}일`;

  useEffect(() => {
    if (!isMenuOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMenuOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMenuOpen]);

  const handleMenuAction = (action?: () => void) => {
    setIsMenuOpen(false);
    action?.();
  };

  return (
    <>
      <header
        className="w-full flex-none bg-slate-950/95 border-b border-slate-800/80 backdrop-blur-md px-2 sm:px-3 md:px-4 py-1.5 z-40 shadow-sm select-none"
        style={{
          paddingTop: 'max(6px, env(safe-area-inset-top, 6px))',
          paddingLeft: 'max(10px, env(safe-area-inset-left, 10px))',
          paddingRight: 'max(10px, env(safe-area-inset-right, 10px))',
        }}
      >
        <div className="w-full max-w-6xl mx-auto flex flex-wrap md:flex-nowrap items-center justify-between gap-1.5 sm:gap-3">
          {/* ─── 1. 좌측: 캐릭터 아바타 + 고질라 레벨 & EXP HUD ─── */}
          <div className="flex items-center gap-2 shrink-0 order-1">
            <div
              className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 select-none shadow-sm transition-all"
              style={{
                background: 'linear-gradient(135deg, #06b6d4 0%, #2563eb 100%)',
                border:
                  aura.tier !== 'none'
                    ? `1.5px solid ${aura.themeColor}`
                    : '1.5px solid rgba(165, 243, 252, 0.7)',
                boxShadow:
                  aura.tier !== 'none'
                    ? aura.glowShadow
                    : '0 0 10px rgba(6, 182, 212, 0.35)',
              }}
            >
              {equippedHead && (
                <span
                  className="absolute -top-2 left-1/2 -translate-x-1/2 text-[11px] leading-none drop-shadow pointer-events-none"
                  title={equippedHead.name}
                >
                  {equippedHead.turretEmoji || equippedHead.icon}
                </span>
              )}
              <span className="text-lg sm:text-xl leading-none">🦖</span>
              {equippedWeapon && equippedWeapon.id !== 'part_weapon_standard' && (
                <span
                  className="absolute -bottom-1 -right-1 text-[10px] leading-none drop-shadow pointer-events-none"
                  title={equippedWeapon.name}
                >
                  {equippedWeapon.icon}
                </span>
              )}
            </div>

            <div className="flex flex-col justify-center min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs sm:text-sm font-black tracking-tight text-amber-300 whitespace-nowrap">
                  고질라
                </span>

                {/* 현재 진화 폼 미니 뱃지 */}
                <span
                  title={`${evo.name} (${evo.beamName})`}
                  className="px-1.5 py-0.5 rounded-md text-[10px] sm:text-[11px] font-black whitespace-nowrap shrink-0 text-white leading-none"
                  style={{
                    background: evo.badgeBg,
                    border: `1px solid ${evo.themeColor}`,
                  }}
                >
                  {evo.icon} {evo.shortName}
                </span>

                {equippedTitle && equippedTitle.id !== 'title_default' && (
                  <span
                    title={`아토믹 칭호: ${equippedTitle.title}`}
                    className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-cyan-950/90 border border-cyan-400/70 text-cyan-200 text-[10px] font-black whitespace-nowrap shrink-0 leading-none"
                  >
                    <span>{equippedTitle.badgeIcon}</span>
                    <span>{equippedTitle.title.replace(/^[^\s]+\s/, '')}</span>
                  </span>
                )}

                {streak > 1 && (
                  <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-400/40 whitespace-nowrap shrink-0 leading-none">
                    🔥{streak}
                  </span>
                )}
              </div>

              {/* 레벨 (각성 아우라 테두리 & 글로우) & 슬림 EXP 게이지 */}
              <div className="flex items-center gap-1.5 mt-1 text-[10px] sm:text-[11px] whitespace-nowrap">
                <span
                  className="font-black flex items-center gap-0.5 px-1.5 py-0.5 rounded leading-none transition-all"
                  style={{
                    color: aura.tier !== 'none' ? aura.themeColor : '#67e8f9',
                    border:
                      aura.tier !== 'none'
                        ? `1px solid ${aura.themeColor}aa`
                        : '1px solid rgba(6, 182, 212, 0.35)',
                    boxShadow:
                      aura.tier !== 'none'
                        ? `0 0 8px ${aura.themeColor}66`
                        : 'none',
                    backgroundColor:
                      aura.tier !== 'none'
                        ? `${aura.themeColor}1a`
                        : 'rgba(15, 23, 42, 0.7)',
                  }}
                  title={aura.tier !== 'none' ? `[각성 아우라] ${aura.name} (${aura.description})` : undefined}
                >
                  <Award
                    className="w-3 h-3 shrink-0"
                    style={{ color: aura.tier !== 'none' ? aura.themeColor : '#fbbf24' }}
                  />
                  LV.{level}
                  {aura.tier !== 'none' && (
                    <span className="text-[10px] ml-0.5" title={aura.name}>
                      {aura.icon}
                    </span>
                  )}
                </span>
                <div
                  className="w-14 sm:w-20 bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700 shrink-0"
                  title={`경험치: ${expProgress}%`}
                >
                  <div
                    className="h-full bg-gradient-to-r from-cyan-400 to-amber-400 rounded-full transition-all duration-300"
                    style={{ width: `${expProgress}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-400 font-bold">{expProgress}%</span>
              </div>
            </div>
          </div>

          {/* ─── 2. 중앙: 핵심 과목 스위치 (언어 배틀 / 산수 요격) + 오늘 퀘스트 ─── */}
          {onSelectMode && (
            <div className="w-full md:w-auto order-3 md:order-2 flex justify-center py-0.5 md:py-0">
              <div className="flex items-center gap-1.5 bg-slate-900/95 p-1 rounded-xl border border-slate-800 shadow-inner">
                {/* [ 🔤 언어 배틀 ] */}
                <button
                  type="button"
                  onClick={() => onSelectMode('language')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs sm:text-sm font-black transition-all cursor-pointer active:scale-95 ${
                    activeMode === 'language'
                      ? 'bg-cyan-950 text-cyan-200 border border-cyan-400/80 shadow-[0_0_12px_rgba(6,182,212,0.35)] ring-1 ring-cyan-400/40'
                      : 'text-slate-400 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  <span>🔤</span>
                  <span>언어 배틀</span>
                  {dailyDualQuest?.languageDone && (
                    <span className="text-emerald-400 text-xs font-black" title="언어 훈련 완료">
                      ✓
                    </span>
                  )}
                </button>

                {/* [ 🔢 산수 요격 ] */}
                <button
                  type="button"
                  onClick={() => onSelectMode('math')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs sm:text-sm font-black transition-all cursor-pointer active:scale-95 ${
                    activeMode === 'math'
                      ? 'bg-amber-950 text-amber-200 border border-amber-400/80 shadow-[0_0_12px_rgba(245,158,11,0.35)] ring-1 ring-amber-400/40'
                      : 'text-slate-400 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  <span>🔢</span>
                  <span>산수 요격</span>
                  {dailyDualQuest?.mathDone && (
                    <span className="text-emerald-400 text-xs font-black" title="산수 훈련 완료">
                      ✓
                    </span>
                  )}
                </button>

                {/* 오늘의 퀘스트 달성 뱃지 */}
                {dailyDualQuest && (
                  <span
                    title={
                      dualQuestCount === 2
                        ? '오늘의 듀얼 퀘스트 2/2 완주! (보너스 알 획득 완료)'
                        : dualQuestCount === 1
                        ? '오늘 출석+알 획득 완료! (1과목 더 하면 보너스 알 추가)'
                        : '오늘 1과목만 완주해도 출석+괴수 알 지급!'
                    }
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] sm:text-xs font-black shrink-0 transition-all ${
                      dualQuestCount === 2
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : dualQuestCount === 1
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-slate-800/80 text-slate-400 border border-slate-700/60'
                    }`}
                  >
                    <span>⚡</span>
                    <span>{dualQuestCount === 2 ? '2/2 🎉' : `${dualQuestCount}/2`}</span>
                  </span>
                )}
              </div>
            </div>
          )}

          {/* ─── 3. 우측: 핵심 재화(알 · 쿠폰 · 도감 · 상자) + [☰ 메뉴] ─── */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 order-2 md:order-3">
            {/* [재화 1] 🥚 괴수 알 */}
            {onOpenGacha && (
              <button
                type="button"
                onClick={onOpenGacha}
                title={`보유 중인 괴수 알: ${eggCount}개 (클릭 시 알 깨기)`}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs sm:text-sm font-black transition-all active:scale-95 border cursor-pointer shrink-0 ${
                  eggCount > 0
                    ? 'bg-amber-950/50 border-amber-500/75 text-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.28)]'
                    : 'bg-slate-900/90 border-slate-800 text-slate-400'
                }`}
              >
                <span className="leading-none">🥚</span>
                <span>{eggCount}</span>
              </button>
            )}

            {/* [재화 2] 🎁 황금 보물상자 (1개 이상 보유 시에만 반짝이며 노출) */}
            {onOpenTreasureBox && treasureBoxCount > 0 && (
              <button
                type="button"
                onClick={onOpenTreasureBox}
                title={`보유 중인 황금 보물상자: ${treasureBoxCount}개 (클릭 시 상자 개봉!)`}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs sm:text-sm font-black transition-all active:scale-95 border cursor-pointer shrink-0 bg-amber-950/70 border-amber-400 text-amber-300 shadow-[0_0_10px_rgba(251,191,36,0.45)] animate-pulse"
              >
                <span className="leading-none">🎁</span>
                <span>{treasureBoxCount}</span>
              </button>
            )}

            {/* [재화 3] 🎟️ 쿠폰 */}
            {onOpenCouponModal && (
              <button
                type="button"
                onClick={onOpenCouponModal}
                title={`보관된 쿠폰함 (${unusedCouponCount}장 보유)`}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs sm:text-sm font-black transition-all active:scale-95 border cursor-pointer shrink-0 ${
                  unusedCouponCount > 0
                    ? 'bg-rose-950/50 border-rose-500/75 text-rose-300 shadow-[0_0_8px_rgba(244,63,94,0.28)]'
                    : 'bg-slate-900/90 border-slate-800 text-slate-400'
                }`}
              >
                <span className="leading-none">🎟️</span>
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
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900/90 border border-amber-500/50 text-amber-300 text-xs sm:text-sm font-black transition-all active:scale-95 cursor-pointer shrink-0 shadow-[0_0_8px_rgba(245,158,11,0.18)]"
            >
              <span className="leading-none">
                {partnerMonster ? partnerMonster.partnerSkill.icon : '📖'}
              </span>
              <span>
                {unlockedMonsterCount}/{totalMonsterCount}
              </span>
            </button>

            {/* 복습 모드 나가기 버튼 */}
            {isReviewMode && onExitReviewMode && (
              <button
                type="button"
                onClick={onExitReviewMode}
                title="오답 복습 특훈 종료 → 일반 모드로 복귀"
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-900/70 border border-amber-400 text-amber-200 text-xs sm:text-sm font-black transition-all active:scale-95 cursor-pointer shrink-0"
              >
                <LogOut className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                <span>종료</span>
              </button>
            )}

            {/* [☰ 메뉴] 통합 버튼 */}
            <button
              type="button"
              onClick={() => setIsMenuOpen(true)}
              aria-label="전체 메뉴 열기"
              aria-expanded={isMenuOpen}
              className="relative flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-600/80 hover:border-cyan-400/70 text-slate-100 text-xs sm:text-sm font-black transition-all active:scale-95 cursor-pointer shrink-0 shadow-sm"
            >
              <Menu className="w-4 h-4 text-cyan-300 shrink-0" />
              <span>메뉴</span>
              {hasMenuAlert && (
                <span
                  aria-hidden="true"
                  className="absolute -top-1 -right-1 flex h-2.5 w-2.5"
                >
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500 border border-slate-950" />
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ─── 통합 [☰ 메뉴] 태블릿용 드롭다운 / 모달 패널 ─── */}
      {isMenuOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="고질라 배틀 전체 메뉴"
          className="fixed inset-0 z-[9990] bg-slate-950/75 backdrop-blur-sm flex items-start justify-center sm:justify-end p-3 sm:p-5 animate-fadeIn"
          onClick={() => setIsMenuOpen(false)}
        >
          <div
            className="w-full max-w-md bg-slate-900 border-2 border-cyan-500/50 rounded-2xl shadow-2xl shadow-cyan-950/60 overflow-hidden mt-10 sm:mt-12 max-h-[85dvh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 패널 상단 헤더 */}
            <div className="flex items-center justify-between px-4 py-3 bg-slate-950/90 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-lg">🦖</span>
                <div>
                  <h2 className="text-sm sm:text-base font-black text-white leading-tight">
                    고질라 배틀 메뉴
                  </h2>
                  <p className="text-[11px] text-slate-400 font-semibold">
                    보너스 게임 · 출석/오답 · 부모님 설정
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMenuOpen(false)}
                aria-label="메뉴 닫기"
                className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 스크롤 본문 */}
            <div className="p-4 space-y-5 overflow-y-auto">
              {/* 섹션 1: 🎮 보너스 게임 & 특훈 */}
              <div>
                <div className="text-xs font-black text-cyan-300 tracking-wide mb-2.5 flex items-center gap-1.5">
                  <span>🎮</span>
                  <span>보너스 게임 &amp; 특훈</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {onOpenSpeedQuiz && (
                    <button
                      type="button"
                      onClick={() => handleMenuAction(onOpenSpeedQuiz)}
                      className="flex items-center gap-2.5 p-3 rounded-xl bg-purple-950/50 hover:bg-purple-900/60 border border-yellow-400/50 text-left transition-all active:scale-95 cursor-pointer"
                    >
                      <span className="text-xl shrink-0">⚡</span>
                      <div className="min-w-0">
                        <div className="text-xs sm:text-sm font-black text-yellow-300 truncate">
                          30초 번개퀴즈
                        </div>
                        <div className="text-[10px] text-slate-300 truncate">스피드 보너스</div>
                      </div>
                    </button>
                  )}

                  {onOpenGeometryLab && (
                    <button
                      type="button"
                      onClick={() => handleMenuAction(onOpenGeometryLab)}
                      className="flex items-center gap-2.5 p-3 rounded-xl bg-cyan-950/50 hover:bg-cyan-900/60 border border-cyan-400/50 text-left transition-all active:scale-95 cursor-pointer"
                    >
                      <span className="text-xl shrink-0">📐</span>
                      <div className="min-w-0">
                        <div className="text-xs sm:text-sm font-black text-cyan-200 truncate">
                          도형·서술형 연구소
                        </div>
                        <div className="text-[10px] text-slate-300 truncate">그림 산수 특훈</div>
                      </div>
                    </button>
                  )}

                  {onOpenSchoolMission && (
                    <button
                      type="button"
                      onClick={() => handleMenuAction(onOpenSchoolMission)}
                      className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-500/50 text-left transition-all active:scale-95 cursor-pointer"
                    >
                      <span className="text-xl shrink-0">🏫</span>
                      <div className="min-w-0">
                        <div className="text-xs sm:text-sm font-black text-emerald-200 truncate">
                          고질라 학교 탐험
                        </div>
                        <div className="text-[10px] text-slate-300 truncate">일본어 모험</div>
                      </div>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleMenuAction(onOpenReviewModal)}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all active:scale-95 cursor-pointer ${
                      wrongCount > 0
                        ? 'bg-rose-950/50 hover:bg-rose-900/60 border-rose-400/60'
                        : 'bg-slate-800/70 hover:bg-slate-800 border-slate-700'
                    }`}
                  >
                    <BookOpen
                      className={`w-5 h-5 shrink-0 ${wrongCount > 0 ? 'text-rose-400' : 'text-slate-400'}`}
                    />
                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm font-black text-white truncate">
                        오답노트 &amp; 레이드
                      </div>
                      <div
                        className={`text-[10px] font-bold truncate ${
                          wrongCount > 0 ? 'text-rose-300' : 'text-slate-400'
                        }`}
                      >
                        {wrongCount}개 대기 중
                      </div>
                    </div>
                  </button>

                  {onOpenAttendanceModal && (
                    <button
                      type="button"
                      onClick={() => handleMenuAction(onOpenAttendanceModal)}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all active:scale-95 cursor-pointer ${
                        isTodayAttended
                          ? 'bg-emerald-950/40 hover:bg-emerald-900/50 border-emerald-500/50'
                          : 'bg-amber-950/50 hover:bg-amber-900/60 border-amber-400/60'
                      }`}
                    >
                      <span className="text-xl shrink-0">🐾</span>
                      <div className="min-w-0">
                        <div className="text-xs sm:text-sm font-black text-white truncate">
                          7일 출석 스탬프
                        </div>
                        <div className="text-[10px] text-amber-300 font-bold truncate">
                          {displayStampProgress} · 누적 {cumulativeAttendanceDays}일
                        </div>
                      </div>
                    </button>
                  )}

                  {onOpenTreasureBox && (
                    <button
                      type="button"
                      onClick={() => handleMenuAction(onOpenTreasureBox)}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all active:scale-95 cursor-pointer ${
                        treasureBoxCount > 0
                          ? 'bg-amber-950/60 hover:bg-amber-900/70 border-amber-400'
                          : 'bg-slate-800/70 hover:bg-slate-800 border-slate-700'
                      }`}
                    >
                      <span className="text-xl shrink-0">🎁</span>
                      <div className="min-w-0">
                        <div className="text-xs sm:text-sm font-black text-amber-200 truncate">
                          황금 보물상자
                        </div>
                        <div className="text-[10px] text-slate-300 font-bold truncate">
                          {treasureBoxCount}개 보유
                        </div>
                      </div>
                    </button>
                  )}
                </div>
              </div>

              {/* 섹션 2: ⚙️ 설정 & 학부모 메뉴 */}
              <div>
                <div className="text-xs font-black text-slate-300 tracking-wide mb-2.5 flex items-center gap-1.5">
                  <span>⚙️</span>
                  <span>설정 &amp; 학부모 메뉴</span>
                </div>
                <div className="space-y-2">
                  {onToggleVoiceAttack && (
                    <button
                      type="button"
                      onClick={() => handleMenuAction(onToggleVoiceAttack)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border transition-all active:scale-[0.99] cursor-pointer ${
                        isVoiceAttackEnabled
                          ? 'bg-rose-950/40 border-rose-500/60 text-rose-200'
                          : 'bg-slate-800/70 border-slate-700 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        {isVoiceAttackEnabled ? (
                          <Mic className="w-4 h-4 text-rose-400 shrink-0" />
                        ) : (
                          <MicOff className="w-4 h-4 text-slate-400 shrink-0" />
                        )}
                        <span className="text-xs sm:text-sm font-black">
                          🎙️ 음성 포효 공격
                        </span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
                          isVoiceAttackEnabled
                            ? 'bg-rose-500 text-white'
                            : 'bg-slate-700 text-slate-300'
                        }`}
                      >
                        {isVoiceAttackEnabled ? '켜짐' : '꺼짐'}
                      </span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleMenuAction(onOpenParentModal)}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-100 transition-all active:scale-[0.99] cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <Settings className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span className="text-xs sm:text-sm font-black">
                        ⚙️ 단어 숙제 설정 &amp; 리포트
                      </span>
                    </div>
                  </button>

                  {isParentAdmin && onOpenParentAdmin && (
                    <button
                      type="button"
                      onClick={() => handleMenuAction(onOpenParentAdmin)}
                      className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-rose-500/20 hover:brightness-110 border border-amber-400/70 text-amber-200 transition-all active:scale-[0.99] cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-base leading-none">📊</span>
                        <span className="text-xs sm:text-sm font-black">학부모 원격 관리</span>
                      </div>
                    </button>
                  )}

                  {!isStandalone && onOpenInstall && (
                    <button
                      type="button"
                      onClick={() => handleMenuAction(onOpenInstall)}
                      className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600/30 to-indigo-600/30 hover:brightness-110 border border-cyan-400/60 text-cyan-200 transition-all active:scale-[0.99] cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-base leading-none">📱</span>
                        <span className="text-xs sm:text-sm font-black">홈 화면에 앱 설치</span>
                      </div>
                    </button>
                  )}

                  {onSignOut && (
                    <button
                      type="button"
                      onClick={() => handleMenuAction(onSignOut)}
                      className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-800/50 hover:bg-rose-950/40 border border-slate-700/80 hover:border-rose-500/50 text-slate-300 hover:text-rose-300 transition-all active:scale-[0.99] cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <LogOut className="w-4 h-4 shrink-0" />
                        <span className="text-xs sm:text-sm font-black">🚪 로그아웃</span>
                      </div>
                      {userEmail && (
                        <span className="text-[10px] text-slate-400 truncate max-w-[160px]">
                          {userEmail}
                        </span>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
