import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { X, Flame, Award, Sparkles, CheckCircle2, Lock, Gift, Ticket } from 'lucide-react';
import type { AttendanceDayInfo } from '../hooks/useAttendance';
import {
  loadCoupons,
  hasClaimedWeeklyReward,
  type EarnedCoupon,
} from '../data/gachaRewards';
import { playStampThudSound } from '../utils/soundEffects';
import { CouponModal } from './CouponModal';

export { CouponModal };

interface AttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStreak: number;
  maxStreak: number;
  weekDays: AttendanceDayInfo[];
  weekAttendedCount: number;
  isTodayAttended: boolean;
  isNewlyAttended?: boolean;
  onOpenLuckyGacha?: () => void;
  hasClaimedWeeklyReward?: boolean;
  initialShowCoupons?: boolean;
  onCouponsChanged?: () => void;
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
  weekDays,
  weekAttendedCount,
  isTodayAttended,
  isNewlyAttended = false,
  onOpenLuckyGacha,
  hasClaimedWeeklyReward: hasClaimedWeeklyRewardProp,
  initialShowCoupons = false,
  onCouponsChanged,
}) => {
  const [shouldAnimateStamp, setShouldAnimateStamp] = useState(false);
  const [showCoupons, setShowCoupons] = useState(initialShowCoupons);
  const [coupons, setCoupons] = useState<EarnedCoupon[]>([]);
  const [claimedWeekly, setClaimedWeekly] = useState(() => hasClaimedWeeklyReward());

  const isWeekComplete = weekAttendedCount === 7;
  const isAlreadyClaimed = hasClaimedWeeklyRewardProp !== undefined ? hasClaimedWeeklyRewardProp : claimedWeekly;

  useEffect(() => {
    if (isOpen) {
      setClaimedWeekly(hasClaimedWeeklyReward());
    }
  }, [isOpen, hasClaimedWeeklyRewardProp]);

  useEffect(() => {
    if (isOpen && isNewlyAttended) {
      setShouldAnimateStamp(true);
      playStampThudSound();
      confetti({
        particleCount: 80,
        spread: 75,
        origin: { y: 0.55 },
        colors: ['#10b981', '#34d399', '#fde047', '#06b6d4'],
      });
    } else {
      setShouldAnimateStamp(false);
    }

    if (isOpen) {
      setCoupons(loadCoupons());
      setShowCoupons(initialShowCoupons);
    }
  }, [isOpen, isNewlyAttended, initialShowCoupons]);

  if (!isOpen) return null;

  const weeklyProgressPercent = Math.round((weekAttendedCount / 7) * 100);
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
          maxWidth: '490px',
          maxHeight: '94vh',
          overflowY: 'auto',
          backgroundColor: '#0f172a',
          border: '2px solid rgba(16, 185, 129, 0.5)',
          borderRadius: '24px',
          boxShadow: '0 0 40px rgba(16, 185, 129, 0.35)',
          padding: '20px 18px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
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
          /* ─── 메인 출석부 뷰 ─── */
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
                background: 'linear-gradient(90deg, #047857, #10b981)',
                marginBottom: '8px',
                border: '1.5px solid #6ee7b7',
                boxShadow: '0 0 14px rgba(16, 185, 129, 0.6)',
              }}
            >
              <Sparkles size={14} color="#fef08a" />
              <span style={{ fontSize: '12px', fontWeight: 900, color: '#ffffff' }}>
                🐾 고질라의 주간 출석부
              </span>
            </div>

            {/* 스트릭 헤더 */}
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
              <Flame size={24} color="#f59e0b" />
              <span>{currentStreak}일 연속 출석 중!</span>
            </h2>

            <p
              style={{
                fontSize: '12px',
                color: '#cbd5e1',
                fontWeight: 700,
                margin: '0 0 16px 0',
                textAlign: 'center',
              }}
            >
              {isTodayAttended ? (
                <span style={{ color: '#4ade80' }}>
                  🎉 오늘 출석 완료! 고질라가 힘차게 발자국을 남겼어요!
                </span>
              ) : (
                <span style={{ color: '#fde047' }}>
                  단어 배틀 1스테이지를 클리어하면 오늘의 발자국이 쾅 찍혀요!
                </span>
              )}
            </p>

            {/* 스트릭 요약 카드 */}
            <div
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-around',
                backgroundColor: '#020617',
                borderRadius: '16px',
                padding: '10px 14px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                marginBottom: '16px',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700 }}>현재 연속 출석</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                  <Flame size={16} color="#ef4444" />
                  <span style={{ fontSize: '18px', fontWeight: 900, color: '#fca5a5' }}>
                    {currentStreak}일
                  </span>
                </div>
              </div>
              <div style={{ width: '1px', height: '28px', backgroundColor: '#334155' }} />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700 }}>역대 최장 기록</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                  <Award size={16} color="#f59e0b" />
                  <span style={{ fontSize: '18px', fontWeight: 900, color: '#fde047' }}>
                    {maxStreak}일
                  </span>
                </div>
              </div>
            </div>

            {/* 이번 주 7일 캘린더 그리드 */}
            <div
              style={{
                width: '100%',
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: '6px',
                marginBottom: '16px',
              }}
            >
              {weekDays.map((dayInfo) => {
                const isTargetAnimate = shouldAnimateStamp && dayInfo.isToday && dayInfo.isAttended;

                return (
                  <div
                    key={dayInfo.dateStr}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      padding: '8px 4px',
                      borderRadius: '12px',
                      backgroundColor: dayInfo.isAttended
                        ? 'rgba(16, 185, 129, 0.18)'
                        : dayInfo.isToday
                        ? 'rgba(245, 158, 11, 0.15)'
                        : 'rgba(30, 41, 59, 0.4)',
                      border: dayInfo.isAttended
                        ? '1.5px solid #10b981'
                        : dayInfo.isToday
                        ? '2px dashed #f59e0b'
                        : '1px solid #334155',
                      boxShadow: dayInfo.isAttended
                        ? '0 0 12px rgba(16, 185, 129, 0.3)'
                        : dayInfo.isToday
                        ? '0 0 14px rgba(245, 158, 11, 0.3)'
                        : 'none',
                      transition: 'all 0.25s ease',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 900,
                        color:
                          dayInfo.dayName === '일'
                            ? '#f87171'
                            : dayInfo.dayName === '토'
                            ? '#60a5fa'
                            : '#cbd5e1',
                        marginBottom: '1px',
                      }}
                    >
                      {dayInfo.dayName}
                    </span>

                    <span
                      style={{
                        fontSize: '10px',
                        color: '#94a3b8',
                        fontWeight: 700,
                        marginBottom: '6px',
                      }}
                    >
                      {dayInfo.day}일
                    </span>

                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {dayInfo.isAttended ? (
                        <GodzillaFootprintStamp size={36} color="#10b981" isAnimated={isTargetAnimate} />
                      ) : dayInfo.isToday ? (
                        <div
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '9999px',
                            border: '2px dashed #f59e0b',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '13px',
                            color: '#fde047',
                          }}
                        >
                          ?
                        </div>
                      ) : dayInfo.isFuture ? (
                        <Lock size={16} color="#475569" />
                      ) : (
                        <span style={{ fontSize: '13px', color: '#475569', fontWeight: 900 }}>-</span>
                      )}
                    </div>

                    <span
                      style={{
                        fontSize: '9px',
                        fontWeight: 800,
                        marginTop: '4px',
                        color: dayInfo.isAttended
                          ? '#6ee7b7'
                          : dayInfo.isToday
                          ? '#fde047'
                          : '#64748b',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {dayInfo.isAttended
                        ? '완료'
                        : dayInfo.isToday
                        ? '오늘'
                        : dayInfo.isFuture
                        ? '예정'
                        : '미출석'}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* 주간 미션 섹션 */}
            <div
              style={{
                width: '100%',
                backgroundColor: '#020617',
                borderRadius: '16px',
                border: isWeekComplete
                  ? '2px solid #f59e0b'
                  : '1.5px solid rgba(255, 255, 255, 0.1)',
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                marginBottom: '16px',
                boxShadow: isWeekComplete ? '0 0 20px rgba(251, 191, 36, 0.4)' : 'none',
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#fef08a' }}>
                  <Gift size={15} color="#facc15" />
                  <span>주간 미션: 7일 출석 완료 시 🎁 황금 보물상자(실물 쿠폰 당첨) 획득!</span>
                </div>
                <span
                  style={{
                    color: isWeekComplete ? '#fbbf24' : '#38bdf8',
                    fontWeight: 900,
                  }}
                >
                  {weekAttendedCount} / 7일
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
                    width: `${weeklyProgressPercent}%`,
                    height: '100%',
                    background: isWeekComplete
                      ? 'linear-gradient(90deg, #d97706 0%, #f59e0b 50%, #fbbf24 100%)'
                      : 'linear-gradient(90deg, #06b6d4 0%, #10b981 100%)',
                    borderRadius: '9999px',
                    transition: 'width 0.4s ease',
                    boxShadow: isWeekComplete ? '0 0 8px rgba(251, 191, 36, 0.7)' : 'none',
                  }}
                />
              </div>

              {/* 7일 달성 시: 황금 보물상자 버튼 분기 */}
              {isWeekComplete && (
                isAlreadyClaimed ? (
                  <button
                    type="button"
                    disabled
                    style={{
                      width: '100%',
                      padding: '14px',
                      borderRadius: '16px',
                      backgroundColor: '#1e293b',
                      color: '#94a3b8',
                      fontWeight: 800,
                      fontSize: '13px',
                      border: '1.5px solid #334155',
                      cursor: 'not-allowed',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      opacity: 0.85,
                    }}
                  >
                    <span>🎉 이번 주 7일 출석 완료! 🎁 황금 보물상자 수령 완료 (다음 주 월요일에 새로 시작)</span>
                  </button>
                ) : onOpenLuckyGacha ? (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      setTimeout(() => onOpenLuckyGacha(), 150);
                    }}
                    style={{
                      width: '100%',
                      padding: '12px',
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
                      animation: 'weeklyGlowPulse 2s infinite',
                    }}
                  >
                    <span style={{ fontSize: '20px' }}>🎁</span>
                    <span>황금 보물상자 열러 가기! (실물 쿠폰 당첨)</span>
                    <Sparkles size={16} color="#fde047" />
                  </button>
                ) : null
              )}
            </div>

            {/* 하단 계속하기 버튼 */}
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
        @keyframes weeklyGlowPulse {
          0%, 100% { box-shadow: 0 0 20px rgba(251, 191, 36, 0.6); }
          50% { box-shadow: 0 0 35px rgba(251, 191, 36, 0.95); }
        }
      `}</style>
    </div>
  );
};
