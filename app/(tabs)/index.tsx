import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/hooks/useApp';
import { MiningAnimation } from '@/components/feature/MiningAnimation';
import { Colors, Spacing, Radius, FontSize, FontWeight, FontFamily } from '@/constants/theme';
import { formatRupiah, formatHashRate, getActiveBoostersFiltered } from '@/services/gameService';
import { BOOSTERS } from '@/constants/config';

function HashDisplay({ value }: { value: string }) {
  return (
    <View style={hStyles.container}>
      {value.split('').map((char, i) => (
        <View key={i} style={hStyles.cell}>
          <Text style={hStyles.char}>{char}</Text>
        </View>
      ))}
    </View>
  );
}

const hStyles = StyleSheet.create({
  container: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 3 },
  cell: { backgroundColor: 'rgba(0,255,127,0.08)', borderRadius: 3, padding: 3, minWidth: 16, alignItems: 'center' },
  char: { fontSize: 11, fontFamily: FontFamily.number, color: Colors.accent },
});

export default function MiningScreen() {
  const { user, currentHashRate, currentMultiplier, startMining, stopMining } = useApp();
  const insets = useSafeAreaInsets();

  const [hashDisplay, setHashDisplay] = useState('000000000000000000000000');
  const [displayBalance, setDisplayBalance] = useState(0);
  const headerAnim = useRef(new Animated.Value(0)).current;
  const cardAnim = useRef(new Animated.Value(40)).current;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const HEX = '0123456789abcdef';
  const randomHash = () => Array.from({ length: 24 }, () => HEX[Math.floor(Math.random() * 16)]).join('');

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.spring(cardAnim, { toValue: 0, tension: 50, friction: 8, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    if (user.miningActive) {
      intervalRef.current = setInterval(() => {
        setHashDisplay(randomHash());
      }, 120);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setHashDisplay('000000000000000000000000');
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [user.miningActive]);

  useEffect(() => {
    setDisplayBalance(user.balance);
  }, [user.balance]);

  const now = Date.now();
  const activeBoosters = getActiveBoostersFiltered(user.activeBoosters, now);

  const toggleMining = () => {
    if (user.miningActive) stopMining();
    else startMining();
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: Colors.bg }}
      contentContainerStyle={{ paddingBottom: Spacing.lg }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <Animated.View style={{ opacity: headerAnim }}>
        <LinearGradient colors={['#0D0D30', '#07071A']} style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.appTitle}>CASHPOP</Text>
              <Text style={styles.danaNum}>{user.danaNumber}</Text>
            </View>
            <View style={styles.balanceBadge}>
              <Text style={styles.balanceLabel}>Saldo</Text>
              <Text style={styles.balanceValue}>{formatRupiah(displayBalance)}</Text>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Mining Core */}
      <Animated.View style={[styles.miningCard, { transform: [{ translateY: cardAnim }] }]}>
        <LinearGradient colors={['#10102E', '#0D1635']} style={styles.miningGrad}>
          {/* Status Bar */}
          <View style={styles.statusBar}>
            <View style={[styles.statusDot, { backgroundColor: user.miningActive ? Colors.accent : Colors.textMuted }]} />
            <Text style={[styles.statusText, { color: user.miningActive ? Colors.accent : Colors.textMuted }]}>
              {user.miningActive ? 'MINING AKTIF' : 'MINING BERHENTI'}
            </Text>
            {activeBoosters.length > 0 && (
              <View style={styles.boostBadge}>
                <MaterialIcons name="bolt" size={12} color="#000" />
                <Text style={styles.boostBadgeText}>{currentMultiplier}×</Text>
              </View>
            )}
          </View>

          {/* Orb */}
          <View style={styles.orbArea}>
            <MiningAnimation active={user.miningActive} />
          </View>

          {/* Hash Display */}
          <View style={styles.hashBox}>
            <Text style={styles.hashLabel}>HASH OUTPUT</Text>
            <HashDisplay value={hashDisplay} />
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <MaterialIcons name="speed" size={20} color={Colors.primary} />
              <Text style={styles.statValue}>{formatHashRate(currentHashRate)}</Text>
              <Text style={styles.statLabel}>Hash Rate</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <MaterialIcons name="trending-up" size={20} color={Colors.accent} />
              <Text style={styles.statValue}>{currentMultiplier}×</Text>
              <Text style={styles.statLabel}>Multiplier</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <MaterialIcons name="numbers" size={20} color={Colors.purple} />
              <Text style={styles.statValue}>{user.totalHashCount.toLocaleString('id')}</Text>
              <Text style={styles.statLabel}>Total Hash</Text>
            </View>
          </View>

          {/* Toggle Button */}
          <TouchableOpacity style={styles.mineBtn} onPress={toggleMining} activeOpacity={0.85}>
            <LinearGradient
              colors={user.miningActive ? ['#FF4757', '#CC0022'] : ['#FFD700', '#FF8C42']}
              style={styles.mineBtnGrad}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <MaterialIcons
                name={user.miningActive ? 'stop-circle' : 'play-circle-filled'}
                size={26}
                color={user.miningActive ? '#fff' : '#000'}
              />
              <Text style={[styles.mineBtnText, { color: user.miningActive ? '#fff' : '#000' }]}>
                {user.miningActive ? 'STOP MINING' : 'START MINING'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </LinearGradient>
      </Animated.View>

      {/* Active Boosters */}
      {activeBoosters.length > 0 && (
        <View style={styles.activeBoosters}>
          <Text style={styles.sectionTitle}>Booster Aktif</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
            {activeBoosters.map((ab) => {
              const bDef = BOOSTERS.find((b) => b.id === ab.boosterId);
              const remaining = Math.max(0, ab.expiresAt - Date.now());
              const hours = Math.floor(remaining / 3600000);
              const mins = Math.floor((remaining % 3600000) / 60000);
              return (
                <View key={ab.id} style={styles.activeBoosterChip}>
                  <MaterialIcons name={bDef?.icon as any || 'bolt'} size={14} color={bDef?.color || Colors.primary} />
                  <Text style={styles.activeBoosterName}>{bDef?.name || 'Booster'}</Text>
                  <Text style={styles.activeBoosterTime}>{hours}j {mins}m</Text>
                </View>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Summary Cards */}
      <View style={styles.summaryGrid}>
        {[
          { label: 'Total Penghasilan', value: formatRupiah(user.totalEarned), icon: 'payments', color: Colors.primary },
          { label: 'Video Ditonton', value: `${user.totalAdsWatched}/350`, icon: 'ondemand-video', color: Colors.accent },
          { label: 'Referral', value: `${user.referralCount} orang`, icon: 'group-add', color: Colors.purple },
          { label: 'Kode Referral', value: `#${user.referralCode}`, icon: 'qr-code', color: Colors.pink },
        ].map((item) => (
          <View key={item.label} style={styles.summaryCard}>
            <LinearGradient colors={['#10102E', '#161640']} style={styles.summaryGrad}>
              <MaterialIcons name={item.icon as any} size={22} color={item.color} />
              <Text style={[styles.summaryValue, { color: item.color }]}>{item.value}</Text>
              <Text style={styles.summaryLabel}>{item.label}</Text>
            </LinearGradient>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.md },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  appTitle: { fontSize: 26, fontFamily: FontFamily.title, color: Colors.primary, letterSpacing: 3 },
  danaNum: { fontSize: FontSize.sm, fontFamily: FontFamily.body, color: Colors.textMuted, marginTop: 2 },
  balanceBadge: { alignItems: 'flex-end', backgroundColor: 'rgba(255,215,0,0.08)', borderRadius: Radius.md, padding: 10, borderWidth: 1, borderColor: 'rgba(255,215,0,0.2)' },
  balanceLabel: { fontSize: FontSize.xs, fontFamily: FontFamily.body, color: Colors.textMuted },
  balanceValue: { fontSize: FontSize.lg, fontFamily: FontFamily.number, color: Colors.primary },
  miningCard: { margin: Spacing.md, borderRadius: Radius.xl, overflow: 'hidden' },
  miningGrad: { padding: Spacing.lg, borderRadius: Radius.xl, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  statusBar: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: Spacing.md },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: FontSize.sm, fontFamily: FontFamily.button, letterSpacing: 1.5 },
  boostBadge: { backgroundColor: Colors.primary, borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 3, flexDirection: 'row', alignItems: 'center', gap: 2, marginLeft: 'auto' },
  boostBadgeText: { fontSize: FontSize.xs, fontFamily: FontFamily.number, color: '#000' },
  orbArea: { marginVertical: Spacing.md },
  hashBox: { backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.md, width: '100%', borderWidth: 1, borderColor: 'rgba(0,255,127,0.15)' },
  hashLabel: { fontSize: FontSize.xs, fontFamily: FontFamily.body, color: Colors.textMuted, letterSpacing: 2, marginBottom: 8, textAlign: 'center' },
  statsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.lg, width: '100%' },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statDivider: { width: 1, height: 40, backgroundColor: Colors.border },
  statValue: { fontSize: FontSize.md, fontFamily: FontFamily.number, color: Colors.textPrimary },
  statLabel: { fontSize: FontSize.xs, fontFamily: FontFamily.body, color: Colors.textMuted },
  mineBtn: { width: '100%', borderRadius: Radius.lg, overflow: 'hidden' },
  mineBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 18 },
  mineBtnText: { fontSize: FontSize.lg, fontFamily: FontFamily.button, letterSpacing: 1.5 },
  activeBoosters: { paddingHorizontal: Spacing.md, marginBottom: Spacing.md },
  sectionTitle: { fontSize: FontSize.md, fontFamily: FontFamily.bodySemibold, color: Colors.textSecondary },
  activeBoosterChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,215,0,0.1)', borderRadius: Radius.full, paddingHorizontal: 12, paddingVertical: 8, marginRight: 8, borderWidth: 1, borderColor: 'rgba(255,215,0,0.2)' },
  activeBoosterName: { fontSize: FontSize.sm, fontFamily: FontFamily.bodyMedium, color: Colors.textPrimary },
  activeBoosterTime: { fontSize: FontSize.xs, fontFamily: FontFamily.number, color: Colors.primary },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: Spacing.md, gap: Spacing.sm },
  summaryCard: { width: '47.5%', borderRadius: Radius.lg, overflow: 'hidden' },
  summaryGrad: { padding: Spacing.md, borderRadius: Radius.lg, gap: 6, borderWidth: 1, borderColor: Colors.border },
  summaryValue: { fontSize: FontSize.md, fontFamily: FontFamily.number },
  summaryLabel: { fontSize: FontSize.xs, fontFamily: FontFamily.body, color: Colors.textMuted },
});
