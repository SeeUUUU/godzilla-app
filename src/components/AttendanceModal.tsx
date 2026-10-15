import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { X, Flame, Award, Sparkles, CheckCircle2, Lock, Gift, Ticket, RotateCcw } from 'lucide-react';
import type { AttendanceStampSlot } from '../types';
import type { AttendanceDayInfo } from '../hooks/useAttendance';
import { getAttendanceStampSlots } from '../hooks/useAttendance';
import { loadCoupons, type EarnedCoupon } from '../data/gachaRewards';
import { playStampThudSound, playVictoryFanfare } from '../utils/soundEffects';
import { CouponModal } from './CouponModal';

export { CouponModal };

interface AttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStreak: number;
  maxStreak: number;
  stampCount?: number;
  cumulativeAttendanceDays?: number;
  stampSlots?: AttendanceStampSlot[];
  isTodayAttended: boolean;
  isNewlyAttended?: boolean;
  onOpenLuckyGacha?: () => void;
  onResetStampCycle?: () => void;
  treasureBoxCount?: number;
  initialShowCoupons?: boolean;
  onCouponsChanged?: () => void;
  // 하위 호환성용 props
  weekDays?: AttendanceDayInfo[];
  weekAttendedCount?: number;
  hasClaimedWeeklyReward?: boolean;
}

// 귀여운 고질라 발자국 스탬프 SVG
export const GodzillaFootprintStamp: React.FC<{
  size?: number;
  color?: string;
  isAnimated?: boolean;
}> = ({ size = 44, color = '#10b981', isAnimated = false }) => {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        animation: isAnimated ? 'stampSlam 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards' : 'none',
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          filter: `drop-shadow(0 0 8px ${color}aa)`,
          transform: 'rotate(-4deg)',
        }}
      >
        <path
          d="M16 26 C13 16, 18 9, 22 7 C24 14, 24 22, 21 27 C19 30, 17 30, 16 26 Z"
          fill={color}
        />
        <path
          d="M32 5 C27 15, 27 24, 32 28 C37 24, 37 15, 32 5 Z"
          fill={color}
        />
        <path
          d="M48 26 C51 16, 46 9, 42 7 C40 14, 40 22, 43 27 C45 30, 47 30, 48 26 Z"
          fill={color}
        />
        <path
          d="M20 32 C13 36, 14 49, 21 55 C27 60, 37 60, 43 55 C50 49, 51 36, 44 32 C38 34, 26 34, 20 32 Z"
          fill={color}
        />
        <ellipse cx="32" cy="46" rx="7" ry="5" fill="#065f46" opacity="0.6" />
        <ellipse cx="23" cy="41" rx="3.5" ry="3" fill="#065f46" opacity="0.5" />
        <ellipse cx="41" cy="41" rx="3.5" ry="3" fill="#065f46" opacity="0.5" />
      </svg>
    </div>
  );
};

