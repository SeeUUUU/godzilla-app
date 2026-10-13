import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const [showGuideModal, setShowGuideModal] = useState<boolean>(false);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);

  useEffect(() => {
    // 1. 이미 Standalone(홈 화면에 추가된 PWA 독립 앱)으로 실행 중인지 확인
    const checkStandalone = () => {
      const isStandaloneMode =
        window.matchMedia('(display-mode: standalone)').matches ||
        window.matchMedia('(display-mode: fullscreen)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
        document.referrer.includes('android-app://');
      setIsStandalone(Boolean(isStandaloneMode));
    };

    checkStandalone();
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleMediaChange = (e: MediaQueryListEvent) => {
      setIsStandalone(e.matches);
    };
    mediaQuery.addEventListener?.('change', handleMediaChange);

    // 2. iOS 디바이스 확인 (iPhone, iPad, iPod)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice =
      /iphone|ipad|ipod/.test(userAgent) ||
      (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1);
    setIsIOS(isIOSDevice);

    // 3. 사용자 이전 닫기 여부 확인 (세션 기준)
    const dismissedSession = sessionStorage.getItem('godzilla_pwa_banner_dismissed');
    if (dismissedSession === 'true') {
      setIsDismissed(true);
    }

    // 4. Chromium 계열 beforeinstallprompt 이벤트 캡처
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    // 5. 앱 설치 완료 이벤트 캡처
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setIsStandalone(true);
      console.log('[PWA] Godzilla App was successfully installed!');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      mediaQuery.removeEventListener?.('change', handleMediaChange);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // 설치 버튼 클릭 처리
  const triggerInstall = useCallback(async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setIsInstalled(true);
          setDeferredPrompt(null);
        }
      } catch (err) {
        console.warn('[PWA] Prompt error:', err);
        setShowGuideModal(true);
      }
    } else {
      // iOS이거나 브라우저 프롬프트 지원 안 되는 경우 가이드 모달 띄우기
      setShowGuideModal(true);
    }
  }, [deferredPrompt]);

  // 배너 닫기 (현재 세션 동안 유지)
  const dismissBanner = useCallback(() => {
    setIsDismissed(true);
    try {
      sessionStorage.setItem('godzilla_pwa_banner_dismissed', 'true');
    } catch {
      // ignore
    }
  }, []);

  return {
    isStandalone,
    isIOS,
    isDismissed,
    isInstalled,
    isInstallable: Boolean(deferredPrompt) || isIOS,
    showGuideModal,
    setShowGuideModal,
    triggerInstall,
    dismissBanner,
  };
}
