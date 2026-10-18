import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, Lock, Volume2, Sparkles, Calendar, Layers, Heart } from 'lucide-react';
import type { MonsterCardData, UnlockedMonsterRecord } from '../types';
import {
  MONSTER_CARDS,
  RARITY_METADATA,
  MonsterSvgIllustration,
  getStoredUnlockedMonsters,
  getStoredEquippedPartner,
  setStoredEquippedPartner,
  getMonsterAwakening,
} from '../data/monsterData';
import { getStoredParentCheer } from './ParentModal';
import { playVictoryFanfare } from '../utils/soundEffects';

interface SnackMenuItem {
  id: string;
  emoji: string;
  ko: string;
  en: string;
  ja: string;
  price: number;
}

const SNACK_MENU: SnackMenuItem[] = [
  { id: 'apple', emoji: '🍎', ko: '사과', en: 'Apple', ja: 'りんご', price: 300 },
  { id: 'milk', emoji: '🥛', ko: '우유', en: 'Milk', ja: 'ぎゅうにゅう', price: 400 },
  { id: 'bread', emoji: '🍞', ko: '빵', en: 'Bread', ja: 'パン', price: 500 },
  { id: 'banana', emoji: '🍌', ko: '바나나', en: 'Banana', ja: 'バナナ', price: 200 },
  { id: 'riceball', emoji: '🍙', ko: '주먹밥', en: 'Rice Ball', ja: 'おにぎり', price: 600 },
  { id: 'juice', emoji: '🧃', ko: '주스', en: 'Juice', ja: 'ジュース', price: 300 },
];

interface SnackOrderQuestion {
  customer: MonsterCardData;
  orderType: 'sum' | 'change';
  items: SnackMenuItem[];
  paidAmount?: number;
  promptKo: string;
  promptSub: string;
  correctAnswer: number;
  choices: number[];
}

function createSnackOrder(availableMonsters: MonsterCardData[]): SnackOrderQuestion {
  const pool = availableMonsters.length > 0 ? availableMonsters : [MONSTER_CARDS[0]];
  const customer = pool[Math.floor(Math.random() * pool.length)];
  const isChangeMode = Math.random() < 0.45;

  if (isChangeMode) {
    const item = SNACK_MENU[Math.floor(Math.random() * SNACK_MENU.length)];
    const paidAmount = 1000;
    const correctAnswer = paidAmount - item.price;
    const choiceSet = new Set<number>([correctAnswer]);
    const offsets = [-200, -100, 100, 200, 300];
    for (const off of offsets) {
      if (choiceSet.size >= 4) break;
      const cand = correctAnswer + off;
      if (cand >= 100 && cand <= 900) choiceSet.add(cand);
    }
    const choices = Array.from(choiceSet).sort((a, b) => a - b);
    return {
      customer,
      orderType: 'change',
      items: [item],
      paidAmount,
      promptKo: `${item.emoji} ${item.ko}(${item.en} · ${item.ja}) 1개를 사고 1,000원을 냈어요! 거스름돈은 얼마일까요?`,
      promptSub: `💡 1,000원 - ${item.price}원(${item.ko}) = ?`,
      correctAnswer,
      choices,
    };
  } else {
    const idx1 = Math.floor(Math.random() * SNACK_MENU.length);
    let idx2 = Math.floor(Math.random() * SNACK_MENU.length);
    if (idx2 === idx1) idx2 = (idx1 + 1) % SNACK_MENU.length;
    const item1 = SNACK_MENU[idx1];
    const item2 = SNACK_MENU[idx2];
    const correctAnswer = item1.price + item2.price;
    const choiceSet = new Set<number>([correctAnswer]);
    const offsets = [-200, -100, 100, 200, 300];
    for (const off of offsets) {
      if (choiceSet.size >= 4) break;
      const cand = correctAnswer + off;
      if (cand >= 200 && cand <= 1500) choiceSet.add(cand);
    }
    const choices = Array.from(choiceSet).sort((a, b) => a - b);
    return {
      customer,
      orderType: 'sum',
      items: [item1, item2],
      promptKo: `${item1.emoji} ${item1.ko}(${item1.en}) 1개랑 ${item2.emoji} ${item2.ko}(${item2.ja}) 1개 주세요! 모두 얼마인가요?`,
      promptSub: `💡 ${item1.price}원(${item1.ko}) + ${item2.price}원(${item2.ko}) = ?`,
      correctAnswer,
      choices,
    };
  }
}

type IslandThemeId = 'volcano' | 'ocean' | 'space';

const ISLAND_THEMES: Record<
  IslandThemeId,
  {
    name: string;
    emoji: string;
    bgGradient: string;
    borderColor: string;
    accentColor: string;
    subTitle: string;
  }
> = {
  volcano: {
    name: '화산 요새',
    emoji: '🌋',
    bgGradient: 'linear-gradient(180deg, #1c1917 0%, #450a0a 55%, #7c2d12 100%)',
    borderColor: '#f97316',
    accentColor: '#fdba74',
    subTitle: '뜨거운 용암 에너지가 넘치는 고질라의 고향 기지!',
  },
  ocean: {
    name: '심해 아틀란티스',
    emoji: '🌊',
    bgGradient: 'linear-gradient(180deg, #020617 0%, #083344 55%, #0e7490 100%)',
    borderColor: '#06b6d4',
    accentColor: '#67e8f9',
    subTitle: '신비로운 푸른 바닷속 고대 괴수 안식처!',
  },
  space: {
    name: '네온 우주 기지',
    emoji: '🌌',
    bgGradient: 'linear-gradient(180deg, #090d16 0%, #2e1065 55%, #4c1d95 100%)',
    borderColor: '#a855f7',
    accentColor: '#d8b4fe',
    subTitle: '은하계 별빛과 플라즈마가 빛나는 우주 방위 기지!',
  },
};

