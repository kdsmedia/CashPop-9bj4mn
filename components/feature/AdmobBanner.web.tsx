import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors } from '@/constants/theme';

// Web stub — react-native-google-mobile-ads is not available on web
export function AdmobBanner() {
  return <View style={styles.container} />;
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.tabBg,
    height: 0,
  },
});
