import { useState, useEffect, useRef, useCallback } from 'react';
import type { RoarPowerResult } from '../types';
export type { RoarPowerResult };

/**
 * 3단계 포효 판정 계산기
 * - 일반 레벨 (볼륨 0 ~ 40): GOOD! ⭐ (표준 두께)
 * - 강력 레벨 (볼륨 41 ~ 75): GREAT ROAR! ⭐⭐ (두께 1.8배 + 네온 발광)
 * - 슈퍼 포효 레벨 (볼륨 76 ~ 100): PERFECT ATOMIC ROAR! ⭐⭐⭐ (두께 3.0배 + 화면 진동 0.4초)
 */
export const calculateRoarPower = (peakVolume: number): RoarPowerResult => {
  const clamped = Math.max(0, Math.min(100, Math.round(peakVolume)));
  if (clamped >= 76) {
    return {
      level: 'PERFECT',
      peakVolume: clamped,
      label: 'PERFECT ATOMIC ROAR! ⭐⭐⭐',
      badge: 'PERFECT ⭐⭐⭐',
      stars: 3,
      scaleMultiplier: 3.0,
    };
  }
  if (clamped >= 41) {
    return {
      level: 'GREAT',
      peakVolume: clamped,
      label: 'GREAT ROAR! ⭐⭐',
      badge: 'GREAT ⭐⭐',
      stars: 2,
      scaleMultiplier: 1.8,
    };
  }
  return {
    level: 'GOOD',
    peakVolume: clamped,
    label: 'GOOD! ⭐',
    badge: 'GOOD ⭐',
    stars: 1,
    scaleMultiplier: 1.0,
  };
};

export interface UseVoiceVolumeOptions {
  enabled?: boolean;
}

/**
 * Web Audio API 기반 마이크 실시간 볼륨(데시벨) 감지 훅
 */
export const useVoiceVolume = (options: UseVoiceVolumeOptions = {}) => {
  const { enabled = true } = options;
  const [currentVolume, setCurrentVolume] = useState<number>(0);
  const [peakVolume, setPeakVolume] = useState<number>(0);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const peakVolumeRef = useRef<number>(0);
  const smoothedVolumeRef = useRef<number>(0);

  // 마이크 스트림 및 AudioContext 완벽 해제 (브라우저 마이크 점유 빨간불 즉각 해제)
  const cleanupAudio = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach((track) => {
          track.stop();
        });
      } catch (e) {
        console.warn('Failed to stop media tracks:', e);
      }
      streamRef.current = null;
    }

    if (audioContextRef.current) {
      try {
        if (audioContextRef.current.state !== 'closed') {
          audioContextRef.current.close().catch(() => {});
        }
      } catch (e) {
        console.warn('Failed to close AudioContext:', e);
      }
      audioContextRef.current = null;
    }

    analyserRef.current = null;
    setCurrentVolume(0);
  }, []);

  const resetPeakVolume = useCallback(() => {
    peakVolumeRef.current = 0;
    setPeakVolume(0);
  }, []);

  const startAudioMonitoring = useCallback(async () => {
    cleanupAudio();

    if (
      typeof window === 'undefined' ||
      !navigator?.mediaDevices ||
      typeof navigator.mediaDevices.getUserMedia !== 'function'
    ) {
      setHasPermission(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      streamRef.current = stream;
      setHasPermission(true);

      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

      if (!AudioContextClass) {
        return;
      }

      const audioContext = new AudioContextClass();
      audioContextRef.current = audioContext;

      if (audioContext.state === 'suspended') {
        await audioContext.resume().catch(() => {});
      }

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.25;
      analyserRef.current = analyser;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateVolume = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteTimeDomainData(dataArray);

        // RMS (Root Mean Square) 계산
        let sumSquares = 0;
        for (let i = 0; i < bufferLength; i++) {
          const norm = (dataArray[i] - 128) / 128;
          sumSquares += norm * norm;
        }
        const rms = Math.sqrt(sumSquares / bufferLength);

        // 0~100 스케일 변환 (어린이 음성 특성에 맞춘 민감도 튜닝)
        // 주변 배경 잡음(rms <= 0.015) 억제, 목소리 발성 시 20~80, 큰 포효 시 80~100 도달
        let calculated = 0;
        if (rms > 0.015) {
          calculated = Math.min(100, Math.round(Math.pow((rms - 0.01) * 3.2, 0.72) * 100));
        }

        // 반응형 게이지를 위한 부드러운 감쇠 (어택은 즉시, 릴리즈는 부드럽게)
        if (calculated > smoothedVolumeRef.current) {
          smoothedVolumeRef.current = calculated;
        } else {
          smoothedVolumeRef.current = Math.max(
            0,
            Math.round(smoothedVolumeRef.current * 0.82 + calculated * 0.18)
          );
        }

        setCurrentVolume(smoothedVolumeRef.current);

        if (calculated > peakVolumeRef.current) {
          peakVolumeRef.current = calculated;
          setPeakVolume(calculated);
        }

        animationFrameRef.current = requestAnimationFrame(updateVolume);
      };

      animationFrameRef.current = requestAnimationFrame(updateVolume);
    } catch (err) {
      console.warn('Microphone volume monitoring fallback (permission or hardware):', err);
      setHasPermission(false);
    }
  }, [cleanupAudio]);

  useEffect(() => {
    if (enabled) {
      startAudioMonitoring();
    } else {
      cleanupAudio();
    }
    return () => {
      cleanupAudio();
    };
  }, [enabled, startAudioMonitoring, cleanupAudio]);

  const powerResult = calculateRoarPower(peakVolume);

  return {
    currentVolume,
    peakVolume,
    powerResult,
    hasPermission,
    resetPeakVolume,
    cleanupAudio,
  };
};
