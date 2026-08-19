import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
  Image,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/hooks/useApp';
import { useAlert } from '@/template';
import { Colors, Spacing, Radius, FontSize, FontFamily } from '@/constants/theme';
import { ScrollView, TextInput, KeyboardAvoidingView, Platform } from 'react-native';

export default function OnboardingScreen() {
  const { setupUser } = useApp();
  const { showAlert } = useAlert();
  const router = useRouter();
  const params = useLocalSearchParams<{ ref?: string }>();
  const insets = useSafeAreaInsets();

  const [danaNumber, setDanaNumber] = useState('');
  const [loading, setLoading] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 8, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.06, duration: 1400, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1400, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.timing(rotateAnim, { toValue: 1, duration: 12000, easing: Easing.linear, useNativeDriver: true })
    ).start();
  }, []);

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const handleStart = async () => {
    const cleaned = danaNumber.replace(/\D/g, '');
    if (cleaned.length < 10) {
      showAlert('Format Salah', 'Masukkan nomor DANA yang valid (min 10 digit)');
      return;
    }
    setLoading(true);
    await setupUser(cleaned, params.ref);
    router.replace('/(tabs)');
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <LinearGradient colors={['#07071A', '#0D0D30', '#07071A']} style={styles.container}>
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Logo area */}
          <Animated.View style={[styles.heroArea, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <Animated.View style={[styles.orb, { transform: [{ scale: pulseAnim }] }]}>
              <Animated.View style={[styles.orbRing, { transform: [{ rotate: rotateInterpolate }] }]}>
                <LinearGradient
                  colors={['#FFD700', '#FF8C42', '#8B5CF6', '#00FF7F']}
                  style={styles.orbRingGrad}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                />
              </Animated.View>
              <Image
                source={require('@/assets/images/icon.png')}
                style={styles.logoImg}
                resizeMode="contain"
              />
            </Animated.View>

            <Text style={styles.appName}>CashPoP</Text>
            <Text style={styles.tagline}>Mining Saldo DANA Otomatis</Text>

            <View style={styles.pills}>
              {['Mining 24/7', 'Tarik ke DANA', 'Spin Harian'].map((f) => (
                <View key={f} style={styles.pill}>
                  <MaterialIcons name="check-circle" size={12} color={Colors.accent} />
                  <Text style={styles.pillText}>{f}</Text>
                </View>
              ))}
            </View>
          </Animated.View>

          {/* Form */}
          <Animated.View style={[styles.formCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <LinearGradient colors={['#10102E', '#161640']} style={styles.formGrad}>
              <Text style={styles.formTitle}>Mulai Sekarang</Text>
              <Text style={styles.formSub}>Masukkan nomor DANA kamu</Text>

              <View style={styles.inputWrapper}>
                <MaterialIcons name="account-balance-wallet" size={20} color={Colors.primary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Contoh: 08123456789"
                  placeholderTextColor={Colors.textMuted}
                  value={danaNumber}
                  onChangeText={setDanaNumber}
                  keyboardType="phone-pad"
                  maxLength={16}
                />
              </View>

              {params.ref ? (
                <View style={styles.refBadge}>
                  <MaterialIcons name="person-add" size={14} color={Colors.accent} />
                  <Text style={styles.refText}>Referral: #{params.ref}</Text>
                </View>
              ) : null}

              <View style={styles.btnWrap}>
                <TouchableOpacity
                  style={[styles.startBtn, loading && { opacity: 0.7 }]}
                  onPress={handleStart}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  <LinearGradient colors={['#FFD700', '#FF8C42']} style={styles.startGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                    <MaterialIcons name={loading ? 'hourglass-top' : 'rocket-launch'} size={20} color="#000" />
                    <Text style={styles.startText}>{loading ? 'Memulai...' : 'MULAI SEKARANG'}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              <Text style={styles.disclaimer}>
                Dengan melanjutkan, kamu menyetujui Syarat & Ketentuan CashPoP
              </Text>
            </LinearGradient>
          </Animated.View>

          {/* Stats preview */}
          <Animated.View style={[styles.statsRow, { opacity: fadeAnim }]}>
            {[
              { label: 'Pengguna Aktif', value: '128K+' },
              { label: 'Total Dibayar', value: 'Rp2.4M' },
              { label: 'Rating', value: '4.8★' },
            ].map((s) => (
              <View key={s.label} style={styles.statItem}>
                <Text style={styles.statValue}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </Animated.View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { alignItems: 'center', paddingHorizontal: Spacing.md },
  heroArea: { alignItems: 'center', marginBottom: Spacing.xl },
  orb: { marginBottom: Spacing.lg, position: 'relative', alignItems: 'center', justifyContent: 'center', width: 140, height: 140 },
  orbRing: { position: 'absolute', width: 140, height: 140, borderRadius: 70, overflow: 'hidden' },
  orbRingGrad: { flex: 1, opacity: 0.3 },
  logoImg: { width: 120, height: 120, borderRadius: 60 },
  appName: {
    fontSize: 40,
    fontFamily: FontFamily.title,
    color: Colors.primary,
    letterSpacing: 2,
    marginBottom: 8,
  },
  tagline: { fontSize: FontSize.md, fontFamily: FontFamily.bodyMedium, color: Colors.textSecondary, marginBottom: Spacing.md },
  pills: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,255,127,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(0,255,127,0.3)',
  },
  pillText: { fontSize: FontSize.xs, fontFamily: FontFamily.bodyMedium, color: Colors.accent },
  formCard: { width: '100%', borderRadius: Radius.xl, overflow: 'hidden', marginBottom: Spacing.xl },
  formGrad: { padding: Spacing.lg, borderRadius: Radius.xl, borderWidth: 1, borderColor: Colors.border, gap: Spacing.sm },
  formTitle: { fontSize: FontSize.xl, fontFamily: FontFamily.bodySemibold, color: Colors.textPrimary },
  formSub: { fontSize: FontSize.sm, fontFamily: FontFamily.body, color: Colors.textSecondary },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.xs,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, height: 52, color: Colors.textPrimary, fontSize: FontSize.base, fontFamily: FontFamily.body },
  refBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,255,127,0.1)',
    borderRadius: Radius.sm,
    padding: 10,
  },
  refText: { fontSize: FontSize.sm, fontFamily: FontFamily.bodyMedium, color: Colors.accent },
  btnWrap: { marginTop: Spacing.xs },
  startBtn: { borderRadius: Radius.md, overflow: 'hidden' },
  startGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16 },
  startText: { fontSize: FontSize.lg, fontFamily: FontFamily.button, color: '#000', letterSpacing: 1 },
  disclaimer: { fontSize: FontSize.xs, fontFamily: FontFamily.body, color: Colors.textMuted, textAlign: 'center' },
  statsRow: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.md },
  statItem: { flex: 1, alignItems: 'center', backgroundColor: Colors.bgCard, borderRadius: Radius.md, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  statValue: { fontSize: FontSize.lg, fontFamily: FontFamily.number, color: Colors.primary, marginBottom: 4 },
  statLabel: { fontSize: FontSize.xs, fontFamily: FontFamily.body, color: Colors.textMuted, textAlign: 'center' },
});
