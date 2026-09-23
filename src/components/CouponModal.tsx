import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { X, Ticket, History } from 'lucide-react';
import {
  loadCoupons,
  markCouponUsed,
  type EarnedCoupon,
} from '../data/gachaRewards';
import { playDadStampSlamSound } from '../utils/soundEffects';

export interface CouponModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  onCouponsChanged?: () => void;
  onBackToAttendance?: () => void;
  embedded?: boolean;
}

const formatDate = (isoString?: string): string => {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}.${m}.${day}`;
};

const formatDateTime = (isoString?: string): string => {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${y}.${m}.${day} ${h}:${min}`;
};

export const CouponModal: React.FC<CouponModalProps> = ({
  isOpen = true,
  onClose,
  onCouponsChanged,
  onBackToAttendance,
  embedded = false,
}) => {
  const [coupons, setCoupons] = useState<EarnedCoupon[]>(() => loadCoupons());
  const [activeTab, setActiveTab] = useState<'available' | 'used'>('available');
  const [confirmingCoupon, setConfirmingCoupon] = useState<EarnedCoupon | null>(null);
  const [stampingCouponId, setStampingCouponId] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCoupons(loadCoupons());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const validCoupons = coupons.filter((c) => c.minutes > 0);
  const availableCoupons = validCoupons.filter((c) => !c.isUsed);
  const usedCoupons = validCoupons
    .filter((c) => c.isUsed)
    .sort((a, b) => {
      const timeA = new Date(a.usedAt || a.earnedAt).getTime();
      const timeB = new Date(b.usedAt || b.earnedAt).getTime();
      return timeB - timeA;
    });

  const handleStartUse = (coupon: EarnedCoupon) => {
    if (stampingCouponId) return;
    setConfirmingCoupon(coupon);
  };

  const handleConfirmStamp = () => {
    if (!confirmingCoupon) return;
    const targetCoupon = confirmingCoupon;
    const targetId = targetCoupon.id;
    setConfirmingCoupon(null);
    setStampingCouponId(targetId);

    // 1) 묵직한 물리 타격 사운드
    playDadStampSlamSound();

    // 2) 진동 피드백 (모바일 지원 시)
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate([40, 30, 80]);
      } catch {
        // ignore
      }
    }

    // 3) 화면 가벼운 흔들림
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);

    // 4) 축하 콘페티 파티클
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#ef4444', '#f59e0b', '#fbbf24', '#10b981'],
      });
    } catch {
      // ignore
    }

    // 5) 1초간 도장 쾅! 연출 감상 후 데이터 동기화 및 사용 완료 처리
    setTimeout(() => {
      markCouponUsed(targetId);
      const updated = loadCoupons();
      setCoupons(updated);
      setStampingCouponId(null);
      onCouponsChanged?.();

      // 만약 보유 쿠폰이 0장이 되면 사용 내역 탭으로 자동 이동
      const remainingUnused = updated.filter((c) => !c.isUsed && c.minutes > 0);
      if (remainingUnused.length === 0) {
        setActiveTab('used');
      }
    }, 1000);
  };

  const content = (
    <div
      style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        animation: isShaking ? 'screenShake 0.45s cubic-bezier(0.36, 0.07, 0.19, 0.97) both' : 'none',
      }}
    >
      {/* 헤더 타이틀 */}
      <div style={{ textAlign: 'center', marginBottom: '14px' }}>
        <h3
          style={{
            fontSize: '18px',
            fontWeight: 900,
            color: '#fde047',
            margin: '0 0 4px 0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          <span>🎟️</span>
          <span>내 보너스 쿠폰함</span>
        </h3>
        <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>
          아빠와 약속한 시간 동안 게임을 즐길 수 있어요!
        </p>
      </div>

      {/* 상단 2분할 탭: 보유 중인 쿠폰 / 사용한 쿠폰 내역 */}
      <div
        style={{
          display: 'flex',
          width: '100%',
          backgroundColor: '#090d16',
          padding: '4px',
          borderRadius: '14px',
          gap: '6px',
          marginBottom: '16px',
          border: '1px solid #1e293b',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('available')}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '8px 10px',
            borderRadius: '10px',
            border: activeTab === 'available' ? '1.5px solid #f59e0b' : '1px solid transparent',
            backgroundColor: activeTab === 'available' ? 'rgba(245, 158, 11, 0.18)' : 'transparent',
            color: activeTab === 'available' ? '#fde047' : '#64748b',
            fontSize: '12px',
            fontWeight: 800,
            cursor: 'pointer',
            transition: 'all 0.18s ease',
          }}
        >
          <Ticket size={14} />
          <span>보유 중인 쿠폰</span>
          <span
            style={{
              padding: '1px 6px',
              borderRadius: '9999px',
              backgroundColor: activeTab === 'available' ? '#ef4444' : '#334155',
              color: '#ffffff',
              fontSize: '10px',
              fontWeight: 900,
            }}
          >
            {availableCoupons.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('used')}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '8px 10px',
            borderRadius: '10px',
            border: activeTab === 'used' ? '1.5px solid #3b82f6' : '1px solid transparent',
            backgroundColor: activeTab === 'used' ? 'rgba(59, 130, 246, 0.18)' : 'transparent',
            color: activeTab === 'used' ? '#60a5fa' : '#64748b',
            fontSize: '12px',
            fontWeight: 800,
            cursor: 'pointer',
            transition: 'all 0.18s ease',
          }}
        >
          <History size={14} />
          <span>사용한 쿠폰 내역</span>
          <span
            style={{
              padding: '1px 6px',
              borderRadius: '9999px',
              backgroundColor: activeTab === 'used' ? '#2563eb' : '#334155',
              color: '#ffffff',
              fontSize: '10px',
              fontWeight: 900,
            }}
          >
            {usedCoupons.length}
          </span>
        </button>
      </div>

      {/* ─── 탭 1: 보유 중인 쿠폰 (황금빛 골드 테마) ─── */}
      {activeTab === 'available' && (
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {availableCoupons.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                backgroundColor: 'rgba(30, 41, 59, 0.4)',
                borderRadius: '16px',
                border: '1px dashed #334155',
                padding: '30px 16px',
              }}
            >
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>🎟️</div>
              <div style={{ color: '#e2e8f0', fontSize: '14px', fontWeight: 800, marginBottom: '4px' }}>
                사용 가능한 보너스 쿠폰이 없어요!
              </div>
              <div style={{ color: '#64748b', fontSize: '11px', lineHeight: '1.5' }}>
                7일 출석 완료 또는 도감 10종 완성을 달성하면
                <br />🎁 황금 보물상자에서 보너스 쿠폰을 획득할 수 있어요!
              </div>
            </div>
          ) : (
            availableCoupons.map((coupon) => {
              const isCurrentlyStamping = stampingCouponId === coupon.id;
              return (
                <div
                  key={coupon.id}
                  style={{
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.16) 0%, rgba(30, 41, 59, 0.8) 100%)',
                    border: '1.5px solid #f59e0b',
                    borderRadius: '14px',
                    padding: '12px 14px',
                    boxShadow: '0 4px 14px rgba(245, 158, 11, 0.15)',
                  }}
                >
                  {/* 쿠폰 정보 */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '26px' }}>{coupon.emoji}</span>
                    <div>
                      <div
                        style={{
                          fontSize: '15px',
                          fontWeight: 900,
                          color: '#fde047',
                          letterSpacing: '-0.2px',
                        }}
                      >
                        게임 {coupon.minutes}분 보너스
                      </div>
                      <div
                        style={{
                          fontSize: '10px',
                          color: '#94a3b8',
                          fontWeight: 600,
                          marginTop: '2px',
                        }}
                      >
                        📅 {formatDate(coupon.earnedAt)} 획득
                      </div>
                    </div>
                  </div>

                  {/* 사용하기 버튼 */}
                  <button
                    type="button"
                    onClick={() => handleStartUse(coupon)}
                    disabled={!!stampingCouponId}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      border: '1.5px solid #6ee7b7',
                      color: '#ffffff',
                      fontSize: '12px',
                      fontWeight: 900,
                      cursor: stampingCouponId ? 'default' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      boxShadow: '0 2px 8px rgba(16, 185, 129, 0.35)',
                      opacity: stampingCouponId ? 0.6 : 1,
                    }}
                  >
                    <span>쿠폰 사용하기</span>
                    <span>🎫</span>
                  </button>

                  {/* 쾅! 찍히는 붉은색 원형 도장 오버레이 */}
                  {isCurrentlyStamping && (
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundColor: 'rgba(2, 6, 23, 0.55)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 10,
                      }}
                    >
                      <div
                        style={{
                          width: '92px',
                          height: '92px',
                          borderRadius: '9999px',
                          border: '3.5px solid #ef4444',
                          outline: '2px dashed #dc2626',
                          outlineOffset: '-7px',
                          backgroundColor: 'rgba(239, 68, 68, 0.12)',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#ef4444',
                          boxShadow: '0 0 20px rgba(239, 68, 68, 0.6)',
                          animation: 'dadStampSlam 0.55s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
                        }}
                      >
                        <span style={{ fontSize: '9px', fontWeight: 900, letterSpacing: '0.5px' }}>
                          ★ 아빠 인증 ★
                        </span>
                        <span style={{ fontSize: '14px', fontWeight: 900, margin: '2px 0' }}>
                          사용 완료 ✔️
                        </span>
                        <span style={{ fontSize: '8px', fontWeight: 800 }}>
                          {formatDate(new Date().toISOString())}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ─── 탭 2: 사용한 쿠폰 내역 (명예의 훈장 & 흑백/차분한 톤) ─── */}
      {activeTab === 'used' && (
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {usedCoupons.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                backgroundColor: 'rgba(30, 41, 59, 0.3)',
                borderRadius: '16px',
                border: '1px dashed #334155',
                padding: '30px 16px',
              }}
            >
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>📜</div>
              <div style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 700 }}>
                사용한 쿠폰 내역이 아직 없어요.
              </div>
            </div>
          ) : (
            <>
              <div
                style={{
                  fontSize: '11px',
                  color: '#64748b',
                  fontWeight: 700,
                  paddingLeft: '4px',
                }}
              >
                🎖️ 총 {usedCoupons.length}장의 쿠폰을 성실하게 보상받았어요!
              </div>

              {usedCoupons.map((coupon) => (
                <div
                  key={coupon.id}
                  style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: 'rgba(15, 23, 42, 0.7)',
                    border: '1px solid #334155',
                    borderRadius: '14px',
                    padding: '10px 14px',
                    opacity: 0.85,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '22px', filter: 'grayscale(0.7)' }}>{coupon.emoji}</span>
                    <div>
                      <div
                        style={{
                          fontSize: '13px',
                          fontWeight: 800,
                          color: '#94a3b8',
                          textDecoration: 'line-through',
                        }}
                      >
                        게임 {coupon.minutes}분 보너스
                      </div>
                      <div
                        style={{
                          fontSize: '10px',
                          color: '#64748b',
                          fontWeight: 600,
                          marginTop: '2px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '1px',
                        }}
                      >
                        <span>📅 획득: {formatDate(coupon.earnedAt)}</span>
                        <span style={{ color: '#ef4444', fontWeight: 700 }}>
                          🔴 사용: {formatDateTime(coupon.usedAt || coupon.earnedAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 사용 완료 붉은색 도장 훈장 */}
                  <div
                    style={{
                      border: '2px solid #ef4444',
                      borderRadius: '8px',
                      padding: '3px 7px',
                      color: '#ef4444',
                      fontSize: '11px',
                      fontWeight: 900,
                      transform: 'rotate(-6deg)',
                      backgroundColor: 'rgba(239, 68, 68, 0.08)',
                      letterSpacing: '-0.3px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '2px',
                      boxShadow: '0 0 8px rgba(239, 68, 68, 0.25)',
                    }}
                  >
                    <span>사용 완료</span>
                    <span>✔️</span>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* 출석부 복귀 버튼 (임베디드 모드일 때) */}
      {embedded && onBackToAttendance && (
        <button
          type="button"
          onClick={onBackToAttendance}
          style={{
            marginTop: '16px',
            width: '100%',
            padding: '10px',
            borderRadius: '12px',
            backgroundColor: '#1e293b',
            border: '1px solid #475569',
            color: '#cbd5e1',
            fontWeight: 800,
            fontSize: '13px',
            cursor: 'pointer',
          }}
        >
          ← 출석부로 돌아가기
        </button>
      )}

      {/* ─── 아빠 도장 확인 가벼운 팝업 (비밀번호 없음) ─── */}
      {confirmingCoupon && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 60,
            backgroundColor: 'rgba(2, 6, 23, 0.85)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '360px',
              backgroundColor: '#0f172a',
              border: '2px solid #ef4444',
              borderRadius: '20px',
              padding: '20px',
              textAlign: 'center',
              boxShadow: '0 0 30px rgba(239, 68, 68, 0.4)',
              animation: 'confirmScaleUp 0.25s ease-out forwards',
            }}
          >
            <div style={{ fontSize: '36px', marginBottom: '8px' }}>👨‍👧‍👦</div>
            <h4
              style={{
                fontSize: '16px',
                fontWeight: 900,
                color: '#f87171',
                margin: '0 0 6px 0',
              }}
            >
              정말 쿠폰을 사용할까요?
            </h4>
            <p
              style={{
                fontSize: '13px',
                fontWeight: 700,
                color: '#e2e8f0',
                margin: '0 0 14px 0',
                lineHeight: '1.4',
              }}
            >
              아빠에게 보여주고 도장을 찍으세요!
            </p>

            <div
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px dashed #ef4444',
                borderRadius: '12px',
                padding: '10px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <span style={{ fontSize: '20px' }}>{confirmingCoupon.emoji}</span>
              <span style={{ fontSize: '15px', fontWeight: 900, color: '#fde047' }}>
                게임 {confirmingCoupon.minutes}분 보너스
              </span>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setConfirmingCoupon(null)}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '10px',
                  backgroundColor: '#334155',
                  border: '1px solid #475569',
                  color: '#cbd5e1',
                  fontWeight: 800,
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleConfirmStamp}
                style={{
                  flex: 1.4,
                  padding: '10px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
                  border: '1.5px solid #fca5a5',
                  color: '#ffffff',
                  fontWeight: 900,
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  boxShadow: '0 0 14px rgba(239, 68, 68, 0.5)',
                }}
              >
                <span>아빠 도장 쾅! 찍기</span>
                <span>🔴</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 스타일 애니메이션 키프레임 */}
      <style>{`
        @keyframes dadStampSlam {
          0% { transform: scale(3.4) rotate(-35deg); opacity: 0; }
          60% { transform: scale(0.92) rotate(-10deg); opacity: 1; }
          80% { transform: scale(1.12) rotate(-14deg); }
          100% { transform: scale(1) rotate(-12deg); opacity: 1; }
        }
        @keyframes screenShake {
          0% { transform: translate(0, 0) rotate(0deg); }
          20% { transform: translate(-5px, 4px) rotate(-0.5deg); }
          40% { transform: translate(5px, -4px) rotate(0.5deg); }
          60% { transform: translate(-3px, 2px) rotate(-0.3deg); }
          80% { transform: translate(3px, -1px) rotate(0.2deg); }
          100% { transform: translate(0, 0) rotate(0deg); }
        }
        @keyframes confirmScaleUp {
          from { transform: scale(0.85); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );

  if (embedded) {
    return <div style={{ width: '100%', paddingTop: '36px' }}>{content}</div>;
  }

  // 단독 모달로 열릴 때의 래퍼
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
          maxWidth: '460px',
          maxHeight: '94vh',
          overflowY: 'auto',
          backgroundColor: '#0f172a',
          border: '2px solid rgba(245, 158, 11, 0.5)',
          borderRadius: '24px',
          boxShadow: '0 0 40px rgba(245, 158, 11, 0.3)',
          padding: '24px 20px',
        }}
      >
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '14px',
              right: '14px',
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
        )}
        {content}
      </div>
    </div>
  );
};
