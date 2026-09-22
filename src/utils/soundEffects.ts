// Web Audio API 기반 오디오 신디사이저 (외부 오디오 파일 없이 실시간 음향 합성)

let audioCtx: AudioContext | null = null;

const getAudioContext = (): AudioContext | null => {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
};

// 1. 고질라 열선 발사 레이저음 (Pew-Pew & Roar Laser)
export const playLaserPewPew = () => {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';

    osc.frequency.setValueAtTime(1400, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.35);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.36);

    const rumble = ctx.createOscillator();
    const rumbleGain = ctx.createGain();
    rumble.type = 'triangle';
    rumble.frequency.setValueAtTime(80, now);
    rumble.frequency.linearRampToValueAtTime(180, now + 0.2);
    rumble.frequency.exponentialRampToValueAtTime(40, now + 0.6);

    rumbleGain.gain.setValueAtTime(0.25, now);
    rumbleGain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);

    rumble.connect(rumbleGain);
    rumbleGain.connect(ctx.destination);

    rumble.start(now);
    rumble.stop(now + 0.61);
  } catch (e) {
    console.warn('Audio error:', e);
  }
};

// 1-2. 피버 모드 메가 빔 초강력 발사음 (Mega Fever Roar Laser)
export const playFeverBeamSound = () => {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    // 초고출력 빔 발사음
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';

    osc.frequency.setValueAtTime(1900, now);
    osc.frequency.exponentialRampToValueAtTime(90, now + 0.48);

    gain.gain.setValueAtTime(0.38, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.48);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.49);

    // 육중한 폭발 럼블 베이스
    const rumble = ctx.createOscillator();
    const rumbleGain = ctx.createGain();
    rumble.type = 'triangle';
    rumble.frequency.setValueAtTime(110, now);
    rumble.frequency.linearRampToValueAtTime(260, now + 0.22);
    rumble.frequency.exponentialRampToValueAtTime(30, now + 0.7);

    rumbleGain.gain.setValueAtTime(0.35, now);
    rumbleGain.gain.exponentialRampToValueAtTime(0.01, now + 0.7);

    rumble.connect(rumbleGain);
    rumbleGain.connect(ctx.destination);

    rumble.start(now);
    rumble.stop(now + 0.71);
  } catch (e) {
    console.warn('Audio error:', e);
  }
};

// 1-3. 5단계 진화별 특화 열선 사운드
export const playEvolutionBeamSound = (tier: string, isFever = false) => {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    if (tier === 'chibi') {
      // 퐁퐁 튀는 귀여운 파이어볼 팝 사운드
      const freqs = [480, 680, 880, 1150];
      freqs.forEach((f, idx) => {
        const t = now + idx * 0.08;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, t);
        osc.frequency.exponentialRampToValueAtTime(f * 1.3, t + 0.07);
        gain.gain.setValueAtTime(isFever ? 0.25 : 0.18, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.075);
      });
      return;
    }

    if (tier === 'minusone') {
      // 고질라 -1.0: 초고압 소닉 크랙 & 핵폭발 충격파
      const crack = ctx.createOscillator();
      const crackGain = ctx.createGain();
      crack.type = 'sawtooth';
      crack.frequency.setValueAtTime(2400, now);
      crack.frequency.exponentialRampToValueAtTime(70, now + 0.35);
      crackGain.gain.setValueAtTime(0.38, now);
      crackGain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
      crack.connect(crackGain);
      crackGain.connect(ctx.destination);
      crack.start(now);
      crack.stop(now + 0.36);

      const sub = ctx.createOscillator();
      const subGain = ctx.createGain();
      sub.type = 'triangle';
      sub.frequency.setValueAtTime(140, now);
      sub.frequency.linearRampToValueAtTime(320, now + 0.15);
      sub.frequency.exponentialRampToValueAtTime(25, now + 0.7);
      subGain.gain.setValueAtTime(0.35, now);
      subGain.gain.exponentialRampToValueAtTime(0.01, now + 0.7);
      sub.connect(subGain);
      subGain.connect(ctx.destination);
      sub.start(now);
      sub.stop(now + 0.71);
      return;
    }

    if (tier === 'evil') {
      // 이블 고질라: 섬뜩한 악령 파괴 광선 울부짖음
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      osc1.type = 'sawtooth';
      osc2.type = 'square';
      osc1.frequency.setValueAtTime(750, now);
      osc2.frequency.setValueAtTime(758, now); // 디튠 비트
      osc1.frequency.linearRampToValueAtTime(300, now + 0.45);
      osc2.frequency.linearRampToValueAtTime(295, now + 0.45);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);
      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.51);
      osc2.stop(now + 0.51);
      return;
    }

    if (tier === 'burning') {
      // 버닝 고질라: 초대형 인피니트 스파이럴 화염 열선 굉음
      playFeverBeamSound();
      return;
    }

    // 기본 고질라 (classic)
    if (isFever) {
      playFeverBeamSound();
    } else {
      playLaserPewPew();
    }
  } catch (e) {
    console.warn('Audio error:', e);
  }
};

