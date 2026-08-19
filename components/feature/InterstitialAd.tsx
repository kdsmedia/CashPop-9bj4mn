import { useEffect, useRef } from 'react';
import { ADMOB_IDS, INTERSTITIAL_INTERVAL_MS } from '@/constants/config';

let InterstitialAd: any = null;
let AdEventType: any = null;
let TestIds: any = null;

try {
  const admob = require('react-native-google-mobile-ads');
  InterstitialAd = admob.InterstitialAd;
  AdEventType = admob.AdEventType;
  TestIds = admob.TestIds;
} catch {}

export function useInterstitialAd() {
  const interstitialRef = useRef<any>(null);
  const lastShownRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadAd = () => {
    if (!InterstitialAd) return;
    try {
      const adUnitId = __DEV__
        ? (TestIds?.INTERSTITIAL || 'ca-app-pub-3940256099942544/1033173712')
        : ADMOB_IDS.INTERSTITIAL;

      const ad = InterstitialAd.createForAdRequest(adUnitId, {
        requestNonPersonalizedAdsOnly: false,
      });

      ad.addAdEventListener(AdEventType?.LOADED, () => {
        interstitialRef.current = ad;
      });

      ad.addAdEventListener(AdEventType?.CLOSED, () => {
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
    // Check every minute if we should show interstitial
    timerRef.current = setInterval(() => {
      showIfReady();
    }, 60 * 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return { showIfReady };
}
