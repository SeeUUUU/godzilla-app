import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Sparkles, X, Ticket } from 'lucide-react';
import {
  rollGachaReward,
  saveCoupon,
  markWeeklyRewardClaimed,
  type GachaReward,
} from '../data/gachaRewards';
import { playEggTapSound, playEggHatchSound, playCardRevealFanfare, playStampThudSound } from '../utils/soundEffects';

interface LuckyEggGachaModalProps {
  isOpen: boolean;
  onClose: () => void;
  eggCount?: number;
  onConsumeEgg?: () => void;
  onBonusExp?: (amount: number) => void;
  onWeeklyRewardClaimed?: () => void;
}

export const LuckyEggGachaModal: React.FC<LuckyEggGachaModalProps> = ({
  isOpen,
  onClose,
  eggCount,
  onConsumeEgg,
  onBonusExp,
  onWeeklyRewardClaimed,
}) => {
  const [tapCount, setTapCount] = useState(0);
  const [isShaking, setIsShaking] = useState(false);
  const [showFlash, setShowFlash] = useState(false);
  const [isHatched, setIsHatched] = useState(false);
  const [reward, setReward] = useState<GachaReward | null>(null);

  // 모달 열릴 때 상태 초기화
  useEffect(() => {
    if (isOpen) {
      setTapCount(0);
      setIsShaking(false);
      setShowFlash(false);
      setIsHatched(false);
      setReward(null);
    }
  }, [isOpen]);

  const handleEggTap = () => {
    if (isHatched || tapCount >= 3 || (eggCount !== undefined && eggCount <= 0)) return;

    const next = tapCount + 1;
    setTapCount(next);
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 450);

    playEggTapSound(next);

    if (next === 3) {
      setShowFlash(true);
      playEggHatchSound();

      setTimeout(() => {
        const rolled = rollGachaReward();
        setReward(rolled);
        setIsHatched(true);
        setShowFlash(false);

        // 쿠폰이면 저장, 꽝이면 위로 EXP
        if (rolled.id !== 'miss') {
          saveCoupon(rolled);
        } else if (rolled.bonusExp > 0 && onBonusExp) {
          onBonusExp(rolled.bonusExp);
        }

        // 알 보유 수량 1개 차감
        if (onConsumeEgg) {
          onConsumeEgg();
        }

        // 주간 보상 수령 기록 및 콜백 통지
        markWeeklyRewardClaimed();
        if (onWeeklyRewardClaimed) {
          onWeeklyRewardClaimed();
        }

        // 사운드 & 폭죽
        if (rolled.id !== 'miss') {
          playCardRevealFanfare(
            rolled.id === 'legendary'
              ? 'mythic'
              : rolled.id === 'special'
              ? 'legendary'
              : 'normal'
          );
          confetti({
            particleCount: rolled.id === 'legendary' ? 130 : 75,
            spread: 85,
            origin: { y: 0.55 },
            colors:
              rolled.id === 'legendary'
                ? ['#fbbf24', '#f59e0b', '#ffffff', '#fde047']
                : rolled.id === 'special'
                ? ['#a855f7', '#c084fc', '#e879f9', '#ffffff']
                : ['#38bdf8', '#06b6d4', '#10b981', '#fde047'],
          });
        } else {
          playStampThudSound();
        }
      }, 600);
    }
  };

  const handleClose = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(2, 6, 23, 0.94)',
        backdropFilter: 'blur(10px)',
        padding: '12px',
      }}
    >
      {/* 섬광 */}
      {showFlash && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 70,
            backgroundColor: '#fffbeb',
            animation: 'luckyFlash 0.55s ease-out forwards',
            pointerEvents: 'none',
          }}
        />
      )}

      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '420px',
          maxHeight: '92vh',
          overflowY: 'auto',
          backgroundColor: '#0f172a',
          border: isHatched && reward
            ? `2.5px solid ${reward.borderColor}`
            : '2.5px solid #f59e0b',
          borderRadius: '24px',
          boxShadow: isHatched && reward
            ? `0 0 50px ${reward.shadowColor}`
            : '0 0 45px rgba(251, 191, 36, 0.7)',
          padding: '20px 18px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          transition: 'all 0.4s ease',
        }}
      >
        {/* 닫기 버튼 */}
        <button
          type="button"
          onClick={handleClose}
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

        {/* 알 보유 수량 배지 */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 14px',
            borderRadius: '9999px',
            backgroundColor: 'rgba(245, 158, 11, 0.2)',
            border: '1.5px solid #f59e0b',
            color: '#fef08a',
            fontSize: '12px',
            fontWeight: 900,
            marginBottom: '8px',
            boxShadow: '0 0 12px rgba(245, 158, 11, 0.35)',
          }}
        >
          <span>🥚 보유 중인 알: {eggCount ?? 0}개</span>
        </div>

        {/* 상단 배지 */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 16px',
            borderRadius: '9999px',
            background: 'linear-gradient(90deg, #92400e, #f59e0b)',
            marginBottom: '8px',
            border: '1.5px solid #fde047',
            boxShadow: '0 0 18px rgba(251, 191, 36, 0.7)',
          }}
        >
          <Sparkles size={14} color="#fef08a" />
          <span style={{ fontSize: '12px', fontWeight: 900, color: '#ffffff' }}>
            🎁 7일 출석 달성! 황금 럭키 알 깨기!
          </span>
        </div>

        {/* ─── 알 깨기 뷰 ─── */}
        {!isHatched && (eggCount !== undefined && eggCount <= 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              width: '100%',
              padding: '24px 8px 12px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🥚❌</div>
            <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#f87171', margin: '0 0 8px 0' }}>
              보유 중인 알이 없습니다!
            </h3>
            <p
              style={{
                fontSize: '13px',
                color: '#94a3b8',
                fontWeight: 700,
                lineHeight: 1.6,
                margin: '0 0 20px 0',
              }}
            >
              단어 배틀이나 출석 미션을 완료해 알을 모아보세요.
            </p>
            <button
              type="button"
              onClick={handleClose}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '14px',
                background: 'linear-gradient(90deg, #334155, #475569)',
                color: '#ffffff',
                fontWeight: 900,
                fontSize: '14px',
                border: '1.5px solid #64748b',
                cursor: 'pointer',
              }}
            >
              확인하고 닫기
            </button>
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              width: '100%',
              paddingTop: '4px',
            }}
          >
            <h2
              style={{
                fontSize: '19px',
                fontWeight: 900,
                color: '#fde047',
                margin: '0 0 4px 0',
                textAlign: 'center',
                textShadow: '0 0 18px #f59e0b',
              }}
            >
              ✨ 황금 럭키 알을 쾅쾅 깨봐!
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
              {tapCount === 0 && '🥚 알을 3번 쿵쿵 두드려서 깨뜨려봐!'}
              {tapCount === 1 && '💥 첫 번째 쿵! 더 세게!'}
              {tapCount === 2 && '🔥 거의 다 왔어! 마지막 한 방!'}
            </p>

            {/* 황금 알 SVG */}
            <div
              onClick={handleEggTap}
              style={{
                position: 'relative',
                width: '200px',
                height: '250px',
                cursor: 'pointer',
                userSelect: 'none',
                transform: isShaking
                  ? 'translate3d(0,0,0) rotate(-8deg) scale(1.1)'
                  : 'translate3d(0,0,0) scale(1)',
                transition: 'transform 0.15s ease-in-out',
                animation: isShaking
                  ? 'luckyEggShake 0.4s ease both'
                  : 'luckyEggFloat 2.5s ease-in-out infinite',
              }}
            >
              <svg viewBox="0 0 140 180" style={{ width: '100%', height: '100%' }}>
                <defs>
                  <radialGradient id="goldenEggGrad" cx="38%" cy="28%" r="68%">
                    <stop offset="0%" stopColor="#fef08a" />
                    <stop offset="30%" stopColor="#fbbf24" />
                    <stop offset="65%" stopColor="#d97706" />
                    <stop offset="100%" stopColor="#78350f" />
                  </radialGradient>
                  <radialGradient id="innerGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#fef9c3" stopOpacity="0.95" />
                    <stop offset="60%" stopColor="#fbbf24" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                  </radialGradient>
                </defs>

                {/* 알 그림자 */}
                <ellipse cx="70" cy="173" rx="50" ry="8" fill="rgba(0,0,0,0.45)" />

                {/* 알 본체 */}
                <path
                  d="M 70 8 C 112 8 135 75 135 125 C 135 162 108 172 70 172 C 32 172 5 162 5 125 C 5 75 28 8 70 8 Z"
                  fill="url(#goldenEggGrad)"
                  stroke="#fde047"
                  strokeWidth="3"
                  style={{
                    filter: `drop-shadow(0 0 ${14 + tapCount * 10}px rgba(251, 191, 36, 0.95))`,
                  }}
                />

                {/* 내부 황금빛 에너지 */}
                {tapCount >= 1 && (
                  <circle cx="70" cy="90" r="35" fill="url(#innerGlow)" />
                )}

                {/* 반짝이 하이라이트 */}
                <path
                  d="M 40 22 C 28 42 24 72 26 94"
                  stroke="#ffffff"
                  strokeWidth="5"
                  strokeLinecap="round"
                  fill="none"
                  opacity="0.7"
                />

                {/* 1단계 균열 */}
                {tapCount >= 1 && (
                  <g>
                    <polyline
                      points="65,14 73,30 62,46 75,62"
                      fill="none"
                      stroke="#78350f"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      style={{ filter: 'drop-shadow(0 0 5px #fef08a)' }}
                    />
                    <polyline
                      points="73,30 88,35"
                      fill="none"
                      stroke="#92400e"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  </g>
                )}

                {/* 2단계 심화 균열 */}
                {tapCount >= 2 && (
                  <g>
                    <polyline
                      points="75,62 58,80 80,96 63,118 76,138"
                      fill="none"
                      stroke="#ffffff"
                      strokeWidth="4"
                      strokeLinecap="round"
                      style={{ filter: 'drop-shadow(0 0 10px #fbbf24)' }}
                    />
                    <polyline
                      points="58,80 42,88 36,104"
                      fill="none"
                      stroke="#fde047"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                    <polyline
                      points="80,96 104,108 110,124"
                      fill="none"
                      stroke="#fde047"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  </g>
                )}
              </svg>
            </div>

            {/* 탭 카운터 */}
            <div
              style={{
                display: 'flex',
                gap: '8px',
                marginTop: '18px',
                marginBottom: '10px',
              }}
            >
              {[1, 2, 3].map((step) => {
                const done = tapCount >= step;
                return (
                  <div
                    key={step}
                    style={{
                      padding: '4px 14px',
                      borderRadius: '9999px',
                      backgroundColor: done ? '#d97706' : '#1e293b',
                      border: done ? '1.5px solid #fbbf24' : '1px solid #334155',
                      color: done ? '#ffffff' : '#64748b',
                      fontSize: '12px',
                      fontWeight: 900,
                      transition: 'all 0.3s ease',
                    }}
                  >
                    {done ? '💥' : '🥚'} {step}회
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={handleEggTap}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '16px',
                background: 'linear-gradient(90deg, #d97706 0%, #f59e0b 50%, #fbbf24 100%)',
                color: '#000000',
                fontWeight: 900,
                fontSize: '15px',
                border: '2px solid #fde047',
                boxShadow: '0 0 20px rgba(251, 191, 36, 0.6)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <span>👆 황금 알 두드리기! ({3 - tapCount}번 남음)</span>
            </button>
          </div>
        ))}

        {/* ─── 결과 카드 뷰 ─── */}
        {isHatched && reward && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              width: '100%',
              animation: 'luckyCardZoom 0.55s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
            }}
          >
            {/* 결과 배지 */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 18px',
                borderRadius: '9999px',
                background: `linear-gradient(90deg, ${reward.borderColor}aa, ${reward.borderColor})`,
                border: `1.5px solid ${reward.borderColor}`,
                boxShadow: `0 0 16px ${reward.shadowColor}`,
                marginBottom: '12px',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: 900,
              }}
            >
              <span>{reward.emoji}</span>
              <span>{reward.badgeLabel}</span>
            </div>

            {/* 쿠폰 티켓 카드 */}
            <div
              style={{
                width: '100%',
                borderRadius: '20px',
                background: reward.bgGradient,
                border: `3px solid ${reward.borderColor}`,
                boxShadow: `0 0 35px ${reward.shadowColor}`,
                padding: '20px 16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                position: 'relative',
                overflow: 'hidden',
                marginBottom: '14px',
              }}
            >
              {/* 티켓 점선 구분선 */}
              {reward.id !== 'miss' && (
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    top: '55%',
                    borderTop: `2px dashed ${reward.borderColor}44`,
                    zIndex: 0,
                  }}
                />
              )}

              {/* 배경 발광 */}
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '200px',
                  height: '200px',
                  borderRadius: '9999px',
                  background: `radial-gradient(circle, ${reward.borderColor}22 0%, transparent 70%)`,
                  pointerEvents: 'none',
                }}
              />

              {/* 아이콘 */}
              <div
                style={{
                  fontSize: reward.id === 'miss' ? '52px' : '60px',
                  marginBottom: '10px',
                  position: 'relative',
                  zIndex: 1,
                  animation: reward.id !== 'miss' ? 'luckyRewardBounce 0.6s ease-out' : 'none',
                }}
              >
                {reward.id === 'miss' ? '🦖💨' : '🎮'}
              </div>

              {/* 메인 텍스트 */}
              {reward.id !== 'miss' ? (
                <>
                  <div
                    style={{
                      fontSize: '13px',
                      fontWeight: 900,
                      color: `${reward.borderColor}`,
                      marginBottom: '4px',
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                      zIndex: 1,
                    }}
                  >
                    BONUS TIME COUPON
                  </div>
                  <div
                    style={{
                      fontSize: '32px',
                      fontWeight: 900,
                      color: '#ffffff',
                      textShadow: `0 0 20px ${reward.borderColor}`,
                      margin: '4px 0',
                      letterSpacing: '-0.02em',
                      zIndex: 1,
                    }}
                  >
                    {reward.emoji} {reward.minutes}분 보너스!
                  </div>
                  <div
                    style={{
                      fontSize: '13px',
                      color: '#cbd5e1',
                      fontWeight: 700,
                      textAlign: 'center',
                      marginTop: '6px',
                      zIndex: 1,
                    }}
                  >
                    {reward.description}
                  </div>

                  {/* 점선 구분 + 사용 안내 */}
                  <div
                    style={{
                      marginTop: '16px',
                      paddingTop: '14px',
                      borderTop: `2px dashed ${reward.borderColor}55`,
                      width: '100%',
                      textAlign: 'center',
                      zIndex: 1,
                    }}
                  >
                    <div
                      style={{
                        fontSize: '11px',
                        color: '#94a3b8',
                        fontWeight: 700,
                        lineHeight: 1.5,
                      }}
                    >
                      📣 엄마 / 아빠에게 이 화면을 보여주고
                      <br />
                      <span style={{ color: reward.borderColor, fontWeight: 900 }}>
                        쿠폰을 사용하세요!
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div
                    style={{
                      fontSize: '18px',
                      fontWeight: 900,
                      color: '#94a3b8',
                      marginBottom: '8px',
                      textAlign: 'center',
                    }}
                  >
                    아쉽지만 꽝! 💨
                  </div>
                  <div
                    style={{
                      fontSize: '13px',
                      color: '#cbd5e1',
                      fontWeight: 700,
                      textAlign: 'center',
                      lineHeight: 1.5,
                    }}
                  >
                    고질라가 방귀를... 😅
                    <br />
                    {reward.description}
                  </div>
                  <div
                    style={{
                      marginTop: '12px',
                      padding: '8px 16px',
                      borderRadius: '10px',
                      backgroundColor: 'rgba(234, 179, 8, 0.15)',
                      border: '1px solid #ca8a04',
                      color: '#fde047',
                      fontSize: '13px',
                      fontWeight: 900,
                    }}
                  >
                    ⚡ 보너스 EXP +{reward.bonusExp} 지급!
                  </div>
                </>
              )}
            </div>

            {(eggCount ?? 0) > 0 ? (
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setTapCount(0);
                    setIsShaking(false);
                    setShowFlash(false);
                    setIsHatched(false);
                    setReward(null);
                  }}
                  style={{
                    width: '100%',
                    padding: '13px',
                    borderRadius: '14px',
                    background: 'linear-gradient(90deg, #d97706 0%, #f59e0b 50%, #fbbf24 100%)',
                    color: '#000000',
                    fontWeight: 900,
                    fontSize: '15px',
                    border: '2px solid #fde047',
                    boxShadow: '0 0 20px rgba(251, 191, 36, 0.7)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  <span>🥚 연속으로 다음 알 깨기 ({eggCount}개 남음)</span>
                </button>

                <button
                  type="button"
                  onClick={handleClose}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '12px',
                    backgroundColor: '#1e293b',
                    color: '#94a3b8',
                    fontWeight: 800,
                    fontSize: '13px',
                    border: '1px solid #334155',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  <Ticket size={16} />
                  <span>쿠폰 보관하고 닫기</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleClose}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '14px',
                  background: reward.id !== 'miss'
                    ? `linear-gradient(90deg, ${reward.borderColor}cc, ${reward.borderColor})`
                    : 'linear-gradient(90deg, #1e293b, #334155)',
                  color: reward.id !== 'miss' ? '#000000' : '#ffffff',
                  fontWeight: 900,
                  fontSize: '14px',
                  border: `1.5px solid ${reward.borderColor}`,
                  boxShadow: `0 0 16px ${reward.shadowColor}`,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <Ticket size={18} />
                <span>{reward.id !== 'miss' ? '쿠폰 보관하고 계속하기!' : '다음 주를 노려봐!'}</span>
              </button>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes luckyFlash {
          0% { opacity: 0.9; }
          100% { opacity: 0; }
        }
        @keyframes luckyEggShake {
          0% { transform: translate3d(0,0,0) rotate(0deg); }
          20% { transform: translate3d(-8px,0,0) rotate(-8deg); }
          40% { transform: translate3d(8px,0,0) rotate(8deg); }
          60% { transform: translate3d(-5px,0,0) rotate(-5deg); }
          80% { transform: translate3d(5px,0,0) rotate(5deg); }
          100% { transform: translate3d(0,0,0) rotate(0deg); }
        }
        @keyframes luckyEggFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes luckyCardZoom {
          0% { transform: scale(0.6) rotateY(90deg); opacity: 0; }
          100% { transform: scale(1) rotateY(0deg); opacity: 1; }
        }
        @keyframes luckyRewardBounce {
          0% { transform: scale(0.5); opacity: 0; }
          70% { transform: scale(1.25); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};
