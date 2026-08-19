import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Colors } from '@/constants/theme';
import { ADMOB_IDS } from '@/constants/config';

// react-native-google-mobile-ads integration
let BannerAd: any = null;
let BannerAdSize: any = null;
let TestIds: any = null;

try {
  const admob = require('react-native-google-mobile-ads');
  BannerAd = admob.BannerAd;
  BannerAdSize = admob.BannerAdSize;
  TestIds = admob.TestIds;
} catch {}

export function AdmobBanner() {
  if (!BannerAd) {
    return <View style={styles.placeholder} />;
  }

  const adUnitId = __DEV__
    ? (TestIds?.BANNER || 'ca-app-pub-3940256099942544/6300978111')
    : ADMOB_IDS.BANNER;

  return (
    <View style={styles.container}>
      <BannerAd
        unitId={adUnitId}
        size={BannerAdSize?.BANNER || 'BANNER'}
        requestOptions={{ requestNonPersonalizedAdsOnly: false }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.tabBg,
    minHeight: 52,
  },
  placeholder: {
    height: 0,
    backgroundColor: 'transparent',
  },
});
