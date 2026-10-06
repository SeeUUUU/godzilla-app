import React, { useState, useEffect } from 'react';
import { X, Award, Shield, Check, Lock, Sparkles } from 'lucide-react';
import {
  ATOMIC_PARTS,
  ATOMIC_TITLES,
  getUnlockedPartIds,
  getUnlockedTitleIds,
  getEquippedGear,
  setEquippedGear,
  type PartSlot,
  type AtomicPart,
  type AtomicTitle,
  type EquippedAtomicGear,
} from '../data/atomicPartsData';
import { playCardTapSound, playDingDongSuccess } from '../utils/soundEffects';

interface AtomicHangarModalProps {
  isOpen: boolean;
  onClose: () => void;
  childName: string;
  onGearChanged?: (gear: EquippedAtomicGear) => void;
}

const RARITY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  COMMON: { bg: 'bg-slate-800/80', text: 'text-slate-300', border: 'border-slate-600' },
  RARE: { bg: 'bg-blue-950/80', text: 'text-blue-300', border: 'border-blue-400' },
  EPIC: { bg: 'bg-purple-950/80', text: 'text-purple-300', border: 'border-purple-400' },
  LEGENDARY: { bg: 'bg-amber-950/80', text: 'text-yellow-300', border: 'border-yellow-400 shadow-[0_0_12px_rgba(250,204,21,0.5)]' },
};

