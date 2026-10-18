import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, Zap, Volume2, Trophy, RotateCcw, Sparkles } from 'lucide-react';
import type { WordItem } from '../types';
import { DEFAULT_WORDS } from '../data/words';
import {
  playCardTapSound,
  playDingDongSuccess,
  playErrorBuzzer,
  playVictoryFanfare,
} from '../utils/soundEffects';

interface SpeedQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  words?: WordItem[];
  onRewardEarned?: (expEarned: number, bonusEggEarned: boolean) => void;
}

type SpeedQuizMode = 'lang' | 'math';

interface SpeedQuestion {
  promptMain: string;
  promptSub: string;
  speakText?: string;
  speakLang?: string;
  choices: string[];
  correctAnswer: string;
}

const BEST_SCORE_STORAGE_KEY = 'godzilla_speed_quiz_best';
const DAILY_EGG_DATE_KEY = 'godzilla_speed_quiz_egg_date';

function getTodayDateKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function generateSpeedQuestion(mode: SpeedQuizMode, wordPool: WordItem[] = DEFAULT_WORDS): SpeedQuestion {
  const activePool = Array.isArray(wordPool) && wordPool.length >= 4 ? wordPool : DEFAULT_WORDS;
  if (mode === 'lang') {
    const idx = Math.floor(Math.random() * activePool.length);
    const target = activePool[idx];
    const askEnglish = Math.random() < 0.55;
    const correctLabel = `${target.emoji || '✨'} ${target.ko}`;
    const choiceSet = new Set<string>([correctLabel]);

    let guard = 0;
    while (choiceSet.size < 4 && guard < 40) {
      guard++;
      const other = activePool[Math.floor(Math.random() * activePool.length)];
      if (other.id !== target.id) {
        choiceSet.add(`${other.emoji || '✨'} ${other.ko}`);
      }
    }
    const choices = Array.from(choiceSet).sort(() => Math.random() - 0.5);

    if (askEnglish) {
      return {
        promptMain: `🇺🇸 "${target.en}"`,
        promptSub: `🔊 원어민 발음을 듣고 우리말 뜻을 골라보세요!`,
        speakText: target.en,
        speakLang: 'en-US',
        choices,
        correctAnswer: correctLabel,
      };
    } else {
      const readingHint = target.jaKana || target.reading || target.ja;
      return {
        promptMain: `🇯🇵 "${target.ja}"`,
        promptSub: `발음 힌트: [${readingHint}] · 무슨 뜻일까요?`,
        speakText: target.jaKana || target.ja,
        speakLang: 'ja-JP',
        choices,
        correctAnswer: correctLabel,
      };
    }
  } else {
    // 초2 암산 (덧셈, 뺄셈, 구구단 2~9단)
    const roll = Math.random();
    let promptMain: string;
    let promptSub: string;
    let answer: number;

    if (roll < 0.45) {
      // 구구단 (2~9단)
      const a = Math.floor(Math.random() * 8) + 2;
      const b = Math.floor(Math.random() * 8) + 2;
      answer = a * b;
      promptMain = `${a} × ${b} = ?`;
      promptSub = `⚡ 구구단 ${a}단 번개 암산!`;
    } else if (roll < 0.75) {
      // 두 자리 + 한/두 자리 암산
      const a = Math.floor(Math.random() * 40) + 12;
      const b = Math.floor(Math.random() * 25) + 8;
      answer = a + b;
      promptMain = `${a} + ${b} = ?`;
      promptSub = `⚡ 일의 자리와 십의 자리를 빠르게 더해 보세요!`;
    } else {
      // 두 자리 뺄셈 암산
      const a = Math.floor(Math.random() * 50) + 30;
      const b = Math.floor(Math.random() * 22) + 6;
      answer = a - b;
      promptMain = `${a} - ${b} = ?`;
      promptSub = `⚡ 침착하게 빼면 바로 보여요!`;
    }

    const choiceSet = new Set<number>([answer]);
    const offsets = [-10, -3, -2, -1, 1, 2, 3, 10];
    for (const off of offsets.sort(() => Math.random() - 0.5)) {
      if (choiceSet.size >= 4) break;
      const cand = answer + off;
      if (cand > 0) choiceSet.add(cand);
    }
    const choices = Array.from(choiceSet)
      .sort((x, y) => x - y)
      .map(String);

    return {
      promptMain,
      promptSub,
      choices,
      correctAnswer: String(answer),
    };
  }
}