// 2. 킹 기도라 황금 중력 번개/전기 충격 사운드 (Electric Lightning Zap)
export const playElectricShockSound = () => {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    // 지직거리는 전기 노이즈 버스트
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';

    // 800Hz와 120Hz를 빠르게 진동하는 전기 아크 사운드
    osc.frequency.setValueAtTime(950, now);
    osc.frequency.setValueAtTime(320, now + 0.06);
    osc.frequency.setValueAtTime(820, now + 0.12);
    osc.frequency.setValueAtTime(160, now + 0.2);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.45);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.46);

    // 타격 서브 베이스
    const bass = ctx.createOscillator();
    const bassGain = ctx.createGain();
    bass.type = 'triangle';
    bass.frequency.setValueAtTime(180, now);
    bass.frequency.exponentialRampToValueAtTime(45, now + 0.35);

    bassGain.gain.setValueAtTime(0.3, now);
    bassGain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

    bass.connect(bassGain);
    bassGain.connect(ctx.destination);

    bass.start(now);
    bass.stop(now + 0.36);
  } catch (e) {
    console.warn('Audio error:', e);
  }
};

// 3. 정답 딩동댕 벨소리 (Ding-Dong-Dang Celebratory Chime)
export const playDingDongSuccess = () => {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5];

    notes.forEach((freq, index) => {
      const startTime = now + index * 0.1;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.2, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.36);
    });
  } catch (e) {
    console.warn('Audio error:', e);
  }
};

// 4. 오답 진동음 (Error Buzz/Wobble)
export const playErrorBuzzer = () => {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.linearRampToValueAtTime(95, now + 0.25);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.26);
  } catch (e) {
    console.warn('Audio error:', e);
  }
};

// 5. 카드 탭 팝 사운드 (Tactile Touch Click)
export const playCardTapSound = () => {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.08);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.09);
  } catch (e) {
    console.warn('Audio error:', e);
  }
};

// 6. 알 탭 타격/금가는 소리 (Egg Tap & Crack)
export const playEggTapSound = (tapIndex: number = 1) => {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // 탭 횟수(1, 2, 3)에 따라 점진적으로 높아지는 긴장감 피치
    const baseFreq = 320 + tapIndex * 140;
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.06);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.12);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.13);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.14);

    // 금가는 고주파 딱! 소리
    const click = ctx.createOscillator();
    const clickGain = ctx.createGain();
    click.type = 'sawtooth';
    click.frequency.setValueAtTime(1200 + tapIndex * 400, now);
    click.frequency.exponentialRampToValueAtTime(300, now + 0.05);

    clickGain.gain.setValueAtTime(0.2, now);
    clickGain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

    click.connect(clickGain);
    clickGain.connect(ctx.destination);

    click.start(now);
    click.stop(now + 0.06);
  } catch (e) {
    console.warn('Audio error:', e);
  }
};

