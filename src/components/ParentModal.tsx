import React, { useState, useMemo } from 'react';
import type { WordItem, DailyDualQuest } from '../types';
import { X, Save, RotateCcw, AlertCircle, CheckCircle, Heart, BarChart3, BookOpen, ShieldAlert } from 'lucide-react';
import { DEFAULT_WORDS, auditAndHealWords, REGEX_KOREAN, REGEX_ENGLISH } from '../data/words';
import { getUnlockedPartIds, getUnlockedTitleIds } from '../data/atomicPartsData';

export const STORAGE_KEY_PARENT_CHEER = 'godzilla_parent_cheer_message';

export const getStoredParentCheer = (): string => {
  if (typeof window === 'undefined') return '';
  try {
    return localStorage.getItem(STORAGE_KEY_PARENT_CHEER) || '';
  } catch {
    return '';
  }
};

export interface ParentModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentWords: WordItem[];
  onSaveWords: (newWords: WordItem[]) => void;
  currentLevel?: number;
  onSetLevel?: (newLevel: number) => void;
  onResetAllData?: () => void;
  stageNum?: number;
  totalStages?: number;
  mathStageNum?: number;
  wrongWords?: WordItem[];
  unlockedMonsterCount?: number;
  attendanceDays?: number;
  dailyDualQuest?: DailyDualQuest;
}

interface ParentGateChallenge {
  a: number;
  b: number;
  answer: number;
}

const createParentGateChallenge = (): ParentGateChallenge => {
  const a = 12 + Math.floor(Math.random() * 8); // 12 ~ 19
  const b = 3 + Math.floor(Math.random() * 7);  // 3 ~ 9
  return { a, b, answer: a * b };
};

const getMathCurriculumLabel = (mathStage: number): string => {
  if (mathStage <= 3) return '두 자리 수 덧셈·뺄셈 (기본 연산)';
  if (mathStage <= 6) return '받아올림·받아내림 1회 집중 훈련';
  if (mathStage <= 8) return '세 수의 연속 덧셈과 뺄셈';
  if (mathStage <= 10) return '100 이하 두 자리 수 종합 응용';
  return '초2 서술형(문장제) 사고력 문제';
};

