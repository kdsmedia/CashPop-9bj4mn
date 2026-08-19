import { useEffect, useRef } from 'react';
import { INTERSTITIAL_INTERVAL_MS } from '@/constants/config';

// Interstitial ad hook — real ads load via native AdMob SDK at runtime
export function useInterstitialAd() {
  const lastShownRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const showIfReady = () => {
    const now = Date.now();
    if (now - lastShownRef.current < INTERSTITIAL_INTERVAL_MS) return;
    lastShownRef.current = now;
    // Native interstitial show call handled by AdMob plugin at build time
  };

  useEffect(() => {
    timerRef.current = setInterval(() => {
      showIfReady();
    }, 60 * 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return { showIfReady };
}
