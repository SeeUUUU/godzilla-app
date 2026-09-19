import React, { useState, useEffect, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Volume2, Sparkles, X, CheckCircle2, Gift } from 'lucide-react';
import type { MonsterCardData } from '../types';
import {
  rollRandomMonster,
  saveMonsterToStorage,
  RARITY_METADATA,
  MonsterSvgIllustration,
} from '../data/monsterData';
import {
  playEggTapSound,
  playEggHatchSound,
  playCardRevealFanfare,
} from '../utils/soundEffects';

interface EggGachaModalProps {
  isOpen: boolean;
  onClose: () => void;
  eggCount?: number;
  onConsumeEgg?: () => void;
  onBonusExp?: (amount: number) => void;
  onMonsterUnlocked?: () => void;
  onRewardCollected?: (monster: MonsterCardData, isNew: boolean) => void;
}

export const EggGachaModal: React.FC<EggGachaModalProps> = ({
  isOpen,
  onClose,
  eggCount,
  onConsumeEgg,
  onBonusExp,
  onMonsterUnlocked,
  onRewardCollected,
}) => {
  const [tapCount, setTapCount] = useState(0); // 0, 1, 2, 3(깨짐)
  const [isShaking, setIsShaking] = useState(false);
  const [showFlash, setShowFlash] = useState(false);
  const [isHatched, setIsHatched] = useState(false);
  const [pulledMonster, setPulledMonster] = useState<MonsterCardData | null>(null);
  const [isNewMonster, setIsNewMonster] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const speechTimeoutRef = useRef<number | null>(null);

  // 모달 열릴 때 상태 초기화 및 닫힐 때 음성 취소
  useEffect(() => {
    if (isOpen) {
      setTapCount(0);
      setIsShaking(false);
      setShowFlash(false);
      setIsHatched(false);
      setPulledMonster(null);
      setIsNewMonster(false);
      setIsSpeaking(false);
    } else {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (speechTimeoutRef.current) {
        clearTimeout(speechTimeoutRef.current);
      }
      setIsSpeaking(false);
    }
  }, [isOpen]);

  // 음성 재생 취소 정리
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (speechTimeoutRef.current) {
        clearTimeout(speechTimeoutRef.current);
      }
    };
  }, []);

  // 3개 국어 이름 연속 발음 (한국어 -> 영어 -> 일본어)
  const speakMonsterNames = useCallback((monster: MonsterCardData) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();
    setIsSpeaking(true);

    const uttKo = new SpeechSynthesisUtterance(monster.ko);
    uttKo.lang = 'ko-KR';
    uttKo.rate = 0.85;

    const uttEn = new SpeechSynthesisUtterance(monster.en);
    uttEn.lang = 'en-US';
    uttEn.rate = 0.85;

    const uttJa = new SpeechSynthesisUtterance(monster.jaKana || monster.ja);
    uttJa.lang = 'ja-JP';
    uttJa.rate = 0.85;

    // 브라우저 보이스 매칭
    const voices = window.speechSynthesis.getVoices();
    const koVoice = voices.find((v) => v.lang.startsWith('ko'));
    const enVoice = voices.find((v) => v.lang.startsWith('en'));
    const jaVoice = voices.find((v) => v.lang.startsWith('ja'));
    if (koVoice) uttKo.voice = koVoice;
    if (enVoice) uttEn.voice = enVoice;
    if (jaVoice) uttJa.voice = jaVoice;

    uttKo.onend = () => {
      speechTimeoutRef.current = window.setTimeout(() => {
        window.speechSynthesis.speak(uttEn);
      }, 250);
    };

    uttEn.onend = () => {
      speechTimeoutRef.current = window.setTimeout(() => {
        window.speechSynthesis.speak(uttJa);
      }, 250);
    };

    uttJa.onend = () => {
      setIsSpeaking(false);
    };

    uttJa.onerror = () => setIsSpeaking(false);
    uttEn.onerror = () => setIsSpeaking(false);
    uttKo.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(uttKo);
  }, []);

  // 알 탭 핸들러 (3회 클릭 시 부화)
  const handleEggTap = () => {
    if (isHatched || tapCount >= 3 || (eggCount !== undefined && eggCount <= 0)) return;

    const nextCount = tapCount + 1;
    setTapCount(nextCount);
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 450);

    playEggTapSound(nextCount);

    // 3번째 클릭 시 알 깨짐 & 가챠 연출
    if (nextCount === 3) {
      setShowFlash(true);
      playEggHatchSound();

      setTimeout(() => {
        const monster = rollRandomMonster();
        setPulledMonster(monster);
        setIsHatched(true);
        setShowFlash(false);

        // 몬스터 저장 및 중복 판별
        const result = saveMonsterToStorage(monster.id);
        setIsNewMonster(result.isNew);

        // 알 보유 수량 1개 차감
        if (onConsumeEgg) {
          onConsumeEgg();
        }

        // 도감 갱신 통지
        if (onMonsterUnlocked) {
          onMonsterUnlocked();
        }
        if (onRewardCollected) {
          onRewardCollected(monster, result.isNew);
        }

        // 중복 시 보너스 EXP 지급
        if (!result.isNew && onBonusExp) {
          onBonusExp(30);
        }

        // 카드 등장 사운드 & 콘페티
        playCardRevealFanfare(monster.rarity);
        confetti({
          particleCount: monster.rarity === 'mythic' || monster.rarity === 'legendary' ? 120 : 70,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#00f2ff', '#f59e0b', '#ec4899', '#8b5cf6', '#10b981', '#f43f5e'],
        });
      }, 600);
    }
  };

  if (!isOpen) return null;

  const rarityInfo = pulledMonster ? RARITY_METADATA[pulledMonster.rarity] : null;

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
      {/* 3번째 탭 플래시 섬광 이펙트 */}
      {showFlash && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 60,
            backgroundColor: '#ffffff',
            animation: 'gachaFlash 0.6s ease-out forwards',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* 모달 윈도우 */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '430px',
          maxHeight: '92vh',
          overflowY: 'auto',
          backgroundColor: '#0f172a',
          border: isHatched && rarityInfo ? `2.5px solid ${rarityInfo.borderColor}` : '2px solid rgba(6, 182, 212, 0.4)',
          borderRadius: '24px',
          boxShadow: isHatched && rarityInfo ? `0 0 35px ${rarityInfo.shadowColor}` : '0 0 30px rgba(6, 182, 212, 0.3)',
          padding: '20px 18px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          transition: 'all 0.4s ease',
        }}
      >
        {/* 상단 닫기 버튼 */}
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
            transition: 'background 0.2s',
          }}
        >
          <X size={18} />
        </button>

        {/* 1. 알 깨기 인터랙션 뷰 */}
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
              onClick={onClose}
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
              paddingTop: '8px',
            }}
          >
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
                marginBottom: '10px',
                boxShadow: '0 0 12px rgba(245, 158, 11, 0.35)',
              }}
            >
              <span>🥚 보유 중인 알: {eggCount ?? 0}개</span>
            </div>

            {/* 타이틀 */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 14px',
                borderRadius: '9999px',
                background: 'linear-gradient(90deg, #0369a1, #06b6d4)',
                marginBottom: '10px',
              }}
            >
              <Sparkles size={14} color="#fef08a" />
              <span style={{ fontSize: '13px', fontWeight: 900, color: '#ffffff' }}>
                스테이지 클리어 보상!
              </span>
            </div>

            <h2
              style={{
                fontSize: '22px',
                fontWeight: 900,
                color: '#67e8f9',
                margin: '0 0 4px 0',
                letterSpacing: '-0.02em',
                textAlign: 'center',
              }}
            >
              🥚 신비로운 괴수 알
            </h2>

            <p
              style={{
                fontSize: '13px',
                color: '#cbd5e1',
                fontWeight: 700,
                margin: '0 0 16px 0',
                textAlign: 'center',
              }}
            >
              {tapCount === 0 && '화면 중앙의 알을 3번 톡톡 쳐서 깨뜨려보세요!'}
              {tapCount === 1 && '💥 금이 가기 시작했다! 한 번 더 탭!'}
              {tapCount === 2 && '🔥 거의 다 깨졌어요! 마지막 강력한 탭!'}
            </p>

            {/* 알 오브젝트 (클릭 인터랙션) */}
            <div
              onClick={handleEggTap}
              style={{
                position: 'relative',
                width: '190px',
                height: '240px',
                cursor: 'pointer',
                userSelect: 'none',
                transform: isShaking
                  ? 'translate3d(0, 0, 0) rotate(-6deg) scale(1.08)'
                  : 'translate3d(0, 0, 0) scale(1)',
                transition: 'transform 0.15s ease-in-out',
                animation: isShaking
                  ? 'eggShake 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97) both'
                  : 'eggFloat 3s ease-in-out infinite',
              }}
            >
              {/* 알 베이스 SVG */}
              <svg viewBox="0 0 140 180" style={{ width: '100%', height: '100%' }}>
                <defs>
                  {/* 알 그라데이션 */}
                  <radialGradient id="eggGrad" cx="38%" cy="32%" r="65%">
                    <stop offset="0%" stopColor="#cffafe" />
                    <stop offset="35%" stopColor="#38bdf8" />
                    <stop offset="70%" stopColor="#0284c7" />
                    <stop offset="100%" stopColor="#082f49" />
                  </radialGradient>
                  {/* 내부 에너지 발광 */}
                  <radialGradient id="innerEnergy" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#fef08a" stopOpacity="0.9" />
                    <stop offset="60%" stopColor="#f59e0b" stopOpacity="0.6" />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                  </radialGradient>
                </defs>

                {/* 알 그림자 */}
                <ellipse cx="70" cy="172" rx="48" ry="8" fill="rgba(0,0,0,0.5)" />

                {/* 알 본체 */}
                <path
                  d="M 70 8 C 112 8 135 75 135 125 C 135 162 108 172 70 172 C 32 172 5 162 5 125 C 5 75 28 8 70 8 Z"
                  fill="url(#eggGrad)"
                  stroke="#a5f3fc"
                  strokeWidth="3.5"
                  style={{
                    filter:
                      tapCount > 0
                        ? `drop-shadow(0 0 ${12 + tapCount * 8}px rgba(6, 182, 212, 0.9))`
                        : 'drop-shadow(0 0 12px rgba(6, 182, 212, 0.5))',
                  }}
                />

                {/* 알 위의 신비로운 괴수 점박이 무늬 */}
                <ellipse cx="44" cy="55" rx="10" ry="7" fill="#082f49" opacity="0.45" />
                <ellipse cx="98" cy="75" rx="13" ry="9" fill="#082f49" opacity="0.45" />
                <ellipse cx="50" cy="115" rx="16" ry="10" fill="#082f49" opacity="0.45" />
                <ellipse cx="88" cy="135" rx="9" ry="6" fill="#082f49" opacity="0.45" />

                {/* 반사 하이라이트 */}
                <path
                  d="M 42 22 C 30 40 26 70 28 92"
                  stroke="#ffffff"
                  strokeWidth="4"
                  strokeLinecap="round"
                  fill="none"
                  opacity="0.6"
                />

                {/* 1단계 금 (tapCount >= 1) */}
                {tapCount >= 1 && (
                  <g>
                    <polyline
                      points="68,18 76,34 65,48 78,64"
                      fill="none"
                      stroke="#fef08a"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      style={{ filter: 'drop-shadow(0 0 6px #fde047)' }}
                    />
                    <polyline
                      points="76,34 88,38"
                      fill="none"
                      stroke="#fef08a"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  </g>
                )}

                {/* 2단계 심화된 금 & 빛 새어나옴 (tapCount >= 2) */}
                {tapCount >= 2 && (
                  <g>
                    <circle cx="70" cy="85" r="28" fill="url(#innerEnergy)" />
                    <polyline
                      points="78,64 62,82 82,98 66,118 78,136"
                      fill="none"
                      stroke="#ffffff"
                      strokeWidth="4"
                      strokeLinecap="round"
                      style={{ filter: 'drop-shadow(0 0 10px #f59e0b)' }}
                    />
                    <polyline
                      points="62,82 46,88 40,102"
                      fill="none"
                      stroke="#fde047"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                    <polyline
                      points="82,98 102,106 108,122"
                      fill="none"
                      stroke="#fde047"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  </g>
                )}
              </svg>
            </div>

            {/* 하단 진행 인디케이터 (3회 게이지) */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginTop: '18px',
                marginBottom: '10px',
              }}
            >
              {[1, 2, 3].map((step) => {
                const isPassed = tapCount >= step;
                return (
                  <div
                    key={step}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 12px',
                      borderRadius: '9999px',
                      backgroundColor: isPassed ? '#0284c7' : '#1e293b',
                      border: isPassed ? '1.5px solid #38bdf8' : '1px solid #334155',
                      color: isPassed ? '#ffffff' : '#64748b',
                      fontSize: '12px',
                      fontWeight: 800,
                      transition: 'all 0.3s ease',
                    }}
                  >
                    <span>{isPassed ? '💥' : '🥚'}</span>
                    <span>{step}회</span>
                  </div>
                );
              })}
            </div>

            {/* 터치 유도 텍스트 */}
            <button
              type="button"
              onClick={handleEggTap}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '16px',
                background: 'linear-gradient(90deg, #06b6d4 0%, #2563eb 100%)',
                color: '#ffffff',
                fontWeight: 900,
                fontSize: '15px',
                border: '1.5px solid #67e8f9',
                boxShadow: '0 0 15px rgba(6, 182, 212, 0.5)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <span>👆</span>
              <span>알을 눌러서 깨뜨리기! ({3 - tapCount}번 남음)</span>
            </button>
          </div>
        ))}

        {/* 2. 알 깨짐 후 카드 등장 뷰 */}
        {isHatched && pulledMonster && rarityInfo && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              width: '100%',
              animation: 'cardZoomIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
            }}
          >
            {/* 신규 등록 / 중복 보너스 배지 */}
            <div style={{ marginBottom: '10px' }}>
              {isNewMonster ? (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 14px',
                    borderRadius: '9999px',
                    background: 'linear-gradient(90deg, #10b981, #059669)',
                    color: '#ffffff',
                    fontSize: '12px',
                    fontWeight: 900,
                    boxShadow: '0 0 12px rgba(16, 185, 129, 0.7)',
                    border: '1.5px solid #a7f3d0',
                  }}
                >
                  <Sparkles size={14} />
                  ✨ NEW! 신규 괴수 도감 등록!
                </span>
              ) : (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 14px',
                    borderRadius: '9999px',
                    background: 'linear-gradient(90deg, #d97706, #b45309)',
                    color: '#ffffff',
                    fontSize: '12px',
                    fontWeight: 900,
                    boxShadow: '0 0 12px rgba(245, 158, 11, 0.6)',
                    border: '1.5px solid #fde047',
                  }}
                >
                  <Gift size={14} />
                  이미 보유 중! 보너스 EXP +30 지급!
                </span>
              )}
            </div>

            {/* 괴수 카드 본체 */}
            <div
              style={{
                width: '100%',
                borderRadius: '20px',
                background: rarityInfo.cardBg,
                border: `3px solid ${rarityInfo.borderColor}`,
                boxShadow: `0 0 28px ${rarityInfo.shadowColor}`,
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* 상단: 등급 배지 & 별 개수 */}
              <div
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '10px',
                }}
              >
                <div
                  style={{
                    padding: '3px 10px',
                    borderRadius: '8px',
                    background: rarityInfo.badgeBg,
                    color: '#ffffff',
                    fontSize: '11px',
                    fontWeight: 900,
                    border: '1px solid rgba(255,255,255,0.4)',
                    letterSpacing: '0.04em',
                  }}
                >
                  {rarityInfo.label}
                </div>

                {/* 별 개수 표시 */}
                <div style={{ display: 'flex', gap: '2px' }}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span
                      key={i}
                      style={{
                        fontSize: '14px',
                        color: i < rarityInfo.stars ? rarityInfo.starColor : '#334155',
                        filter:
                          i < rarityInfo.stars
                            ? `drop-shadow(0 0 4px ${rarityInfo.starColor})`
                            : 'none',
                      }}
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>

              {/* 중앙 일러스트레이션 (SVG) */}
              <div
                style={{
                  width: '130px',
                  height: '130px',
                  borderRadius: '16px',
                  backgroundColor: '#090d16',
                  border: `1.5px solid ${rarityInfo.borderColor}66`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '8px',
                  marginBottom: '12px',
                  position: 'relative',
                }}
              >
                <MonsterSvgIllustration monsterId={pulledMonster.id} />
              </div>

              {/* 괴수 칭호 */}
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  color: rarityInfo.titleColor,
                  opacity: 0.9,
                  marginBottom: '2px',
                }}
              >
                {pulledMonster.title}
              </span>

              {/* 3개 국어 이름 표기 & 발음 버튼 */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  width: '100%',
                  backgroundColor: 'rgba(15, 23, 42, 0.75)',
                  borderRadius: '14px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  padding: '10px',
                  marginBottom: '10px',
                }}
              >
                {/* 한국어 이름 & 스피커 버튼 */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginBottom: '4px',
                  }}
                >
                  <h3
                    style={{
                      fontSize: '20px',
                      fontWeight: 900,
                      color: '#ffffff',
                      margin: 0,
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {pulledMonster.ko}
                  </h3>

                  {/* 3개 국어 연속 발음 스피커 버튼 */}
                  <button
                    type="button"
                    onClick={() => speakMonsterNames(pulledMonster)}
                    title="3개 국어(한·영·일) 이름 듣기"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '28px',
                      height: '28px',
                      borderRadius: '8px',
                      backgroundColor: isSpeaking ? '#0284c7' : '#1e293b',
                      border: isSpeaking ? '1.5px solid #38bdf8' : '1px solid #475569',
                      color: isSpeaking ? '#ffffff' : '#38bdf8',
                      cursor: 'pointer',
                      boxShadow: isSpeaking ? '0 0 10px #38bdf8' : 'none',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <Volume2 size={16} />
                  </button>
                </div>

                {/* 영어 & 일본어 (후리가나) 이름 */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '2px',
                    fontSize: '12px',
                    color: '#94a3b8',
                    fontWeight: 700,
                  }}
                >
                  <div style={{ color: '#bae6fd' }}>
                    <span style={{ fontSize: '10px', color: '#64748b', marginRight: '4px' }}>EN</span>
                    {pulledMonster.en}
                  </div>
                  <div style={{ color: '#fde047' }}>
                    <span style={{ fontSize: '10px', color: '#64748b', marginRight: '4px' }}>JA</span>
                    {pulledMonster.ja}
                    <span style={{ fontSize: '10px', color: '#cbd5e1', marginLeft: '4px' }}>
                      ({pulledMonster.jaKana})
                    </span>
                  </div>
                </div>
              </div>

              {/* 속성 & 설명 */}
              <div
                style={{
                  width: '100%',
                  fontSize: '11px',
                  color: '#cbd5e1',
                  lineHeight: '1.4',
                  textAlign: 'center',
                  marginBottom: '4px',
                }}
              >
                <div
                  style={{
                    display: 'inline-block',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    color: rarityInfo.titleColor,
                    fontWeight: 800,
                    marginBottom: '4px',
                  }}
                >
                  특기: {pulledMonster.element}
                </div>
                <p style={{ margin: 0 }}>{pulledMonster.description}</p>
              </div>
            </div>

            {/* 상단 알 보유 수량 배지 */}
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
                marginBottom: '10px',
                boxShadow: '0 0 12px rgba(245, 158, 11, 0.35)',
              }}
            >
              <span>🥚 보유 중인 알: {eggCount ?? 0}개</span>
            </div>

            {/* 도감에 보관하고 계속하기 / 연속 가챠 CTA */}
            {(eggCount ?? 0) > 0 ? (
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setTapCount(0);
                    setIsShaking(false);
                    setShowFlash(false);
                    setIsHatched(false);
                    setPulledMonster(null);
                    setIsNewMonster(false);
                    setIsSpeaking(false);
                  }}
                  style={{
                    width: '100%',
                    padding: '13px',
                    borderRadius: '14px',
                    background: 'linear-gradient(90deg, #f59e0b 0%, #ec4899 50%, #8b5cf6 100%)',
                    color: '#ffffff',
                    fontWeight: 900,
                    fontSize: '15px',
                    border: '2px solid #fde047',
                    boxShadow: '0 0 20px rgba(245, 158, 11, 0.6)',
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
                  onClick={onClose}
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
                  <CheckCircle2 size={16} />
                  <span>도감에 보관하고 닫기</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onClose}
                style={{
                  marginTop: '16px',
                  width: '100%',
                  padding: '12px',
                  borderRadius: '14px',
                  background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
                  color: '#ffffff',
                  fontWeight: 900,
                  fontSize: '14px',
                  border: '1.5px solid #6ee7b7',
                  boxShadow: '0 0 15px rgba(16, 185, 129, 0.5)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <CheckCircle2 size={18} />
                <span>도감에 보관하고 계속하기</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* 스타일 애니메이션 정의 */}
      <style>{`
        @keyframes gachaFlash {
          0% { opacity: 0.95; }
          100% { opacity: 0; }
        }
        @keyframes eggShake {
          0% { transform: translate3d(0, 0, 0) rotate(0deg); }
          20% { transform: translate3d(-6px, 0, 0) rotate(-7deg); }
          40% { transform: translate3d(6px, 0, 0) rotate(7deg); }
          60% { transform: translate3d(-4px, 0, 0) rotate(-4deg); }
          80% { transform: translate3d(4px, 0, 0) rotate(4deg); }
          100% { transform: translate3d(0, 0, 0) rotate(0deg); }
        }
        @keyframes eggFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes cardZoomIn {
          0% {
            transform: scale(0.65) rotateY(90deg);
            opacity: 0;
          }
          100% {
            transform: scale(1) rotateY(0deg);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};