export const ParentModal: React.FC<ParentModalProps> = ({
  isOpen,
  onClose,
  currentWords,
  onSaveWords,
  currentLevel = 1,
  onSetLevel,
  onResetAllData,
  stageNum = 1,
  totalStages = 34,
  mathStageNum = 1,
  wrongWords = [],
  unlockedMonsterCount = 0,
  attendanceDays = 0,
  dailyDualQuest,
}) => {
  // 학부모 확인 게이트 (초등 2학년이 암산하기 어려운 두 자리 × 한 자리 곱셈)
  const [isParentVerified, setIsParentVerified] = useState(false);
  const [gateChallenge, setGateChallenge] = useState<ParentGateChallenge>(() =>
    createParentGateChallenge()
  );
  const [gateInput, setGateInput] = useState('');
  const [gateError, setGateError] = useState<string | null>(null);

  // 대시보드 탭 상태: 'report' | 'words' | 'data'
  const [activeTab, setActiveTab] = useState<'report' | 'words' | 'data'>('report');

  // 부모님 사랑의 응원 캡슐 메시지
  const [cheerMessage, setCheerMessage] = useState<string>(() => getStoredParentCheer());
  const [cheerSaved, setCheerSaved] = useState(false);

  // 모달 마운트 시 현재 단어 목록으로 초기화
  const [inputText, setInputText] = useState(() =>
    currentWords
      .map((w) =>
        w.jaKana
          ? `${w.ko}, ${w.en}, ${w.ja}, ${w.jaKana}`
          : `${w.ko}, ${w.en}, ${w.ja}`
      )
      .join('\n')
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const unlockedPartsCount = useMemo(() => getUnlockedPartIds().length, []);
  const unlockedTitlesCount = useMemo(() => getUnlockedTitleIds().length, []);

  // 오늘의 식탁 칭찬 한마디 자동 생성
  const praisePrompts = useMemo<string[]>(() => {
    const prompts: string[] = [];
    if (dailyDualQuest?.languageDone && dailyDualQuest?.mathDone) {
      prompts.push(
        `🌟 오늘 '3개 국어 배틀'과 '산수 디펜스' 일일 듀얼 퀘스트(2/2)를 모두 완주했어요! 저녁 식탁에서 "오늘 두 가지 임무 다 끝낸 고질라 사령관님 최고!"라고 하이파이브 해주세요.`
      );
    } else if (dailyDualQuest?.languageDone) {
      prompts.push(
        `🗣️ 오늘 3개 국어(한·영·일) 단어 배틀을 멋지게 클리어했어요! 산수 디펜스도 1판 해보면 일일 보너스를 받을 수 있다고 살짝 응원해 주세요.`
      );
    } else if (dailyDualQuest?.mathDone) {
      prompts.push(
        `🧮 오늘 산수 디펜스(${getMathCurriculumLabel(mathStageNum)}) 훈련을 완료했어요! 암산 실력이 쑥쑥 늘고 있다고 칭찬해 주세요.`
      );
    }

    if (wrongWords.length > 0) {
      const sample = wrongWords[0];
      prompts.push(
        `💡 현재 '${sample.ko}(${sample.en} / ${sample.ja})' 등 ${wrongWords.length}개 단어를 데자뷰 복습으로 극복하는 중이에요. 대화할 때 "${sample.ko}가 영어로 뭐였지?" 하고 자연스럽게 물어봐 주세요!`
      );
    } else {
      prompts.push(
        `🏆 밀린 오답 단어가 하나도 없어요! STAGE ${stageNum}까지의 단어를 완벽하게 소화하고 있습니다.`
      );
    }

    if (attendanceDays > 0) {
      prompts.push(
        `🐾 지금까지 누적 ${attendanceDays}일 동안 꾸준히 출석하며 학습 습관을 만들고 있어요. 꾸준함이 가장 큰 재능이라고 격려해 주세요!`
      );
    }
    return prompts;
  }, [dailyDualQuest, wrongWords, mathStageNum, stageNum, attendanceDays]);

  if (!isOpen) {
    return null;
  }

  const handleVerifyParentGate = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(gateInput.trim(), 10);
    if (parsed === gateChallenge.answer) {
      setIsParentVerified(true);
      setGateError(null);
    } else {
      setGateError('정답이 아닙니다. 새로운 문제를 확인해 주세요.');
      setGateInput('');
      setGateChallenge(createParentGateChallenge());
    }
  };

  const handleSaveCheer = () => {
    try {
      localStorage.setItem(STORAGE_KEY_PARENT_CHEER, cheerMessage.trim());
      setCheerSaved(true);
      window.setTimeout(() => setCheerSaved(false), 1800);
    } catch {
      // ignore
    }
  };

  const handleSave = () => {
    setErrorMessage(null);
    setSaveSuccess(false);

    const lines = inputText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) {
      setErrorMessage('최소 1개 이상의 단어 세트를 입력해주세요.');
      return;
    }

    const newWords: WordItem[] = [];

    for (let i = 0; i < lines.length; i++) {
      const parts = lines[i].split(/[,|\t]/).map((p) => p.trim()).filter(Boolean);
      if (parts.length < 3) {
        setErrorMessage(
          `${i + 1}번째 줄을 확인해 주세요. 한국어, 영어, 일본어는 모두 입력하고 쉼표(,), 탭 또는 |로 구분해 주세요. 일본어 읽기는 선택 사항입니다.`
        );
        return;
      }

      let ko = parts[0];
      let en = parts[1];
      let ja = parts[2];
      let jaKana = parts[3];

      if (parts.length >= 4 && REGEX_KOREAN.test(parts[1]) && REGEX_ENGLISH.test(parts[2])) {
        ko = `${parts[0]} / ${parts[1]}`;
        en = parts[2];
        ja = parts[3];
        jaKana = parts[4];
      }

      const defaultWord = DEFAULT_WORDS[i];
      const wordId = defaultWord?.id ?? `w${i + 1}`;

      newWords.push({
        id: wordId,
        ko,
        en,
        ja,
        jaKana: jaKana || undefined,
      });
    }

    const { healedWords } = auditAndHealWords(newWords, DEFAULT_WORDS);
    onSaveWords(healedWords);
    setSaveSuccess(true);
    setTimeout(() => {
      onClose();
    }, 450);
  };

  const handleResetToDefault = () => {
    const lines = DEFAULT_WORDS.map((w) =>
      w.jaKana
        ? `${w.ko}, ${w.en}, ${w.ja}, ${w.jaKana}`
        : `${w.ko}, ${w.en}, ${w.ja}`
    );
    setInputText(lines.join('\n'));
    setErrorMessage(null);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '12px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '580px',
          maxHeight: '90dvh',
          overflowY: 'auto',
          backgroundColor: '#0f172a',
          border: '2px solid #06b6d4',
          borderRadius: '24px',
          padding: '20px',
          boxShadow: '0 0 50px rgba(6, 182, 212, 0.5)',
          color: '#ffffff',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 모달 상단 헤더 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingBottom: '14px',
            borderBottom: '1px solid #334155',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '24px' }}>👨‍👩‍👦</span>
            <div>
              <h2 style={{ fontSize: '17px', fontWeight: 900, margin: 0, color: '#ffffff' }}>
                학부모 코칭 & 숙제 대시보드
              </h2>
              <p style={{ fontSize: '11px', color: '#94a3b8', margin: '2px 0 0 0' }}>
                아이의 학습 성취도를 확인하고 따뜻한 칭찬과 맞춤 단어를 선물하세요.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '6px',
              borderRadius: '8px',
              backgroundColor: '#1e293b',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X style={{ width: '18px', height: '18px' }} />
          </button>
        </div>

        {/* 학부모 확인 게이트 (미인증 시 표시) */}
        {!isParentVerified ? (
          <form onSubmit={handleVerifyParentGate} style={{ marginTop: '18px' }}>
            <div
              style={{
                padding: '18px 16px',
                borderRadius: '16px',
                backgroundColor: '#020617',
                border: '1.5px solid rgba(6, 182, 212, 0.45)',
                textAlign: 'center',
                marginBottom: '16px',
              }}
            >
              <div style={{ fontSize: '32px', marginBottom: '6px' }}>🔒</div>
              <h3 style={{ fontSize: '15px', fontWeight: 900, color: '#22d3ee', margin: '0 0 6px 0' }}>
                학부모 확인 (Parent Gate)
              </h3>
              <p style={{ fontSize: '12px', color: '#cbd5e1', margin: '0 0 14px 0', lineHeight: 1.4 }}>
                아이가 실수로 설정이나 데이터를 변경하지 못하도록<br />
                아래 곱셈 문제의 정답을 입력해 주세요.
              </p>

              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  padding: '10px 20px',
                  borderRadius: '12px',
                  backgroundColor: '#0f172a',
                  border: '1.5px solid #334155',
                  fontSize: '20px',
                  fontWeight: 900,
                  color: '#fde047',
                  marginBottom: '12px',
                }}
              >
                <span>{gateChallenge.a} × {gateChallenge.b} = ?</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                <input
                  type="number"
                  inputMode="numeric"
                  value={gateInput}
                  onChange={(e) => setGateInput(e.target.value)}
                  placeholder="정답 입력"
                  autoFocus
                  style={{
                    width: '130px',
                    padding: '10px 12px',
                    borderRadius: '12px',
                    backgroundColor: '#0f172a',
                    border: '2px solid #06b6d4',
                    color: '#ffffff',
                    fontSize: '16px',
                    fontWeight: 900,
                    textAlign: 'center',
                    outline: 'none',
                  }}
                />
                <button
                  type="submit"
                  style={{
                    padding: '10px 18px',
                    borderRadius: '12px',
                    backgroundColor: '#06b6d4',
                    border: 'none',
                    color: '#020617',
                    fontSize: '14px',
                    fontWeight: 900,
                    cursor: 'pointer',
                    boxShadow: '0 0 12px rgba(6, 182, 212, 0.4)',
                  }}
                >
                  확인
                </button>
              </div>

              {gateError && (
                <p style={{ fontSize: '12px', color: '#f87171', fontWeight: 700, margin: '10px 0 0 0' }}>
                  {gateError}
                </p>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '8px 14px',
                  borderRadius: '12px',
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  color: '#94a3b8',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                닫기
              </button>
            </div>
          </form>
        ) : (
          <>
            {/* 상단 3탭 네비게이션 */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '6px',
                marginTop: '14px',
                marginBottom: '16px',
                backgroundColor: '#020617',
                padding: '5px',
                borderRadius: '14px',
                border: '1px solid #1e293b',
              }}
            >
              <button
                type="button"
                onClick={() => setActiveTab('report')}
                style={{
                  padding: '8px 6px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: activeTab === 'report' ? '#06b6d4' : 'transparent',
                  color: activeTab === 'report' ? '#020617' : '#94a3b8',
                  fontSize: '12px',
                  fontWeight: 900,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '5px',
                }}
              >
                <BarChart3 size={14} />
                <span>칭찬·성장 리포트</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('words')}
                style={{
                  padding: '8px 6px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: activeTab === 'words' ? '#06b6d4' : 'transparent',
                  color: activeTab === 'words' ? '#020617' : '#94a3b8',
                  fontSize: '12px',
                  fontWeight: 900,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '5px',
                }}
              >
                <BookOpen size={14} />
                <span>알림장 단어장</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('data')}
                style={{
                  padding: '8px 6px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: activeTab === 'data' ? '#ef4444' : 'transparent',
                  color: activeTab === 'data' ? '#ffffff' : '#94a3b8',
                  fontSize: '12px',
                  fontWeight: 900,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '5px',
                }}
              >
                <ShieldAlert size={14} />
                <span>데이터 관리</span>
              </button>
            </div>

            {/* 탭 1: 칭찬 & 학습 성장 리포트 */}
            {activeTab === 'report' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* 오늘의 식탁 칭찬 한마디 브리핑 */}
                <div
                  style={{
                    padding: '14px',
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.14) 0%, rgba(16, 185, 129, 0.12) 100%)',
                    border: '1.5px solid rgba(34, 211, 238, 0.45)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '13px',
                      fontWeight: 900,
                      color: '#fde047',
                      marginBottom: '8px',
                    }}
                  >
                    <span>💬</span>
                    <span>오늘의 식탁 칭찬 가이드 (자동 분석)</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {praisePrompts.map((prompt, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: '8px 10px',
                          borderRadius: '10px',
                          backgroundColor: 'rgba(2, 6, 23, 0.65)',
                          fontSize: '12px',
                          color: '#e2e8f0',
                          lineHeight: 1.45,
                          fontWeight: 600,
                        }}
                      >
                        {prompt}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 영역별 성취도 요약 그리드 */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                  <div
                    style={{
                      padding: '12px',
                      borderRadius: '14px',
                      backgroundColor: '#020617',
                      border: '1px solid #1e293b',
                    }}
                  >
                    <div style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 900, marginBottom: '6px' }}>
                      🗣️ 3개 국어(한·영·일) 성취도
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: 900, color: '#ffffff' }}>
                      STAGE {stageNum} <span style={{ fontSize: '12px', color: '#64748b' }}>/ {totalStages}</span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                      수집 동료 괴수: <strong style={{ color: '#fde047' }}>{unlockedMonsterCount}/10종</strong>
                    </div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                      복습 중인 약점 단어: <strong style={{ color: '#f472b6' }}>{wrongWords.length}개</strong>
                    </div>
                  </div>

                  <div
                    style={{
                      padding: '12px',
                      borderRadius: '14px',
                      backgroundColor: '#020617',
                      border: '1px solid #1e293b',
                    }}
                  >
                    <div style={{ fontSize: '11px', color: '#fbbf24', fontWeight: 900, marginBottom: '6px' }}>
                      🧮 초2 산수 디펜스 성취도
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: 900, color: '#ffffff' }}>
                      STAGE {mathStageNum} <span style={{ fontSize: '12px', color: '#64748b' }}>/ 12</span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#cbd5e1', marginTop: '4px', fontWeight: 700 }}>
                      {getMathCurriculumLabel(mathStageNum)}
                    </div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                      해금 파츠/칭호: <strong style={{ color: '#34d399' }}>{unlockedPartsCount}개 / {unlockedTitlesCount}개</strong>
                    </div>
                  </div>
                </div>

                {/* 부모님 사랑의 응원 캡슐 */}
                <div
                  style={{
                    padding: '12px 14px',
                    borderRadius: '14px',
                    backgroundColor: '#020617',
                    border: '1px solid rgba(244, 114, 182, 0.4)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '12px',
                      fontWeight: 900,
                      color: '#f472b6',
                      marginBottom: '6px',
                    }}
                  >
                    <Heart size={14} />
                    <span>💌 괴수 아일랜드에 띄울 부모님 한 줄 응원 캡슐</span>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <input
                      type="text"
                      maxLength={60}
                      value={cheerMessage}
                      onChange={(e) => setCheerMessage(e.target.value)}
                      placeholder="예: 오늘도 열심히 공부한 우리 고질라 대장님 사랑해! ❤️"
                      style={{
                        flex: 1,
                        padding: '8px 10px',
                        borderRadius: '10px',
                        backgroundColor: '#0f172a',
                        border: '1px solid #334155',
                        color: '#ffffff',
                        fontSize: '12px',
                        outline: 'none',
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleSaveCheer}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '10px',
                        backgroundColor: cheerSaved ? '#10b981' : '#ec4899',
                        border: 'none',
                        color: '#ffffff',
                        fontSize: '12px',
                        fontWeight: 900,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {cheerSaved ? '전송 완료!' : '응원 남기기'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 탭 2: 알림장 단어장 관리 */}
            {activeTab === 'words' && (
              <>
                <div
                  style={{
                    margin: '0 0 12px 0',
                    padding: '12px 14px',
                    borderRadius: '14px',
                    backgroundColor: '#020617',
                    border: '1px solid rgba(6, 182, 212, 0.3)',
                    fontSize: '12px',
                    color: '#cbd5e1',
                  }}
                >
                  <p style={{ fontWeight: 800, color: '#22d3ee', margin: '0 0 4px 0' }}>
                    📝 입력 방법:
                  </p>
                  <p style={{ margin: 0 }}>
                    한 줄에 하나씩 <b>한국어, 영어, 일본어</b> 순서로 입력하세요.
                  </p>
                  <p style={{ margin: '4px 0 0 0', color: '#64748b' }}>
                    예시: 친구, Friend, ともだち
                  </p>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <textarea
                    rows={7}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={`친구, Friend, ともだち\n학교, School, がっこう\n사과, Apple, りんご\n고질라, Godzilla, ゴジラ`}
                    style={{
                      width: '100%',
                      backgroundColor: '#020617',
                      border: '2px solid #334155',
                      borderRadius: '16px',
                      padding: '12px 14px',
                      fontSize: '14px',
                      color: '#ffffff',
                      fontFamily: 'monospace',
                      outline: 'none',
                      boxSizing: 'border-box',
                      resize: 'none',
                    }}
                  />
                </div>

                {errorMessage && (
                  <div
                    style={{
                      marginBottom: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 14px',
                      borderRadius: '12px',
                      backgroundColor: '#450a0a',
                      border: '1px solid #ef4444',
                      color: '#fca5a5',
                      fontSize: '12px',
                      fontWeight: 700,
                    }}
                  >
                    <AlertCircle style={{ width: '16px', height: '16px', flexShrink: 0 }} />
                    <span style={{ whiteSpace: 'pre-line' }}>{errorMessage}</span>
                  </div>
                )}

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '8px',
                    borderTop: '1px solid #334155',
                  }}
                >
                  <button
                    type="button"
                    onClick={handleResetToDefault}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 12px',
                      borderRadius: '12px',
                      backgroundColor: '#1e293b',
                      border: '1px solid #475569',
                      color: '#94a3b8',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    <RotateCcw style={{ width: '13px', height: '13px' }} />
                    기본 단어장 복원
                  </button>

                  <button
                    type="button"
                    onClick={handleSave}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '10px 18px',
                      borderRadius: '14px',
                      backgroundColor: '#06b6d4',
                      border: 'none',
                      color: '#020617',
                      fontSize: '13px',
                      fontWeight: 900,
                      cursor: 'pointer',
                      boxShadow: '0 0 15px rgba(6, 182, 212, 0.4)',
                    }}
                  >
                    {saveSuccess ? (
                      <>
                        <CheckCircle style={{ width: '16px', height: '16px' }} />
                        저장 완료!
                      </>
                    ) : (
                      <>
                        <Save style={{ width: '16px', height: '16px' }} />
                        단어 저장 및 적용
                      </>
                    )}
                  </button>
                </div>
              </>
            )}

            {/* 탭 3: 데이터 관리 */}
            {activeTab === 'data' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {import.meta.env.DEV && onSetLevel && (
                  <div
                    style={{
                      padding: '10px 12px',
                      backgroundColor: '#020617',
                      borderRadius: '14px',
                      border: '1px solid #334155',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '11px',
                        fontWeight: 900,
                        color: '#94a3b8',
                        marginBottom: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span>🦖 [DEV] 고질라 진화 레벨 변경 (현재: LV.{currentLevel})</span>
                      <button
                        type="button"
                        onClick={() => onSetLevel(1)}
                        style={{
                          fontSize: '11px',
                          color: '#4ade80',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontWeight: 900,
                          textDecoration: 'underline',
                        }}
                      >
                        🐣 LV.1(치비)로 즉시 초기화
                      </button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '4px' }}>
                      {[
                        { lvl: 1, name: '치비', icon: '🐣', color: '#4ade80' },
                        { lvl: 3, name: '기본', icon: '🦖', color: '#06b6d4' },
                        { lvl: 5, name: '-1.0', icon: '⚡', color: '#38bdf8' },
                        { lvl: 7, name: '이블', icon: '😈', color: '#c084fc' },
                        { lvl: 9, name: '버닝', icon: '🔥', color: '#ff2200' },
                      ].map(({ lvl, name, icon, color }) => {
                        const isActive = currentLevel >= lvl && (lvl === 9 || currentLevel < lvl + 2);
                        return (
                          <button
                            key={lvl}
                            type="button"
                            onClick={() => onSetLevel(lvl)}
                            style={{
                              padding: '5px 2px',
                              borderRadius: '8px',
                              backgroundColor: isActive ? `${color}33` : '#1e293b',
                              border: `1.5px solid ${isActive ? color : '#334155'}`,
                              color: isActive ? color : '#94a3b8',
                              fontSize: '10px',
                              fontWeight: 900,
                              cursor: 'pointer',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: '1px',
                            }}
                          >
                            <span style={{ fontSize: '12px' }}>{icon}</span>
                            <span>LV.{lvl} {name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {onResetAllData && (
                  <div
                    style={{
                      padding: '14px',
                      backgroundColor: 'rgba(239, 68, 68, 0.08)',
                      borderRadius: '14px',
                      border: '1px dashed #ef4444',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '10px',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 900, color: '#f87171' }}>
                        ⚠️ 데이터 전체 초기화 (Ground Zero)
                      </div>
                      <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '3px', lineHeight: 1.4 }}>
                        모든 학습 진도·도감·쿠폰을 초기화하고 처음 상태로 되돌립니다.<br />
                        (웰컴 선물: 🎁 황금 보물상자 1개 지급)
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={onResetAllData}
                      style={{
                        flexShrink: 0,
                        padding: '8px 14px',
                        borderRadius: '10px',
                        backgroundColor: '#dc2626',
                        border: '1px solid #ef4444',
                        color: '#ffffff',
                        fontSize: '11px',
                        fontWeight: 900,
                        cursor: 'pointer',
                        boxShadow: '0 0 10px rgba(239, 68, 68, 0.4)',
                      }}
                    >
                      ⚠️ 전체 초기화
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
