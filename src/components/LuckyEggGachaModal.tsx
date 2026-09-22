import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Sparkles, X, Ticket, CheckCircle2 } from 'lucide-react';
import {
  createGoldenChestReward,
  rollGachaReward,
  saveCoupon,
  markWeeklyRewardClaimed,
  markCodexRewardClaimed,
  type GachaReward,
} from '../data/gachaRewards';
import {
  playChestUnlockSound,
  playChestOpenSound,
  playCardRevealFanfare,
  playStampThudSound,
} from '../utils/soundEffects';

export interface GoldenChestModalProps {
  isOpen: boolean;
  onClose: () => void;
  source?: 'attendance' | 'codex';
  treasureBoxCount?: number;
  onConsumeTreasureBox?: () => void;
  onBonusExp?: (amount: number) => void;
  onWeeklyRewardClaimed?: () => void;
  onCodexRewardClaimed?: () => void;
  onOpenCouponBox?: () => void;
  // 호환성 보존용 prop (알 개수와 완전히 분리됨)
  eggCount?: number;
  onConsumeEgg?: () => void;
}

export const GoldenChestModal: React.FC<GoldenChestModalProps> = ({
  isOpen,
  onClose,
  source = 'attendance',
  treasureBoxCount,
  onConsumeTreasureBox,
  onBonusExp,
  onWeeklyRewardClaimed,
  onCodexRewardClaimed,
  onOpenCouponBox,
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

  const handleChestTap = () => {
    if (isHatched || tapCount >= 3) return;

    const next = tapCount + 1;
    setTapCount(next);
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 400);

    playChestUnlockSound();

    if (next === 3) {
      setShowFlash(true);
      playChestOpenSound();

      setTimeout(() => {
        // 기존 가챠 확률 테이블 기반 뽑기 (도감 10종 완성 최고 보상 교환 시에만 30분 전설 쿠폰 확정)
        const rolled = source === 'codex' ? createGoldenChestReward('codex') : rollGachaReward();
        setReward(rolled);
        setIsHatched(true);
        setShowFlash(false);

        // 보물상자 보유량 1개 차감
        if (onConsumeTreasureBox) {
          onConsumeTreasureBox();
        }

        // 출석체크 또는 도감 완성 영구 수령 플래그 반영
        if (source === 'codex') {
          markCodexRewardClaimed();
          if (onCodexRewardClaimed) onCodexRewardClaimed();
        } else {
          markWeeklyRewardClaimed();
          if (onWeeklyRewardClaimed) onWeeklyRewardClaimed();
        }

        if (rolled.id !== 'miss') {
          // 쿠폰 당첨 시 쿠폰함에 즉시 저장
          saveCoupon(rolled);

          // 희귀도별 팡파레 사운드 & 축하 폭죽
          playCardRevealFanfare(rolled.id);
          confetti({
            particleCount: 140,
            spread: 90,
            origin: { y: 0.55 },
            colors: ['#fbbf24', '#f59e0b', '#ffffff', '#fde047', '#10b981', '#06b6d4'],
          });
        } else {
          // 꽝인 경우: 보너스 EXP 지급 & 쿵! 사운드
          if (rolled.bonusExp > 0 && onBonusExp) {
            onBonusExp(rolled.bonusExp);
          }
          playStampThudSound();
        }
      }, 550);
    }
  };

  const handleClose = () => {
    onClose();
  };

  if (!isOpen) return null;

  const isCodex = source === 'codex';

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
            animation: 'chestFlash 0.55s ease-out forwards',
            pointerEvents: 'none',
          }}
        />
      )}

      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '430px',
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

        {/* 보물상자 보유량 배지 */}
        {treasureBoxCount !== undefined && (
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
            <span>🎁 보유 중인 황금 보물상자: {treasureBoxCount}개</span>
          </div>
        )}

        {/* 상단 배지 */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '5px 16px',
            borderRadius: '9999px',
            background: 'linear-gradient(90deg, #92400e, #d97706, #f59e0b)',
            marginBottom: '10px',
            border: '1.5px solid #fde047',
            boxShadow: '0 0 18px rgba(251, 191, 36, 0.7)',
          }}
        >
          <Sparkles size={14} color="#fef08a" />
          <span style={{ fontSize: '12px', fontWeight: 900, color: '#ffffff' }}>
            {isCodex
              ? '🏆 괴수 도감 10종 완성 최고 보상 교환!'
              : '🎁 행운의 황금 보물상자 찬스!'}
          </span>
        </div>

        {/* ─── 상자 열기 뷰 ─── */}
        {!isHatched && (treasureBoxCount !== undefined && treasureBoxCount <= 0 ? (
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
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎁❌</div>
            <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#f87171', margin: '0 0 8px 0' }}>
              보유 중인 황금 보물상자가 없습니다!
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
              7일 연속 출석을 달성하거나 도감 10종을 완성해 보물상자를 획득해 보세요!
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
                fontSize: '20px',
                fontWeight: 900,
                color: '#fde047',
                margin: '0 0 4px 0',
                textAlign: 'center',
                textShadow: '0 0 18px #f59e0b',
              }}
            >
              ✨ 황금 보물상자를 쿵쿵 열어봐!
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
              {tapCount === 0 && '🗝️ 상자를 3번 두드려서 황금 자물쇠를 풀어봐!'}
              {tapCount === 1 && '💥 첫 번째 쿵! 열쇠가 돌아갔어!'}
              {tapCount === 2 && '🔥 자물쇠 해제! 마지막 한 방에 상자가 열린다!'}
            </p>

            {/* 황금 보물상자 SVG */}
            <div
              onClick={handleChestTap}
              style={{
                position: 'relative',
                width: '240px',
                height: '190px',
                cursor: 'pointer',
                userSelect: 'none',
                transform: isShaking
                  ? 'translate3d(0,0,0) rotate(-6deg) scale(1.08)'
                  : 'translate3d(0,0,0) scale(1)',
                transition: 'transform 0.15s ease-in-out',
                animation: isShaking
                  ? 'chestShake 0.4s ease both'
                  : 'chestFloat 2.8s ease-in-out infinite',
              }}
            >
              <svg viewBox="0 0 240 180" style={{ width: '100%', height: '100%' }}>
                <defs>
                  <radialGradient id="chestGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#fef08a" stopOpacity="0.85" />
                    <stop offset="50%" stopColor="#fbbf24" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="#d97706" stopOpacity="0" />
                  </radialGradient>
                  <radialGradient id="innerLightBeam" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
                    <stop offset="40%" stopColor="#fef08a" stopOpacity="0.75" />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                  </radialGradient>
                  <linearGradient id="chestWood" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#b45309" />
                    <stop offset="45%" stopColor="#92400e" />
                    <stop offset="100%" stopColor="#451a03" />
                  </linearGradient>
                  <linearGradient id="chestGoldTrim" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#fef08a" />
                    <stop offset="35%" stopColor="#fbbf24" />
                    <stop offset="70%" stopColor="#d97706" />
                    <stop offset="100%" stopColor="#92400e" />
                  </linearGradient>
                </defs>

                {/* 바닥 그림자 */}
                <ellipse cx="120" cy="168" rx="88" ry="12" fill="rgba(0,0,0,0.5)" />

                {/* 상자 배경 에너지 글로우 */}
                <ellipse
                  cx="120"
                  cy="115"
                  rx="95"
                  ry="55"
                  fill="url(#chestGlow)"
                  opacity={0.35 + tapCount * 0.25}
                />

                {/* 상자 본체 (하단 바디) */}
                <path
                  d="M 38 98 L 48 156 Q 48 159 55 159 L 185 159 Q 192 159 192 156 L 202 98 Z"
                  fill="url(#chestWood)"
                  stroke="#f59e0b"
                  strokeWidth="2.5"
                />

                {/* 본체 금빛 테두리 프레임 */}
                <path d="M 38 98 L 48 156 L 62 156 L 52 98 Z" fill="url(#chestGoldTrim)" />
                <path d="M 188 98 L 178 156 L 192 156 L 202 98 Z" fill="url(#chestGoldTrim)" />
                <rect x="110" y="98" width="20" height="61" fill="url(#chestGoldTrim)" />
                <rect x="46" y="149" width="148" height="10" fill="url(#chestGoldTrim)" />

                {/* 리벳/스터드 장식 */}
                <circle cx="55" cy="105" r="2.8" fill="#fef08a" />
                <circle cx="51" cy="149" r="2.8" fill="#fef08a" />
                <circle cx="185" cy="105" r="2.8" fill="#fef08a" />
                <circle cx="189" cy="149" r="2.8" fill="#fef08a" />
                <circle cx="120" cy="149" r="2.8" fill="#fef08a" />

                {/* 상자 뚜껑 (Lid) */}
                <path
                  d="M 28 98 Q 120 42 212 98 Q 120 78 28 98 Z"
                  fill="url(#chestWood)"
                  stroke="#fbbf24"
                  strokeWidth="2.5"
                />
                <path
                  d="M 28 98 Q 120 42 212 98 L 212 105 Q 120 85 28 105 Z"
                  fill="url(#chestGoldTrim)"
                />
                <path
                  d="M 48 85 Q 120 50 192 85 L 192 89 Q 120 54 48 89 Z"
                  fill="url(#chestGoldTrim)"
                />

                {/* 뚜껑 금빛 중앙 밴드 */}
                <path d="M 110 55 Q 120 53 130 55 L 130 102 L 110 102 Z" fill="url(#chestGoldTrim)" />

                {/* 중앙 황금 자물쇠 플레이트 */}
                <rect
                  x="105"
                  y="90"
                  width="30"
                  height="30"
                  rx="6"
                  fill="url(#chestGoldTrim)"
                  stroke="#fef08a"
                  strokeWidth="2"
                  style={{ filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.5))' }}
                />

                {/* 자물쇠 걸쇠 및 홀 */}
                {tapCount < 2 ? (
                  <>
                    <path
                      d="M 112 90 L 112 78 Q 120 70 128 78 L 128 90"
                      fill="none"
                      stroke="#fef08a"
                      strokeWidth="4"
                      strokeLinecap="round"
                    />
                    <circle cx="120" cy="102" r="3.5" fill="#451a03" />
                    <polygon points="118,102 122,102 121,111 119,111" fill="#451a03" />
                  </>
                ) : (
                  <>
                    {/* 잠금 해제 상태의 걸쇠 */}
                    <path
                      d="M 112 84 L 112 72 Q 120 64 128 72 L 128 78"
                      fill="none"
                      stroke="#fef08a"
                      strokeWidth="4"
                      strokeLinecap="round"
                    />
                    <circle cx="120" cy="102" r="4.5" fill="#10b981" />
                    <circle cx="120" cy="102" r="2.5" fill="#ffffff" />
                  </>
                )}

                {/* 2단계 시 상자 틈새로 황금빛 누출 */}
                {tapCount >= 2 && (
                  <g>
                    <line
                      x1="32"
                      y1="102"
                      x2="208"
                      y2="102"
                      stroke="#ffffff"
                      strokeWidth="4"
                      strokeLinecap="round"
                      style={{ filter: 'drop-shadow(0 0 10px #fef08a)' }}
                    />
                    <polygon
                      points="120,98 70,30 170,30"
                      fill="url(#innerLightBeam)"
                      opacity="0.8"
                    />
                  </g>
                )}

                {/* 스파클 장식 */}
                <path
                  d="M 60 70 Q 64 78 72 78 Q 64 78 60 86 Q 56 78 48 78 Q 56 78 60 70 Z"
                  fill="#fef08a"
                  opacity={tapCount >= 1 ? '1' : '0.4'}
                />
                <path
                  d="M 180 65 Q 184 72 190 72 Q 184 72 180 79 Q 176 72 170 72 Q 176 72 180 65 Z"
                  fill="#fef08a"
                  opacity={tapCount >= 1 ? '1' : '0.4'}
                />
              </svg>
            </div>

            {/* 탭 카운터 */}
            <div
              style={{
                display: 'flex',
                gap: '8px',
                marginTop: '16px',
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
                    {done ? '💥' : '🗝️'} {step}단계
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={handleChestTap}
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
              <span>👆 황금 상자 쿵쿵 두드리기! ({3 - tapCount}번 남음)</span>
            </button>
          </div>
        ))}

        {/* ─── 결과 카드 뷰 (개봉 완료) ─── */}
        {isHatched && reward && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              width: '100%',
              animation: 'chestCardZoom 0.55s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
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
                  fontSize: '56px',
                  marginBottom: '8px',
                  position: 'relative',
                  zIndex: 1,
                  animation: 'chestRewardBounce 0.6s ease-out',
                }}
              >
                {reward.id === 'miss' ? '🦖💨' : `${reward.emoji}🎁`}
              </div>

              {/* 메인 텍스트 */}
              <div
                style={{
                  fontSize: '12px',
                  fontWeight: 900,
                  color: `${reward.borderColor}`,
                  marginBottom: '4px',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  zIndex: 1,
                }}
              >
                {reward.id === 'miss' ? 'OOPS! TRY NEXT TIME' : 'PREMIUM REWARD COUPON'}
              </div>
              <div
                style={{
                  fontSize: '24px',
                  fontWeight: 900,
                  color: '#ffffff',
                  textShadow: `0 0 20px ${reward.borderColor}`,
                  margin: '4px 0',
                  letterSpacing: '-0.02em',
                  zIndex: 1,
                  textAlign: 'center',
                }}
              >
                {reward.label}
              </div>
              <div
                style={{
                  fontSize: '12px',
                  color: '#cbd5e1',
                  fontWeight: 700,
                  textAlign: 'center',
                  marginTop: '6px',
                  zIndex: 1,
                  lineHeight: 1.4,
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
                  {reward.id === 'miss' ? (
                    <div>
                      아쉽지만 다음 상자에서 대박을 노려봐요! 💨
                      <br />
                      <span style={{ color: '#38bdf8', fontWeight: 900 }}>
                        ⚡ 위로 보너스로 EXP +{reward.bonusExp} 경험치가 지급되었습니다!
                      </span>
                    </div>
                  ) : (
                    <div>
                      📣 부모님께 이 화면을 보여주거나 쿠폰함에서 사용하세요!
                      <br />
                      <span style={{ color: reward.borderColor, fontWeight: 900 }}>
                        🎟️ 내 쿠폰함에 즉시 안전하게 보관되었습니다!
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 하단 버튼 영역 */}
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {treasureBoxCount !== undefined && treasureBoxCount > 0 && (
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
                    fontSize: '14px',
                    border: '2px solid #fde047',
                    boxShadow: '0 0 20px rgba(251, 191, 36, 0.7)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  <span>🎁 연속으로 다음 보물상자 열기 ({treasureBoxCount}개 남음)</span>
                </button>
              )}
              {onOpenCouponBox && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenCouponBox();
                  }}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '14px',
                    background: 'linear-gradient(90deg, #d97706 0%, #f59e0b 50%, #fbbf24 100%)',
                    color: '#000000',
                    fontWeight: 900,
                    fontSize: '14px',
                    border: '2px solid #fde047',
                    boxShadow: '0 0 20px rgba(251, 191, 36, 0.7)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  <Ticket size={16} />
                  <span>내 쿠폰함 바로 확인하기!</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleClose}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '12px',
                  backgroundColor: '#1e293b',
                  color: '#cbd5e1',
                  fontWeight: 800,
                  fontSize: '13px',
                  border: '1px solid #475569',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <CheckCircle2 size={16} />
                <span>확인 및 닫기</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes chestFlash {
          0% { opacity: 0.95; }
          100% { opacity: 0; }
        }
        @keyframes chestShake {
          0% { transform: translate3d(0,0,0) rotate(0deg); }
          20% { transform: translate3d(-8px,0,0) rotate(-6deg); }
          40% { transform: translate3d(8px,0,0) rotate(6deg); }
          60% { transform: translate3d(-5px,0,0) rotate(-4deg); }
          80% { transform: translate3d(5px,0,0) rotate(4deg); }
          100% { transform: translate3d(0,0,0) rotate(0deg); }
        }
        @keyframes chestFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes chestCardZoom {
          0% { transform: scale(0.6) rotateY(90deg); opacity: 0; }
          100% { transform: scale(1) rotateY(0deg); opacity: 1; }
        }
        @keyframes chestRewardBounce {
          0% { transform: scale(0.5); opacity: 0; }
          70% { transform: scale(1.25); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

// 기존 이름과의 하위 호환성 유지용 별칭
export const LuckyEggGachaModal = GoldenChestModal;
