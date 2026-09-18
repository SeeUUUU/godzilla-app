import React from 'react';
import { Settings, Zap, Award, BookOpen, LogOut } from 'lucide-react';
import { getGodzillaEvolution } from '../types';

interface HeaderProps {
  level: number;
  exp: number; // 0 ~ 99
  streak?: number;
  wrongCount?: number;
  isReviewMode?: boolean;
  stageLabel?: string;
  onOpenParentModal: () => void;
  onOpenReviewModal: () => void;
  onExitReviewMode?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  level,
  exp,
  streak = 0,
  wrongCount = 0,
  isReviewMode = false,
  stageLabel,
  onOpenParentModal,
  onOpenReviewModal,
  onExitReviewMode,
}) => {
  const expProgress = Math.min(100, Math.max(0, exp));
  const evo = getGodzillaEvolution(level);

  return (
    <header
      className="w-full flex-none bg-slate-900 border-b border-cyan-500/30 px-2 sm:px-4 py-1 sm:py-1.5 z-40 shadow-md backdrop-blur-md"
      style={{
        width: '100%',
        flexShrink: 0,
        backgroundColor: '#0f172a',
        borderBottom: '1.5px solid rgba(6, 182, 212, 0.4)',
        padding: '6px 14px',
        zIndex: 40,
      }}
    >
      <div
        className="max-w-5xl mx-auto flex items-center justify-between gap-2"
        style={{
          maxWidth: '1024px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* 타이틀 및 서브텍스트 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #06b6d4 0%, #2563eb 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 10px #06b6d4',
              border: '1.5px solid #a5f3fc',
              fontSize: '18px',
              userSelect: 'none',
              flexShrink: 0,
            }}
          >
            🦖
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <h1
                style={{
                  fontSize: '16px',
                  fontWeight: 900,
                  margin: 0,
                  letterSpacing: '0.02em',
                  background: 'linear-gradient(90deg, #67e8f9 0%, #fde047 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  lineHeight: '1.1',
                }}
              >
                고질라 언어 모험
              </h1>
              {streak > 1 && (
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 900,
                    padding: '1px 6px',
                    borderRadius: '9999px',
                    backgroundColor: 'rgba(245, 158, 11, 0.25)',
                    color: '#fde047',
                    border: '1px solid #f59e0b',
                  }}
                >
                  🔥 {streak}연속
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '1px' }}>
              <p style={{ fontSize: '10px', color: '#94a3b8', margin: 0, fontWeight: 600 }}>
                Godzilla Adventure · ゴジラのことばの大冒険
              </p>
              {stageLabel && (
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 900,
                    padding: '1px 7px',
                    borderRadius: '9999px',
                    backgroundColor: isReviewMode ? 'rgba(180, 83, 9, 0.35)' : 'rgba(6, 182, 212, 0.2)',
                    color: isReviewMode ? '#fde047' : '#67e8f9',
                    border: isReviewMode ? '1px solid #d97706' : '1px solid #0e7490',
                    whiteSpace: 'nowrap',
                    letterSpacing: '0.04em',
                  }}
                >
                  {stageLabel}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 레벨, EXP 바, 학부모 설정 버튼 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* 레벨 & EXP */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#020617',
              border: '1.5px solid rgba(6, 182, 212, 0.5)',
              borderRadius: '12px',
              padding: '4px 10px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
                color: '#67e8f9',
                fontWeight: 900,
                fontSize: '12px',
              }}
            >
              <Award style={{ width: '13px', height: '13px', color: '#facc15' }} />
              <span>LV.{level}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', minWidth: '70px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '9px',
                  color: '#94a3b8',
                  fontWeight: 700,
                  marginBottom: '1px',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '2px', color: '#22d3ee' }}>
                  <Zap style={{ width: '9px', height: '9px', fill: '#06b6d4', color: '#06b6d4' }} /> EXP
                </span>
                <span>{expProgress} / 100</span>
              </div>
              <div
                style={{
                  width: '100%',
                  backgroundColor: '#1e293b',
                  borderRadius: '9999px',
                  height: '6px',
                  overflow: 'hidden',
                  border: '1px solid #334155',
                }}
              >
                <div
                  style={{
                    width: `${expProgress}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #06b6d4 0%, #f59e0b 100%)',
                    borderRadius: '9999px',
                    transition: 'width 0.4s ease',
                  }}
                />
              </div>
            </div>
          </div>

          {/* 현재 변신 고질라 진화 뱃지 */}
          <div
            title={`${evo.name} (${evo.beamName})`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 9px',
              borderRadius: '10px',
              background: evo.badgeBg,
              border: `1.5px solid ${evo.themeColor}`,
              boxShadow: `0 0 10px ${evo.themeColor}55`,
              color: '#ffffff',
              fontWeight: 900,
              fontSize: '11px',
              userSelect: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            <span style={{ fontSize: '12px' }}>{evo.icon}</span>
            <span>{evo.shortName}</span>
          </div>

          {/* 오답노트 버튼 */}
          <button
            type="button"
            onClick={onOpenReviewModal}
            title={wrongCount > 0 ? `오답 단어 ${wrongCount}개 복습하기` : '오답노트'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '5px 9px',
              borderRadius: '10px',
              backgroundColor: isReviewMode
                ? 'rgba(245, 158, 11, 0.25)'
                : wrongCount > 0
                ? 'rgba(239, 68, 68, 0.18)'
                : '#1e293b',
              border: isReviewMode
                ? '1.5px solid #f59e0b'
                : wrongCount > 0
                ? '1.5px solid #ef4444'
                : '1.5px solid #475569',
              color: isReviewMode ? '#fef08a' : wrongCount > 0 ? '#fecaca' : '#cbd5e1',
              fontWeight: 800,
              fontSize: '11px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              boxShadow: wrongCount > 0 ? '0 0 10px rgba(239, 68, 68, 0.35)' : undefined,
            }}
          >
            <BookOpen
              style={{
                width: '13px',
                height: '13px',
                color: isReviewMode ? '#f59e0b' : wrongCount > 0 ? '#ef4444' : '#94a3b8',
              }}
            />
            <span>오답노트</span>
            <span
              style={{
                padding: '1px 6px',
                borderRadius: '9999px',
                fontSize: '10px',
                fontWeight: 900,
                backgroundColor: isReviewMode ? '#d97706' : wrongCount > 0 ? '#ef4444' : '#334155',
                color: '#ffffff',
                marginLeft: '1px',
              }}
            >
              {wrongCount}
            </span>
          </button>

          {/* ✕ 복습 모드 나가기 버튼 (복습 모드일 때만 표시) */}
          {isReviewMode && onExitReviewMode && (
            <button
              type="button"
              onClick={onExitReviewMode}
              title="오답 복습 특훈 종료 → 일반 모드로 복귀"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '5px 10px',
                borderRadius: '10px',
                backgroundColor: 'rgba(120, 53, 15, 0.4)',
                border: '1.5px solid #d97706',
                color: '#fde047',
                fontWeight: 900,
                fontSize: '11px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: '0 0 8px rgba(217, 119, 6, 0.4)',
                whiteSpace: 'nowrap',
              }}
            >
              <LogOut style={{ width: '13px', height: '13px', color: '#fbbf24' }} />
              <span>✕ 일반 모드로 나가기</span>
            </button>
          )}

          {/* 학부모 숙제 설정 버튼 (복습 모드 중에는 숨김) */}
          {!isReviewMode && (
            <button
              type="button"
              onClick={onOpenParentModal}
              title="알림장 단어 숙제 관리"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '5px 10px',
                borderRadius: '10px',
                backgroundColor: '#1e293b',
                border: '1.5px solid #475569',
                color: '#e2e8f0',
                fontWeight: 700,
                fontSize: '11px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <Settings style={{ width: '13px', height: '13px', color: '#22d3ee' }} />
              <span>숙제</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