// 7. 알 부화 및 대폭발 섬광음 (Egg Hatch Flash Burst)
export const playEggHatchSound = () => {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    // 1) 폭발적 럼블 베이스
    const bass = ctx.createOscillator();
    const bassGain = ctx.createGain();
    bass.type = 'sawtooth';
    bass.frequency.setValueAtTime(350, now);
    bass.frequency.exponentialRampToValueAtTime(40, now + 0.6);

    bassGain.gain.setValueAtTime(0.4, now);
    bassGain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);

    bass.connect(bassGain);
    bassGain.connect(ctx.destination);
    bass.start(now);
    bass.stop(now + 0.62);

    // 2) 찬란하게 터지는 샤인 벨 (Shine Glissando)
    const pitches = [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98];
    pitches.forEach((freq, idx) => {
      const bell = ctx.createOscillator();
      const bellGain = ctx.createGain();
      bell.type = 'sine';
      bell.frequency.setValueAtTime(freq, now + idx * 0.06);

      bellGain.gain.setValueAtTime(0.18, now + idx * 0.06);
      bellGain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.4);

      bell.connect(bellGain);
      bellGain.connect(ctx.destination);

      bell.start(now + idx * 0.06);
      bell.stop(now + idx * 0.06 + 0.42);
    });
  } catch (e) {
    console.warn('Audio error:', e);
  }
};

// 8. 희귀도별 카드 등장 팡파레 (Card Reveal Fanfare)
export const playCardRevealFanfare = (rarity: string) => {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const isHighRarity = rarity === 'legendary' || rarity === 'mythic' || rarity === 'super_rare';
    const notes = isHighRarity
      ? [523.25, 659.25, 783.99, 1046.5, 1318.51] // C Major fanfare
      : [440, 554.37, 659.25, 880];

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = isHighRarity ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.09);

      gain.gain.setValueAtTime(0.25, now + i * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.09 + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + i * 0.09);
      osc.stop(now + i * 0.09 + 0.38);
    });
  } catch (e) {
    console.warn('Audio error:', e);
  }
};

// 9. 고질라 음성 포효 공격 크리티컬 타격음 (Critical Voice Roar Beam)
export const playCriticalRoarSound = () => {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    // 1) 고질라의 육중한 포효 럼블 (Mega Roar Rumble)
    const roar = ctx.createOscillator();
    const roarGain = ctx.createGain();
    roar.type = 'sawtooth';
    roar.frequency.setValueAtTime(160, now);
    roar.frequency.linearRampToValueAtTime(320, now + 0.18);
    roar.frequency.exponentialRampToValueAtTime(50, now + 0.65);

    roarGain.gain.setValueAtTime(0.4, now);
    roarGain.gain.exponentialRampToValueAtTime(0.01, now + 0.65);

    roar.connect(roarGain);
    roarGain.connect(ctx.destination);
    roar.start(now);
    roar.stop(now + 0.67);

    // 2) 초강력 빔 방사음 (Critical Beam Surge)
    const beam = ctx.createOscillator();
    const beamGain = ctx.createGain();
    beam.type = 'triangle';
    beam.frequency.setValueAtTime(880, now + 0.08);
    beam.frequency.exponentialRampToValueAtTime(1760, now + 0.28);
    beam.frequency.exponentialRampToValueAtTime(220, now + 0.55);

    beamGain.gain.setValueAtTime(0.35, now + 0.08);
    beamGain.gain.exponentialRampToValueAtTime(0.01, now + 0.55);

    beam.connect(beamGain);
    beamGain.connect(ctx.destination);
    beam.start(now + 0.08);
    beam.stop(now + 0.57);

    // 3) 크리티컬 타격 팡파레 화음 (C Major Chord Burst)
    [523.25, 659.25, 783.99, 1046.5].forEach((freq) => {
      const chime = ctx.createOscillator();
      const chimeGain = ctx.createGain();
      chime.type = 'sine';
      chime.frequency.setValueAtTime(freq, now + 0.12);

      chimeGain.gain.setValueAtTime(0.18, now + 0.12);
      chimeGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      chime.connect(chimeGain);
      chimeGain.connect(ctx.destination);
      chime.start(now + 0.12);
      chime.stop(now + 0.52);
    });
  } catch (e) {
    console.warn('Audio error:', e);
  }
};