export const AttendanceModal: React.FC<AttendanceModalProps> = ({
  isOpen,
  onClose,
  currentStreak,
  maxStreak,
  stampCount: rawStampCount,
  cumulativeAttendanceDays = 0,
  stampSlots: propStampSlots,
  isTodayAttended,
  isNewlyAttended = false,
  onOpenLuckyGacha,
  onResetStampCycle,
  treasureBoxCount = 0,
  initialShowCoupons = false,
  onCouponsChanged,
  weekAttendedCount,
}) => {
  const [shouldAnimateStamp, setShouldAnimateStamp] = useState(false);
  const [showCoupons, setShowCoupons] = useState(initialShowCoupons);
  const [coupons, setCoupons] = useState<EarnedCoupon[]>([]);

  // stampCount 결정 (props 또는 weekAttendedCount 하위 호환)
  const stampCount = Math.max(0, Math.min(7, rawStampCount !== undefined ? rawStampCount : (weekAttendedCount ?? 0)));
  const isSevenDaysComplete = stampCount >= 7;

  // 스탬프 슬롯 배열 (props 또는 내부 생성)
  const slots = propStampSlots || getAttendanceStampSlots(stampCount);

  useEffect(() => {
    if (isOpen && isNewlyAttended) {
      setShouldAnimateStamp(true);
      playStampThudSound();

      if (isSevenDaysComplete) {
        playVictoryFanfare();
        confetti({
          particleCount: 160,
          spread: 100,
          origin: { y: 0.5 },
          colors: ['#fbbf24', '#f59e0b', '#10b981', '#38bdf8', '#ef4444'],
        });
      } else {
        confetti({
          particleCount: 80,
          spread: 75,
          origin: { y: 0.55 },
          colors: ['#10b981', '#34d399', '#fde047', '#06b6d4'],
        });
      }
    } else {
      setShouldAnimateStamp(false);
    }

    if (isOpen) {
      setCoupons(loadCoupons());
      setShowCoupons(initialShowCoupons);
    }
  }, [isOpen, isNewlyAttended, isSevenDaysComplete, initialShowCoupons]);

  if (!isOpen) return null;

  const progressPercent = Math.round((stampCount / 7) * 100);
  const unusedCoupons = coupons.filter((c) => !c.isUsed && c.minutes > 0);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(2, 6, 23, 0.92)',
        backdropFilter: 'blur(8px)',
        padding: '12px',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '500px',
          maxHeight: '94vh',
          overflowY: 'auto',
          backgroundColor: '#0f172a',
          border: isSevenDaysComplete ? '2.5px solid #f59e0b' : '2px solid rgba(16, 185, 129, 0.5)',
          borderRadius: '24px',
          boxShadow: isSevenDaysComplete
            ? '0 0 50px rgba(245, 158, 11, 0.45)'
            : '0 0 40px rgba(16, 185, 129, 0.35)',
          padding: '20px 18px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          transition: 'all 0.3s ease',
        }}
      >
        {/* 닫기 버튼 */}
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: 'rgba(30, 41, 59, 0.8)',
            border: '1px solid #475569',
            borderRadius: '9999px',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#94a3b8',
            cursor: 'pointer',
          }}
        >
          <X size={18} />
        </button>

        {/* 상단 쿠폰함 버튼 */}
        <button
          type="button"
          onClick={() => setShowCoupons((v) => !v)}
          style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 10px',
            borderRadius: '9999px',
            backgroundColor: unusedCoupons.length > 0 ? 'rgba(245, 158, 11, 0.2)' : '#1e293b',
            border: unusedCoupons.length > 0 ? '1.5px solid #f59e0b' : '1px solid #475569',
            color: unusedCoupons.length > 0 ? '#fde047' : '#94a3b8',
            fontSize: '11px',
            fontWeight: 800,
            cursor: 'pointer',
          }}
        >
          <Ticket size={12} />
          <span>쿠폰함</span>
          {unusedCoupons.length > 0 && (
            <span
              style={{
                backgroundColor: '#ef4444',
                color: '#fff',
                borderRadius: '9999px',
                fontSize: '10px',
                fontWeight: 900,
                padding: '0 5px',
              }}
            >
              {unusedCoupons.length}
            </span>
          )}
        </button>

        {/* ─── 쿠폰함 뷰 ─── */}
        {showCoupons ? (
          <CouponModal
            embedded={true}
            onBackToAttendance={() => setShowCoupons(false)}
            onCouponsChanged={() => {
              setCoupons(loadCoupons());
              onCouponsChanged?.();
            }}
          />
        ) : (
          /* ─── 메인 7일 누적 출석부 뷰 ─── */
          <>
            <div style={{ height: '20px' }} />

            {/* 상단 배지 */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 14px',
                borderRadius: '9999px',
                background: isSevenDaysComplete
                  ? 'linear-gradient(90deg, #b45309, #f59e0b)'
                  : 'linear-gradient(90deg, #047857, #10b981)',
                marginBottom: '8px',
                border: isSevenDaysComplete ? '1.5px solid #fde047' : '1.5px solid #6ee7b7',
                boxShadow: isSevenDaysComplete
                  ? '0 0 16px rgba(245, 158, 11, 0.7)'
                  : '0 0 14px rgba(16, 185, 129, 0.6)',
              }}
            >
              <Sparkles size={14} color="#fef08a" />
              <span style={{ fontSize: '12px', fontWeight: 900, color: '#ffffff' }}>
                🐾 고질라의 누적 7일 스탬프 판
              </span>
            </div>

            {/* 메인 타이틀 */}
            <h2
              style={{
                fontSize: '22px',
                fontWeight: 900,
                color: '#ffffff',
                margin: '0 0 4px 0',
                textAlign: 'center',
                letterSpacing: '-0.02em',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              {isSevenDaysComplete ? (
                <>
                  <span style={{ fontSize: '24px' }}>🎉</span>
                  <span style={{ color: '#fde047' }}>7일 스탬프 완성!</span>
                </>
              ) : (
                <>
                  <Flame size={24} color="#f59e0b" />
                  <span>{stampCount} / 7일 스탬프 모음!</span>
                </>
              )}
            </h2>

            {/* 든든한 상단 안내 문구: "하루 빠져도 괜찮아요! 언제든 7일을 채우면 황금 보물상자 100% 지급! 🐾" */}
            <div
              style={{
                width: '100%',
                backgroundColor: 'rgba(56, 189, 248, 0.1)',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                borderRadius: '12px',
                padding: '8px 12px',
                margin: '4px 0 12px 0',
                textAlign: 'center',
              }}
            >
              <p
                style={{
                  fontSize: '12px',
                  color: '#7dd3fc',
                  fontWeight: 800,
                  margin: 0,
                  lineHeight: '1.4',
                }}
              >
                🐾 하루 빠져도 괜찮아요! 언제든 7일을 채우면 황금 보물상자 100% 지급! 🎁
              </p>
            </div>

            {/* 오늘 출석 상태 안내 */}
            <p
              style={{
                fontSize: '12px',
                color: '#cbd5e1',
                fontWeight: 700,
                margin: '0 0 14px 0',
                textAlign: 'center',
              }}
            >
              {isTodayAttended ? (
                <span style={{ color: '#4ade80' }}>
                  🎉 오늘 출석 완료! 스탬프 판에 고질라 발자국이 쾅 찍혔어요!
                </span>
              ) : (
                <span style={{ color: '#fde047' }}>
                  일일 듀얼 훈련(언어 1판 + 산수 1판)을 모두 완주하면 오늘의 발자국이 쾅 찍혀요!
                </span>
              )}
            </p>

            {/* 오늘의 출석 보상 알 획득 강조 배너 */}
            {isTodayAttended && (
              <div
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  backgroundColor: isNewlyAttended ? 'rgba(234, 179, 8, 0.2)' : 'rgba(234, 179, 8, 0.1)',
                  border: isNewlyAttended ? '1.5px solid #facc15' : '1px solid rgba(234, 179, 8, 0.4)',
                  borderRadius: '12px',
                  padding: '8px 12px',
                  marginBottom: '14px',
                  boxShadow: isNewlyAttended ? '0 0 15px rgba(250, 204, 21, 0.35)' : 'none',
                }}
              >
                <span style={{ fontSize: '18px' }}>🥚</span>
                <span style={{ fontSize: '12.5px', fontWeight: 900, color: '#fef08a' }}>
                  오늘의 출석 보상: 신비한 괴수 알 획득!
                </span>
              </div>
            )}

            {/* 누적 통계 요약 카드 (현재 스탬프, 총 누적 출석, 연속 출석) */}
            <div
              style={{
                width: '100%',
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '8px',
                backgroundColor: '#020617',
                borderRadius: '16px',
                padding: '10px 12px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                marginBottom: '16px',
                textAlign: 'center',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ fontSize: '10.5px', color: '#94a3b8', fontWeight: 700 }}>현재 스탬프</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginTop: '2px' }}>
                  <span style={{ fontSize: '14px' }}>🐾</span>
                  <span style={{ fontSize: '17px', fontWeight: 900, color: '#6ee7b7' }}>
                    {stampCount}/7
                  </span>
                </div>
              </div>

              <div style={{ borderLeft: '1px solid #334155', borderRight: '1px solid #334155', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ fontSize: '10.5px', color: '#94a3b8', fontWeight: 700 }}>총 누적 출석</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginTop: '2px' }}>
                  <Award size={15} color="#f59e0b" />
                  <span style={{ fontSize: '17px', fontWeight: 900, color: '#fde047' }}>
                    {cumulativeAttendanceDays}일
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ fontSize: '10.5px', color: '#94a3b8', fontWeight: 700 }}>연속 출석</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginTop: '2px' }}>
                  <Flame size={15} color="#ef4444" />
                  <span
                    style={{ fontSize: '17px', fontWeight: 900, color: '#fca5a5' }}
                    title={`역대 최장 연속 기록: ${maxStreak}일`}
                  >
                    {currentStreak}일
                  </span>
                </div>
                <span style={{ fontSize: '9px', color: '#64748b', fontWeight: 700, marginTop: '1px' }}>
                  최고 {maxStreak}일
                </span>
              </div>
            </div>

            {/* ─── 7일 누적 스탬프 슬롯 그리드 (DAY 1 ~ DAY 7) ─── */}
            <div
              style={{
                width: '100%',
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: '6px',
                marginBottom: '16px',
              }}
            >
              {slots.map((slot) => {
                const isTargetAnimate = shouldAnimateStamp && slot.dayIndex === stampCount;
                const isGoldenSlot = slot.isRewardSlot;

                return (
                  <div
                    key={slot.dayIndex}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      padding: '8px 4px',
                      borderRadius: '12px',
                      backgroundColor: slot.isStamped
                        ? isGoldenSlot
                          ? 'rgba(245, 158, 11, 0.25)'
                          : 'rgba(16, 185, 129, 0.18)'
                        : isGoldenSlot
                        ? 'rgba(245, 158, 11, 0.1)'
                        : slot.isCurrentTarget
                        ? 'rgba(245, 158, 11, 0.15)'
                        : 'rgba(30, 41, 59, 0.4)',
                      border: slot.isStamped
                        ? isGoldenSlot
                          ? '2px solid #fbbf24'
                          : '1.5px solid #10b981'
                        : isGoldenSlot
                        ? '1.5px dashed #f59e0b'
                        : slot.isCurrentTarget
                        ? '2px dashed #f59e0b'
                        : '1px solid #334155',
                      boxShadow: slot.isStamped
                        ? isGoldenSlot
                          ? '0 0 16px rgba(251, 191, 36, 0.6)'
                          : '0 0 12px rgba(16, 185, 129, 0.3)'
                        : slot.isCurrentTarget
                        ? '0 0 12px rgba(245, 158, 11, 0.3)'
                        : 'none',
                      transition: 'all 0.25s ease',
                      position: 'relative',
                    }}
                  >
                    {/* 상단 라벨 (DAY 1 ~ DAY 7) */}
                    <span
                      style={{
                        fontSize: '10.5px',
                        fontWeight: 900,
                        color: isGoldenSlot ? '#fde047' : '#cbd5e1',
                        marginBottom: '4px',
                        letterSpacing: '-0.02em',
                      }}
                    >
                      DAY {slot.dayIndex}
                    </span>

                    {/* 중앙 스탬프 / 보물상자 아이콘 영역 */}
                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {isGoldenSlot ? (
                        // 7일차 황금 보물상자 슬롯
                        slot.isStamped ? (
                          <div
                            style={{
                              fontSize: '28px',
                              animation: 'chestBounce 1.5s infinite',
                              filter: 'drop-shadow(0 0 8px rgba(251, 191, 36, 0.9))',
                            }}
                          >
                            🎁
                          </div>
                        ) : (
                          <div
                            style={{
                              fontSize: '24px',
                              opacity: slot.isCurrentTarget ? 0.95 : 0.65,
                              filter: slot.isCurrentTarget
                                ? 'drop-shadow(0 0 6px rgba(245, 158, 11, 0.6))'
                                : 'grayscale(30%)',
                            }}
                          >
                            🎁
                          </div>
                        )
                      ) : slot.isStamped ? (
                        // 1~6일차 일반 고질라 발자국 스탬프
                        <GodzillaFootprintStamp size={34} color="#10b981" isAnimated={isTargetAnimate} />
                      ) : slot.isCurrentTarget ? (
                        // 다음 찍힐 슬롯 (펄스 링)
                        <div
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '9999px',
                            border: '2px dashed #f59e0b',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '12px',
                            color: '#fde047',
                            fontWeight: 900,
                          }}
                        >
                          🐾
                        </div>
                      ) : (
                        // 미달성 미래 슬롯
                        <Lock size={15} color="#475569" />
                      )}
                    </div>

                    {/* 하단 상태 텍스트 */}
                    <span
                      style={{
                        fontSize: '9px',
                        fontWeight: 800,
                        marginTop: '4px',
                        color: slot.isStamped
                          ? isGoldenSlot
                            ? '#fef08a'
                            : '#6ee7b7'
                          : slot.isCurrentTarget
                          ? '#fde047'
                          : '#64748b',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {slot.isStamped
                        ? isGoldenSlot
                          ? '달성! 🎁'
                          : '완료 🐾'
                        : isGoldenSlot
                        ? '황금상자'
                        : slot.isCurrentTarget
                        ? '오늘 차례'
                        : '대기'}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* ─── 7일 스탬프 미션 & 순환 보상 안내 섹션 ─── */}
            <div
              style={{
                width: '100%',
                backgroundColor: '#020617',
                borderRadius: '16px',
                border: isSevenDaysComplete
                  ? '2px solid #f59e0b'
                  : '1.5px solid rgba(255, 255, 255, 0.1)',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                marginBottom: '16px',
                boxShadow: isSevenDaysComplete ? '0 0 25px rgba(251, 191, 36, 0.45)' : 'none',
                transition: 'all 0.3s ease',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '12px',
                  fontWeight: 800,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#fef08a' }}>
                  <Gift size={16} color="#facc15" />
                  <span>
                    {isSevenDaysComplete
                      ? '🎉 7일 스탬프 완성! 황금 보물상자를 획득했습니다! 🎁'
                      : '7일 스탬프 완성 시: 🎁 황금 보물상자(실물 쿠폰 당첨) 100% 지급!'}
                  </span>
                </div>
                <span
                  style={{
                    color: isSevenDaysComplete ? '#fbbf24' : '#38bdf8',
                    fontWeight: 900,
                    fontSize: '13px',
                  }}
                >
                  {stampCount} / 7일
                </span>
              </div>

              {/* 프로그레스 바 */}
              <div
                style={{
                  width: '100%',
                  backgroundColor: '#1e293b',
                  borderRadius: '9999px',
                  height: '8px',
                  overflow: 'hidden',
                  border: '1px solid #334155',
                }}
              >
                <div
                  style={{
                    width: `${progressPercent}%`,
                    height: '100%',
                    background: isSevenDaysComplete
                      ? 'linear-gradient(90deg, #d97706 0%, #f59e0b 50%, #fbbf24 100%)'
                      : 'linear-gradient(90deg, #06b6d4 0%, #10b981 100%)',
                    borderRadius: '9999px',
                    transition: 'width 0.4s ease',
                    boxShadow: isSevenDaysComplete ? '0 0 8px rgba(251, 191, 36, 0.8)' : 'none',
                  }}
                />
              </div>

              {/* 7일 완성 시 액션 버튼들 */}
              {isSevenDaysComplete ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                  {onOpenLuckyGacha && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        setTimeout(() => onOpenLuckyGacha(), 150);
                      }}
                      style={{
                        width: '100%',
                        padding: '13px',
                        borderRadius: '14px',
                        background: 'linear-gradient(90deg, #92400e 0%, #d97706 40%, #f59e0b 70%, #fbbf24 100%)',
                        color: '#ffffff',
                        fontWeight: 900,
                        fontSize: '15px',
                        border: '2px solid #fde047',
                        boxShadow: '0 0 25px rgba(251, 191, 36, 0.8)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        animation: 'stampGlowPulse 2s infinite',
                      }}
                    >
                      <span style={{ fontSize: '20px' }}>🎁</span>
                      <span>황금 보물상자 열러 가기! (보유: {treasureBoxCount}개)</span>
                      <Sparkles size={16} color="#fde047" />
                    </button>
                  )}

                  {onResetStampCycle && (
                    <button
                      type="button"
                      onClick={() => {
                        onResetStampCycle();
                      }}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '12px',
                        backgroundColor: '#1e293b',
                        color: '#cbd5e1',
                        fontWeight: 800,
                        fontSize: '12px',
                        border: '1px solid #475569',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        transition: 'all 0.2s',
                      }}
                    >
                      <RotateCcw size={13} color="#94a3b8" />
                      <span>새로운 7일 스탬프 판 바로 시작하기 🐾</span>
                    </button>
                  )}
                </div>
              ) : (
                <p style={{ fontSize: '11px', color: '#94a3b8', margin: '2px 0 0 0', textAlign: 'center' }}>
                  💡 7일차 스탬프가 찍히면 황금 보물상자가 즉시 지급되고 새로운 7일 스탬프 판이 시작돼요!
                </p>
              )}
            </div>

            {/* 하단 모험 계속하기 버튼 */}
            <button
              type="button"
              onClick={onClose}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '14px',
                background: 'linear-gradient(90deg, #059669 0%, #10b981 100%)',
                color: '#ffffff',
                fontWeight: 900,
                fontSize: '14px',
                border: '1.5px solid #6ee7b7',
                boxShadow: '0 0 16px rgba(16, 185, 129, 0.5)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <CheckCircle2 size={18} />
              <span>신나게 단어 모험 계속하기!</span>
            </button>
          </>
        )}
      </div>

      <style>{`
        @keyframes stampSlam {
          0% { transform: scale(2.6) rotate(-20deg); opacity: 0; }
          60% { transform: scale(0.9) rotate(-3deg); opacity: 1; }
          80% { transform: scale(1.15) rotate(-5deg); }
          100% { transform: scale(1) rotate(-4deg); opacity: 1; }
        }
        @keyframes stampGlowPulse {
          0%, 100% { box-shadow: 0 0 20px rgba(251, 191, 36, 0.6); }
          50% { box-shadow: 0 0 35px rgba(251, 191, 36, 0.95); }
        }
        @keyframes chestBounce {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-4px) scale(1.08); }
        }
      `}</style>
    </div>
  );
};