const MONSTER_CHEER_QUOTES: Record<string, { ko: string; en: string; ja: string }> = {
  godzilla: { ko: '크아앙! 오늘도 끝까지 포기하지 마!', en: 'Never give up today!', ja: 'きょうも あきらめるな！' },
  mothra: { ko: '반짝반짝 평화의 날개로 너를 응원해!', en: 'Cheering for you with wings of peace!', ja: 'へいわの つばさで おうえんしてるよ！' },
  rodan: { ko: '마하의 속도로 단어와 산수를 돌파하자!', en: 'Speed through words and math!', ja: 'マッハの スピードで とっぱしよう！' },
  ghidorah: { ko: '세 개의 머리로 3개 국어를 완벽 정복!', en: 'Master 3 languages with triple power!', ja: '３つの あたまで ３かこくご マスター！' },
  mechagodzilla: { ko: '삐빅! 두뇌 풀가동! 정답률 100% 도전!', en: 'Full brain power! Aim for 100%!', ja: 'ずのう フルかどう！ １００パーセント！' },
};

interface MonsterBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  unlockedRecords?: Record<string, UnlockedMonsterRecord>;
  hasClaimedCodexReward?: boolean;
  onOpenCodexChest?: () => void;
  onClaimCodexReward?: () => void;
  treasureBoxes?: number;
  onExchange?: () => boolean;
  equippedPartnerId?: string | null;
  onEquipPartner?: (partnerId: string | null) => void;
  onAddBonusExp?: (exp: number) => void;
}

