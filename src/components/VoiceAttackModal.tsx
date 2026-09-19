import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { Mic, MicOff, Volume2, Zap, RotateCcw, Sparkles, CheckCircle2 } from 'lucide-react';
import type { WordItem } from '../types';
import { useVoiceRecognition, normalizeText } from '../hooks/useVoiceRecognition';
import type { VoiceLang } from '../hooks/useVoiceRecognition';
import { useSpeech } from '../hooks/useSpeech';
import { playCriticalRoarSound, playDingDongSuccess } from '../utils/soundEffects';

interface VoiceAttackModalProps {
  isOpen: boolean;
  word: WordItem | null;
  onAttack?: (isCritical: boolean) => void;
  onAttackSuccess?: () => void;
  onSkip?: () => void;
  onClose: () => void;
}

type LangKey = 'ko' | 'en' | 'ja';

const LANG_CONFIG: Record<
  LangKey,
  { voiceLang: VoiceLang; label: string; flag: string; stepNum: number; color: string }
> = {
  ko: { voiceLang: 'ko-KR', label: '한국어', flag: '🇰🇷', stepNum: 1, color: '#f59e0b' },
  en: { voiceLang: 'en-US', label: '영어', flag: '🇺🇸', stepNum: 2, color: '#06b6d4' },
  ja: { voiceLang: 'ja-JP', label: '일본어', flag: '🇯🇵', stepNum: 3, color: '#a855f7' },
};

// 개별 언어 발음 매칭 검사
const checkSingleLangMatch = (
  spokenText: string,
  targetLang: LangKey,
  word: WordItem
): boolean => {
  const normSpoken = normalizeText(spokenText);
  if (!normSpoken) return false;

  if (targetLang === 'ko') {
    const normKo = normalizeText(word.ko);
    return (
      normSpoken === normKo ||
      (normKo.length >= 2 && normSpoken.includes(normKo)) ||
      (normSpoken.length >= 2 && normKo.includes(normSpoken))
    );
  }

  if (targetLang === 'en') {
    const normEn = normalizeText(word.en);
    return (
      normSpoken === normEn ||
      normSpoken.startsWith(normEn) ||
      normEn.startsWith(normSpoken) ||
      (normEn.length >= 3 && normSpoken.includes(normEn))
    );
  }

  if (targetLang === 'ja') {
    const normJa = normalizeText(word.ja);
    const normJaKana = word.jaKana ? normalizeText(word.jaKana) : '';
    return Boolean(
      (normJa && (normSpoken === normJa || normSpoken.includes(normJa) || normJa.includes(normSpoken))) ||
      (normJaKana &&
        (normSpoken === normJaKana ||
          normSpoken.includes(normJaKana) ||
          normJaKana.includes(normSpoken)))
    );
  }

  return false;
};

// 미완료된 다음 언어 탐색 (순서: ko -> en -> ja)
const getNextUnclearedLang = (
  cleared: { ko: boolean; en: boolean; ja: boolean },
  currentPref?: LangKey
): LangKey | null => {
  const order: LangKey[] = currentPref
    ? [currentPref, 'ko', 'en', 'ja'].filter(
        (val, idx, arr) => arr.indexOf(val) === idx
      ) as LangKey[]
    : ['ko', 'en', 'ja'];

  for (const lang of order) {
    if (!cleared[lang]) return lang;
  }
  return null;
};