// 12. 고질라 발자국 스탬프 쿵! 타격음 (Stamp Thud & Fanfare)
export const playStampThudSound = () => {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    // 1) 묵직한 발자국 저음 쿵! (Heavy Thud Impact)
    const thud = ctx.createOscillator();
    const thudGain = ctx.createGain();
    thud.type = 'triangle';
    thud.frequency.setValueAtTime(140, now);
    thud.frequency.exponentialRampToValueAtTime(32, now + 0.3);

    thudGain.gain.setValueAtTime(0.5, now);
    thudGain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

    thud.connect(thudGain);
    thudGain.connect(ctx.destination);
    thud.start(now);
    thud.stop(now + 0.36);

    // 2) 경쾌한 스탬프 획득 차임 (Success Chime)
    [587.33, 880, 1174.66].forEach((freq, i) => {
      const chime = ctx.createOscillator();
      const chimeGain = ctx.createGain();
      chime.type = 'sine';
      chime.frequency.setValueAtTime(freq, now + 0.1 + i * 0.07);

      chimeGain.gain.setValueAtTime(0.2, now + 0.1 + i * 0.07);
      chimeGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5 + i * 0.07);

      chime.connect(chimeGain);
      chimeGain.connect(ctx.destination);
      chime.start(now + 0.1 + i * 0.07);
      chime.stop(now + 0.55 + i * 0.07);
    });
  } catch (e) {
    console.warn('Audio error:', e);
  }
};

// 13. 승리 클리어 팡파레 축하음 (Victory Fanfare)
export const playVictoryFanfare = () => {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const notes = [
      { freq: 523.25, time: 0, dur: 0.15 },    // C5
      { freq: 659.25, time: 0.15, dur: 0.15 }, // E5
      { freq: 783.99, time: 0.3, dur: 0.2 },   // G5
      { freq: 1046.5, time: 0.5, dur: 0.6 },   // C6
    ];

    notes.forEach(({ freq, time, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + time);

      gain.gain.setValueAtTime(0.25, now + time);
      gain.gain.exponentialRampToValueAtTime(0.001, now + time + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + time);
      osc.stop(now + time + dur + 0.05);
    });
  } catch (e) {
    console.warn('Audio error:', e);
  }
};

// 12. 황금 보물상자 자물쇠 풀림음
export const playChestUnlockSound = () => {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(550, now);
    osc.frequency.exponentialRampToValueAtTime(1100, now + 0.12);
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.13);
  } catch (e) {
    console.warn('Audio error:', e);
  }
};

// 13. 황금 보물상자 오픈 팡파레 & 샤인음
export const playChestOpenSound = () => {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    // 웅장한 황금빛 저음 럼블
    const bass = ctx.createOscillator();
    const bassGain = ctx.createGain();
    bass.type = 'triangle';
    bass.frequency.setValueAtTime(120, now);
    bass.frequency.exponentialRampToValueAtTime(45, now + 0.5);
    bassGain.gain.setValueAtTime(0.35, now);
    bassGain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
    bass.connect(bassGain);
    bassGain.connect(ctx.destination);
    bass.start(now);
    bass.stop(now + 0.52);

    // 찬란한 황금빛 글리산도 벨
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98, 2093.0];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.06);
      gain.gain.setValueAtTime(0.2, now + i * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.06);
      osc.stop(now + i * 0.06 + 0.42);
    });
  } catch (e) {
    console.warn('Audio error:', e);
  }
};

