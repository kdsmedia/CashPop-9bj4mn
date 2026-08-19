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
import { canCheckin, canSpin, getTodayString, formatRupiah } from '@/services/gameService';
import { SPIN_PRIZES, ADS_REWARD, ADS_DAILY_LIMIT, REFERRAL_REWARD, REFERRAL_DAILY_LIMIT, CHECKIN_REWARD } from '@/constants/config';

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
              <Text style={adStyles.title}>Menonton Video</Text>
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
  const spinBannerScale = useRef(new Animated.Value(1)).current;

  const today = getTodayString();
  const todayAds = user.todayAdsDate === today ? user.todayAdsCount : 0;
  const adsLeft = ADS_DAILY_LIMIT - todayAds;
  const checkinDone = !canCheckin(user.lastCheckinDate);
  const spinDone = !canSpin(user.lastSpinDate);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 9, useNativeDriver: true }),
    ]).start();

    if (!checkinDone) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(checkinPulse, { toValue: 1.04, duration: 900, useNativeDriver: true }),
          Animated.timing(checkinPulse, { toValue: 1, duration: 900, useNativeDriver: true }),
        ])
      ).start();
    }

    Animated.loop(
      Animated.sequence([
        Animated.timing(spinBannerScale, { toValue: 1.02, duration: 1200, useNativeDriver: true }),
        Animated.timing(spinBannerScale, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ])
    ).start();
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
      if (adsLeft <= 0) { showAlert('Batas Tercapai', `Kamu sudah menonton ${ADS_DAILY_LIMIT}x video hari ini`); return; }
      const reward = await watchAd();
      showAlert('Reward Diklaim!', `+${formatRupiah(reward)} (${todayAds + 1}/${ADS_DAILY_LIMIT})`);
    }
  };

  const handleWatchAd = () => {
    if (adsLeft <= 0) { showAlert('Batas Tercapai', `Kamu sudah menonton ${ADS_DAILY_LIMIT}x video hari ini`); return; }
    setAdPurpose('task');
    setShowAd(true);
  };

  const handleSpin = async (prizeIndex: number) => {
    const prize = SPIN_PRIZES[prizeIndex];
    await claimSpin(prize.value, prize.type, prize.value);
    setTimeout(() => {
      showAlert(
        'Selamat!',
        prize.type === 'cash'
          ? `Kamu mendapat ${prize.label}!`
          : `Kamu mendapat ${prize.label} Booster!`,
        [{ text: 'Oke', onPress: () => setShowSpin(false) }]
      );
    }, 600);
  };

  const handleReferral = async () => {
    if (user.referralCount >= REFERRAL_DAILY_LIMIT) {
      showAlert('Batas Tercapai', 'Kamu sudah mencapai batas 10 referral hari ini');
      return;
    }
    showAlert(
      'Simulasi Referral',
      'Di produksi, link referral dikirim ke teman. Mensimulasikan referral berhasil.',
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

          {/* Check-in Banner */}
          <Animated.View style={{ transform: [{ scale: checkinPulse }] }}>
            <TouchableOpacity style={styles.checkinCard} onPress={handleCheckin} activeOpacity={0.85}>
              <LinearGradient
                colors={checkinDone ? ['#1A1A3A', '#1A1A3A'] : ['#0F2A1A', '#0D3525']}
                style={styles.checkinGrad}
              >
                <View style={[styles.checkinIcon, { backgroundColor: checkinDone ? 'rgba(100,100,100,0.2)' : 'rgba(0,255,127,0.15)' }]}>
                  <MaterialIcons name="event-available" size={28} color={checkinDone ? Colors.textMuted : Colors.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.checkinTitle}>Check-in Harian</Text>
                  <Text style={styles.checkinReward}>+{formatRupiah(CHECKIN_REWARD)}</Text>
                  <Text style={[styles.checkinStatus, { color: checkinDone ? Colors.textMuted : Colors.accent }]}>
                    {checkinDone ? 'Sudah diklaim hari ini' : 'Tap untuk menonton & klaim'}
                  </Text>
                </View>
                {!checkinDone && <MaterialIcons name="chevron-right" size={24} color={Colors.accent} />}
                {checkinDone && <MaterialIcons name="check-circle" size={24} color={Colors.textMuted} />}
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          {/* Spin Wheel Banner */}
          <TouchableOpacity
            style={styles.spinBanner}
            onPress={() => setShowSpin(true)}
            activeOpacity={0.85}
          >
            <Animated.View style={{ transform: [{ scale: spinBannerScale }] }}>
              <LinearGradient
                colors={spinDone ? ['#1A1A3A', '#1A1A3A'] : ['#1A0F2E', '#2D1B69']}
                style={styles.spinBannerGrad}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              >
                <View style={[styles.spinIcon, { backgroundColor: spinDone ? 'rgba(100,100,100,0.2)' : 'rgba(139,92,246,0.2)' }]}>
                  <MaterialIcons name="casino" size={28} color={spinDone ? Colors.textMuted : Colors.purple} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.spinBannerTitle}>Spin Harian</Text>
                  <Text style={styles.spinBannerSub}>Rp50 – Rp1.000 + Bonus Booster</Text>
                  <Text style={[styles.spinBannerStatus, { color: spinDone ? Colors.textMuted : Colors.purpleLight }]}>
                    {spinDone ? 'Sudah diputar hari ini' : 'Tap untuk memutar roda'}
                  </Text>
                </View>
                {!spinDone && <MaterialIcons name="chevron-right" size={24} color={Colors.purpleLight} />}
                {spinDone && <MaterialIcons name="check-circle" size={24} color={Colors.textMuted} />}
              </LinearGradient>
            </Animated.View>
          </TouchableOpacity>

          {/* Daily Tasks */}
          <Text style={styles.sectionTitle}>Tugas Harian</Text>

          {/* Watch Video Task */}
          <View style={styles.taskCard}>
            <LinearGradient colors={['#10102E', '#161640']} style={styles.taskGrad}>
              <View style={styles.taskHeader}>
                <View style={[styles.taskIcon, { backgroundColor: 'rgba(255,215,0,0.1)' }]}>
                  <MaterialIcons name="play-circle" size={24} color={Colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.taskTitle}>Video Harian</Text>
                  <Text style={styles.taskDesc}>{formatRupiah(ADS_REWARD)}/video · Maks {ADS_DAILY_LIMIT}× per hari</Text>
                </View>
                <View style={styles.taskProgress}>
                  <Text style={styles.taskProgressText}>{todayAds}/{ADS_DAILY_LIMIT}</Text>
                </View>
              </View>

              <View style={styles.progBarOuter}>
                <View style={[styles.progBarInner, { width: `${(todayAds / ADS_DAILY_LIMIT) * 100}%` }]} />
              </View>
              <Text style={styles.taskEarned}>+{formatRupiah(todayAds * ADS_REWARD)} hari ini</Text>

              <TouchableOpacity
                style={[styles.taskBtn, adsLeft <= 0 && styles.taskBtnDisabled]}
                onPress={handleWatchAd}
                disabled={adsLeft <= 0}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={adsLeft > 0 ? ['#FFD700', '#FF8C42'] : ['#333', '#444']}
                  style={styles.taskBtnGrad}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                >
                  <MaterialIcons name={adsLeft > 0 ? 'play-arrow' : 'check'} size={18} color={adsLeft > 0 ? '#000' : '#888'} />
                  <Text style={[styles.taskBtnText, { color: adsLeft > 0 ? '#000' : '#888' }]}>
                    {adsLeft > 0 ? `Tonton (+${formatRupiah(ADS_REWARD)})` : 'Selesai Hari Ini'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>
          </View>

          {/* Referral Task */}
          <View style={styles.taskCard}>
            <LinearGradient colors={['#10102E', '#161640']} style={styles.taskGrad}>
              <View style={styles.taskHeader}>
                <View style={[styles.taskIcon, { backgroundColor: 'rgba(0,255,127,0.1)' }]}>
                  <MaterialIcons name="group-add" size={24} color={Colors.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.taskTitle}>Undang Teman</Text>
                  <Text style={styles.taskDesc}>{formatRupiah(REFERRAL_REWARD)}/referral valid · Maks {REFERRAL_DAILY_LIMIT}× per hari</Text>
                </View>
                <View style={[styles.taskProgress, { backgroundColor: 'rgba(0,255,127,0.1)' }]}>
                  <Text style={[styles.taskProgressText, { color: Colors.accent }]}>{user.referralCount}</Text>
                </View>
              </View>

              <View style={styles.refCodeBox}>
                <Text style={styles.refCodeLabel}>Kode Referralmu</Text>
                <View style={styles.refCodeValue}>
                  <MaterialIcons name="qr-code" size={16} color={Colors.accent} />
                  <Text style={styles.refCode}>{user.referralCode}</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.taskBtn} onPress={handleReferral} activeOpacity={0.85}>
                <LinearGradient colors={['#00FF7F', '#00CC66']} style={styles.taskBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  <MaterialIcons name="share" size={18} color="#000" />
                  <Text style={[styles.taskBtnText, { color: '#000' }]}>Bagikan Link Referral</Text>
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>
          </View>

          {/* Syarat Penarikan info */}
          <View style={styles.infoCard}>
            <MaterialIcons name="info-outline" size={18} color={Colors.info} />
            <Text style={styles.infoText}>
              Total video ditonton: <Text style={{ fontFamily: FontFamily.number, color: Colors.primary }}>{user.totalAdsWatched}/350</Text> — Syarat untuk penarikan
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
  scroll: { paddingHorizontal: Spacing.md, gap: Spacing.md },
  pageHeader: { marginBottom: Spacing.sm },
  pageTitle: { fontSize: FontSize.xxl, fontFamily: FontFamily.title, color: Colors.textPrimary },
  pageSubtitle: { fontSize: FontSize.sm, fontFamily: FontFamily.body, color: Colors.textMuted, marginTop: 4 },
  checkinCard: { borderRadius: Radius.xl, overflow: 'hidden' },
  checkinGrad: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, gap: Spacing.md, borderRadius: Radius.xl, borderWidth: 1, borderColor: Colors.border },
  checkinIcon: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  checkinTitle: { fontSize: FontSize.md, fontFamily: FontFamily.bodySemibold, color: Colors.textPrimary },
  checkinReward: { fontSize: FontSize.xl, fontFamily: FontFamily.number, color: Colors.accent },
  checkinStatus: { fontSize: FontSize.xs, fontFamily: FontFamily.body, marginTop: 2 },
  spinBanner: { borderRadius: Radius.xl, overflow: 'hidden' },
  spinBannerGrad: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, gap: Spacing.md, borderRadius: Radius.xl, borderWidth: 1, borderColor: 'rgba(139,92,246,0.3)' },
  spinIcon: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  spinBannerTitle: { fontSize: FontSize.md, fontFamily: FontFamily.bodySemibold, color: Colors.textPrimary },
  spinBannerSub: { fontSize: FontSize.sm, fontFamily: FontFamily.number, color: Colors.purpleLight },
  spinBannerStatus: { fontSize: FontSize.xs, fontFamily: FontFamily.body, marginTop: 2 },
  sectionTitle: { fontSize: FontSize.lg, fontFamily: FontFamily.bodySemibold, color: Colors.textSecondary, marginTop: Spacing.xs },
  taskCard: { borderRadius: Radius.xl, overflow: 'hidden' },
  taskGrad: { padding: Spacing.md, gap: Spacing.sm, borderRadius: Radius.xl, borderWidth: 1, borderColor: Colors.border },
  taskHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  taskIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  taskTitle: { fontSize: FontSize.md, fontFamily: FontFamily.bodySemibold, color: Colors.textPrimary },
  taskDesc: { fontSize: FontSize.xs, fontFamily: FontFamily.body, color: Colors.textMuted, marginTop: 2 },
  taskProgress: { backgroundColor: 'rgba(255,215,0,0.1)', borderRadius: Radius.sm, paddingHorizontal: 10, paddingVertical: 6 },
  taskProgressText: { fontSize: FontSize.sm, fontFamily: FontFamily.number, color: Colors.primary },
  progBarOuter: { height: 6, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' },
  progBarInner: { height: '100%', backgroundColor: Colors.primary, borderRadius: 3 },
  taskEarned: { fontSize: FontSize.xs, fontFamily: FontFamily.body, color: Colors.textMuted },
  taskBtn: { borderRadius: Radius.md, overflow: 'hidden' },
  taskBtnDisabled: { opacity: 0.5 },
  taskBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14 },
  taskBtnText: { fontSize: FontSize.base, fontFamily: FontFamily.button },
  refCodeBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(0,255,127,0.06)', borderRadius: Radius.md, padding: Spacing.md, borderWidth: 1, borderColor: 'rgba(0,255,127,0.15)' },
  refCodeLabel: { fontSize: FontSize.sm, fontFamily: FontFamily.body, color: Colors.textMuted },
  refCodeValue: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  refCode: { fontSize: FontSize.xl, fontFamily: FontFamily.number, color: Colors.accent, letterSpacing: 3 },
  infoCard: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(78,205,196,0.08)', borderRadius: Radius.md, padding: Spacing.md, borderWidth: 1, borderColor: 'rgba(78,205,196,0.2)' },
  infoText: { flex: 1, fontSize: FontSize.sm, fontFamily: FontFamily.body, color: Colors.textSecondary },
  spinOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'flex-end' },
  spinModal: { borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, overflow: 'hidden' },
  spinModalInner: { padding: Spacing.lg, paddingBottom: Spacing.xxl, alignItems: 'center', gap: Spacing.md, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, borderWidth: 1, borderColor: Colors.border },
  spinModalHeader: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  spinModalTitle: { fontSize: FontSize.xl, fontFamily: FontFamily.title, color: Colors.primary },
});
