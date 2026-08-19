import { useEffect, useRef } from 'react';
import {
  InterstitialAd,
  AdEventType,
  TestIds,
} from 'react-native-google-mobile-ads';
import { ADMOB_IDS, INTERSTITIAL_INTERVAL_MS } from '@/constants/config';

const adUnitId = __DEV__ ? TestIds.INTERSTITIAL : ADMOB_IDS.INTERSTITIAL;

let adInstance: ReturnType<typeof InterstitialAd.createForAdRequest> | null = null;
let adLoaded = false;

function loadNewAd() {
  try {
    adLoaded = false;
    adInstance = InterstitialAd.createForAdRequest(adUnitId, {
      requestNonPersonalizedAdsOnly: false,
    });
    adInstance.addAdEventListener(AdEventType.LOADED, () => {
      adLoaded = true;
    });
    adInstance.addAdEventListener(AdEventType.CLOSED, () => {
      adLoaded = false;
      adInstance = null;
      setTimeout(loadNewAd, 2000);
    });
    adInstance.addAdEventListener(AdEventType.ERROR, () => {
      adLoaded = false;
      adInstance = null;
      setTimeout(loadNewAd, 30000);
    });
    adInstance.load();
  } catch {}
}

export function useInterstitialAd() {
  const lastShownRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const showIfReady = () => {
    const now = Date.now();
    if (now - lastShownRef.current < INTERSTITIAL_INTERVAL_MS) return;
    if (!adInstance || !adLoaded) return;
    try {
      adInstance.show();
      lastShownRef.current = now;
    } catch {}
  };

  useEffect(() => {
    loadNewAd();
    timerRef.current = setInterval(() => {
      showIfReady();
    }, 60 * 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return { showIfReady };
}
