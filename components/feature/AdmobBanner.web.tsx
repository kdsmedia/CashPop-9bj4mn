import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors } from '@/constants/theme';

export function AdmobBanner() {
  return <View style={styles.container} />;
}

const styles = StyleSheet.create({
  container: {
    height: 50,
    backgroundColor: Colors.tabBg,
  },
});
