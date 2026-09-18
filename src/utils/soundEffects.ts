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
