import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, Animated, Image, Dimensions } from 'react-native';
import { useApp } from '@/hooks/useApp';
import { Colors, FontFamily, FontSize, Spacing, Radius } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const SPLASH_DURATION = 10000; // 10 seconds

const LOAD_STEPS = [
  'Memuat konfigurasi...',
  'Memeriksa data pengguna...',
  'Menginisialisasi mesin mining...',
  'Memuat booster & reward...',
  'Menyiapkan tugas harian...',
  'Mengecek koneksi server...',
  'Memverifikasi saldo DANA...',
  'Memuat papan peringkat...',
  'Menyiapkan notifikasi...',
  'Siap memulai!',
];

export default function SplashScreen() {
  const { user, isLoading } = useApp();
  const router = useRouter();

  const progressAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.5)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  const [stepIndex, setStepIndex] = useState(0);
  const [progressPercent, setProgressPercent] = useState(0);
  const [canNavigate, setCanNavigate] = useState(false);

  useEffect(() => {
    // Logo entrance
    Animated.parallel([
      Animated.spring(logoScale, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
      Animated.timing(logoOpacity, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();

    // Glow pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.3, duration: 1500, useNativeDriver: true }),
      ])
    ).start();

    // Progress bar animation
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: SPLASH_DURATION,
      useNativeDriver: false,
    }).start(() => {
      setCanNavigate(true);
    });

    // Step counter
    const stepInterval = SPLASH_DURATION / LOAD_STEPS.length;
    const stepTimer = setInterval(() => {
      setStepIndex((prev) => {
        if (prev < LOAD_STEPS.length - 1) return prev + 1;
        clearInterval(stepTimer);
        return prev;
      });
    }, stepInterval);

    // Progress percent updater
    const percentTimer = setInterval(() => {
      progressAnim.addListener(({ value }) => {
        setProgressPercent(Math.floor(value * 100));
      });
    }, 100);

    return () => {
      clearInterval(stepTimer);
      clearInterval(percentTimer);
      progressAnim.removeAllListeners();
    };
  }, []);

  useEffect(() => {
    if (canNavigate && !isLoading) {
      if (user.isOnboarded) {
        router.replace('/(tabs)');
      } else {
        router.replace('/onboarding');
      }
    }
  }, [canNavigate, isLoading, user.isOnboarded]);

  const barWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.2, 0.8],
  });

  return (
    <LinearGradient colors={['#07071A', '#0D0D30', '#07071A']} style={styles.container}>
      {/* Background binary particles */}
      <View style={styles.bgPattern}>
        {['01001100', '11010010', '00110101', '10100011', '01101001'].map((bin, i) => (
          <Text key={i} style={[styles.bgBinary, { top: 60 + i * 100, left: i % 2 === 0 ? 20 : width - 100, opacity: 0.06 }]}>
            {bin}
          </Text>
        ))}
      </View>

      {/* Logo */}
      <Animated.View style={[styles.logoWrap, { transform: [{ scale: logoScale }], opacity: logoOpacity }]}>
        <Animated.View style={[styles.logoGlow, { opacity: glowOpacity }]} />
        <Image
          source={require('@/assets/images/icon.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>

      {/* App name */}
      <Animated.View style={{ opacity: fadeAnim, alignItems: 'center', marginBottom: Spacing.xl }}>
        <Text style={styles.appName}>CashPoP</Text>
        <Text style={styles.tagline}>Mining Saldo DANA Otomatis</Text>
      </Animated.View>

      {/* Loading section */}
      <Animated.View style={[styles.loadingBox, { opacity: fadeAnim }]}>
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, { width: barWidth }]}>
            <LinearGradient
              colors={['#FFD700', '#FF8C42', '#FFD700']}
              style={StyleSheet.absoluteFillObject}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          </Animated.View>
          {/* Shine effect */}
          <Animated.View style={[styles.progressShine, { left: barWidth as any, opacity: glowOpacity }]} />
        </View>

        <View style={styles.progressInfo}>
          <Text style={styles.stepText}>{LOAD_STEPS[stepIndex]}</Text>
          <Text style={styles.percentText}>{progressPercent}%</Text>
        </View>
      </Animated.View>

      {/* Version */}
      <Animated.View style={{ opacity: fadeAnim }}>
        <Text style={styles.version}>v1.0.0 · com.altomedia.cashpop</Text>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xl },
  bgPattern: { position: 'absolute', width: '100%', height: '100%' },
  bgBinary: { position: 'absolute', fontSize: 13, fontFamily: FontFamily.number, color: Colors.accent, letterSpacing: 2 },
  logoWrap: { position: 'relative', alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.lg },
  logoGlow: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: Colors.primary,
    opacity: 0.15,
  },
  logo: { width: 160, height: 160, borderRadius: 80 },
  appName: {
    fontSize: 42,
    fontFamily: FontFamily.title,
    color: Colors.primary,
    letterSpacing: 2,
    marginBottom: 4,
  },
  tagline: { fontSize: FontSize.sm, fontFamily: FontFamily.body, color: Colors.textMuted },
  loadingBox: { width: '100%', gap: Spacing.sm, marginBottom: Spacing.xl },
  progressTrack: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 4,
    overflow: 'visible',
    position: 'relative',
  },
  progressFill: { height: '100%', borderRadius: 4, overflow: 'hidden' },
  progressShine: {
    position: 'absolute',
    top: -4,
    width: 12,
    height: 16,
    borderRadius: 6,
    backgroundColor: '#fff',
  },
  progressInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stepText: { fontSize: FontSize.xs, fontFamily: FontFamily.body, color: Colors.textMuted, flex: 1 },
  percentText: { fontSize: FontSize.md, fontFamily: FontFamily.number, color: Colors.primary },
  version: { fontSize: FontSize.xs, fontFamily: FontFamily.body, color: 'rgba(255,255,255,0.2)' },
});
