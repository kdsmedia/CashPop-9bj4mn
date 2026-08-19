import { useEffect, useRef } from 'react';
import {
  InterstitialAd,
  AdEventType,
  TestIds,
} from 'react-native-google-mobile-ads';
import { ADMOB_IDS, INTERSTITIAL_INTERVAL_MS } from '@/constants/config';

const adUnitId = __DEV__ ? TestIds.INTERSTITIAL : ADMOB_IDS.INTERSTITIAL;

export function useInterstitialAd() {
  const interstitialRef = useRef<any>(null);
  const lastShownRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadAd = () => {
    try {
      const ad = InterstitialAd.createForAdRequest(adUnitId, {
        requestNonPersonalizedAdsOnly: false,
      });

      const unsubLoaded = ad.addAdEventListener(AdEventType.LOADED, () => {
        interstitialRef.current = ad;
      });

      const unsubClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
        interstitialRef.current = null;
        loadAd(); // preload next
      });

      ad.load();
    } catch {}
  };

  const showIfReady = () => {
    const now = Date.now();
    if (now - lastShownRef.current < INTERSTITIAL_INTERVAL_MS) return;
    if (!interstitialRef.current) return;
    try {
      interstitialRef.current.show();
      lastShownRef.current = now;
    } catch {}
  };

  useEffect(() => {
    loadAd();
    timerRef.current = setInterval(() => {
      showIfReady();
    }, 60 * 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return { showIfReady };
}