export const MonsterBookModal: React.FC<MonsterBookModalProps> = ({
  isOpen,
  onClose,
  unlockedRecords: propRecords,
  onOpenCodexChest,
  onClaimCodexReward,
  equippedPartnerId: propEquippedPartnerId,
  onEquipPartner,
  onAddBonusExp,
}) => {
  const [records, setRecords] = useState<Record<string, UnlockedMonsterRecord>>({});
  const [equippedPartnerId, setEquippedPartnerId] = useState<string | null>(() => getStoredEquippedPartner());
  const [selectedMonster, setSelectedMonster] = useState<MonsterCardData | null>(null);
  const [viewMode, setViewMode] = useState<'codex' | 'island' | 'snack'>('codex');
  const [snackOrder, setSnackOrder] = useState<SnackOrderQuestion>(() => createSnackOrder([MONSTER_CARDS[0]]));
  const [snackAnswerStatus, setSnackAnswerStatus] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [snackServedCount, setSnackServedCount] = useState<number>(0);
  const [islandTheme, setIslandTheme] = useState<IslandThemeId>(() => {
    try {
      const saved = localStorage.getItem('godzilla_island_theme');
      if (saved === 'volcano' || saved === 'ocean' || saved === 'space') return saved;
    } catch {}
    return 'volcano';
  });
  const [cheeringMonster, setCheeringMonster] = useState<MonsterCardData | null>(null);
  const [parentCheer, setParentCheer] = useState<string>('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const speechTimeoutRef = useRef<number | null>(null);
  const speechSessionRef = useRef(0);

  const stopSpeech = useCallback(() => {
    speechSessionRef.current += 1;
    if (speechTimeoutRef.current !== null) {
      window.clearTimeout(speechTimeoutRef.current);
      speechTimeoutRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, []);

  // 모달 열릴 때 최신 도감 데이터 동기화
  useEffect(() => {
    if (isOpen) {
      const current = propRecords || getStoredUnlockedMonsters();
      setRecords(current);
      setEquippedPartnerId(propEquippedPartnerId !== undefined ? propEquippedPartnerId : getStoredEquippedPartner());
      setSelectedMonster(null);
      setIsSpeaking(false);
      setParentCheer(getStoredParentCheer());
      const unlockedList = MONSTER_CARDS.filter((m) => (current[m.id]?.count ?? 0) >= 1);
      setCheeringMonster(unlockedList[0] || null);
      setSnackOrder(createSnackOrder(unlockedList));
      setSnackAnswerStatus('idle');
    }
  }, [isOpen, propRecords, propEquippedPartnerId]);

  const handleTogglePartner = useCallback((monsterId: string) => {
    setEquippedPartnerId((prev) => {
      const next = prev === monsterId ? null : monsterId;
      setStoredEquippedPartner(next);
      onEquipPartner?.(next);
      return next;
    });
  }, [onEquipPartner]);

  useEffect(() => {
    if (!isOpen) {
      stopSpeech();
    }
  }, [isOpen, stopSpeech]);

  // 발음 클린업
  useEffect(() => {
    return () => {
      speechSessionRef.current += 1;
      if (speechTimeoutRef.current !== null) window.clearTimeout(speechTimeoutRef.current);
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
    };
  }, []);

  // 3개 국어 이름 연속 발음 (한국어 -> 영어 -> 일본어)
  const speakMonsterNames = useCallback((monster: MonsterCardData) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    speechSessionRef.current += 1;
    const session = speechSessionRef.current;
    if (speechTimeoutRef.current !== null) window.clearTimeout(speechTimeoutRef.current);
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
      if (session !== speechSessionRef.current) return;
      speechTimeoutRef.current = window.setTimeout(() => {
        if (session !== speechSessionRef.current) return;
        window.speechSynthesis.speak(uttEn);
      }, 250);
    };

    uttEn.onend = () => {
      if (session !== speechSessionRef.current) return;
      speechTimeoutRef.current = window.setTimeout(() => {
        if (session !== speechSessionRef.current) return;
        window.speechSynthesis.speak(uttJa);
      }, 250);
    };

    uttJa.onend = () => {
      if (session === speechSessionRef.current) setIsSpeaking(false);
    };

    const onSpeechError = () => {
      if (session === speechSessionRef.current) stopSpeech();
    };
    uttJa.onerror = onSpeechError;
    uttEn.onerror = onSpeechError;
    uttKo.onerror = onSpeechError;

    window.speechSynthesis.speak(uttKo);
  }, [stopSpeech]);

  if (!isOpen) return null;

  const totalCount = MONSTER_CARDS.length;
  const unlockedCount = MONSTER_CARDS.filter((monster) => (records[monster.id]?.count ?? 0) >= 1).length;
  const progressPercent = Math.round((unlockedCount / totalCount) * 100);
  const isAllCollected = unlockedCount >= totalCount;

  const selectedMeta = selectedMonster ? RARITY_METADATA[selectedMonster.rarity] : null;
  const selectedRecord = selectedMonster ? records[selectedMonster.id] : null;

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
          maxWidth: '720px',
          maxHeight: '92vh',
          backgroundColor: '#0f172a',
          border: '2px solid rgba(6, 182, 212, 0.4)',
          borderRadius: '24px',
          boxShadow: '0 0 35px rgba(6, 182, 212, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* 모달 상단 헤더 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            backgroundColor: '#1e293b',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
              }}
            >
              📖
            </div>
            <div>
              <h2
                style={{
                  fontSize: '17px',
                  fontWeight: 900,
                  color: '#ffffff',
                  margin: 0,
                  lineHeight: '1.2',
                }}
              >
                괴수 카드 도감
              </h2>
              <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0, fontWeight: 600 }}>
                Monster Card Codex · 10종 괴수를 모두 모아보세요!
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
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
        </div>

        {/* 수집 진행률 바 */}
        <div
          style={{
            padding: '12px 20px',
            backgroundColor: 'rgba(15, 23, 42, 0.8)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '12px',
              fontWeight: 800,
              marginBottom: '6px',
            }}
          >
            <span style={{ color: '#67e8f9', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Sparkles size={14} color="#facc15" /> 수집 현황 ({unlockedCount} / {totalCount})
            </span>
            <span style={{ color: '#fde047' }}>{progressPercent}% 수집 완료</span>
          </div>

          <div
            style={{
              width: '100%',
              height: '8px',
              backgroundColor: '#1e293b',
              borderRadius: '9999px',
              overflow: 'hidden',
              border: '1px solid #334155',
            }}
          >
            <div
              style={{
                width: `${progressPercent}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #06b6d4 0%, #10b981 50%, #f59e0b 100%)',
                borderRadius: '9999px',
                transition: 'width 0.4s ease',
              }}
            />
          </div>
        </div>

        {/* 도감 / 괴수 아일랜드 기지 / 괴수 간식 트럭 탭 전환 바 */}
        <div
          style={{
            display: 'flex',
            gap: '6px',
            padding: '10px 20px',
            backgroundColor: '#0f172a',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            flexWrap: 'wrap',
          }}
        >
          <button
            type="button"
            onClick={() => setViewMode('codex')}
            style={{
              flex: 1,
              minWidth: '140px',
              padding: '9px 10px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: 900,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '5px',
              backgroundColor: viewMode === 'codex' ? 'rgba(6, 182, 212, 0.2)' : 'rgba(30, 41, 59, 0.6)',
              border: viewMode === 'codex' ? '2px solid #06b6d4' : '1px solid #334155',
              color: viewMode === 'codex' ? '#67e8f9' : '#94a3b8',
              boxShadow: viewMode === 'codex' ? '0 0 14px rgba(6, 182, 212, 0.25)' : 'none',
              transition: 'all 0.2s',
            }}
          >
            <span>📖</span>
            <span>괴수 카드 도감 ({unlockedCount}/{totalCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('island')}
            style={{
              flex: 1,
              minWidth: '140px',
              padding: '9px 10px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: 900,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '5px',
              backgroundColor: viewMode === 'island' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(30, 41, 59, 0.6)',
              border: viewMode === 'island' ? '2px solid #10b981' : '1px solid #334155',
              color: viewMode === 'island' ? '#6ee7b7' : '#94a3b8',
              boxShadow: viewMode === 'island' ? '0 0 14px rgba(16, 185, 129, 0.25)' : 'none',
              transition: 'all 0.2s',
            }}
          >
            <span>🏝️</span>
            <span>괴수 아일랜드 기지</span>
            {parentCheer && (
              <span
                style={{
                  padding: '1px 6px',
                  borderRadius: '9999px',
                  backgroundColor: '#ec4899',
                  color: '#ffffff',
                  fontSize: '10px',
                  fontWeight: 900,
                }}
              >
                💌 응원 도착
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setViewMode('snack')}
            style={{
              flex: 1,
              minWidth: '140px',
              padding: '9px 10px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: 900,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '5px',
              backgroundColor: viewMode === 'snack' ? 'rgba(245, 158, 11, 0.22)' : 'rgba(30, 41, 59, 0.6)',
              border: viewMode === 'snack' ? '2px solid #f59e0b' : '1px solid #334155',
              color: viewMode === 'snack' ? '#fde047' : '#94a3b8',
              boxShadow: viewMode === 'snack' ? '0 0 14px rgba(245, 158, 11, 0.3)' : 'none',
              transition: 'all 0.2s',
            }}
          >
            <span>🏪</span>
            <span>괴수 간식 트럭</span>
            <span
              style={{
                padding: '1px 5px',
                borderRadius: '9999px',
                backgroundColor: '#d97706',
                color: '#ffffff',
                fontSize: '9px',
                fontWeight: 900,
              }}
            >
              +20 EXP
            </span>
          </button>
        </div>

        {/* 10종 괴수 전원 수집 완료 시 황금 보물상자 교환 배너 */}
        {isAllCollected && (
          <div
            style={{
              margin: '12px 20px 0 20px',
              padding: '12px 16px',
              borderRadius: '16px',
              background: 'linear-gradient(90deg, #78350f 0%, #b45309 40%, #d97706 70%, #f59e0b 100%)',
              border: '2px solid #fde047',
              boxShadow: '0 0 24px rgba(251, 191, 36, 0.65)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '24px' }}>🏆</span>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 900, color: '#fef08a' }}>
                  🎉 10종 괴수 전원 수집 완료! (도감 마스터 달성)
                </div>
                <div style={{ fontSize: '11px', color: '#fef3c7', fontWeight: 700 }}>
                  최고 보상인 🎁 황금 보물상자(30분 쿠폰)로 교환할 수 있어요!
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                if (onClaimCodexReward) {
                  onClaimCodexReward();
                } else {
                  onOpenCodexChest?.();
                }
              }}
              className="animate-bounce"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '10px 18px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
                border: '2px solid #ffffff',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 900,
                cursor: 'pointer',
                boxShadow: '0 0 20px rgba(245, 158, 11, 0.85)',
              }}
            >
              <span style={{ fontSize: '18px' }}>🎁</span>
              <span>황금 보물상자로 교환하기!</span>
              <Sparkles size={16} color="#ffffff" />
            </button>
          </div>
        )}

        {/* 메인 스크롤 영역: 도감 그리드 또는 괴수 아일랜드 기지 */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px 20px',
          }}
        >
          {viewMode === 'island' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* 부모님 응원 캡슐 전광판 */}
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: '16px',
                  background: 'linear-gradient(90deg, rgba(131, 24, 67, 0.55) 0%, rgba(76, 29, 149, 0.55) 100%)',
                  border: '1.5px solid rgba(244, 114, 182, 0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '12px',
                      backgroundColor: 'rgba(236, 72, 153, 0.25)',
                      border: '1px solid #f472b6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Heart size={18} color="#f472b6" fill="#f472b6" />
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 900, color: '#f9a8d4', marginBottom: '2px' }}>
                      💌 부모님이 보낸 응원 전광판
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 900, color: '#ffffff', lineHeight: 1.35 }}>
                      “{parentCheer || '오늘도 씩씩하게 3개 국어와 산수에 도전하는 우리 아이 최고! 화이팅! ❤️'}”
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
                    window.speechSynthesis.cancel();
                    const text = parentCheer || '오늘도 씩씩하게 도전하는 우리 아이 최고! 화이팅!';
                    const utt = new SpeechSynthesisUtterance(text);
                    utt.lang = 'ko-KR';
                    utt.rate = 0.92;
                    window.speechSynthesis.speak(utt);
                  }}
                  style={{
                    padding: '7px 11px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(236, 72, 153, 0.3)',
                    border: '1px solid #f472b6',
                    color: '#fce7f3',
                    fontSize: '11px',
                    fontWeight: 900,
                    cursor: 'pointer',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Volume2 size={14} />
                  <span>듣기</span>
                </button>
              </div>

              {/* 아일랜드 배경 테마 선택기 */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '8px',
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: 900, color: '#cbd5e1' }}>
                  🎨 기지 테마 변경: <span style={{ color: ISLAND_THEMES[islandTheme].accentColor }}>{ISLAND_THEMES[islandTheme].subTitle}</span>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {(Object.keys(ISLAND_THEMES) as IslandThemeId[]).map((themeKey) => {
                    const t = ISLAND_THEMES[themeKey];
                    const active = islandTheme === themeKey;
                    return (
                      <button
                        key={themeKey}
                        type="button"
                        onClick={() => {
                          setIslandTheme(themeKey);
                          try {
                            localStorage.setItem('godzilla_island_theme', themeKey);
                          } catch {}
                        }}
                        style={{
                          padding: '5px 10px',
                          borderRadius: '10px',
                          fontSize: '11px',
                          fontWeight: 900,
                          cursor: 'pointer',
                          backgroundColor: active ? 'rgba(255,255,255,0.15)' : 'rgba(15, 23, 42, 0.7)',
                          border: active ? `1.5px solid ${t.borderColor}` : '1px solid #334155',
                          color: active ? '#ffffff' : '#94a3b8',
                        }}
                      >
                        {t.emoji} {t.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 괴수 아일랜드 인터랙티브 무대 */}
              <div
                style={{
                  borderRadius: '20px',
                  background: ISLAND_THEMES[islandTheme].bgGradient,
                  border: `2px solid ${ISLAND_THEMES[islandTheme].borderColor}`,
                  padding: '16px',
                  minHeight: '240px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  position: 'relative',
                  boxShadow: 'inset 0 0 40px rgba(0, 0, 0, 0.5)',
                }}
              >
                {unlockedCount === 0 ? (
                  <div
                    style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center',
                      padding: '32px 12px',
                      color: '#cbd5e1',
                    }}
                  >
                    <div style={{ fontSize: '42px', marginBottom: '8px' }}>🥚🏝️</div>
                    <div style={{ fontSize: '15px', fontWeight: 900, color: '#ffffff', marginBottom: '4px' }}>
                      아직 아일랜드 기지에 도착한 괴수가 없어요!
                    </div>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                      스테이지를 클리어하고 괴수 알을 부화시키면 이곳 기지에 괴수 친구들이 모여들어요!
                    </div>
                  </div>
                ) : (
                  <>
                    {/* 괴수 캐릭터 배치 그리드 */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(92px, 1fr))',
                        gap: '10px',
                        marginBottom: '14px',
                      }}
                    >
                      {MONSTER_CARDS.filter((m) => (records[m.id]?.count ?? 0) >= 1).map((monster) => {
                        const isCheering = cheeringMonster?.id === monster.id;
                        const isPartner = equippedPartnerId === monster.id;
                        const meta = RARITY_METADATA[monster.rarity];
                        return (
                          <button
                            key={monster.id}
                            type="button"
                            onClick={() => {
                              setCheeringMonster(monster);
                              speakMonsterNames(monster);
                            }}
                            style={{
                              padding: '8px 6px',
                              borderRadius: '16px',
                              backgroundColor: isCheering ? 'rgba(255, 255, 255, 0.16)' : 'rgba(15, 23, 42, 0.65)',
                              border: isCheering
                                ? '2px solid #fde047'
                                : isPartner
                                ? '2px solid #f59e0b'
                                : `1.5px solid ${meta.borderColor}88`,
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              cursor: 'pointer',
                              transform: isCheering ? 'translateY(-4px) scale(1.04)' : 'none',
                              transition: 'all 0.2s ease',
                              boxShadow: isCheering ? '0 0 18px rgba(253, 224, 71, 0.5)' : 'none',
                            }}
                          >
                            <div style={{ width: '56px', height: '56px', marginBottom: '4px' }}>
                              <MonsterSvgIllustration monsterId={monster.id} />
                            </div>
                            <span style={{ fontSize: '11px', fontWeight: 900, color: '#ffffff' }}>
                              {monster.ko}
                            </span>
                            <span style={{ fontSize: '9px', fontWeight: 800, color: isPartner ? '#fde047' : '#94a3b8' }}>
                              {isPartner ? '⚡동행 파트너' : `Lv.${records[monster.id]?.count || 1}`}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* 선택된 괴수의 3개 국어 응원 대화창 */}
                    {cheeringMonster && (
                      <div
                        style={{
                          padding: '12px 14px',
                          borderRadius: '14px',
                          backgroundColor: 'rgba(2, 6, 23, 0.88)',
                          border: '1.5px solid rgba(253, 224, 71, 0.5)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: '10px',
                        }}
                      >
                        <div style={{ flex: 1, minWidth: '200px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                            <span style={{ fontSize: '13px', fontWeight: 900, color: '#fde047' }}>
                              🗣️ {cheeringMonster.ko} ({cheeringMonster.en} · {cheeringMonster.ja})
                            </span>
                            <button
                              type="button"
                              onClick={() => speakMonsterNames(cheeringMonster)}
                              style={{
                                padding: '2px 7px',
                                borderRadius: '6px',
                                backgroundColor: '#0284c7',
                                border: 'none',
                                color: '#ffffff',
                                fontSize: '10px',
                                fontWeight: 900,
                                cursor: 'pointer',
                              }}
                            >
                              🔊 3개국어 이름 듣기
                            </button>
                          </div>
                          {(() => {
                            const quote = MONSTER_CHEER_QUOTES[cheeringMonster.id] || {
                              ko: `${cheeringMonster.ko}가 너의 3개 국어 모험을 힘차게 응원해!`,
                              en: `${cheeringMonster.en} cheers for your adventure!`,
                              ja: `${cheeringMonster.jaKana || cheeringMonster.ja}が おうえんしているよ！`,
                            };
                            return (
                              <div style={{ fontSize: '11px', color: '#e2e8f0', lineHeight: 1.45, fontWeight: 700 }}>
                                <div>🇰🇷 “{quote.ko}”</div>
                                <div style={{ color: '#bae6fd' }}>🇺🇸 “{quote.en}”</div>
                                <div style={{ color: '#fef08a' }}>🇯🇵 “{quote.ja}”</div>
                              </div>
                            );
                          })()}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleTogglePartner(cheeringMonster.id)}
                          style={{
                            padding: '8px 12px',
                            borderRadius: '10px',
                            backgroundColor:
                              equippedPartnerId === cheeringMonster.id
                                ? 'rgba(239, 68, 68, 0.25)'
                                : 'rgba(245, 158, 11, 0.25)',
                            border:
                              equippedPartnerId === cheeringMonster.id
                                ? '1.5px solid #ef4444'
                                : '1.5px solid #f59e0b',
                            color: '#ffffff',
                            fontSize: '11px',
                            fontWeight: 900,
                            cursor: 'pointer',
                          }}
                        >
                          {equippedPartnerId === cheeringMonster.id ? '✕ 파트너 해제' : '⚡ 파트너로 동행'}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ) : viewMode === 'snack' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* 간식 트럭 헤더 배너 */}
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: '16px',
                  background: 'linear-gradient(90deg, #78350f 0%, #b45309 50%, #9a3412 100%)',
                  border: '2px solid #f59e0b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '8px',
                }}
              >
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 900, color: '#fef08a' }}>
                    🏪 3개 국어 × 화폐 산수: 괴수 간식 트럭!
                  </div>
                  <div style={{ fontSize: '11px', color: '#fde68a', fontWeight: 700 }}>
                    메뉴판을 눌러 3개 국어 발음을 듣고, 배고픈 괴수 손님의 간식값과 거스름돈을 계산해 주세요!
                  </div>
                </div>
                <div
                  style={{
                    padding: '4px 12px',
                    borderRadius: '9999px',
                    backgroundColor: 'rgba(2, 6, 23, 0.7)',
                    border: '1.5px solid #fde047',
                    color: '#fde047',
                    fontSize: '12px',
                    fontWeight: 900,
                  }}
                >
                  🍔 오늘 대접한 손님: {snackServedCount}마리
                </div>
              </div>

              {/* 3개 국어 메뉴판 (6종 간식) */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                  gap: '8px',
                }}
              >
                {SNACK_MENU.map((item) => {
                  const isOrdered = snackOrder.items.some((i) => i.id === item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
                        window.speechSynthesis.cancel();
                        const uKo = new SpeechSynthesisUtterance(item.ko);
                        uKo.lang = 'ko-KR';
                        const uEn = new SpeechSynthesisUtterance(item.en);
                        uEn.lang = 'en-US';
                        const uJa = new SpeechSynthesisUtterance(item.ja);
                        uJa.lang = 'ja-JP';
                        uKo.onend = () => window.speechSynthesis.speak(uEn);
                        uEn.onend = () => window.speechSynthesis.speak(uJa);
                        window.speechSynthesis.speak(uKo);
                      }}
                      style={{
                        padding: '8px 6px',
                        borderRadius: '14px',
                        backgroundColor: isOrdered ? 'rgba(245, 158, 11, 0.2)' : 'rgba(30, 41, 59, 0.75)',
                        border: isOrdered ? '2px solid #fde047' : '1px solid #475569',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        cursor: 'pointer',
                        boxShadow: isOrdered ? '0 0 12px rgba(253, 224, 71, 0.45)' : 'none',
                      }}
                    >
                      <span style={{ fontSize: '22px' }}>{item.emoji}</span>
                      <span style={{ fontSize: '11px', fontWeight: 900, color: '#ffffff', marginTop: '2px' }}>
                        {item.ko} · {item.en}
                      </span>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: '#bae6fd' }}>
                        {item.ja}
                      </span>
                      <span
                        style={{
                          marginTop: '4px',
                          padding: '1px 7px',
                          borderRadius: '9999px',
                          backgroundColor: '#0f172a',
                          border: '1px solid #f59e0b',
                          color: '#fde047',
                          fontSize: '11px',
                          fontWeight: 900,
                        }}
                      >
                        💰 {item.price}원
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* 괴수 손님 주문 카운터 */}
              <div
                style={{
                  padding: '16px',
                  borderRadius: '18px',
                  backgroundColor: 'rgba(15, 23, 42, 0.9)',
                  border: '2px solid rgba(56, 189, 248, 0.45)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '68px',
                      height: '68px',
                      borderRadius: '16px',
                      backgroundColor: '#020617',
                      border: '2px solid #38bdf8',
                      padding: '6px',
                      flexShrink: 0,
                    }}
                  >
                    <MonsterSvgIllustration monsterId={snackOrder.customer.id} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '12px', fontWeight: 900, color: '#38bdf8', marginBottom: '3px' }}>
                      🗣️ 손님: {snackOrder.customer.ko} ({snackOrder.customer.en} · {snackOrder.customer.ja})
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 900, color: '#ffffff', lineHeight: 1.4 }}>
                      “{snackOrder.promptKo}”
                    </div>
                    <div style={{ fontSize: '12px', fontWeight: 800, color: '#fde047', marginTop: '4px' }}>
                      {snackOrder.promptSub}
                    </div>
                  </div>
                </div>

                {/* 4지선다 계산 버튼 */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                  {snackOrder.choices.map((choice) => {
                    const isCorrectChoice = choice === snackOrder.correctAnswer;
                    const showCorrect = snackAnswerStatus === 'correct' && isCorrectChoice;
                    return (
                      <button
                        key={choice}
                        type="button"
                        disabled={snackAnswerStatus === 'correct'}
                        onClick={() => {
                          if (choice === snackOrder.correctAnswer) {
                            setSnackAnswerStatus('correct');
                            setSnackServedCount((c) => c + 1);
                            playVictoryFanfare();
                            onAddBonusExp?.(20);
                          } else {
                            setSnackAnswerStatus('wrong');
                          }
                        }}
                        style={{
                          padding: '12px',
                          borderRadius: '14px',
                          fontSize: '15px',
                          fontWeight: 900,
                          cursor: snackAnswerStatus === 'correct' ? 'default' : 'pointer',
                          backgroundColor: showCorrect
                            ? 'rgba(16, 185, 129, 0.3)'
                            : 'rgba(30, 41, 59, 0.9)',
                          border: showCorrect ? '2px solid #10b981' : '1.5px solid #475569',
                          color: showCorrect ? '#6ee7b7' : '#ffffff',
                          transition: 'all 0.15s',
                        }}
                      >
                        🪙 {choice}원
                      </button>
                    );
                  })}
                </div>

                {/* 정답/오답 피드백 및 다음 손님 버튼 */}
                {snackAnswerStatus === 'wrong' && (
                  <div
                    style={{
                      padding: '8px 12px',
                      borderRadius: '10px',
                      backgroundColor: 'rgba(239, 68, 68, 0.2)',
                      border: '1px solid #f87171',
                      color: '#fecaca',
                      fontSize: '12px',
                      fontWeight: 800,
                      textAlign: 'center',
                    }}
                  >
                    앗! 위 메뉴판의 가격(💰)을 다시 보고 천천히 계산해 볼까요?
                  </div>
                )}

                {snackAnswerStatus === 'correct' && (
                  <div
                    style={{
                      padding: '10px 14px',
                      borderRadius: '12px',
                      backgroundColor: 'rgba(16, 185, 129, 0.2)',
                      border: '1.5px solid #34d399',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '8px',
                    }}
                  >
                    <div style={{ fontSize: '12px', fontWeight: 900, color: '#a7f3d0' }}>
                      🎉 계산 성공! {snackOrder.customer.ko}가 맛있게 먹고 보너스 +20 EXP를 선물했어요!
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const unlockedList = MONSTER_CARDS.filter((m) => (records[m.id]?.count ?? 0) >= 1);
                        setSnackOrder(createSnackOrder(unlockedList));
                        setSnackAnswerStatus('idle');
                      }}
                      style={{
                        padding: '7px 14px',
                        borderRadius: '10px',
                        background: 'linear-gradient(90deg, #f59e0b, #d97706)',
                        border: '1.5px solid #fde047',
                        color: '#ffffff',
                        fontSize: '12px',
                        fontWeight: 900,
                        cursor: 'pointer',
                      }}
                    >
                      다음 손님 주문 받기 🍔 →
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(115px, 1fr))',
              gap: '12px',
            }}
          >
            {MONSTER_CARDS.map((monster) => {
              const record = records[monster.id];
              const isUnlocked = (record?.count ?? 0) >= 1;
              const isEquipped = equippedPartnerId === monster.id;
              const meta = RARITY_METADATA[monster.rarity];
              const awakening = getMonsterAwakening(record?.count ?? 0);

              return (
                <div
                  key={monster.id}
                  onClick={() => {
                    if (isUnlocked) {
                      setSelectedMonster(monster);
                    }
                  }}
                  style={{
                    backgroundColor: isUnlocked ? meta.cardBg : '#0b0f19',
                    border: isEquipped
                      ? '2px solid #f59e0b'
                      : isUnlocked && awakening.stage >= 3
                      ? '2px solid #ec4899'
                      : isUnlocked
                      ? `2px solid ${meta.borderColor}`
                      : '1.5px dashed rgba(71, 85, 105, 0.6)',
                    borderRadius: '16px',
                    padding: '10px 8px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    minHeight: '170px',
                    cursor: isUnlocked ? 'pointer' : 'default',
                    boxShadow: isEquipped
                      ? '0 0 18px rgba(245, 158, 11, 0.85)'
                      : isUnlocked && awakening.stage >= 2
                      ? `0 0 16px ${awakening.glowColor}`
                      : isUnlocked
                      ? `0 0 14px ${meta.shadowColor}`
                      : 'none',
                    transition: 'all 0.2s ease',
                    position: 'relative',
                    userSelect: 'none',
                  }}
                >
                  {/* 상단: 등급 라벨 또는 미발견 상태 + 동행 중 뱃지 */}
                  <div
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '9px',
                      fontWeight: 900,
                      marginBottom: '4px',
                    }}
                  >
                    {isUnlocked ? (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <span
                            style={{
                              padding: '1px 5px',
                              borderRadius: '4px',
                              background: meta.badgeBg,
                              color: '#ffffff',
                            }}
                          >
                            {meta.label}
                          </span>
                          {isEquipped && (
                            <span
                              style={{
                                padding: '1px 4px',
                                borderRadius: '4px',
                                backgroundColor: '#f59e0b',
                                color: '#0f172a',
                                fontSize: '8px',
                                fontWeight: 900,
                              }}
                            >
                              ✨동행
                            </span>
                          )}
                        </div>
                        <span style={{ color: meta.starColor }}>{'★'.repeat(meta.stars)}</span>
                      </>
                    ) : (
                      <>
                        <span
                          style={{
                            padding: '1px 5px',
                            borderRadius: '4px',
                            backgroundColor: '#1e293b',
                            color: '#64748b',
                          }}
                        >
                          미발견
                        </span>
                        <Lock size={12} color="#64748b" />
                      </>
                    )}
                  </div>

                  {/* 중앙 일러스트 (획득 시) 또는 신비로운 물음표 그래픽 (미획득 시) */}
                  {isUnlocked ? (
                    <div
                      style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '14px',
                        backgroundColor: '#020617',
                        border: `1.5px solid ${meta.borderColor}66`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '4px',
                        margin: '4px 0',
                      }}
                    >
                      <MonsterSvgIllustration monsterId={monster.id} />
                    </div>
                  ) : (
                    <div
                      style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '14px',
                        backgroundColor: 'rgba(15, 23, 42, 0.75)',
                        border: '1.5px dashed #334155',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '4px 0',
                        position: 'relative',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '30px',
                          fontWeight: 900,
                          color: '#475569',
                          lineHeight: 1,
                          userSelect: 'none',
                          letterSpacing: '-0.02em',
                        }}
                      >
                        ?
                      </span>
                      <div
                        style={{
                          position: 'absolute',
                          bottom: '3px',
                          right: '3px',
                          backgroundColor: '#1e293b',
                          borderRadius: '9999px',
                          padding: '2px 3px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '1px solid #334155',
                        }}
                      >
                        <Lock size={10} color="#64748b" />
                      </div>
                    </div>
                  )}

                  {/* 하단: 이름 & 상태 */}
                  <div style={{ textAlign: 'center', width: '100%' }}>
                    <div
                      style={{
                        fontSize: '12px',
                        fontWeight: 900,
                        color: isUnlocked ? '#ffffff' : '#64748b',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {isUnlocked ? monster.ko : '???'}
                    </div>

                    {isUnlocked ? (
                      <div
                        style={{
                          fontSize: '9px',
                          color: '#94a3b8',
                          fontWeight: 700,
                          marginTop: '2px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px',
                        }}
                      >
                        <span>보유: {record.count}장</span>
                        <span
                          style={{
                            padding: '0px 4px',
                            borderRadius: '4px',
                            background: awakening.badgeBg,
                            color: '#ffffff',
                            fontSize: '8px',
                            fontWeight: 900,
                          }}
                        >
                          {awakening.shortBadge}
                        </span>
                      </div>
                    ) : (
                      <div
                        style={{
                          fontSize: '9px',
                          color: '#475569',
                          fontWeight: 700,
                          marginTop: '2px',
                        }}
                      >
                        알 깨기로 획득
                      </div>
                    )}

                    {/* 파트너 장착/해제 버튼 */}
                    {isUnlocked ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTogglePartner(monster.id);
                        }}
                        style={{
                          width: '100%',
                          marginTop: '6px',
                          padding: '4px 6px',
                          borderRadius: '8px',
                          fontSize: '10px',
                          fontWeight: 900,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '3px',
                          backgroundColor: isEquipped ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                          border: isEquipped ? '1px solid #ef4444' : '1px solid #f59e0b',
                          color: isEquipped ? '#fca5a5' : '#fde047',
                          boxShadow: isEquipped ? '0 0 6px rgba(239, 68, 68, 0.4)' : '0 0 6px rgba(245, 158, 11, 0.3)',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {isEquipped ? (
                          <>
                            <span>✕</span>
                            <span>장착 해제</span>
                          </>
                        ) : (
                          <>
                            <span>⚡</span>
                            <span>파트너 장착</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <div
                        style={{
                          width: '100%',
                          marginTop: '6px',
                          padding: '4px 6px',
                          borderRadius: '8px',
                          fontSize: '9px',
                          fontWeight: 700,
                          color: '#475569',
                          backgroundColor: 'rgba(30, 41, 59, 0.4)',
                          border: '1px solid rgba(71, 85, 105, 0.3)',
                        }}
                      >
                        미획득
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          )}
        </div>

        {/* 하단 버튼 영역 */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            backgroundColor: '#1e293b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: isAllCollected ? 'space-between' : 'flex-end',
            gap: '8px',
          }}
        >
          {isAllCollected && (
            <button
              type="button"
              onClick={() => {
                if (onClaimCodexReward) {
                  onClaimCodexReward();
                } else {
                  onOpenCodexChest?.();
                }
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: '12px',
                background: 'linear-gradient(90deg, #d97706, #f59e0b)',
                border: '1.5px solid #fde047',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: 900,
                cursor: 'pointer',
                boxShadow: '0 0 12px rgba(245, 158, 11, 0.5)',
              }}
            >
              <span>🎁</span>
              <span>황금 보물상자로 교환하기!</span>
              <Sparkles size={14} />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px 20px',
              borderRadius: '12px',
              backgroundColor: '#334155',
              border: '1px solid #475569',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
          >
            닫기
          </button>
        </div>

        {/* ──────── 획득한 괴수 상세 팝업 (Detail Modal) ──────── */}
        {selectedMonster && selectedMeta && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 60,
              backgroundColor: 'rgba(2, 6, 23, 0.95)',
              backdropFilter: 'blur(6px)',
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: 'detailFadeIn 0.25s ease-out forwards',
            }}
          >
            <div
              style={{
                width: '100%',
                maxWidth: '400px',
                borderRadius: '22px',
                backgroundColor: selectedMeta.cardBg,
                border: `3px solid ${selectedMeta.borderColor}`,
                boxShadow: `0 0 35px ${selectedMeta.shadowColor}`,
                padding: '18px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                position: 'relative',
              }}
            >
              {/* 상세 팝업 닫기 버튼 */}
              <button
                type="button"
                onClick={() => setSelectedMonster(null)}
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  background: 'rgba(30, 41, 59, 0.8)',
                  border: '1px solid #475569',
                  borderRadius: '9999px',
                  width: '30px',
                  height: '30px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#cbd5e1',
                  cursor: 'pointer',
                }}
              >
                <X size={16} />
              </button>

              {/* 상단 등급 정보 */}
              <div
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '10px',
                  paddingRight: '32px',
                }}
              >
                <span
                  style={{
                    padding: '3px 10px',
                    borderRadius: '8px',
                    background: selectedMeta.badgeBg,
                    color: '#ffffff',
                    fontSize: '11px',
                    fontWeight: 900,
                  }}
                >
                  {selectedMeta.label}
                </span>

                <span style={{ fontSize: '14px', color: selectedMeta.starColor }}>
                  {'★'.repeat(selectedMeta.stars)}
                </span>
              </div>

              {/* 대형 일러스트 */}
              <div
                style={{
                  width: '120px',
                  height: '120px',
                  borderRadius: '16px',
                  backgroundColor: '#090d16',
                  border: `1.5px solid ${selectedMeta.borderColor}66`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '8px',
                  marginBottom: '10px',
                }}
              >
                <MonsterSvgIllustration monsterId={selectedMonster.id} />
              </div>

              {/* 칭호 */}
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  color: selectedMeta.titleColor,
                  marginBottom: '2px',
                }}
              >
                {selectedMonster.title}
              </span>

              {/* 3개 국어 이름 박스 & 발음 듣기 */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  width: '100%',
                  backgroundColor: 'rgba(15, 23, 42, 0.8)',
                  borderRadius: '14px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  padding: '10px',
                  marginBottom: '10px',
                }}
              >
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
                    }}
                  >
                    {selectedMonster.ko}
                  </h3>

                  {/* 3개 국어 연속 발음 버튼 */}
                  <button
                    type="button"
                    onClick={() => speakMonsterNames(selectedMonster)}
                    title="3개 국어 발음 듣기"
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
                    }}
                  >
                    <Volume2 size={16} />
                  </button>
                </div>

                {/* 영어 & 일본어 */}
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
                    {selectedMonster.en}
                  </div>
                  <div style={{ color: '#fde047' }}>
                    <span style={{ fontSize: '10px', color: '#64748b', marginRight: '4px' }}>JA</span>
                    {selectedMonster.ja}
                    <span style={{ fontSize: '10px', color: '#cbd5e1', marginLeft: '4px' }}>
                      ({selectedMonster.jaKana})
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
                  marginBottom: '10px',
                }}
              >
                <div
                  style={{
                    display: 'inline-block',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    color: selectedMeta.titleColor,
                    fontWeight: 800,
                    marginBottom: '4px',
                  }}
                >
                  특기: {selectedMonster.element}
                </div>
                <p style={{ margin: 0 }}>{selectedMonster.description}</p>
              </div>

              {/* 수집 기록 정보 (날짜 & 보유 수량 & 각성 단계) */}
              {selectedRecord && (() => {
                const detailAwakening = getMonsterAwakening(selectedRecord.count || 1);
                return (
                  <div
                    style={{
                      width: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                      padding: '8px 10px',
                      borderRadius: '12px',
                      backgroundColor: 'rgba(2, 6, 23, 0.7)',
                      border: `1.5px solid ${detailAwakening.borderColor}`,
                      fontSize: '10px',
                      color: '#94a3b8',
                      fontWeight: 700,
                      marginBottom: '10px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={12} color="#38bdf8" />
                        수집일: {selectedRecord.unlockedAt || '-'}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Layers size={12} color="#facc15" />
                        보유 수량: {selectedRecord.count || 1}장
                      </span>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingTop: '4px',
                        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                        color: '#fde047',
                        fontWeight: 900,
                      }}
                    >
                      <span>🧬 {detailAwakening.label}</span>
                      <span
                        style={{
                          padding: '1px 6px',
                          borderRadius: '6px',
                          background: detailAwakening.badgeBg,
                          color: '#ffffff',
                          fontSize: '9px',
                        }}
                      >
                        파트너 효과 ×{detailAwakening.multiplier}배 ({detailAwakening.progressText})
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* 파트너 패시브 스킬 안내 카드 */}
              <div
                style={{
                  width: '100%',
                  borderRadius: '14px',
                  backgroundColor: 'rgba(245, 158, 11, 0.12)',
                  border: '1.5px solid rgba(245, 158, 11, 0.45)',
                  padding: '10px 12px',
                  marginBottom: '12px',
                  textAlign: 'left',
                  boxShadow: '0 0 10px rgba(245, 158, 11, 0.15)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                  <span style={{ fontSize: '15px' }}>{selectedMonster.partnerSkill.icon}</span>
                  <span style={{ fontSize: '12px', fontWeight: 900, color: '#fde047' }}>
                    파트너 패시브: [{selectedMonster.partnerSkill.name}]
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '11px', color: '#fef08a', lineHeight: 1.4, fontWeight: 600 }}>
                  {selectedMonster.partnerSkill.description}
                </p>
              </div>

              {/* 하단: 파트너 장착/해제 + 닫기 버튼 */}
              <div style={{ width: '100%', display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => {
                    handleTogglePartner(selectedMonster.id);
                  }}
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    borderRadius: '12px',
                    background: equippedPartnerId === selectedMonster.id
                      ? 'linear-gradient(90deg, #dc2626 0%, #b91c1c 100%)'
                      : 'linear-gradient(90deg, #d97706 0%, #f59e0b 100%)',
                    color: '#ffffff',
                    fontWeight: 900,
                    fontSize: '13px',
                    border: equippedPartnerId === selectedMonster.id ? '1.5px solid #f87171' : '1.5px solid #fde047',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    boxShadow: equippedPartnerId === selectedMonster.id
                      ? '0 0 12px rgba(239, 68, 68, 0.5)'
                      : '0 0 12px rgba(245, 158, 11, 0.5)',
                  }}
                >
                  {equippedPartnerId === selectedMonster.id ? (
                    <>
                      <span>✖</span>
                      <span>파트너 동행 해제</span>
                    </>
                  ) : (
                    <>
                      <span>⚡</span>
                      <span>이 괴수를 파트너로 장착!</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedMonster(null)}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '12px',
                    backgroundColor: '#334155',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '13px',
                    border: '1px solid #475569',
                    cursor: 'pointer',
                  }}
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes detailFadeIn {
          0% { opacity: 0; transform: scale(0.92); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};
