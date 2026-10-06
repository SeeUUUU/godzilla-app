import React from 'react';
import type { GodzillaAuraTier } from '../types';

interface GodzillaAuraEffectProps {
  tier: GodzillaAuraTier;
}

export const GodzillaAuraEffect: React.FC<GodzillaAuraEffectProps> = ({ tier }) => {
  if (tier === 'none') return null;

  return (
    <div
      className="absolute inset-0 pointer-events-none z-10 overflow-visible select-none"
      aria-hidden="true"
    >
      {/* ─── 1. [Lv.10 ~ 19] 초음속 충격파 (Supersonic Pulse) ─── */}
      {tier === 'supersonic' && (
        <>
          {/* 발밑 타원형 충격파 펄스 링 1 */}
          <div
            className="absolute animate-supersonic-ring rounded-full border-2 border-cyan-400"
            style={{
              bottom: '4px',
              left: '48%',
              width: '120px',
              height: '32px',
              transform: 'translate(-50%, 50%)',
              pointerEvents: 'none',
            }}
          />
          {/* 발밑 타원형 충격파 펄스 링 2 (지연 발생) */}
          <div
            className="absolute animate-supersonic-ring-delayed rounded-full border-2 border-cyan-300"
            style={{
              bottom: '4px',
              left: '48%',
              width: '120px',
              height: '32px',
              transform: 'translate(-50%, 50%)',
              pointerEvents: 'none',
            }}
          />
          {/* 발밑 네온 에너지 잔광 */}
          <div
            className="absolute rounded-full"
            style={{
              bottom: '0px',
              left: '48%',
              width: '110px',
              height: '24px',
              transform: 'translateX(-50%)',
              background: 'radial-gradient(ellipse at center, rgba(0, 242, 255, 0.45) 0%, rgba(6, 182, 212, 0.2) 50%, transparent 80%)',
              filter: 'blur(4px)',
            }}
          />
        </>
      )}

      {/* ─── 2. [Lv.20 ~ 29] 화염 융합로 (Volcano Fusion) ─── */}
      {tier === 'volcano' && (
        <>
          {/* 등 지느러미 부근 및 몸체 배후 화염 열기 아우라 */}
          <div
            className="absolute animate-pulse rounded-full"
            style={{
              top: '12%',
              left: '12%',
              width: '76%',
              height: '75%',
              background: 'radial-gradient(ellipse at 35% 45%, rgba(249, 115, 22, 0.48) 0%, rgba(239, 68, 68, 0.28) 50%, transparent 75%)',
              filter: 'blur(16px)',
            }}
          />

          {/* 피어오르는 화염 및 스파크 파티클들 */}
          <div
            className="absolute animate-flame-spark"
            style={{ top: '32%', left: '26%', animationDelay: '0s', fontSize: '12px' }}
          >
            🔥
          </div>
          <div
            className="absolute animate-flame-spark"
            style={{ top: '20%', left: '38%', animationDelay: '0.45s', fontSize: '14px' }}
          >
            🔥
          </div>
          <div
            className="absolute animate-flame-spark"
            style={{ top: '28%', left: '48%', animationDelay: '0.9s', fontSize: '11px' }}
          >
            🔥
          </div>
          <div
            className="absolute animate-flame-spark"
            style={{ top: '40%', left: '18%', animationDelay: '1.35s', fontSize: '13px' }}
          >
            🔥
          </div>
          {/* 붉은 불씨 스파크 도트 */}
          <div
            className="absolute w-2 h-2 rounded-full bg-amber-400 animate-flame-spark"
            style={{
              top: '45%',
              left: '32%',
              animationDelay: '0.3s',
              boxShadow: '0 0 8px #f97316, 0 0 12px #ef4444',
            }}
          />
          <div
            className="absolute w-1.5 h-1.5 rounded-full bg-yellow-300 animate-flame-spark"
            style={{
              top: '25%',
              left: '52%',
              animationDelay: '0.75s',
              boxShadow: '0 0 8px #f59e0b',
            }}
          />
          <div
            className="absolute w-2 h-2 rounded-full bg-orange-400 animate-flame-spark"
            style={{
              top: '38%',
              left: '42%',
              animationDelay: '1.2s',
              boxShadow: '0 0 8px #ea580c',
            }}
          />
        </>
      )}

      {/* ─── 3. [Lv.30 ~ 39] 스페이스 크리스탈 (Cosmic Energy) ─── */}
      {tier === 'cosmic' && (
        <>
          {/* 배후 코스믹 퍼플 안개 아우라 */}
          <div
            className="absolute rounded-full"
            style={{
              top: '8%',
              left: '10%',
              width: '80%',
              height: '80%',
              background: 'radial-gradient(ellipse at 40% 45%, rgba(192, 132, 252, 0.42) 0%, rgba(139, 92, 246, 0.22) 50%, rgba(56, 189, 248, 0.1) 70%, transparent 85%)',
              filter: 'blur(18px)',
              animation: 'pulse 3s infinite alternate ease-in-out',
            }}
          />

          {/* 부유하는 보랏빛 크리스탈 다이아몬드 파티클들 */}
          {/* 파티클 1: 머리 위 뒤쪽 */}
          <div
            className="absolute animate-crystal-float text-purple-300"
            style={{
              top: '8%',
              left: '22%',
              animationDelay: '0s',
              fontSize: '15px',
              filter: 'drop-shadow(0 0 8px #c084fc) drop-shadow(0 0 14px #a855f7)',
            }}
          >
            💎
          </div>

          {/* 파티클 2: 등 지느러미 상단 */}
          <div
            className="absolute animate-crystal-float-alt text-violet-300"
            style={{
              top: '18%',
              left: '12%',
              animationDelay: '0.4s',
              fontSize: '13px',
              filter: 'drop-shadow(0 0 6px #e879f9) drop-shadow(0 0 12px #c084fc)',
            }}
          >
            ✦
          </div>

          {/* 파티클 3: 앞쪽 어깨/가슴 부근 */}
          <div
            className="absolute animate-crystal-float text-fuchsia-300"
            style={{
              top: '26%',
              left: '52%',
              animationDelay: '0.8s',
              fontSize: '14px',
              filter: 'drop-shadow(0 0 8px #d946ef) drop-shadow(0 0 14px #818cf8)',
            }}
          >
            💎
          </div>

          {/* 파티클 4: 등 뒤 중간 */}
          <div
            className="absolute animate-crystal-float-alt text-cyan-200"
            style={{
              top: '42%',
              left: '16%',
              animationDelay: '1.2s',
              fontSize: '12px',
              filter: 'drop-shadow(0 0 6px #38bdf8) drop-shadow(0 0 12px #c084fc)',
            }}
          >
            ✧
          </div>

          {/* 파티클 5: 꼬리 및 발밑 위쪽 */}
          <div
            className="absolute animate-crystal-float text-purple-200"
            style={{
              top: '52%',
              left: '42%',
              animationDelay: '1.6s',
              fontSize: '13px',
              filter: 'drop-shadow(0 0 8px #c084fc) drop-shadow(0 0 16px #9333ea)',
            }}
          >
            ✦
          </div>

          {/* 코스믹 반짝임 다이아몬드 SVG 파티클 */}
          <svg
            className="absolute animate-crystal-float"
            style={{
              top: '14%',
              left: '40%',
              width: '12px',
              height: '12px',
              animationDelay: '0.6s',
              filter: 'drop-shadow(0 0 6px #c084fc)',
            }}
            viewBox="0 0 24 24"
            fill="#e9d5ff"
          >
            <polygon points="12,0 24,12 12,24 0,12" />
          </svg>
        </>
      )}

      {/* ─── 4. [Lv.40 ~ 49] 암흑 흑염 (Abyssal Shadow) ─── */}
      {tier === 'abyssal' && (
        <>
          {/* 전신을 휘감는 검붉은 다크 플레임 아우라 */}
          <div
            className="absolute animate-dark-flame rounded-full"
            style={{
              top: '8%',
              left: '8%',
              width: '84%',
              height: '84%',
              background:
                'radial-gradient(ellipse at 42% 48%, rgba(220, 38, 38, 0.6) 0%, rgba(127, 29, 29, 0.45) 45%, rgba(0, 0, 0, 0.75) 75%, transparent 90%)',
              filter: 'blur(18px)',
            }}
          />

          {/* 흑염 연기 및 검붉은 재 파티클 */}
          <div
            className="absolute animate-dark-ash text-red-600"
            style={{
              top: '35%',
              left: '22%',
              animationDelay: '0s',
              fontSize: '13px',
              filter: 'drop-shadow(0 0 6px #991b1b)',
            }}
          >
            🌑
          </div>
          <div
            className="absolute animate-dark-ash text-rose-500"
            style={{
              top: '22%',
              left: '36%',
              animationDelay: '0.5s',
              fontSize: '12px',
              filter: 'drop-shadow(0 0 8px #dc2626)',
            }}
          >
            🔥
          </div>
          <div
            className="absolute animate-dark-ash text-black"
            style={{
              top: '40%',
              left: '48%',
              animationDelay: '1.0s',
              fontSize: '11px',
              filter: 'drop-shadow(0 0 4px #dc2626)',
            }}
          >
            🌑
          </div>
          <div
            className="absolute animate-dark-ash text-red-500"
            style={{
              top: '18%',
              left: '20%',
              animationDelay: '1.5s',
              fontSize: '14px',
              filter: 'drop-shadow(0 0 8px #ef4444)',
            }}
          >
            🔥
          </div>
          {/* 다크 스파크 도트 */}
          <div
            className="absolute w-2 h-2 rounded-full bg-red-600 animate-dark-ash"
            style={{
              top: '50%',
              left: '30%',
              animationDelay: '0.8s',
              boxShadow: '0 0 10px #7f1d1d, 0 0 14px #000000',
            }}
          />
        </>
      )}

      {/* ─── 5. [Lv.50 이상] 신화의 지배자 - 골든 엠페러 (Golden Emperor) ─── */}
      {tier === 'emperor' && (
        <>
          {/* 황금빛 웅장한 신성 아우라 */}
          <div
            className="absolute animate-golden-aura rounded-full"
            style={{
              top: '5%',
              left: '6%',
              width: '88%',
              height: '88%',
              background:
                'radial-gradient(ellipse at 42% 45%, rgba(251, 191, 36, 0.58) 0%, rgba(245, 158, 11, 0.35) 45%, rgba(217, 119, 6, 0.15) 70%, transparent 85%)',
              filter: 'blur(20px)',
            }}
          />

          {/* 전신을 뚫고 나오는 황금 번개 스파크들 */}
          <div
            className="absolute animate-golden-lightning text-yellow-300"
            style={{
              top: '12%',
              left: '18%',
              animationDelay: '0s',
              fontSize: '16px',
            }}
          >
            ⚡
          </div>
          <div
            className="absolute animate-golden-lightning text-amber-200"
            style={{
              top: '28%',
              left: '52%',
              animationDelay: '0.35s',
              fontSize: '18px',
            }}
          >
            ⚡
          </div>
          <div
            className="absolute animate-golden-lightning text-yellow-200"
            style={{
              top: '42%',
              left: '24%',
              animationDelay: '0.7s',
              fontSize: '15px',
            }}
          >
            ⚡
          </div>
          <div
            className="absolute animate-golden-lightning text-amber-300"
            style={{
              top: '20%',
              left: '38%',
              animationDelay: '1.05s',
              fontSize: '17px',
            }}
          >
            ⚡
          </div>

          {/* 황금빛 반짝임 스타 파티클 */}
          <div
            className="absolute animate-pulse text-amber-300"
            style={{
              top: '8%',
              left: '35%',
              animationDuration: '1.2s',
              fontSize: '13px',
              filter: 'drop-shadow(0 0 8px #fbbf24)',
            }}
          >
            ✨
          </div>
          <div
            className="absolute animate-pulse text-yellow-200"
            style={{
              top: '52%',
              left: '46%',
              animationDuration: '1.5s',
              fontSize: '12px',
              filter: 'drop-shadow(0 0 8px #ffd700)',
            }}
          >
            ✨
          </div>
        </>
      )}
    </div>
  );
};