export const SpeedQuizModal: React.FC<SpeedQuizModalProps> = ({
  isOpen,
  onClose,
  words = DEFAULT_WORDS,
  onRewardEarned,
}) => {
  const [mode, setMode] = useState<SpeedQuizMode>('lang');
  const [phase, setPhase] = useState<'ready' | 'playing' | 'result'>('ready');
  const [timeLeft, setTimeLeft] = useState<number>(30);
  const [score, setScore] = useState<number>(0);
  const [combo, setCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [bestScore, setBestScore] = useState<number>(() => {
    try {
      return Number(localStorage.getItem(BEST_SCORE_STORAGE_KEY) || '0') || 0;
    } catch {
      return 0;
    }
  });
  const [question, setQuestion] = useState<SpeedQuestion>(() => generateSpeedQuestion('lang', words));
  const [feedback, setFeedback] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [earnedEggThisRound, setEarnedEggThisRound] = useState<boolean>(false);
  const [earnedExpThisRound, setEarnedExpThisRound] = useState<number>(0);
  const rewardHandledRef = useRef<boolean>(false);

  const speakCurrentQuestion = useCallback((q: SpeedQuestion) => {
    if (!q.speakText || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utt = new SpeechSynthesisUtterance(q.speakText);
      utt.lang = q.speakLang || 'en-US';
      utt.rate = 0.9;
      window.speechSynthesis.speak(utt);
    } catch {
      // ignore TTS errors
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setPhase('ready');
      setTimeLeft(30);
      setScore(0);
      setCombo(0);
      setMaxCombo(0);
      setFeedback('idle');
      setEarnedEggThisRound(false);
      setEarnedExpThisRound(0);
      rewardHandledRef.current = false;
    } else if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, [isOpen]);

  // 30초 타이머 작동
  useEffect(() => {
    if (!isOpen || phase !== 'playing') return;
    const timer = window.setInterval(() => {
      if (document.hidden) return;
      setTimeLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [isOpen, phase]);

  // 시간 종료 시 결과 처리
  useEffect(() => {
    if (phase === 'playing' && timeLeft === 0 && !rewardHandledRef.current) {
      rewardHandledRef.current = true;
      setPhase('result');
      playVictoryFanfare();

      const expEarned = score > 0 ? Math.max(10, score * 5) : 0;
      let bonusEgg = false;
      const todayKey = getTodayDateKey();
      try {
        if (score > bestScore) {
          setBestScore(score);
          localStorage.setItem(BEST_SCORE_STORAGE_KEY, String(score));
        }
        const lastEggDate = localStorage.getItem(DAILY_EGG_DATE_KEY);
        if (score >= 8 && lastEggDate !== todayKey) {
          bonusEgg = true;
          localStorage.setItem(DAILY_EGG_DATE_KEY, todayKey);
        }
      } catch {}

      setEarnedExpThisRound(expEarned);
      setEarnedEggThisRound(bonusEgg);
      if (expEarned > 0 || bonusEgg) {
        onRewardEarned?.(expEarned, bonusEgg);
      }
    }
  }, [phase, timeLeft, score, bestScore, onRewardEarned]);

  const handleStart = (selectedMode: SpeedQuizMode) => {
    playCardTapSound();
    setMode(selectedMode);
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setTimeLeft(30);
    setFeedback('idle');
    rewardHandledRef.current = false;
    const firstQ = generateSpeedQuestion(selectedMode, words);
    setQuestion(firstQ);
    setPhase('playing');
    if (selectedMode === 'lang') {
      speakCurrentQuestion(firstQ);
    }
  };

  const handleAnswer = (selected: string) => {
    if (phase !== 'playing' || feedback !== 'idle') return;
    if (selected === question.correctAnswer) {
      playDingDongSuccess();
      const nextScore = score + 1;
      const nextCombo = combo + 1;
      setScore(nextScore);
      setCombo(nextCombo);
      if (nextCombo > maxCombo) setMaxCombo(nextCombo);
      setFeedback('correct');
      window.setTimeout(() => {
        const nextQ = generateSpeedQuestion(mode, words);
        setQuestion(nextQ);
        setFeedback('idle');
        if (mode === 'lang') {
          speakCurrentQuestion(nextQ);
        }
      }, 220);
    } else {
      playErrorBuzzer();
      setCombo(0);
      setFeedback('wrong');
      window.setTimeout(() => {
        setFeedback('idle');
      }, 350);
    }
  };

  if (!isOpen) return null;

  const alreadyClaimedEggToday = (() => {
    try {
      return localStorage.getItem(DAILY_EGG_DATE_KEY) === getTodayDateKey();
    } catch {
      return false;
    }
  })();

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 65,
        backgroundColor: 'rgba(2, 6, 23, 0.92)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '14px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '480px',
          borderRadius: '24px',
          background: 'linear-gradient(165deg, #0f172a 0%, #1e1b4b 60%, #090d16 100%)',
          border: '2.5px solid #facc15',
          boxShadow: '0 0 35px rgba(250, 204, 21, 0.35)',
          padding: '20px',
          color: '#ffffff',
          position: 'relative',
        }}
      >
        {/* 닫기 버튼 */}
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '14px',
            right: '14px',
            width: '32px',
            height: '32px',
            borderRadius: '9999px',
            backgroundColor: 'rgba(30, 41, 59, 0.85)',
            border: '1px solid #475569',
            color: '#cbd5e1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <X size={18} />
        </button>

        {/* 상단 타이틀 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #facc15, #ea580c)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0f172a',
            }}
          >
            <Zap size={22} fill="#0f172a" />
          </div>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 900, margin: 0, color: '#fef08a' }}>
              ⚡ 30초 번개 스피드 퀴즈!
            </h2>
            <p style={{ fontSize: '11px', color: '#cbd5e1', margin: 0, fontWeight: 700 }}>
              30초 동안 최대한 많이 맞추면 보너스 EXP와 괴수 알(8점↑) 지급!
            </p>
          </div>
        </div>

        {phase === 'ready' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div
              style={{
                padding: '12px 14px',
                borderRadius: '16px',
                backgroundColor: 'rgba(15, 23, 42, 0.8)',
                border: '1.5px solid rgba(250, 204, 21, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span style={{ fontSize: '13px', fontWeight: 900, color: '#fde047', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Trophy size={16} /> 최고 기록: {bestScore}문제 돌파!
              </span>
              <span style={{ fontSize: '11px', fontWeight: 800, color: alreadyClaimedEggToday ? '#94a3b8' : '#6ee7b7' }}>
                {alreadyClaimedEggToday ? '✓ 오늘 보너스 알 획득 완료' : '🎁 8문제 이상 시 괴수 알 +1'}
              </span>
            </div>

            <button
              type="button"
              onClick={() => handleStart('lang')}
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: '18px',
                background: 'linear-gradient(90deg, #0284c7 0%, #2563eb 100%)',
                border: '2px solid #7dd3fc',
                color: '#ffffff',
                textAlign: 'left',
                cursor: 'pointer',
                boxShadow: '0 0 20px rgba(2, 132, 199, 0.45)',
              }}
            >
              <div style={{ fontSize: '16px', fontWeight: 900, marginBottom: '4px' }}>
                🎧 1. 3개 국어 번개 듣기 스피드런 시작!
              </div>
              <div style={{ fontSize: '12px', color: '#bae6fd', fontWeight: 700 }}>
                영어·일본어 단어와 원어민 발음을 듣고 우리말 뜻을 순식간에 맞춰요!
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleStart('math')}
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: '18px',
                background: 'linear-gradient(90deg, #d97706 0%, #ea580c 100%)',
                border: '2px solid #fde047',
                color: '#ffffff',
                textAlign: 'left',
                cursor: 'pointer',
                boxShadow: '0 0 20px rgba(234, 88, 12, 0.45)',
              }}
            >
              <div style={{ fontSize: '16px', fontWeight: 900, marginBottom: '4px' }}>
                🧮 2. 초2 암산 & 구구단 스피드런 시작!
              </div>
              <div style={{ fontSize: '12px', color: '#fef3c7', fontWeight: 700 }}>
                구구단(2~9단)과 두 자리 덧셈·뺄셈을 30초 안에 번개처럼 풀어요!
              </div>
            </button>
          </div>
        )}

        {phase === 'playing' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* 상단 타이머 & 스코어 바 */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderRadius: '14px',
                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                border: '1px solid #334155',
              }}
            >
              <span
                style={{
                  fontSize: '15px',
                  fontWeight: 900,
                  color: timeLeft <= 7 ? '#f87171' : '#38bdf8',
                }}
              >
                ⏱️ 남은 시간: {timeLeft}초
              </span>
              <span style={{ fontSize: '14px', fontWeight: 900, color: '#fde047' }}>
                ⚡ 정답: {score}개 {combo >= 2 && `(${combo} COMBO!)`}
              </span>
            </div>

            {/* 문제 전광판 */}
            <div
              style={{
                padding: '20px 14px',
                borderRadius: '18px',
                backgroundColor:
                  feedback === 'correct'
                    ? 'rgba(16, 185, 129, 0.25)'
                    : feedback === 'wrong'
                    ? 'rgba(239, 68, 68, 0.25)'
                    : 'rgba(2, 6, 23, 0.85)',
                border:
                  feedback === 'correct'
                    ? '2px solid #10b981'
                    : feedback === 'wrong'
                    ? '2px solid #ef4444'
                    : '2px solid #38bdf8',
                textAlign: 'center',
                transition: 'all 0.15s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <span style={{ fontSize: '26px', fontWeight: 900, color: '#ffffff' }}>
                  {question.promptMain}
                </span>
                {question.speakText && (
                  <button
                    type="button"
                    onClick={() => speakCurrentQuestion(question)}
                    style={{
                      padding: '6px',
                      borderRadius: '10px',
                      backgroundColor: '#0284c7',
                      border: '1px solid #7dd3fc',
                      color: '#ffffff',
                      cursor: 'pointer',
                    }}
                  >
                    <Volume2 size={18} />
                  </button>
                )}
              </div>
              <div style={{ fontSize: '12px', color: '#bae6fd', fontWeight: 700, marginTop: '6px' }}>
                {question.promptSub}
              </div>
            </div>

            {/* 4지선다 버튼 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
              {question.choices.map((choice) => (
                <button
                  key={choice}
                  type="button"
                  onClick={() => handleAnswer(choice)}
                  style={{
                    padding: '14px 10px',
                    borderRadius: '16px',
                    backgroundColor: '#1e293b',
                    border: '2px solid #475569',
                    color: '#ffffff',
                    fontSize: '16px',
                    fontWeight: 900,
                    cursor: 'pointer',
                  }}
                >
                  {choice}
                </button>
              ))}
            </div>
          </div>
        )}

        {phase === 'result' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '42px' }}>⚡🏆</div>
            <h3 style={{ fontSize: '22px', fontWeight: 900, margin: 0, color: '#fde047' }}>
              30초 번개 퀴즈 종료! ({score}문제 돌파!)
            </h3>
            <p style={{ fontSize: '13px', color: '#cbd5e1', margin: 0, fontWeight: 700 }}>
              최대 연속 콤보: {maxCombo} COMBO · 역대 최고 기록: {Math.max(bestScore, score)}문제
            </p>

            <div
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '16px',
                backgroundColor: 'rgba(16, 185, 129, 0.2)',
                border: '2px solid #10b981',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              }}
            >
              <div style={{ fontSize: '15px', fontWeight: 900, color: '#6ee7b7', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <Sparkles size={18} /> 획득 보상: +{earnedExpThisRound} EXP!
              </div>
              {earnedEggThisRound && (
                <div style={{ fontSize: '14px', fontWeight: 900, color: '#fde047' }}>
                  🥚 8문제 이상 돌파 달성! 오늘의 보너스 괴수 알 +1개 추가 획득!
                </div>
              )}
            </div>

            <div style={{ width: '100%', display: 'flex', gap: '8px', marginTop: '4px' }}>
              <button
                type="button"
                onClick={() => handleStart(mode)}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '14px',
                  background: 'linear-gradient(90deg, #f59e0b, #ea580c)',
                  border: '2px solid #fde047',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: 900,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <RotateCcw size={16} /> 다시 도전하기
              </button>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '12px 18px',
                  borderRadius: '14px',
                  backgroundColor: '#334155',
                  border: '1px solid #475569',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                닫기
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
