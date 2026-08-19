import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Animated,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/hooks/useApp';
import { useAlert } from '@/template';
import { SpinWheel } from '@/components/feature/SpinWheel';
import { Colors, Spacing, Radius, FontSize, FontFamily } from '@/constants/theme';
import { canCheckin, canSpin, getTodayString, formatRupiah, calculateStreak, getStreakReward } from '@/services/gameService';
import { SPIN_PRIZES, ADS_REWARD, ADS_DAILY_LIMIT, REFERRAL_REWARD, REFERRAL_DAILY_LIMIT, CHECKIN_REWARD, STREAK_REWARDS, PLAYSTORE_BASE_URL } from '@/constants/config';

function AdModal({ visible, onFinish }: { visible: boolean; onFinish: () => void }) {
  const prog = useRef(new Animated.Value(0)).current;
  const [seconds, setSeconds] = useState(5);

  useEffect(() => {
    if (!visible) return;
    setSeconds(5);
    prog.setValue(0);
    Animated.timing(prog, { toValue: 1, duration: 5000, useNativeDriver: false }).start();
    const t = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) { clearInterval(t); return 0; }
        return s - 1;
      });
    }, 1000);
    const auto = setTimeout(onFinish, 5100);
    return () => { clearInterval(t); clearTimeout(auto); };
  }, [visible]);

  const barWidth = prog.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={adStyles.overlay}>
        <View style={adStyles.card}>
          <LinearGradient colors={['#10102E', '#0D1635']} style={adStyles.inner}>
            <View style={adStyles.adBox}>
              <MaterialIcons name="play-circle-filled" size={52} color={Colors.primary} />
              <Text style={adStyles.title}>Menunggu...</Text>
              <Text style={adStyles.sub}>Selesaikan untuk klaim reward</Text>
            </View>
            <View style={adStyles.progBar}>
              <Animated.View style={[adStyles.progFill, { width: barWidth }]} />
            </View>
            <Text style={adStyles.timer}>{seconds > 0 ? `${seconds}s` : 'Selesai!'}</Text>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
}

const adStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  card: { width: '100%', borderRadius: Radius.xl, overflow: 'hidden' },
  inner: { padding: Spacing.xl, alignItems: 'center', borderRadius: Radius.xl, borderWidth: 1, borderColor: Colors.border },
  adBox: { width: '100%', height: 160, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: Spacing.lg },
  title: { fontSize: FontSize.lg, fontFamily: FontFamily.bodySemibold, color: Colors.textPrimary },
  sub: { fontSize: FontSize.sm, fontFamily: FontFamily.body, color: Colors.textMuted },
  progBar: { width: '100%', height: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden', marginBottom: 8 },
  progFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 3 },
  timer: { fontSize: FontSize.lg, fontFamily: FontFamily.number, color: Colors.primary },
});

