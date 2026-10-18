import React, { useState, useEffect } from 'react';
import { X, Search, ArrowRight, Eye, EyeOff, Sparkles, AlertCircle, RotateCcw } from 'lucide-react';
import type { MathProblemItem } from '../types';
import { getProblemHintFormula } from '../data/mathData';
import { playCardTapSound, playDingDongSuccess } from '../utils/soundEffects';

interface MathBlockHintModalProps {
  isOpen: boolean;
  onClose: () => void;
  problem: MathProblemItem;
  childName: string;
}

/** 10개 묶음 막대 1개 (세로형 10등분 블록 - 클릭 분해 및 소거 상태 지원) */
const TensBlock: React.FC<{
  label?: string;
  isInteractiveSplit?: boolean;
  isCrossedOut?: boolean;
  isNewCarry?: boolean;
  onClick?: () => void;
}> = ({
  label = '10',
  isInteractiveSplit = false,
  isCrossedOut = false,
  isNewCarry = false,
  onClick,
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={!onClick}
    className={`flex flex-col items-center justify-between w-7 sm:w-8 h-20 sm:h-24 rounded-md border-2 shadow-md select-none p-0.5 relative transition-all ${
      isCrossedOut
        ? 'border-red-500/50 bg-slate-800/40 opacity-40 scale-95'
        : isNewCarry
        ? 'border-yellow-300 bg-gradient-to-b from-yellow-400 via-amber-500 to-orange-600 shadow-[0_0_15px_rgba(250,204,21,0.85)] animate-bounce'
        : isInteractiveSplit
        ? 'border-yellow-300 bg-gradient-to-b from-amber-400 via-amber-500 to-amber-700 ring-2 ring-yellow-300 shadow-[0_0_14px_rgba(250,204,21,0.75)] cursor-pointer hover:scale-105 active:scale-95 animate-pulse'
        : 'border-amber-400 bg-gradient-to-b from-amber-500 via-amber-600 to-amber-700'
    } ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
    title={isInteractiveSplit ? '터치해서 낱개 10개로 쪼개기!' : '10개 묶음 막대 (10)'}
  >
    {/* 10등분 눈금선 */}
    <div className="w-full flex-1 flex flex-col justify-between py-0.5 opacity-60 pointer-events-none">
      {[...Array(9)].map((_, i) => (
        <div key={i} className="w-full border-b border-amber-900/60" />
      ))}
    </div>
    {isInteractiveSplit && (
      <span className="text-[9px] font-black text-slate-950 bg-yellow-300 px-1 rounded shadow absolute -top-2 whitespace-nowrap">
        👆쪼개기
      </span>
    )}
    {isNewCarry && (
      <span className="text-[9px] font-black text-slate-950 bg-yellow-200 px-1 rounded shadow absolute -top-2 whitespace-nowrap">
        ✨+10합체
      </span>
    )}
    {isCrossedOut && (
      <span className="text-base font-black text-red-400 absolute inset-0 flex items-center justify-center">
        ✕
      </span>
    )}
    <span className="text-[10px] font-black text-amber-100 bg-amber-950/80 px-1 rounded absolute bottom-1">
      {label}
    </span>
  </button>
);

/** 낱개 1개 큐브 (받아내림 분해 큐브 및 소거 표시 지원) */
const OnesCube: React.FC<{
  isFromBorrowedTen?: boolean;
  isCrossedOut?: boolean;
}> = ({ isFromBorrowedTen = false, isCrossedOut = false }) => (
  <div
    className={`w-5 h-5 sm:w-6 sm:h-6 rounded-md border-2 shadow-sm flex items-center justify-center text-[10px] font-black select-none relative transition-all ${
      isCrossedOut
        ? 'border-red-500/50 bg-slate-800/40 text-slate-500 opacity-45 scale-90'
        : isFromBorrowedTen
        ? 'border-yellow-300 bg-gradient-to-br from-amber-400 via-yellow-500 to-orange-500 text-slate-950 shadow-[0_0_8px_rgba(250,204,21,0.7)]'
        : 'border-emerald-400 bg-gradient-to-br from-emerald-400 via-teal-500 to-emerald-600 text-white'
    }`}
    title={isFromBorrowedTen ? '10묶음이 쪼개져서 생긴 낱개 (1)' : '낱개 1개'}
  >
    {isCrossedOut ? <span className="text-red-400 font-black text-xs">✕</span> : '1'}
  </div>
);

/** 특정 숫자의 수 모형 (10개 묶음 + 낱개) 카드 - 조작형 인터랙션 지원 */
const NumberBlockSection: React.FC<{
  num: number;
  label: string;
  themeColor?: 'cyan' | 'amber' | 'purple';
  canSplitTen?: boolean;
  isBorrowedSplit?: boolean;
  onSplitTen?: () => void;
  crossedOutTens?: number;
  crossedOutOnes?: number;
  extraCarryTen?: boolean;
  hiddenCarryOnes?: number;
}> = ({
  num,
  label,
  themeColor = 'cyan',
  canSplitTen = false,
  isBorrowedSplit = false,
  onSplitTen,
  crossedOutTens = 0,
  crossedOutOnes = 0,
  extraCarryTen = false,
  hiddenCarryOnes = 0,
}) => {
  const baseTens = Math.floor(num / 10);
  const baseOnes = num % 10;

  const displayTens = isBorrowedSplit ? Math.max(0, baseTens - 1) : baseTens;
  const borrowedOnes = isBorrowedSplit ? 10 : 0;
  const totalOnes = Math.max(0, baseOnes + borrowedOnes - hiddenCarryOnes);

  const borderColor =
    themeColor === 'amber'
      ? 'border-amber-500/50 bg-amber-950/30'
      : themeColor === 'purple'
      ? 'border-purple-500/50 bg-purple-950/30'
      : 'border-cyan-500/50 bg-cyan-950/30';

  return (
    <div className={`flex flex-col p-2.5 sm:p-3 rounded-xl border ${borderColor} shadow-inner transition-all`}>
      <div className="flex items-center justify-between mb-2 pb-1 border-b border-slate-700/60 flex-wrap gap-1">
        <span className="text-xs font-bold text-slate-300">{label}</span>
        <span className="text-lg sm:text-xl font-black text-white flex items-center gap-1">
          <span className="text-yellow-300">{num}</span>
          <span className="text-[11px] text-slate-300 font-bold">
            ({displayTens + (extraCarryTen ? 1 : 0) > 0 ? `10묶음 ${displayTens + (extraCarryTen ? 1 : 0)}개` : '10묶음 0개'}
            {', '}
            {`낱개 ${totalOnes}개`})
          </span>
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        {/* 10개 묶음 영역 */}
        <div className="flex flex-col items-center bg-slate-900/80 rounded-lg p-2 border border-amber-500/30">
          <span className="text-[11px] font-bold text-amber-300 mb-1.5 flex items-center gap-1">
            <span>📦</span>
            <span>
              10개 묶음 ({Math.max(0, displayTens - crossedOutTens + (extraCarryTen ? 1 : 0))}개)
            </span>
          </span>
          <div className="flex flex-wrap items-center justify-center gap-1.5 min-h-[5rem] py-1">
            {displayTens > 0 || extraCarryTen ? (
              <>
                {[...Array(displayTens)].map((_, i) => {
                  const isLastRod = i === displayTens - 1;
                  const canTapToSplit = canSplitTen && !isBorrowedSplit && isLastRod;
                  const isCrossed = i >= displayTens - crossedOutTens;
                  return (
                    <TensBlock
                      key={i}
                      isInteractiveSplit={canTapToSplit}
                      isCrossedOut={isCrossed}
                      onClick={canTapToSplit ? onSplitTen : undefined}
                    />
                  );
                })}
                {extraCarryTen && <TensBlock key="carry-ten" isNewCarry />}
              </>
            ) : (
              <span className="text-xs text-slate-500 py-6">묶음 없음 (0)</span>
            )}
          </div>
        </div>

        {/* 낱개 큐브 영역 */}
        <div className="flex flex-col items-center bg-slate-900/80 rounded-lg p-2 border border-emerald-500/30">
          <span className="text-[11px] font-bold text-emerald-300 mb-1.5 flex items-center gap-1">
            <span>🟩</span>
            <span>
              낱개 ({Math.max(0, totalOnes - crossedOutOnes)}개)
              {isBorrowedSplit && (
                <strong className="text-yellow-300 ml-0.5">+10변신!</strong>
              )}
            </span>
          </span>
          <div className="grid grid-cols-5 gap-1 items-center justify-center min-h-[5rem] content-center p-1">
            {totalOnes > 0 ? (
              [...Array(totalOnes)].map((_, i) => {
                const isFromBorrow = isBorrowedSplit && i >= baseOnes;
                const isCrossed = i >= totalOnes - crossedOutOnes;
                return (
                  <OnesCube
                    key={i}
                    isFromBorrowedTen={isFromBorrow}
                    isCrossedOut={isCrossed}
                  />
                );
              })
            ) : (
              <span className="text-xs text-slate-500 col-span-5 text-center py-6">낱개 없음 (0)</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const MathBlockHintModal: React.FC<MathBlockHintModalProps> = ({
  isOpen,
  onClose,
  problem,
  childName,
}) => {
  const [showAnswer, setShowAnswer] = useState(false);
  // 조작형(Manipulative) 상태: 받아내림 10묶음 쪼개기, 뺄셈 소거하기, 받아올림 10묶음 합체하기
  const [isBorrowedSplit, setIsBorrowedSplit] = useState(false);
  const [isSubtractedCrossed, setIsSubtractedCrossed] = useState(false);
  const [isCarryCombined, setIsCarryCombined] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowAnswer(false);
      setIsBorrowedSplit(false);
      setIsSubtractedCrossed(false);
      setIsCarryCombined(false);
    }
  }, [isOpen, problem?.id]);

  if (!isOpen) return null;

  const formula = getProblemHintFormula(problem);
  const answerNum = typeof problem.answer === 'number' ? problem.answer : parseInt(problem.answer, 10);

  // 기본 수식 데이터가 없을 때의 안전 기본값
  const a = formula?.a ?? 0;
  const op = formula?.op ?? '+';
  const b = formula?.b ?? 0;
  const c = formula?.c;
  const op2 = formula?.op2;

  // 두 수 연산 분석
  const tensA = Math.floor(a / 10);
  const onesA = a % 10;
  const tensB = Math.floor(b / 10);
  const onesB = b % 10;

  const isAddition = op === '+';
  const hasCarry = isAddition && onesA + onesB >= 10; // 받아올림 발생 여부
  const hasBorrow = !isAddition && onesA < onesB; // 받아내림 발생 여부

  const handleSplitBorrowTen = () => {
    if (isBorrowedSplit) return;
    playDingDongSuccess();
    setIsBorrowedSplit(true);
  };

  const handleToggleSubtractCross = () => {
    playCardTapSound();
    if (hasBorrow && !isBorrowedSplit) {
      setIsBorrowedSplit(true);
    }
    setIsSubtractedCrossed((prev) => !prev);
  };

  const handleToggleCarryCombine = () => {
    playDingDongSuccess();
    setIsCarryCombined((prev) => !prev);
  };

  const handleResetManipulative = () => {
    playCardTapSound();
    setIsBorrowedSplit(false);
    setIsSubtractedCrossed(false);
    setIsCarryCombined(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl max-h-[90vh] flex flex-col bg-slate-900/95 border-2 border-cyan-400 rounded-2xl shadow-2xl shadow-cyan-950/70 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 모달 상단 헤더 */}
        <div className="flex-none flex items-center justify-between px-4 py-3 bg-gradient-to-r from-slate-900 via-cyan-950/70 to-slate-900 border-b border-cyan-500/40">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan-500/20 border border-cyan-400/50 text-cyan-300">
              <Search size={18} />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-white flex flex-wrap items-center gap-1.5">
                <span>직접 만져보는 10묶음·낱개 수 모형</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-400 text-cyan-300">
                  체험형 힌트
                </span>
                <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/80 text-yellow-300 font-black animate-pulse flex items-center gap-1 shadow-sm">
                  <span>⏸️</span>
                  <span>게임 일시 정지됨</span>
                </span>
              </h3>
              <p className="text-[11px] text-cyan-200/80 font-medium">
                ⭐ {childName} 대장님! 블록을 직접 터치해서 쪼개고 합쳐보세요!
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="닫기"
          >
            <X size={18} />
          </button>
        </div>

        {/* 모달 본문 영역 (스크롤 가능) */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3.5 sm:space-y-4">
          {/* 1. 수식 안내 카드 */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/80 border border-amber-500/40">
            <div className="flex items-center gap-2">
              <span className="text-lg">💡</span>
              <div>
                <span className="text-[11px] text-amber-300 font-bold block">
                  {problem.isWordProblem ? '문제 속에서 세운 식' : '풀어야 할 수식'}
                </span>
                <span className="text-base sm:text-xl font-black text-white tracking-wider">
                  {a} {op} {b} {c !== undefined && op2 ? `${op2} ${c}` : ''} = ?
                </span>
              </div>
            </div>

            <span className="text-xs font-bold text-amber-300 px-2.5 py-1 rounded-full bg-amber-950/80 border border-amber-400">
              {c !== undefined
                ? '세 수의 연산'
                : isAddition
                ? hasCarry
                  ? '받아올림 있는 덧셈'
                  : '받아올림 없는 덧셈'
                : hasBorrow
                ? '받아내림 있는 뺄셈'
                : '받아내림 없는 뺄셈'}
            </span>
          </div>

          {/* 1-2. 조작형 수 모형 체험 컨트롤 바 */}
          {c === undefined && (
            <div className="p-2.5 rounded-xl bg-gradient-to-r from-cyan-950/70 via-slate-900 to-indigo-950/70 border border-cyan-400/50 flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs font-bold text-cyan-200 flex items-center gap-1.5">
                <span className="text-base">🖐️</span>
                {hasBorrow ? (
                  !isBorrowedSplit ? (
                    <span>
                      낱개 {onesA}개에서 {onesB}개를 못 빼요! <strong>[10묶음 막대]</strong>를 눌러 낱개 10개로 쪼개보세요!
                    </span>
                  ) : !isSubtractedCrossed ? (
                    <span>
                      변신 성공! 이제 낱개 <strong>{onesA + 10}개</strong>에서 <strong>{b}</strong>만큼 지워볼까요?
                    </span>
                  ) : (
                    <span className="text-emerald-300 font-black">
                      🎉 남은 블록: 10묶음 {tensA - 1 - tensB}개 + 낱개 {onesA + 10 - onesB}개 = {answerNum}!
                    </span>
                  )
                ) : !isAddition ? (
                  !isSubtractedCrossed ? (
                    <span>버튼을 눌러 빼는 수({b})만큼 블록을 직접 지워보세요!</span>
                  ) : (
                    <span className="text-emerald-300 font-black">
                      🎉 남은 블록: 10묶음 {tensA - tensB}개 + 낱개 {onesA - onesB}개 = {answerNum}!
                    </span>
                  )
                ) : hasCarry ? (
                  !isCarryCombined ? (
                    <span>
                      낱개가 총 {onesA + onesB}개예요! 10개를 모아서 새로운 <strong>[10묶음 막대]</strong>로 합체해 보세요!
                    </span>
                  ) : (
                    <span className="text-emerald-300 font-black">
                      🎉 10묶음 합체 완료! 10묶음 {tensA + tensB + 1}개 + 남은 낱개 {(onesA + onesB) % 10}개 = {answerNum}!
                    </span>
                  )
                ) : (
                  <span>10묶음끼리, 낱개끼리 차례대로 세어 보세요!</span>
                )}
              </div>

              <div className="flex items-center gap-1.5 ml-auto">
                {hasBorrow && !isBorrowedSplit && (
                  <button
                    type="button"
                    onClick={handleSplitBorrowTen}
                    className="px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow-md cursor-pointer active:scale-95 transition-all flex items-center gap-1 animate-bounce"
                  >
                    <span>⚡ 10묶음 → 낱개 10개로 쪼개기!</span>
                  </button>
                )}
                {!isAddition && (!hasBorrow || isBorrowedSplit) && (
                  <button
                    type="button"
                    onClick={handleToggleSubtractCross}
                    className="px-3 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-400 text-white font-black text-xs shadow-md cursor-pointer active:scale-95 transition-all flex items-center gap-1"
                  >
                    <span>{isSubtractedCrossed ? '↩️ 지우기 취소' : `✂️ ${b}만큼 블록 덜어내기!`}</span>
                  </button>
                )}
                {hasCarry && (
                  <button
                    type="button"
                    onClick={handleToggleCarryCombine}
                    className="px-3 py-1.5 rounded-lg bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black text-xs shadow-md cursor-pointer active:scale-95 transition-all flex items-center gap-1"
                  >
                    <span>
                      {isCarryCombined ? '↩️ 합체 전으로 보기' : '✨ 낱개 10개 → 10묶음 합체!'}
                    </span>
                  </button>
                )}
                {(isBorrowedSplit || isSubtractedCrossed || isCarryCombined) && (
                  <button
                    type="button"
                    onClick={handleResetManipulative}
                    title="블록 처음 상태로 되돌리기"
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600 cursor-pointer"
                  >
                    <RotateCcw size={14} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* 2. 두 수의 수 모형 시각화 */}
          <div className="space-y-2">
            <NumberBlockSection
              num={a}
              label="첫 번째 수"
              themeColor="cyan"
              canSplitTen={hasBorrow}
              isBorrowedSplit={isBorrowedSplit}
              onSplitTen={handleSplitBorrowTen}
              crossedOutTens={!isAddition && isSubtractedCrossed ? tensB : 0}
              crossedOutOnes={!isAddition && isSubtractedCrossed ? onesB : 0}
              extraCarryTen={isAddition && isCarryCombined}
              hiddenCarryOnes={isAddition && isCarryCombined ? Math.min(onesA, 10) : 0}
            />

            <div className="flex items-center justify-center my-1">
              <span className="w-8 h-8 rounded-full bg-amber-500 text-slate-950 font-black text-lg flex items-center justify-center shadow-md">
                {op}
              </span>
            </div>

            <NumberBlockSection
              num={b}
              label="두 번째 수"
              themeColor="amber"
              hiddenCarryOnes={
                isAddition && isCarryCombined ? Math.max(0, 10 - Math.min(onesA, 10)) : 0
              }
            />

            {/* 세 수 연산일 경우 세 번째 수 추가 */}
            {c !== undefined && op2 && (
              <>
                <div className="flex items-center justify-center my-1">
                  <span className="w-8 h-8 rounded-full bg-purple-500 text-white font-black text-lg flex items-center justify-center shadow-md">
                    {op2}
                  </span>
                </div>
                <NumberBlockSection num={c} label="세 번째 수" themeColor="purple" />
              </>
            )}
          </div>

          {/* 3. 단계별 수 모형 해결 비법 가이드 */}
          <div className="p-3 sm:p-4 rounded-xl bg-gradient-to-br from-indigo-950/60 to-slate-950 border border-indigo-500/40 space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs sm:text-sm font-black text-indigo-300">
              <Sparkles size={16} className="text-yellow-400" />
              <span>수 모형으로 쉽게 푸는 비법!</span>
            </div>

            {isAddition ? (
              // 덧셈 가이드
              <div className="space-y-2 text-xs sm:text-sm text-slate-200">
                <div className="flex items-start gap-2 bg-slate-900/60 p-2 rounded-lg border border-slate-700/50">
                  <span className="font-black text-emerald-400 flex-none">1단계</span>
                  <div>
                    <span className="font-bold text-emerald-300">낱개(일의 자리)끼리 먼저 모아요: </span>
                    <span>
                      {onesA}개 + {onesB}개 = <strong className="text-yellow-300">{onesA + onesB}개</strong>
                    </span>
                    {hasCarry ? (
                      <div className="mt-1 p-1.5 rounded bg-amber-950/70 border border-amber-400/50 text-amber-200 text-xs font-bold flex items-center gap-1">
                        <span>🌟</span>
                        <span>
                          낱개가 10개 이상이에요! 10개는 새로운 <strong>[10개 묶음 1개]</strong>로 합체(받아올림)되고, 낱개는{' '}
                          <strong className="text-yellow-300">{(onesA + onesB) % 10}개</strong>가 남아요!
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-xs block mt-0.5">
                        (10개가 넘지 않으므로 낱개는 그대로 {onesA + onesB}개!)
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-2 bg-slate-900/60 p-2 rounded-lg border border-slate-700/50">
                  <span className="font-black text-amber-400 flex-none">2단계</span>
                  <div>
                    <span className="font-bold text-amber-300">10개 묶음(십의 자리)끼리 모아요: </span>
                    {hasCarry ? (
                      <span>
                        원래 묶음 {tensA}개 + {tensB}개에 새로 올라온 <strong>+1개</strong>를 더해 = 총{' '}
                        <strong className="text-yellow-300">
                          {tensA + tensB + 1}개 묶음 ({(tensA + tensB + 1) * 10})
                        </strong>
                      </span>
                    ) : (
                      <span>
                        {tensA}개 + {tensB}개 = 총{' '}
                        <strong className="text-yellow-300">
                          {tensA + tensB}개 묶음 ({(tensA + tensB) * 10})
                        </strong>
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-2 bg-slate-900/60 p-2 rounded-lg border border-slate-700/50">
                  <span className="font-black text-cyan-400 flex-none">3단계</span>
                  <div>
                    <span className="font-bold text-cyan-300">모두 합치면: </span>
                    <span>
                      10개 묶음 {(tensA + tensB + (hasCarry ? 1 : 0)) * 10}과 낱개{' '}
                      {hasCarry ? (onesA + onesB) % 10 : onesA + onesB}이 모여서 정답 완성!
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              // 뺄셈 가이드
              <div className="space-y-2 text-xs sm:text-sm text-slate-200">
                <div className="flex items-start gap-2 bg-slate-900/60 p-2 rounded-lg border border-slate-700/50">
                  <span className="font-black text-emerald-400 flex-none">1단계</span>
                  <div>
                    <span className="font-bold text-emerald-300">낱개(일의 자리)끼리 먼저 빼요: </span>
                    {hasBorrow ? (
                      <div className="space-y-1">
                        <span className="text-red-300">
                          낱개 {onesA}개에서 {onesB}개를 뺄 수 없어요!
                        </span>
                        <div className="p-1.5 rounded bg-red-950/70 border border-red-400/50 text-red-200 text-xs font-bold flex items-center gap-1">
                          <AlertCircle size={14} className="flex-none text-red-400" />
                          <span>
                            <strong>[10개 묶음 1개]</strong>를 풀어서 낱개 10개로 변신(받아내림)!
                          </span>
                        </div>
                        <span className="block text-slate-300 text-xs">
                          낱개가 {onesA + 10}개가 되었어요! {onesA + 10} - {onesB} ={' '}
                          <strong className="text-yellow-300">{onesA + 10 - onesB}개</strong>가 남아요.
                        </span>
                      </div>
                    ) : (
                      <span>
                        {onesA}개 - {onesB}개 = <strong className="text-yellow-300">{onesA - onesB}개</strong>가 남아요!
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-2 bg-slate-900/60 p-2 rounded-lg border border-slate-700/50">
                  <span className="font-black text-amber-400 flex-none">2단계</span>
                  <div>
                    <span className="font-bold text-amber-300">10개 묶음(십의 자리)끼리 빼요: </span>
                    {hasBorrow ? (
                      <span>
                        빌려주고 남은 묶음 ({tensA} - 1)개에서 {tensB}개를 빼면 ={' '}
                        <strong className="text-yellow-300">
                          {tensA - 1 - tensB}개 묶음 ({(tensA - 1 - tensB) * 10})
                        </strong>
                      </span>
                    ) : (
                      <span>
                        묶음 {tensA}개에서 {tensB}개를 빼면 ={' '}
                        <strong className="text-yellow-300">
                          {tensA - tensB}개 묶음 ({(tensA - tensB) * 10})
                        </strong>
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-2 bg-slate-900/60 p-2 rounded-lg border border-slate-700/50">
                  <span className="font-black text-cyan-400 flex-none">3단계</span>
                  <div>
                    <span className="font-bold text-cyan-300">남은 것을 합치면: </span>
                    <span>
                      남은 묶음 {(hasBorrow ? tensA - 1 - tensB : tensA - tensB) * 10}과 남은 낱개{' '}
                      {hasBorrow ? onesA + 10 - onesB : onesA - onesB}이 모여 정답이 돼요!
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 4. 정답 확인 살짝 열어보기 토글 */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
            <span className="text-xs text-slate-400 font-medium">
              스스로 계산해 본 답이 맞는지 확인해 볼까요?
            </span>
            <button
              type="button"
              onClick={() => setShowAnswer((prev) => !prev)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 text-xs font-bold cursor-pointer transition-all active:scale-95"
            >
              {showAnswer ? <EyeOff size={14} /> : <Eye size={14} />}
              <span>{showAnswer ? '정답 숨기기' : '정답 확인하기'}</span>
            </button>
          </div>

          {showAnswer && (
            <div className="p-3 rounded-xl bg-emerald-950/80 border-2 border-emerald-400 text-center animate-fadeIn">
              <span className="text-xs text-emerald-300 font-bold block mb-1">
                ⭐ {childName} 대장님, 정답은 바로!
              </span>
              <span className="text-2xl sm:text-3xl font-black text-yellow-300 tracking-wider">
                {answerNum}
              </span>
            </div>
          )}
        </div>

        {/* 모달 하단 닫기/요격 버튼 */}
        <div className="flex-none p-3 bg-slate-950 border-t border-cyan-500/30 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-xs sm:text-sm shadow-lg active:scale-95 transition-all flex items-center justify-center gap-1.5 border border-cyan-300 cursor-pointer"
          >
            <span>이해했어요! 요격하러 가기</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
