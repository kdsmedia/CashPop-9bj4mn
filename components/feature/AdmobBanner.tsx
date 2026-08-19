import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors } from '@/constants/theme';
import { ADMOB_IDS } from '@/constants/config';
import {
  BannerAd,
  BannerAdSize,
  TestIds,
} from 'react-native-google-mobile-ads';
import { ensureAdsInitialized } from './InterstitialAd';

const adUnitId = __DEV__ ? TestIds.BANNER : ADMOB_IDS.BANNER;

export function AdmobBanner() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    ensureAdsInitialized().then(() => {
      if (mounted) setReady(true);
    });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <View style={styles.container}>
      {ready && (
        <BannerAd
          unitId={adUnitId}
          size={BannerAdSize.BANNER}
          requestOptions={{ requestNonPersonalizedAdsOnly: false }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.tabBg,
    height: 50,
    overflow: 'hidden',
  },
});
