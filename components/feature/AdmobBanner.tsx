import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors } from '@/constants/theme';

// AdMob banner placeholder — real ads load via native AdMob SDK at runtime
export function AdmobBanner() {
  return <View style={styles.container} />;
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