export const VoiceAttackModal: React.FC<VoiceAttackModalProps> = ({
  isOpen,
  word,
  onAttack,
  onAttackSuccess,
  onSkip,
  onClose,
}) => {
  const { isListening, transcript, error, isSupported, startListening, stopListening } =
    useVoiceRecognition();
  const { speak } = useSpeech();

  // 3개 국어 클리어 상태
  const [clearedLangs, setClearedLangs] = useState<{ ko: boolean; en: boolean; ja: boolean }>({
    ko: false,
    en: false,
    ja: false,
  });
  const [selectedVoiceLang, setSelectedVoiceLang] = useState<VoiceLang>('ko-KR');
  const [isAllCleared, setIsAllCleared] = useState(false);
  const [justClearedLang, setJustClearedLang] = useState<LangKey | null>(null);
  const [showFlash, setShowFlash] = useState(false);
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  const timerRef = useRef<number | null>(null);
  const clearedLangsRef = useRef(clearedLangs);
  const isAllClearedRef = useRef(isAllCleared);
  const selectedVoiceLangRef = useRef(selectedVoiceLang);

  // 최신 Ref 동기화
  useEffect(() => {
    clearedLangsRef.current = clearedLangs;
  }, [clearedLangs]);

  useEffect(() => {
    isAllClearedRef.current = isAllCleared;
  }, [isAllCleared]);

  useEffect(() => {
    selectedVoiceLangRef.current = selectedVoiceLang;
  }, [selectedVoiceLang]);

  // 달성한 언어 개수 (0 ~ 3)
  const clearedCount = useMemo(() => {
    return Object.values(clearedLangs).filter(Boolean).length;
  }, [clearedLangs]);

  // 현재 선택된 음성 엔진 언어의 LangKey ('ko' | 'en' | 'ja')
  const currentLangKey: LangKey = useMemo(() => {
    if (selectedVoiceLang === 'en-US') return 'en';
    if (selectedVoiceLang === 'ja-JP') return 'ja';
    return 'ko';
  }, [selectedVoiceLang]);

  // 마이크 청취 시작 헬퍼
  const restartMicForLang = useCallback(
    (targetLang: VoiceLang) => {
      if (!isSupported) return;
      stopListening();
      window.setTimeout(() => {
        if (!isAllClearedRef.current) {
          startListening(targetLang, (text) => {
            handleCheckSpokenRef.current?.(text);
          });
        }
      }, 300);
    },
    [isSupported, startListening, stopListening]
  );

  // 음성 매칭 검사 로직
  const handleCheckSpoken = useCallback(
    (spoken: string) => {
      if (!word || isAllClearedRef.current) return;

      const currentCleared = clearedLangsRef.current;
      const activeKey =
        selectedVoiceLangRef.current === 'en-US'
          ? 'en'
          : selectedVoiceLangRef.current === 'ja-JP'
          ? 'ja'
          : 'ko';

      // 1. 현재 선택된 언어를 우선 검사
      let matchedLang: LangKey | null = null;
      if (!currentCleared[activeKey] && checkSingleLangMatch(spoken, activeKey, word)) {
        matchedLang = activeKey;
      } else {
        // 2. 다른 미완료 언어 검사 (아이들이 순서 상관없이 외쳐도 관대하게 수용)
        const candidates: LangKey[] = (['ko', 'en', 'ja'] as LangKey[]).filter(
          (k) => k !== activeKey && !currentCleared[k]
        );
        for (const candidate of candidates) {
          if (checkSingleLangMatch(spoken, candidate, word)) {
            matchedLang = candidate;
            break;
          }
        }
      }

      if (!matchedLang) return;

      // 해당 언어 클리어 처리
      const nextCleared = { ...currentCleared, [matchedLang]: true };
      clearedLangsRef.current = nextCleared;
      setClearedLangs(nextCleared);
      setJustClearedLang(matchedLang);
      window.setTimeout(() => setJustClearedLang(null), 1200);

      const allDone = nextCleared.ko && nextCleared.en && nextCleared.ja;

      if (allDone) {
        // 3 / 3 전체 완료! -> 메가 크리티컬 열선 발사
        setIsAllCleared(true);
        isAllClearedRef.current = true;
        setShowFlash(true);
        stopListening();

        playCriticalRoarSound();
        confetti({
          particleCount: 110,
          spread: 90,
          origin: { y: 0.55 },
          colors: ['#ef4444', '#f59e0b', '#00f2ff', '#10b981', '#a855f7'],
        });

        // 0.8초 후 크리티컬 공격 발사 및 모달 닫기
        window.setTimeout(() => {
          if (onAttackSuccess) {
            onAttackSuccess();
          } else if (onAttack) {
            onAttack(true);
          }
          onClose();
        }, 800);
      } else {
        // 단일 언어 성공 -> 딩동 효과음 + 미니 컨페티
        playDingDongSuccess();
        confetti({
          particleCount: 35,
          spread: 55,
          origin: { y: 0.6 },
          colors: ['#10b981', '#34d399', '#fde047'],
        });

        // 다음 미완료 언어로 자동 전환 및 마이크 재시작
        const nextLang = getNextUnclearedLang(nextCleared);
        if (nextLang) {
          const nextVoiceLang = LANG_CONFIG[nextLang].voiceLang;
          setSelectedVoiceLang(nextVoiceLang);
          selectedVoiceLangRef.current = nextVoiceLang;
          restartMicForLang(nextVoiceLang);
        }
      }
    },
    [word, stopListening, onAttack, onAttackSuccess, onClose, restartMicForLang]
  );

  const handleCheckSpokenRef = useRef(handleCheckSpoken);
  useEffect(() => {
    handleCheckSpokenRef.current = handleCheckSpoken;
  }, [handleCheckSpoken]);

  // 실시간 인식 텍스트 변경 감지
  useEffect(() => {
    if (transcript && !isAllCleared) {
      handleCheckSpoken(transcript);
    }
  }, [transcript, isAllCleared, handleCheckSpoken]);

  // 모달 열림 / 닫힘 시 초기화
  useEffect(() => {
    if (isOpen && word) {
      setClearedLangs({ ko: false, en: false, ja: false });
      clearedLangsRef.current = { ko: false, en: false, ja: false };
      setIsAllCleared(false);
      isAllClearedRef.current = false;
      setSelectedVoiceLang('ko-KR');
      selectedVoiceLangRef.current = 'ko-KR';
      setJustClearedLang(null);
      setShowFlash(false);
      setSecondsElapsed(0);

      // 자동 마이크 시작
      if (isSupported) {
        startListening('ko-KR', (text) => {
          handleCheckSpokenRef.current?.(text);
        });
      }

      timerRef.current = window.setInterval(() => {
        setSecondsElapsed((prev) => prev + 1);
      }, 1000);
    } else {
      stopListening();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      stopListening();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isOpen, word, isSupported, startListening, stopListening]);

  // 상단 탭 수동 선택
  const handleSelectLang = (lang: VoiceLang) => {
    setSelectedVoiceLang(lang);
    selectedVoiceLangRef.current = lang;
    if (!isAllCleared) {
      restartMicForLang(lang);
    }
  };

  // 재시도 핸들러
  const handleRetryMic = () => {
    if (isAllCleared) return;
    restartMicForLang(selectedVoiceLang);
  };

  // 건너뛰기 (일반 공격)
  const handleSkip = () => {
    stopListening();
    playDingDongSuccess();
    if (onSkip) {
      onSkip();
    } else if (onAttack) {
      onAttack(false);
    }
    onClose();
  };

  if (!isOpen || !word) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(2, 6, 23, 0.94)',
        backdropFilter: 'blur(8px)',
        padding: '12px',
      }}
    >
      {/* 성공 시 섬광 이펙트 */}
      {showFlash && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 60,
            backgroundColor: '#ffffff',
            animation: 'roarFlash 0.5s ease-out forwards',
            pointerEvents: 'none',
          }}
        />
      )}

      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '470px',
          backgroundColor: '#0f172a',
          border: isAllCleared
            ? '3px solid #10b981'
            : clearedCount > 0
            ? '2px solid #38bdf8'
            : '2px solid rgba(239, 68, 68, 0.5)',
          borderRadius: '24px',
          boxShadow: isAllCleared
            ? '0 0 50px rgba(16, 185, 129, 0.9), 0 0 25px rgba(56, 189, 248, 0.8)'
            : clearedCount > 0
            ? '0 0 35px rgba(56, 189, 248, 0.5)'
            : '0 0 35px rgba(239, 68, 68, 0.35)',
          padding: '20px 18px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          transition: 'all 0.3s ease',
        }}
      >
        {/* 상단 콤보 배지 */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 14px',
            borderRadius: '9999px',
            background: isAllCleared
              ? 'linear-gradient(90deg, #059669, #10b981)'
              : 'linear-gradient(90deg, #b91c1c, #ea580c)',
            marginBottom: '8px',
            border: isAllCleared ? '1.5px solid #6ee7b7' : '1.5px solid #fca5a5',
            boxShadow: '0 0 12px rgba(239, 68, 68, 0.6)',
          }}
        >
          <Sparkles size={14} color="#fef08a" />
          <span style={{ fontSize: '12px', fontWeight: 900, color: '#ffffff' }}>
            {isAllCleared ? '🎉 3개 국어 완전 정복 성공!' : '🔥 고질라 3단 콤보 포효 미션'}
          </span>
        </div>

        {/* 타이틀 및 달성도 표시 */}
        <h2
          style={{
            fontSize: '19px',
            fontWeight: 900,
            color: '#ffffff',
            margin: '0 0 4px 0',
            textAlign: 'center',
            letterSpacing: '-0.02em',
          }}
        >
          🗣️ 3개 국어 포효 미션{' '}
          <span style={{ color: clearedCount === 3 ? '#4ade80' : '#fde047' }}>
            (달성: {clearedCount} / 3)
          </span>
        </h2>

        <p
          style={{
            fontSize: '12px',
            color: '#cbd5e1',
            fontWeight: 700,
            margin: '0 0 12px 0',
            textAlign: 'center',
          }}
        >
          3개 언어를 차례대로 외치면{' '}
          <span style={{ color: '#f87171', fontWeight: 900 }}>메가 크리티컬 2배 열선</span>이 발사돼요!
        </p>

        {/* 3단계 진행도 인디케이터 바 */}
        <div
          style={{
            width: '100%',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '6px',
            marginBottom: '14px',
          }}
        >
          {(['ko', 'en', 'ja'] as const).map((langKey) => {
            const config = LANG_CONFIG[langKey];
            const isDone = clearedLangs[langKey];
            const isActive = currentLangKey === langKey && !isDone;

            return (
              <div
                key={langKey}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  padding: '6px 8px',
                  borderRadius: '10px',
                  backgroundColor: isDone
                    ? 'rgba(16, 185, 129, 0.22)'
                    : isActive
                    ? 'rgba(239, 68, 68, 0.22)'
                    : 'rgba(30, 41, 59, 0.6)',
                  border: isDone
                    ? '1.5px solid #34d399'
                    : isActive
                    ? '1.5px solid #f87171'
                    : '1px solid #334155',
                  transition: 'all 0.2s ease',
                }}
              >
                <span style={{ fontSize: '13px' }}>{config.flag}</span>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    color: isDone ? '#6ee7b7' : isActive ? '#fca5a5' : '#94a3b8',
                  }}
                >
                  {isDone ? '✅ 완료' : `${config.stepNum}단계`}
                </span>
              </div>
            );
          })}
        </div>

        {/* 3개 국어 단어 카드 영역 */}
        <div
          style={{
            width: '100%',
            backgroundColor: '#020617',
            borderRadius: '16px',
            border: '1.5px solid rgba(255, 255, 255, 0.1)',
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            marginBottom: '14px',
          }}
        >
          {/* 1. 한국어 카드 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '7px 12px',
              borderRadius: '10px',
              backgroundColor: clearedLangs.ko
                ? 'rgba(16, 185, 129, 0.16)'
                : currentLangKey === 'ko'
                ? 'rgba(245, 158, 11, 0.15)'
                : 'rgba(30, 41, 59, 0.4)',
              border: clearedLangs.ko
                ? '1.5px solid #10b981'
                : currentLangKey === 'ko'
                ? '1.5px solid #f59e0b'
                : '1px solid rgba(255, 255, 255, 0.08)',
              boxShadow: justClearedLang === 'ko' ? '0 0 20px #10b981' : 'none',
              transform: justClearedLang === 'ko' ? 'scale(1.02)' : 'none',
              transition: 'all 0.25s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#f59e0b' }}>🇰🇷 한국어</span>
              <span style={{ fontSize: '16px', fontWeight: 900, color: '#ffffff' }}>{word.ko}</span>
            </div>

            {clearedLangs.ko ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '3px 8px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(16, 185, 129, 0.25)',
                  border: '1.5px solid #34d399',
                  color: '#6ee7b7',
                  fontSize: '11px',
                  fontWeight: 900,
                  animation: 'comboPop 0.3s ease-out',
                }}
              >
                <CheckCircle2 size={14} />
                <span>✅ 통과!</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => speak(word.ko, 'ko-KR')}
                title="발음 듣기"
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#f59e0b',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '4px',
                }}
              >
                <Volume2 size={17} />
              </button>
            )}
          </div>

          {/* 2. 영어 카드 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '7px 12px',
              borderRadius: '10px',
              backgroundColor: clearedLangs.en
                ? 'rgba(16, 185, 129, 0.16)'
                : currentLangKey === 'en'
                ? 'rgba(6, 182, 212, 0.15)'
                : 'rgba(30, 41, 59, 0.4)',
              border: clearedLangs.en
                ? '1.5px solid #10b981'
                : currentLangKey === 'en'
                ? '1.5px solid #06b6d4'
                : '1px solid rgba(255, 255, 255, 0.08)',
              boxShadow: justClearedLang === 'en' ? '0 0 20px #10b981' : 'none',
              transform: justClearedLang === 'en' ? 'scale(1.02)' : 'none',
              transition: 'all 0.25s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#22d3ee' }}>🇺🇸 영어</span>
              <span style={{ fontSize: '16px', fontWeight: 900, color: '#ffffff' }}>{word.en}</span>
            </div>

            {clearedLangs.en ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '3px 8px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(16, 185, 129, 0.25)',
                  border: '1.5px solid #34d399',
                  color: '#6ee7b7',
                  fontSize: '11px',
                  fontWeight: 900,
                  animation: 'comboPop 0.3s ease-out',
                }}
              >
                <CheckCircle2 size={14} />
                <span>✅ 통과!</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => speak(word.en, 'en-US')}
                title="발음 듣기"
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#22d3ee',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '4px',
                }}
              >
                <Volume2 size={17} />
              </button>
            )}
          </div>

          {/* 3. 일본어 카드 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '7px 12px',
              borderRadius: '10px',
              backgroundColor: clearedLangs.ja
                ? 'rgba(16, 185, 129, 0.16)'
                : currentLangKey === 'ja'
                ? 'rgba(168, 85, 247, 0.15)'
                : 'rgba(30, 41, 59, 0.4)',
              border: clearedLangs.ja
                ? '1.5px solid #10b981'
                : currentLangKey === 'ja'
                ? '1.5px solid #a855f7'
                : '1px solid rgba(255, 255, 255, 0.08)',
              boxShadow: justClearedLang === 'ja' ? '0 0 20px #10b981' : 'none',
              transform: justClearedLang === 'ja' ? 'scale(1.02)' : 'none',
              transition: 'all 0.25s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#c084fc' }}>🇯🇵 일본어</span>
              <span style={{ fontSize: '16px', fontWeight: 900, color: '#ffffff' }}>
                {word.ja}
                {word.jaKana && (
                  <span style={{ fontSize: '12px', color: '#94a3b8', marginLeft: '4px' }}>
                    ({word.jaKana})
                  </span>
                )}
              </span>
            </div>

            {clearedLangs.ja ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '3px 8px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(16, 185, 129, 0.25)',
                  border: '1.5px solid #34d399',
                  color: '#6ee7b7',
                  fontSize: '11px',
                  fontWeight: 900,
                  animation: 'comboPop 0.3s ease-out',
                }}
              >
                <CheckCircle2 size={14} />
                <span>✅ 통과!</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => speak(word.jaKana || word.ja, 'ja-JP')}
                title="발음 듣기"
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#c084fc',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '4px',
                }}
              >
                <Volume2 size={17} />
              </button>
            )}
          </div>
        </div>

        {/* 언어 선택 탭 (순서 자유 전환 지원) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginBottom: '14px',
          }}
        >
          <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700 }}>외칠 언어:</span>
          {(
            [
              { code: 'ko-KR', key: 'ko' as LangKey, label: '🇰🇷 한국어' },
              { code: 'en-US', key: 'en' as LangKey, label: '🇺🇸 영어' },
              { code: 'ja-JP', key: 'ja' as LangKey, label: '🇯🇵 일본어' },
            ] as const
          ).map((tab) => {
            const isSelected = selectedVoiceLang === tab.code;
            const isDone = clearedLangs[tab.key];

            return (
              <button
                key={tab.code}
                type="button"
                onClick={() => handleSelectLang(tab.code)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '8px',
                  backgroundColor: isDone
                    ? 'rgba(16, 185, 129, 0.2)'
                    : isSelected
                    ? '#ef4444'
                    : '#1e293b',
                  color: isDone ? '#34d399' : isSelected ? '#ffffff' : '#94a3b8',
                  border: isDone
                    ? '1px solid #10b981'
                    : isSelected
                    ? '1px solid #fca5a5'
                    : '1px solid #334155',
                  fontSize: '11px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>{tab.label}</span>
                {isDone && <CheckCircle2 size={12} />}
              </button>
            );
          })}
        </div>

        {/* 중앙 마이크 인터랙션 영역 */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '4px 0 16px 0',
            position: 'relative',
          }}
        >
          {/* 대형 마이크 버튼 */}
          <button
            type="button"
            onClick={isListening ? stopListening : handleRetryMic}
            disabled={isAllCleared || !isSupported}
            style={{
              width: '88px',
              height: '88px',
              borderRadius: '9999px',
              backgroundColor: isAllCleared
                ? '#10b981'
                : isListening
                ? '#ef4444'
                : '#334155',
              border: isAllCleared
                ? '3px solid #6ee7b7'
                : isListening
                ? '3px solid #fca5a5'
                : '2px solid #64748b',
              boxShadow: isAllCleared
                ? '0 0 40px #10b981'
                : isListening
                ? '0 0 30px rgba(239, 68, 68, 0.85), inset 0 0 15px rgba(255, 255, 255, 0.3)'
                : '0 0 10px rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: isAllCleared ? 'default' : 'pointer',
              animation: isListening && !isAllCleared ? 'micPulse 1.2s infinite' : 'none',
              transition: 'all 0.25s ease',
            }}
          >
            {isAllCleared ? (
              <Zap size={42} color="#ffffff" />
            ) : isListening ? (
              <Mic size={40} color="#ffffff" />
            ) : (
              <MicOff size={36} color="#94a3b8" />
            )}
          </button>

          {/* 청취 상태 및 안내 메시지 */}
          <div
            style={{
              marginTop: '12px',
              textAlign: 'center',
              minHeight: '48px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {isAllCleared ? (
              <div
                style={{
                  fontSize: '16px',
                  fontWeight: 900,
                  color: '#4ade80',
                  animation: 'criticalPop 0.4s ease-out',
                }}
              >
                💥 3개 국어 완전 정복! 메가 크리티컬 열선 발사!
              </div>
            ) : !isSupported ? (
              <div style={{ fontSize: '12px', color: '#f87171', fontWeight: 700 }}>
                마이크를 지원하지 않는 브라우저입니다. [건너뛰기]를 눌러주세요.
              </div>
            ) : isListening ? (
              <>
                <div
                  style={{
                    fontSize: '13px',
                    fontWeight: 800,
                    color: '#fca5a5',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <span className="animate-pulse">🔴</span> [
                  {LANG_CONFIG[currentLangKey].flag} {LANG_CONFIG[currentLangKey].label}]로 크게
                  외쳐보세요!
                </div>
                {transcript && (
                  <div
                    style={{
                      fontSize: '12px',
                      color: '#67e8f9',
                      fontWeight: 700,
                      marginTop: '2px',
                    }}
                  >
                    "{transcript}"
                  </div>
                )}
              </>
            ) : (
              <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 700 }}>
                마이크 버튼을 눌러 다음 언어를 외쳐보세요!
              </div>
            )}

            {error && !isAllCleared && (
              <div style={{ fontSize: '11px', color: '#fb7185', marginTop: '2px' }}>
                {error === 'not-allowed'
                  ? '⚠️ 마이크 권한을 허용해주세요.'
                  : '다시 한번 힘차게 외쳐봐요!'}
              </div>
            )}
          </div>
        </div>

        {/* 지연 발생 시 재시도 가이드 */}
        {secondsElapsed >= 5 && !isAllCleared && (
          <div
            style={{
              marginBottom: '10px',
              padding: '6px 12px',
              borderRadius: '10px',
              backgroundColor: 'rgba(30, 41, 59, 0.8)',
              border: '1px solid #475569',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '11px',
              color: '#fde047',
            }}
          >
            <span>💡 인식이 잘 안 되나요?</span>
            <button
              type="button"
              onClick={handleRetryMic}
              style={{
                background: 'none',
                border: 'none',
                color: '#67e8f9',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
                textDecoration: 'underline',
              }}
            >
              <RotateCcw size={12} /> 다시 시도
            </button>
          </div>
        )}

        {/* 하단 안전장치: 건너뛰기(일반 공격) 버튼 */}
        <div
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            paddingTop: '12px',
          }}
        >
          <button
            type="button"
            onClick={handleRetryMic}
            disabled={isListening || isAllCleared}
            style={{
              padding: '8px 14px',
              borderRadius: '10px',
              backgroundColor: '#1e293b',
              border: '1px solid #475569',
              color: '#cbd5e1',
              fontSize: '12px',
              fontWeight: 800,
              cursor: isListening || isAllCleared ? 'default' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              opacity: isListening || isAllCleared ? 0.6 : 1,
            }}
          >
            <RotateCcw size={14} />
            <span>다시 말하기</span>
          </button>

          <button
            type="button"
            onClick={handleSkip}
            style={{
              padding: '8px 16px',
              borderRadius: '10px',
              background: 'linear-gradient(90deg, #0284c7, #2563eb)',
              border: '1px solid #38bdf8',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 900,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              boxShadow: '0 0 10px rgba(2, 132, 199, 0.4)',
            }}
          >
            <Zap size={14} />
            <span>⚡ 그냥 공격하기 (건너뛰기)</span>
          </button>
        </div>
      </div>

      <style>{`
        @keyframes roarFlash {
          0% { opacity: 0.9; }
          100% { opacity: 0; }
        }
        @keyframes micPulse {
          0% {
            box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7), 0 0 20px rgba(239, 68, 68, 0.5);
            transform: scale(1);
          }
          50% {
            box-shadow: 0 0 0 18px rgba(239, 68, 68, 0), 0 0 35px rgba(239, 68, 68, 0.8);
            transform: scale(1.06);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(239, 68, 68, 0), 0 0 20px rgba(239, 68, 68, 0.5);
            transform: scale(1);
          }
        }
        @keyframes comboPop {
          0% { transform: scale(0.6); opacity: 0; }
          70% { transform: scale(1.2); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes criticalPop {
          0% { transform: scale(0.7); opacity: 0; }
          60% { transform: scale(1.15); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};
