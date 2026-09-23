import React, { useState } from 'react';
import type { WordItem } from '../types';
import { X, Save, RotateCcw, AlertCircle, CheckCircle } from 'lucide-react';
import { DEFAULT_WORDS } from '../data/defaultWords';

interface ParentModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentWords: WordItem[];
  onSaveWords: (newWords: WordItem[]) => void;
  currentLevel?: number;
  onSetLevel?: (newLevel: number) => void;
  onResetAllData?: () => void;
}

export const ParentModal: React.FC<ParentModalProps> = ({
  isOpen,
  onClose,
  currentWords,
  onSaveWords,
  currentLevel = 1,
  onSetLevel,
  onResetAllData,
}) => {
  // 모달 마운트 시 현재 단어 목록으로 초기화 (setState in effect 방지)
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

  // 기본 상태(isOpen === false)일 때는 완전히 렌더링되지 않음
  if (!isOpen) {
    return null;
  }

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
      const parts = lines[i].split(/[,/|\t]/).map((p) => p.trim());
      if (parts.length < 3) {
        setErrorMessage(
          `${i + 1}번째 줄의 형식이 올바르지 않습니다.\n'한국어, 영어, 일본어' 3단어를 쉼표(,)로 구분해 주세요.`
        );
        return;
      }

      newWords.push({
        id: i + 1,
        ko: parts[0],
        en: parts[1],
        ja: parts[2],
        jaKana: parts[3] || undefined,
      });
    }

    onSaveWords(newWords);
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
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '560px',
          backgroundColor: '#0f172a',
          border: '2px solid #06b6d4',
          borderRadius: '24px',
          padding: '24px',
          boxShadow: '0 0 50px rgba(6, 182, 212, 0.5)',
          color: '#ffffff',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 모달 상단 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingBottom: '16px',
            borderBottom: '1px solid #334155',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '24px' }}>⚙️</span>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 900, margin: 0, color: '#ffffff' }}>
                알림장 단어 숙제 관리 (학부모용)
              </h2>
              <p style={{ fontSize: '12px', color: '#94a3b8', margin: '2px 0 0 0' }}>
                매일 바뀌는 알림장 단어를 입력해 고질라 게임에 등록하세요.
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

        {/* 설명 안내 박스 */}
        <div
          style={{
            margin: '16px 0',
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

        {/* 텍스트 영역 */}
        <div style={{ marginBottom: '16px' }}>
          <textarea
            rows={7}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`친구, Friend, ともだち\n학교, School, がっこう\n사과, Apple, りんご\n고질라, Godzilla, ゴジ라`}
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

        {/* 에러 메시지 */}
        {errorMessage && (
          <div
            style={{
              marginBottom: '16px',
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

        {/* 고질라 레벨 & 5단계 진화 형태 변경기 */}
        {onSetLevel && (
          <div
            style={{
              marginBottom: '14px',
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
              <span>🦖 고질라 진화 레벨 변경 (현재: LV.{currentLevel})</span>
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
                      transition: 'all 0.15s ease',
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

        {/* 전체 데이터 초기화 (Ground Zero 리셋) */}
        {onResetAllData && (
          <div
            style={{
              marginBottom: '14px',
              padding: '10px 12px',
              backgroundColor: 'rgba(239, 68, 68, 0.08)',
              borderRadius: '14px',
              border: '1px dashed #ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px',
            }}
          >
            <div>
              <div style={{ fontSize: '11px', fontWeight: 900, color: '#f87171' }}>
                ⚠️ 데이터 전체 초기화 (Ground Zero)
              </div>
              <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>
                레벨·스테이지·재화(알/상자)·도감·쿠폰·오답·출석을 모두 초기화합니다.
              </div>
            </div>
            <button
              type="button"
              onClick={onResetAllData}
              style={{
                flexShrink: 0,
                padding: '6px 12px',
                borderRadius: '10px',
                backgroundColor: '#dc2626',
                border: '1px solid #ef4444',
                color: '#ffffff',
                fontSize: '11px',
                fontWeight: 900,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                boxShadow: '0 0 10px rgba(239, 68, 68, 0.4)',
                transition: 'all 0.15s ease',
              }}
            >
              ⚠️ 데이터 전체 초기화
            </button>
          </div>
        )}

        {/* 하단 버튼 */}
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
            기본 6개 복원
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 14px',
                borderRadius: '12px',
                backgroundColor: 'transparent',
                border: 'none',
                color: '#94a3b8',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              닫기
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
        </div>
      </div>
    </div>
  );
};