export const AtomicHangarModal: React.FC<AtomicHangarModalProps> = ({
  isOpen,
  onClose,
  childName,
  onGearChanged,
}) => {
  const [activeTab, setActiveTab] = useState<'parts' | 'titles'>('parts');
  const [selectedSlot, setSelectedSlot] = useState<PartSlot>('head');

  const [unlockedParts, setUnlockedParts] = useState<string[]>(() => getUnlockedPartIds());
  const [unlockedTitles, setUnlockedTitles] = useState<string[]>(() => getUnlockedTitleIds());
  const [equippedGear, setEquippedGearState] = useState<EquippedAtomicGear>(() => getEquippedGear());

  useEffect(() => {
    if (isOpen) {
      setUnlockedParts(getUnlockedPartIds());
      setUnlockedTitles(getUnlockedTitleIds());
      setEquippedGearState(getEquippedGear());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // 장착 중인 파츠 정보
  const equippedHead = ATOMIC_PARTS.find((p) => p.id === equippedGear.head);
  const equippedFin = ATOMIC_PARTS.find((p) => p.id === equippedGear.fin);
  const equippedWeapon = ATOMIC_PARTS.find((p) => p.id === equippedGear.weapon);
  const equippedTitle = ATOMIC_TITLES.find((t) => t.id === equippedGear.title) || ATOMIC_TITLES[0];

  // 파츠 장착/해제 토글
  const handleToggleEquipPart = (part: AtomicPart) => {
    playCardTapSound();
    const isCurrentlyEquipped = equippedGear[part.slot] === part.id;
    const newGear: EquippedAtomicGear = {
      ...equippedGear,
      [part.slot]: isCurrentlyEquipped ? null : part.id,
    };
    setEquippedGearState(newGear);
    setEquippedGear(newGear);
    onGearChanged?.(newGear);
  };

  // 칭호 착용
  const handleEquipTitle = (title: AtomicTitle) => {
    playDingDongSuccess();
    const newGear: EquippedAtomicGear = {
      ...equippedGear,
      title: title.id,
    };
    setEquippedGearState(newGear);
    setEquippedGear(newGear);
    onGearChanged?.(newGear);
  };

  const filteredParts = ATOMIC_PARTS.filter((p) => p.slot === selectedSlot);
  const partsCollectRate = Math.round((unlockedParts.length / ATOMIC_PARTS.length) * 100);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-slate-900/95 border-2 border-amber-400 rounded-2xl shadow-2xl shadow-amber-950/80 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 상단 헤더 */}
        <div className="flex-none flex items-center justify-between px-4 py-3 bg-gradient-to-r from-slate-900 via-amber-950/70 to-slate-900 border-b border-amber-500/40">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/20 border border-amber-400/50 text-amber-300">
              <Award size={20} />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-1.5">
                <span>아토믹 격납고 & 명예의 전당</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-950 border border-amber-400 text-yellow-300 font-bold">
                  CUSTOM
                </span>
              </h3>
              <p className="text-[11px] text-amber-200/80 font-medium">
                ⭐ {childName} 대장님의 나만의 고질라 장비실
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

        {/* 중앙 상단: 커스텀 고질라 쇼룸 프리뷰 */}
        <div className="flex-none p-3.5 bg-gradient-to-b from-slate-950/90 to-slate-900/90 border-b border-amber-500/30">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 max-w-xl mx-auto">
            {/* 고질라 포탑 아바타 프리뷰 */}
            <div className="flex items-center gap-3">
              <div className="relative flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-900 border-2 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.4)]">
                {/* 등지느러미 이펙트 */}
                {equippedFin && (
                  <span className="absolute -top-1 -left-1 text-base sm:text-lg animate-pulse" title={equippedFin.name}>
                    {equippedFin.turretEmoji}
                  </span>
                )}
                {/* 헤드기어 */}
                {equippedHead && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-lg sm:text-xl animate-bounce" title={equippedHead.name}>
                    {equippedHead.turretEmoji}
                  </span>
                )}
                {/* 본체 고질라 */}
                <span className="text-3xl sm:text-4xl select-none">
                  🦖
                </span>
                {/* 무기 이펙트 */}
                {equippedWeapon && (
                  <span className="absolute -bottom-1 -right-1 text-base sm:text-lg animate-pulse" title={equippedWeapon.name}>
                    {equippedWeapon.turretEmoji}
                  </span>
                )}
              </div>

              {/* 현재 장착 요약 정보 */}
              <div className="flex flex-col">
                <span className="px-2 py-0.5 rounded-md bg-cyan-950/90 border border-cyan-400 text-cyan-200 text-xs font-black w-fit mb-1 shadow-sm">
                  {equippedTitle.title}
                </span>
                <span className="text-sm font-extrabold text-white flex items-center gap-1">
                  <span>아토믹 커스텀 고질라</span>
                  <Sparkles size={14} className="text-yellow-400" />
                </span>
                <div className="text-[11px] text-slate-300 font-medium flex items-center gap-2 mt-0.5">
                  <span>헤드: {equippedHead?.name ?? '미장착'}</span>
                  <span>·</span>
                  <span>등: {equippedFin?.name ?? '기본'}</span>
                  <span>·</span>
                  <span>무기: {equippedWeapon?.name ?? '기본'}</span>
                </div>
              </div>
            </div>

            {/* 수집 달성률 배지 */}
            <div className="flex flex-col items-center sm:items-end w-full sm:w-auto">
              <span className="text-[11px] text-amber-300 font-bold mb-1">
                파츠 수집률: {unlockedParts.length}/{ATOMIC_PARTS.length} ({partsCollectRate}%)
              </span>
              <div className="w-36 h-2 bg-slate-800 rounded-full overflow-hidden border border-amber-500/50">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-500"
                  style={{ width: `${partsCollectRate}%` }}
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-1">
                칭호 달성: {unlockedTitles.length}/{ATOMIC_TITLES.length}
              </span>
            </div>
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <div className="flex-none flex items-center border-b border-slate-700/80 bg-slate-950/70 px-4 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('parts')}
            className={`px-4 py-2 font-black text-xs sm:text-sm border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'parts'
                ? 'border-amber-400 text-amber-300 bg-amber-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield size={16} />
            <span>아토믹 파츠 장착</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('titles')}
            className={`px-4 py-2 font-black text-xs sm:text-sm border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'titles'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Award size={16} />
            <span>명예의 칭호 ({unlockedTitles.length})</span>
          </button>
        </div>

        {/* 탭 1: 아토믹 파츠 목록 */}
        {activeTab === 'parts' && (
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
            {/* 슬롯 선택 세그먼트 (머리, 등, 무기) */}
            <div className="grid grid-cols-3 gap-2 p-1 bg-slate-950/80 rounded-xl border border-slate-800">
              {(
                [
                  { slot: 'head', label: '👑 헤드기어' },
                  { slot: 'fin', label: '🔥 등지느러미' },
                  { slot: 'weapon', label: '💥 열선 무기' },
                ] as const
              ).map(({ slot, label }) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => {
                    playCardTapSound();
                    setSelectedSlot(slot);
                  }}
                  className={`py-1.5 px-2 rounded-lg font-black text-xs transition-all cursor-pointer text-center ${
                    selectedSlot === slot
                      ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* 파츠 카드 그리드 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {filteredParts.map((part) => {
                const isUnlocked = unlockedParts.includes(part.id);
                const isEquipped = equippedGear[part.slot] === part.id;
                const rarityStyle = RARITY_COLORS[part.rarity];

                return (
                  <div
                    key={part.id}
                    className={`relative flex flex-col justify-between p-3 rounded-xl border transition-all ${
                      isEquipped
                        ? 'border-yellow-400 bg-gradient-to-br from-amber-950/60 to-slate-900 shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                        : isUnlocked
                        ? `${rarityStyle.border} ${rarityStyle.bg}`
                        : 'border-slate-800 bg-slate-950/60 opacity-60'
                    }`}
                  >
                    {/* 상단: 아이콘, 이름, 희귀도 */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl p-1.5 rounded-lg bg-slate-900/80 border border-slate-700/60 shadow-inner flex items-center justify-center w-10 h-10">
                          {part.icon}
                        </span>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs sm:text-sm font-black text-white">
                              {part.name}
                            </span>
                            <span className={`text-[9px] font-black px-1.5 py-0.2 rounded border ${rarityStyle.border} ${rarityStyle.text}`}>
                              {part.rarity}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 block line-clamp-1">
                            {part.description}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 하단: 해금 조건 및 장착 액션 */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-700/40 text-[11px]">
                      {isUnlocked ? (
                        <>
                          <span className="text-emerald-400 font-bold flex items-center gap-1">
                            <Check size={13} />
                            <span>보유 중</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => handleToggleEquipPart(part)}
                            className={`px-3 py-1 rounded-lg font-black text-xs transition-all cursor-pointer active:scale-95 ${
                              isEquipped
                                ? 'bg-amber-500 text-slate-950 shadow-md hover:bg-amber-400'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600'
                            }`}
                          >
                            {isEquipped ? '장착 중 ✓' : '장착하기'}
                          </button>
                        </>
                      ) : (
                        <div className="w-full flex items-center justify-between text-slate-400">
                          <span className="flex items-center gap-1 text-[10px]">
                            <Lock size={12} className="text-amber-400/80" />
                            <span>{part.unlockCondition}</span>
                          </span>
                          <span className="text-[10px] font-bold text-slate-500">잠김</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 탭 2: 명예의 칭호 목록 */}
        {activeTab === 'titles' && (
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5">
            {ATOMIC_TITLES.map((title) => {
              const isUnlocked = unlockedTitles.includes(title.id);
              const isEquipped = equippedGear.title === title.id;

              return (
                <div
                  key={title.id}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                    isEquipped
                      ? 'border-cyan-400 bg-gradient-to-r from-cyan-950/70 to-slate-900 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                      : isUnlocked
                      ? 'border-slate-700 bg-slate-900/80 hover:border-slate-500'
                      : 'border-slate-800 bg-slate-950/60 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl p-1.5 rounded-lg bg-slate-950 border border-slate-700/60 flex items-center justify-center w-10 h-10">
                      {title.badgeIcon}
                    </span>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs sm:text-sm font-black text-white">
                          {title.title}
                        </span>
                        {isEquipped && (
                          <span className="px-1.5 py-0.2 rounded-full bg-cyan-950 border border-cyan-400 text-cyan-300 text-[10px] font-bold">
                            착용 중
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 block">
                        {title.description}
                      </span>
                    </div>
                  </div>

                  <div>
                    {isUnlocked ? (
                      <button
                        type="button"
                        onClick={() => handleEquipTitle(title)}
                        className={`px-3 py-1.5 rounded-lg font-black text-xs transition-all cursor-pointer active:scale-95 ${
                          isEquipped
                            ? 'bg-cyan-500 text-slate-950 shadow-md hover:bg-cyan-400'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600'
                        }`}
                      >
                        {isEquipped ? '착용 완료 ✓' : '착용하기'}
                      </button>
                    ) : (
                      <div className="flex items-center gap-1 text-[11px] text-slate-500">
                        <Lock size={12} className="text-slate-500" />
                        <span className="text-[10px]">{title.unlockCondition}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 하단 닫기 바 */}
        <div className="flex-none p-3 bg-slate-950 border-t border-amber-500/30 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs sm:text-sm shadow-lg active:scale-95 transition-all flex items-center justify-center gap-1.5 border border-yellow-200 cursor-pointer"
          >
            <span>장착 완료 & 요격 전장으로</span>
            <Check size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