// Streak fire animation component
function StreakBadge({ streak }: { streak: number }) {
  const fireAnim = useRef(new Animated.Value(1)).current;
  const bounceAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(fireAnim, { toValue: 1.15, duration: 600, useNativeDriver: true }),
        Animated.timing(fireAnim, { toValue: 0.9, duration: 600, useNativeDriver: true }),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.spring(bounceAnim, { toValue: 1.05, tension: 200, friction: 5, useNativeDriver: true }),
        Animated.spring(bounceAnim, { toValue: 1, tension: 200, friction: 5, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const streakColor = streak >= 30 ? '#FFD700' : streak >= 7 ? '#FF8C42' : streak >= 3 ? '#FF6B9D' : '#4ECDC4';

  return (
    <Animated.View style={[streakStyles.wrap, { transform: [{ scale: bounceAnim }] }]}>
      <LinearGradient colors={[streakColor + '33', streakColor + '11']} style={streakStyles.inner}>
        <Animated.View style={{ transform: [{ scale: fireAnim }] }}>
          <MaterialIcons name="local-fire-department" size={22} color={streakColor} />
        </Animated.View>
        <View>
          <Text style={[streakStyles.count, { color: streakColor }]}>{streak}</Text>
          <Text style={streakStyles.label}>hari</Text>
        </View>
        <View style={streakStyles.milestoneList}>
          {STREAK_REWARDS.map((m) => (
            <View key={m.days} style={[streakStyles.milestone, streak >= m.days && { backgroundColor: streakColor + '33' }]}>
              <Text style={[streakStyles.mDay, { color: streak >= m.days ? streakColor : Colors.textMuted }]}>{m.days}h</Text>
            </View>
          ))}
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

const streakStyles = StyleSheet.create({
  wrap: { borderRadius: Radius.lg, overflow: 'hidden', marginBottom: Spacing.md },
  inner: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.md, borderRadius: Radius.lg, borderWidth: 1, borderColor: 'rgba(255,140,66,0.3)' },
  count: { fontSize: 28, fontFamily: FontFamily.title, lineHeight: 32 },
  label: { fontSize: FontSize.xs, fontFamily: FontFamily.body, color: Colors.textMuted },
  milestoneList: { flexDirection: 'row', gap: 4, flexWrap: 'wrap', flex: 1, justifyContent: 'flex-end' },
  milestone: { borderRadius: 4, paddingHorizontal: 6, paddingVertical: 3, backgroundColor: 'rgba(255,255,255,0.06)' },
  mDay: { fontSize: FontSize.xs, fontFamily: FontFamily.number },
});

export default function TasksScreen() {
  const { user, claimCheckin, claimSpin, watchAd, addReferral } = useApp();
  const { showAlert } = useAlert();
  const insets = useSafeAreaInsets();

  const [showSpin, setShowSpin] = useState(false);
  const [showAd, setShowAd] = useState(false);
  const [adPurpose, setAdPurpose] = useState<'task' | 'checkin'>('task');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const checkinPulse = useRef(new Animated.Value(1)).current;

  const today = getTodayString();
  const todayAds = user.todayAdsDate === today ? user.todayAdsCount : 0;
  const adsLeft = ADS_DAILY_LIMIT - todayAds;
  const checkinDone = !canCheckin(user.lastCheckinDate);
  const spinDone = !canSpin(user.lastSpinDate);

  // Calculate next streak reward
  const nextStreak = calculateStreak(user.checkinStreak, user.lastStreakDate);
  const checkinReward = getStreakReward(checkinDone ? user.checkinStreak : nextStreak);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 9, useNativeDriver: true }),
    ]).start();

    if (!checkinDone) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(checkinPulse, { toValue: 1.03, duration: 900, useNativeDriver: true }),
          Animated.timing(checkinPulse, { toValue: 1, duration: 900, useNativeDriver: true }),
        ])
      ).start();
    }
  }, []);

  const handleCheckin = () => {
    if (checkinDone) { showAlert('Sudah Check-in', 'Kamu sudah check-in hari ini. Coba lagi besok!'); return; }
    setAdPurpose('checkin');
    setShowAd(true);
  };

  const handleAdFinish = async () => {
    setShowAd(false);
    if (adPurpose === 'checkin') {
      const reward = await claimCheckin();
      showAlert('Check-in Berhasil!', `Kamu mendapat ${formatRupiah(reward)}`);
    } else {
      if (adsLeft <= 0) { showAlert('Batas Tercapai', `Kamu sudah menyelesaikan ${ADS_DAILY_LIMIT}x aktivitas hari ini`); return; }
      const reward = await watchAd();
      showAlert('Reward Diklaim!', `+${formatRupiah(reward)} (${todayAds + 1}/${ADS_DAILY_LIMIT})`);
    }
  };

  const handleWatchAd = () => {
    if (adsLeft <= 0) { showAlert('Batas Tercapai', `Kamu sudah menyelesaikan ${ADS_DAILY_LIMIT}x aktivitas hari ini`); return; }
    setAdPurpose('task');
    setShowAd(true);
  };

  const handleSpin = async (prizeIndex: number) => {
    const prize = SPIN_PRIZES[prizeIndex];
    await claimSpin(prize.value, prize.type, prize.value);
    setTimeout(() => {
      showAlert(
        'Selamat!',
        prize.type === 'cash' ? `Kamu mendapat ${prize.label}!` : `Kamu mendapat ${prize.label} Booster!`,
        [{ text: 'Oke', onPress: () => setShowSpin(false) }]
      );
    }, 600);
  };

  const handleReferral = async () => {
    if (user.referralCount >= REFERRAL_DAILY_LIMIT) {
      showAlert('Batas Tercapai', 'Kamu sudah mencapai batas 10 referral hari ini');
      return;
    }
    const referralUrl = `${PLAYSTORE_BASE_URL}${user.referralCode}`;
    showAlert(
      'Referral',
      `Bagikan link ini ke teman:\n${referralUrl}`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Klaim +Rp500',
          onPress: async () => {
            const r = await addReferral();
            showAlert('Referral Diklaim!', `+${formatRupiah(r)} dari referral valid`);
          },
        },
      ]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 16, paddingBottom: Spacing.xxl }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          {/* Header */}
          <View style={styles.pageHeader}>
            <Text style={styles.pageTitle}>Tugas Harian</Text>
            <Text style={styles.pageSubtitle}>Selesaikan tugas untuk mendapatkan bonus</Text>
          </View>

          {/* Streak Badge */}
          {user.checkinStreak > 0 && <StreakBadge streak={user.checkinStreak} />}

          {/* Top row: Check-in + Spin side by side */}
          <View style={styles.topRow}>
            {/* Check-in */}
            <Animated.View style={[{ flex: 1 }, { transform: [{ scale: checkinPulse }] }]}>
              <TouchableOpacity style={styles.miniCard} onPress={handleCheckin} activeOpacity={0.85}>
                <LinearGradient
                  colors={checkinDone ? ['#1A1A3A', '#1A1A3A'] : ['#0F2A1A', '#0D3525']}
                  style={styles.miniCardGrad}
                >
                  <View style={[styles.miniIcon, { backgroundColor: checkinDone ? 'rgba(100,100,100,0.2)' : 'rgba(0,255,127,0.15)' }]}>
                    <MaterialIcons name="event-available" size={22} color={checkinDone ? Colors.textMuted : Colors.accent} />
                  </View>
                  <Text style={styles.miniTitle}>Check-in</Text>
                  <Text style={[styles.miniReward, { color: checkinDone ? Colors.textMuted : Colors.accent }]}>
                    +{formatRupiah(checkinReward)}
                  </Text>
                  <Text style={[styles.miniStatus, { color: checkinDone ? Colors.textMuted : Colors.accent }]}>
                    {checkinDone ? 'Sudah klaim' : 'Tap klaim'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>

            {/* Spin */}
            <TouchableOpacity style={{ flex: 1 }} onPress={() => setShowSpin(true)} activeOpacity={0.85}>
              <LinearGradient
                colors={spinDone ? ['#1A1A3A', '#1A1A3A'] : ['#1A0F2E', '#2D1B69']}
                style={styles.miniCardGrad}
              >
                <View style={[styles.miniIcon, { backgroundColor: spinDone ? 'rgba(100,100,100,0.2)' : 'rgba(139,92,246,0.2)' }]}>
                  <MaterialIcons name="casino" size={22} color={spinDone ? Colors.textMuted : Colors.purple} />
                </View>
                <Text style={styles.miniTitle}>Spin</Text>
                <Text style={[styles.miniReward, { color: spinDone ? Colors.textMuted : Colors.purpleLight }]}>
                  s/d Rp1.000
                </Text>
                <Text style={[styles.miniStatus, { color: spinDone ? Colors.textMuted : Colors.purpleLight }]}>
                  {spinDone ? 'Sudah diputar' : 'Tap putar'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Daily Tasks label */}
          <Text style={[styles.sectionTitle, { marginTop: Spacing.md }]}>Tugas Harian</Text>

          {/* Task Cards 2x grid */}
          <View style={styles.taskGrid}>
            {/* Watch Task */}
            <TouchableOpacity
              style={[styles.taskMiniCard, adsLeft <= 0 && styles.taskMiniCardDone]}
              onPress={handleWatchAd}
              disabled={adsLeft <= 0}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={adsLeft > 0 ? ['#1A1400', '#2A1E00'] : ['#1A1A3A', '#1A1A3A']}
                style={styles.taskMiniGrad}
              >
                <View style={[styles.taskMiniIcon, { backgroundColor: adsLeft > 0 ? 'rgba(255,215,0,0.15)' : 'rgba(100,100,100,0.1)' }]}>
                  <MaterialIcons name="monetization-on" size={22} color={adsLeft > 0 ? Colors.primary : Colors.textMuted} />
                </View>
                <Text style={[styles.taskMiniTitle, { color: adsLeft > 0 ? Colors.textPrimary : Colors.textMuted }]}>
                  Aktivitas Harian
                </Text>
                <Text style={[styles.taskMiniReward, { color: adsLeft > 0 ? Colors.primary : Colors.textMuted }]}>
                  +{formatRupiah(ADS_REWARD)}/x
                </Text>
                <View style={styles.taskMiniProgRow}>
                  <View style={styles.taskMiniProgBar}>
                    <View style={[styles.taskMiniProgFill, { width: `${(todayAds / ADS_DAILY_LIMIT) * 100}%`, backgroundColor: adsLeft > 0 ? Colors.primary : Colors.textMuted }]} />
                  </View>
                  <Text style={[styles.taskMiniProgText, { color: adsLeft > 0 ? Colors.primary : Colors.textMuted }]}>
                    {todayAds}/{ADS_DAILY_LIMIT}
                  </Text>
                </View>
                <Text style={[styles.taskMiniStatus, { color: adsLeft > 0 ? Colors.accent : Colors.textMuted }]}>
                  {adsLeft > 0 ? `Sisa ${adsLeft}x` : 'Selesai hari ini'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Referral Task */}
            <TouchableOpacity style={styles.taskMiniCard} onPress={handleReferral} activeOpacity={0.85}>
              <LinearGradient colors={['#001A0F', '#002515']} style={styles.taskMiniGrad}>
                <View style={[styles.taskMiniIcon, { backgroundColor: 'rgba(0,255,127,0.15)' }]}>
                  <MaterialIcons name="group-add" size={22} color={Colors.accent} />
                </View>
                <Text style={styles.taskMiniTitle}>Undang Teman</Text>
                <Text style={[styles.taskMiniReward, { color: Colors.accent }]}>
                  +{formatRupiah(REFERRAL_REWARD)}/org
                </Text>
                <View style={styles.taskMiniProgRow}>
                  <View style={styles.taskMiniProgBar}>
                    <View style={[styles.taskMiniProgFill, { width: `${(user.referralCount / REFERRAL_DAILY_LIMIT) * 100}%`, backgroundColor: Colors.accent }]} />
                  </View>
                  <Text style={[styles.taskMiniProgText, { color: Colors.accent }]}>
                    {user.referralCount}/{REFERRAL_DAILY_LIMIT}
                  </Text>
                </View>
                <Text style={[styles.taskMiniStatus, { color: Colors.accent }]}>
                  Kode: #{user.referralCode}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Syarat Penarikan info */}
          <View style={styles.infoCard}>
            <MaterialIcons name="info-outline" size={18} color={Colors.info} />
            <Text style={styles.infoText}>
              Total aktivitas: <Text style={{ fontFamily: FontFamily.number, color: Colors.primary }}>{user.totalAdsWatched}/350</Text> — Syarat untuk penarikan
            </Text>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Spin Wheel Modal */}
      <Modal visible={showSpin} transparent animationType="slide">
        <View style={styles.spinOverlay}>
          <View style={styles.spinModal}>
            <LinearGradient colors={['#0D0D30', '#07071A']} style={styles.spinModalInner}>
              <View style={styles.spinModalHeader}>
                <Text style={styles.spinModalTitle}>Spin Roda</Text>
                <TouchableOpacity onPress={() => setShowSpin(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <MaterialIcons name="close" size={24} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>
              <SpinWheel onSpin={handleSpin} canSpin={!spinDone} />
            </LinearGradient>
          </View>
        </View>
      </Modal>

      {/* Ad Modal */}
      <AdModal visible={showAd} onFinish={handleAdFinish} />
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: Spacing.md, gap: Spacing.sm },
  pageHeader: { marginBottom: Spacing.xs },
  pageTitle: { fontSize: FontSize.xxl, fontFamily: FontFamily.title, color: Colors.textPrimary },
  pageSubtitle: { fontSize: FontSize.sm, fontFamily: FontFamily.body, color: Colors.textMuted, marginTop: 4 },

  topRow: { flexDirection: 'row', gap: Spacing.sm },
  miniCard: { flex: 1, borderRadius: Radius.lg, overflow: 'hidden' },
  miniCardGrad: { padding: Spacing.md, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', gap: 6, minHeight: 140 },
  miniIcon: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  miniTitle: { fontSize: FontSize.sm, fontFamily: FontFamily.bodySemibold, color: Colors.textPrimary },
  miniReward: { fontSize: FontSize.lg, fontFamily: FontFamily.number },
  miniStatus: { fontSize: FontSize.xs, fontFamily: FontFamily.body },

  sectionTitle: { fontSize: FontSize.md, fontFamily: FontFamily.bodySemibold, color: Colors.textSecondary },

  taskGrid: { flexDirection: 'row', gap: Spacing.sm },
  taskMiniCard: { flex: 1, borderRadius: Radius.lg, overflow: 'hidden' },
  taskMiniCardDone: { opacity: 0.65 },
  taskMiniGrad: { padding: Spacing.md, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, gap: 6 },
  taskMiniIcon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  taskMiniTitle: { fontSize: FontSize.sm, fontFamily: FontFamily.bodySemibold, color: Colors.textPrimary },
  taskMiniReward: { fontSize: FontSize.md, fontFamily: FontFamily.number },
  taskMiniProgRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  taskMiniProgBar: { flex: 1, height: 5, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' },
  taskMiniProgFill: { height: '100%', borderRadius: 3 },
  taskMiniProgText: { fontSize: FontSize.xs, fontFamily: FontFamily.number },
  taskMiniStatus: { fontSize: FontSize.xs, fontFamily: FontFamily.body },

  infoCard: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(78,205,196,0.08)', borderRadius: Radius.md, padding: Spacing.md, borderWidth: 1, borderColor: 'rgba(78,205,196,0.2)', marginTop: Spacing.xs },
  infoText: { flex: 1, fontSize: FontSize.sm, fontFamily: FontFamily.body, color: Colors.textSecondary },

  spinOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'flex-end' },
  spinModal: { borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, overflow: 'hidden' },
  spinModalInner: { padding: Spacing.lg, paddingBottom: Spacing.xxl, alignItems: 'center', gap: Spacing.md, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, borderWidth: 1, borderColor: Colors.border },
  spinModalHeader: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  spinModalTitle: { fontSize: FontSize.xl, fontFamily: FontFamily.title, color: Colors.primary },
});
