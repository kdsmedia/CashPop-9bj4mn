import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, FontSize, FontWeight } from '@/constants/theme';

export function AdmobBanner() {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, { toValue: 1, duration: 1800, useNativeDriver: true }),
        Animated.timing(shimmerAnim, { toValue: 0, duration: 1800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const opacity = shimmerAnim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(255,215,0,0.08)', 'rgba(255,140,66,0.08)']}
        style={styles.banner}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <Animated.View style={[styles.inner, { opacity }]}>
          <MaterialIcons name="campaign" size={16} color={Colors.textMuted} />
          <Text style={styles.label}>Advertisement</Text>
          <View style={styles.adSlot}>
            <Text style={styles.adText}>Banner Ad 320×50</Text>
          </View>
        </Animated.View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 54,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,215,0,0.15)',
  },
  banner: { flex: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, paddingHorizontal: 16 },
  inner: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  label: { fontSize: FontSize.xs, color: Colors.textMuted },
  adSlot: {
    flex: 1,
    height: 36,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderStyle: 'dashed',
  },
  adText: { fontSize: FontSize.xs, color: Colors.textMuted },
});
