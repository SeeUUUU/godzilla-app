import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, Lock, Volume2, Sparkles, Calendar, Layers } from 'lucide-react';
import type { MonsterCardData, UnlockedMonsterRecord } from '../types';
import {
  MONSTER_CARDS,
  RARITY_METADATA,
  MonsterSvgIllustration,
  getStoredUnlockedMonsters,
} from '../data/monsterData';

interface MonsterBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  unlockedRecords?: Record<string, UnlockedMonsterRecord>;
}

export const MonsterBookModal: React.FC<MonsterBookModalProps> = ({
  isOpen,
  onClose,
  unlockedRecords: propRecords,
}) => {
  const [records, setRecords] = useState<Record<string, UnlockedMonsterRecord>>({});
  const [selectedMonster, setSelectedMonster] = useState<MonsterCardData | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const speechTimeoutRef = useRef<number | null>(null);

  // 모달 열릴 때 최신 도감 데이터 동기화
  useEffect(() => {
    if (isOpen) {
      const current = propRecords || getStoredUnlockedMonsters();
      setRecords(current);
      setSelectedMonster(null);
      setIsSpeaking(false);
    }
  }, [isOpen, propRecords]);

  // 발음 클린업
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

  if (!isOpen) return null;

  const totalCount = MONSTER_CARDS.length;
  const unlockedCount = Object.keys(records).filter((id) =>
    MONSTER_CARDS.some((m) => m.id === id)
  ).length;
  const progressPercent = Math.round((unlockedCount / totalCount) * 100);

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

        {/* 메인 10종 괴수 그리드 스크롤 영역 */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px 20px',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(115px, 1fr))',
              gap: '12px',
            }}
          >
            {MONSTER_CARDS.map((monster) => {
              const record = records[monster.id];
              const isUnlocked = !!record;
              const meta = RARITY_METADATA[monster.rarity];

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
                    border: isUnlocked
                      ? `2px solid ${meta.borderColor}`
                      : '1.5px dashed rgba(71, 85, 105, 0.6)',
                    borderRadius: '16px',
                    padding: '10px 8px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    minHeight: '145px',
                    cursor: isUnlocked ? 'pointer' : 'default',
                    boxShadow: isUnlocked ? `0 0 14px ${meta.shadowColor}` : 'none',
                    transition: 'all 0.2s ease',
                    position: 'relative',
                    userSelect: 'none',
                  }}
                >
                  {/* 상단: 등급 라벨 또는 미발견 상태 */}
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
                        }}
                      >
                        보유: {record.count || 1}장
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
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 하단 닫기 버튼 */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            backgroundColor: '#1e293b',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
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

              {/* 수집 기록 정보 (날짜 & 보유 수량) */}
              {selectedRecord && (
                <div
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-around',
                    padding: '6px 10px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    fontSize: '10px',
                    color: '#94a3b8',
                    fontWeight: 700,
                    marginBottom: '10px',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={12} color="#38bdf8" />
                    수집일: {selectedRecord.unlockedAt || '-'}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Layers size={12} color="#facc15" />
                    보유 수량: {selectedRecord.count || 1}장
                  </span>
                </div>
              )}

              {/* 확인 버튼 */}
              <button
                type="button"
                onClick={() => setSelectedMonster(null)}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '12px',
                  background: 'linear-gradient(90deg, #0284c7 0%, #2563eb 100%)',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '13px',
                  border: '1px solid #38bdf8',
                  cursor: 'pointer',
                }}
              >
                확인
              </button>
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
