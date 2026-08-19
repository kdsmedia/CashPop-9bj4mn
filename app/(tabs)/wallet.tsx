import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Animated,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/hooks/useApp';
import { useAlert } from '@/template';
import { Colors, Spacing, Radius, FontSize, FontFamily } from '@/constants/theme';
import { formatRupiah, canWithdraw, getTodayString } from '@/services/gameService';
import { WITHDRAWAL_MIN } from '@/constants/config';

export default function WalletScreen() {
  const { user, requestWithdrawal } = useApp();
  const { showAlert } = useAlert();
  const insets = useSafeAreaInsets();

  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const balanceAnim = useRef(new Animated.Value(0.8)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(balanceAnim, { toValue: 1, tension: 50, friction: 8, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 9, useNativeDriver: true }),
    ]).start();
  }, []);

  const today = getTodayString();
  const withdrawCheck = canWithdraw(user);
  const adsProgress = Math.min(user.totalAdsWatched / 350, 1);
  const adsRemaining = Math.max(0, 350 - user.totalAdsWatched);

  const handleWithdraw = async () => {
    const num = parseInt(amount.replace(/\D/g, ''), 10);
    if (!num || num < WITHDRAWAL_MIN) {
      showAlert('Nominal Tidak Valid', `Minimal penarikan ${formatRupiah(WITHDRAWAL_MIN)}`);
      return;
    }
    if (num > user.balance) {
      showAlert('Saldo Kurang', `Saldo kamu hanya ${formatRupiah(user.balance)}`);
      return;
    }
    if (!withdrawCheck.canWithdraw) {
      showAlert('Tidak Bisa Tarik', withdrawCheck.reason || 'Syarat belum terpenuhi');
      return;
    }
    showAlert(
      'Konfirmasi Penarikan',
      `Tarik ${formatRupiah(num)} ke nomor DANA ${user.danaNumber}?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Ya, Tarik',
          onPress: async () => {
            setLoading(true);
            const result = await requestWithdrawal(num);
            setLoading(false);
            setAmount('');
            if (result.success) {
              showAlert('Berhasil!', result.message);
            } else {
              showAlert('Gagal', result.message);
            }
          },
        },
      ]
    );
  };

  const quickAmounts = [10000, 25000, 50000, 100000];

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={{ flex: 1, backgroundColor: Colors.bg }}>
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 16, paddingBottom: Spacing.xxl }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Page Header */}
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            <View style={styles.pageHeader}>
              <Text style={styles.pageTitle}>Dompet</Text>
              <Text style={styles.pageSubtitle}>Kelola saldo & penarikan</Text>
            </View>
          </Animated.View>

          {/* Balance Card */}
          <Animated.View style={{ transform: [{ scale: balanceAnim }], opacity: fadeAnim }}>
            <LinearGradient
              colors={['#1A0F2E', '#0F1635', '#07071A']}
              style={styles.balanceCard}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            >
              <View style={styles.decoCircle1} />
              <View style={styles.decoCircle2} />

              <View style={styles.balanceTop}>
                <View>
                  <Text style={styles.balanceLabel}>Total Saldo</Text>
                  <Text style={styles.balanceAmount}>{formatRupiah(user.balance)}</Text>
                </View>
                <View style={styles.walletIcon}>
                  <LinearGradient colors={['#FFD700', '#FF8C42']} style={styles.walletIconGrad}>
                    <MaterialIcons name="account-balance-wallet" size={28} color="#000" />
                  </LinearGradient>
                </View>
              </View>

              <View style={styles.balanceDivider} />

              <View style={styles.balanceStats}>
                <View style={styles.bStat}>
                  <Text style={styles.bStatLabel}>Total Penghasilan</Text>
                  <Text style={styles.bStatValue}>{formatRupiah(user.totalEarned)}</Text>
                </View>
                <View style={styles.bStatDivider} />
                <View style={styles.bStat}>
                  <Text style={styles.bStatLabel}>Nomor DANA</Text>
                  <Text style={styles.bStatValue}>{user.danaNumber}</Text>
                </View>
              </View>
            </LinearGradient>
          </Animated.View>

          {/* Syarat Penarikan */}
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            <View style={styles.reqCard}>
              <LinearGradient colors={['#10102E', '#161640']} style={styles.reqGrad}>
                <View style={styles.reqHeader}>
                  <MaterialIcons name="verified-user" size={20} color={Colors.info} />
                  <Text style={styles.reqTitle}>Syarat Penarikan</Text>
                </View>

                {[
                  {
                    label: 'Saldo minimum Rp10.000',
                    done: user.balance >= WITHDRAWAL_MIN,
                    value: formatRupiah(user.balance),
                  },
                  {
                    label: 'Video (350× total)',
                    done: user.totalAdsWatched >= 350,
                    value: `${user.totalAdsWatched}/350`,
                  },
                  {
                    label: 'Belum tarik hari ini',
                    done: user.lastWithdrawalDate !== today,
                    value: user.lastWithdrawalDate === today ? 'Sudah hari ini' : 'Belum',
                  },
                ].map((req) => (
                  <View key={req.label} style={styles.reqItem}>
                    <MaterialIcons
                      name={req.done ? 'check-circle' : 'radio-button-unchecked'}
                      size={18}
                      color={req.done ? Colors.accent : Colors.textMuted}
                    />
                    <Text style={[styles.reqLabel, { color: req.done ? Colors.textPrimary : Colors.textMuted }]}>
                      {req.label}
                    </Text>
                    <Text style={[styles.reqValue, { color: req.done ? Colors.accent : Colors.textMuted }]}>
                      {req.value}
                    </Text>
                  </View>
                ))}

                <View style={styles.adsProgWrap}>
                  <View style={styles.adsProgBar}>
                    <Animated.View style={[styles.adsProgFill, { width: `${adsProgress * 100}%` }]} />
                  </View>
                  <Text style={styles.adsProgText}>
                    {adsRemaining > 0 ? `${adsRemaining} video lagi` : 'Syarat terpenuhi!'}
                  </Text>
                </View>
              </LinearGradient>
            </View>

            {/* Withdrawal Form */}
            <View style={styles.formCard}>
              <LinearGradient colors={['#10102E', '#161640']} style={styles.formGrad}>
                <Text style={styles.formTitle}>Tarik Saldo</Text>

                <View style={styles.quickRow}>
                  {quickAmounts.map((qa) => (
                    <TouchableOpacity
                      key={qa}
                      style={[styles.quickBtn, amount === String(qa) && styles.quickBtnActive]}
                      onPress={() => setAmount(String(qa))}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.quickBtnText, amount === String(qa) && styles.quickBtnTextActive]}>
                        {formatRupiah(qa)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.inputRow}>
                  <View style={styles.inputWrap}>
                    <Text style={styles.rpPrefix}>Rp</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Masukkan nominal"
                      placeholderTextColor={Colors.textMuted}
                      value={amount ? parseInt(amount).toLocaleString('id') : ''}
                      onChangeText={(t) => setAmount(t.replace(/\D/g, ''))}
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                <Text style={styles.minNote}>Minimal penarikan: {formatRupiah(WITHDRAWAL_MIN)} · 1× per hari</Text>

                <View style={styles.danaTarget}>
                  <MaterialIcons name="send" size={16} color={Colors.primary} />
                  <Text style={styles.danaTargetText}>Dikirim ke: <Text style={{ fontFamily: FontFamily.number, color: Colors.primary }}>{user.danaNumber}</Text></Text>
                </View>

                <TouchableOpacity
                  style={[styles.withdrawBtn, (!withdrawCheck.canWithdraw || loading) && styles.withdrawBtnDisabled]}
                  onPress={handleWithdraw}
                  disabled={!withdrawCheck.canWithdraw || loading}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={withdrawCheck.canWithdraw ? ['#FFD700', '#FF8C42'] : ['#333', '#444']}
                    style={styles.withdrawBtnGrad}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  >
                    <MaterialIcons
                      name={loading ? 'hourglass-top' : withdrawCheck.canWithdraw ? 'send' : 'lock'}
                      size={20}
                      color={withdrawCheck.canWithdraw ? '#000' : '#888'}
                    />
                    <Text style={[styles.withdrawBtnText, { color: withdrawCheck.canWithdraw ? '#000' : '#888' }]}>
                      {loading ? 'Memproses...' : withdrawCheck.canWithdraw ? 'TARIK SEKARANG' : 'Syarat Belum Terpenuhi'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>

                {!withdrawCheck.canWithdraw && withdrawCheck.reason && (
                  <View style={styles.errorNote}>
                    <MaterialIcons name="warning" size={14} color={Colors.error} />
                    <Text style={styles.errorNoteText}>{withdrawCheck.reason}</Text>
                  </View>
                )}
              </LinearGradient>
            </View>

            {/* Referral Code share */}
            <View style={styles.refCard}>
              <LinearGradient colors={['#0F1E0F', '#0D1A0D']} style={styles.refGrad}>
                <MaterialIcons name="group-add" size={22} color={Colors.accent} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.refTitle}>Kode Referral</Text>
                  <Text style={styles.refCode}>{user.referralCode}</Text>
                  <Text style={styles.refHint}>Bagikan ke teman · Rp500/referral valid</Text>
                </View>
                <TouchableOpacity
                  style={styles.copyBtn}
                  onPress={() => showAlert('Referral', `Kode: ${user.referralCode}\nLink: play.google.com/store/apps/details?id=com.altomedia.cashpop&ref=${user.referralCode}`)}
                  activeOpacity={0.8}
                >
                  <LinearGradient colors={['#00FF7F', '#00CC66']} style={styles.copyBtnGrad}>
                    <MaterialIcons name="share" size={16} color="#000" />
                  </LinearGradient>
                </TouchableOpacity>
              </LinearGradient>
            </View>
          </Animated.View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: Spacing.md, gap: Spacing.md },
  pageHeader: { marginBottom: Spacing.xs },
  pageTitle: { fontSize: FontSize.xxl, fontFamily: FontFamily.title, color: Colors.textPrimary },
  pageSubtitle: { fontSize: FontSize.sm, fontFamily: FontFamily.body, color: Colors.textMuted, marginTop: 4 },
  balanceCard: { borderRadius: Radius.xl, padding: Spacing.lg, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,215,0,0.2)', position: 'relative' },
  decoCircle1: { position: 'absolute', width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(255,215,0,0.04)', right: -40, top: -40 },
  decoCircle2: { position: 'absolute', width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,140,66,0.04)', left: -30, bottom: -30 },
  balanceTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md },
  balanceLabel: { fontSize: FontSize.sm, fontFamily: FontFamily.body, color: Colors.textMuted },
  balanceAmount: { fontSize: 32, fontFamily: FontFamily.number, color: Colors.primary },
  walletIcon: { width: 56, height: 56, borderRadius: 28, overflow: 'hidden' },
  walletIconGrad: { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 28 },
  balanceDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginBottom: Spacing.md },
  balanceStats: { flexDirection: 'row', alignItems: 'center' },
  bStat: { flex: 1 },
  bStatLabel: { fontSize: FontSize.xs, fontFamily: FontFamily.body, color: Colors.textMuted, marginBottom: 4 },
  bStatValue: { fontSize: FontSize.md, fontFamily: FontFamily.number, color: Colors.textPrimary },
  bStatDivider: { width: 1, height: 36, backgroundColor: 'rgba(255,255,255,0.06)', marginHorizontal: Spacing.md },
  reqCard: { borderRadius: Radius.xl, overflow: 'hidden' },
  reqGrad: { padding: Spacing.md, gap: Spacing.sm, borderRadius: Radius.xl, borderWidth: 1, borderColor: Colors.border },
  reqHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  reqTitle: { fontSize: FontSize.md, fontFamily: FontFamily.bodySemibold, color: Colors.info },
  reqItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  reqLabel: { flex: 1, fontSize: FontSize.sm, fontFamily: FontFamily.body },
  reqValue: { fontSize: FontSize.sm, fontFamily: FontFamily.number },
  adsProgWrap: { gap: 6, marginTop: 4 },
  adsProgBar: { height: 6, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' },
  adsProgFill: { height: '100%', backgroundColor: Colors.accent, borderRadius: 3 },
  adsProgText: { fontSize: FontSize.xs, fontFamily: FontFamily.body, color: Colors.textMuted },
  formCard: { borderRadius: Radius.xl, overflow: 'hidden' },
  formGrad: { padding: Spacing.md, gap: Spacing.md, borderRadius: Radius.xl, borderWidth: 1, borderColor: Colors.border },
  formTitle: { fontSize: FontSize.lg, fontFamily: FontFamily.bodySemibold, color: Colors.textPrimary },
  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  quickBtn: { borderRadius: Radius.sm, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: Colors.bgSurface },
  quickBtnActive: { borderColor: Colors.primary, backgroundColor: 'rgba(255,215,0,0.1)' },
  quickBtnText: { fontSize: FontSize.sm, fontFamily: FontFamily.body, color: Colors.textSecondary },
  quickBtnTextActive: { fontFamily: FontFamily.number, color: Colors.primary },
  inputRow: {},
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Spacing.md },
  rpPrefix: { fontSize: FontSize.lg, fontFamily: FontFamily.number, color: Colors.primary, marginRight: 8 },
  input: { flex: 1, height: 52, color: Colors.textPrimary, fontSize: FontSize.lg, fontFamily: FontFamily.number },
  minNote: { fontSize: FontSize.xs, fontFamily: FontFamily.body, color: Colors.textMuted },
  danaTarget: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,215,0,0.06)', borderRadius: Radius.sm, padding: Spacing.sm },
  danaTargetText: { fontSize: FontSize.sm, fontFamily: FontFamily.body, color: Colors.textSecondary },
  withdrawBtn: { borderRadius: Radius.md, overflow: 'hidden' },
  withdrawBtnDisabled: { opacity: 0.6 },
  withdrawBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 18 },
  withdrawBtnText: { fontSize: FontSize.base, fontFamily: FontFamily.button, letterSpacing: 0.5 },
  errorNote: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  errorNoteText: { fontSize: FontSize.xs, fontFamily: FontFamily.body, color: Colors.error, flex: 1 },
  refCard: { borderRadius: Radius.xl, overflow: 'hidden' },
  refGrad: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.md, borderRadius: Radius.xl, borderWidth: 1, borderColor: 'rgba(0,255,127,0.2)' },
  refTitle: { fontSize: FontSize.sm, fontFamily: FontFamily.body, color: Colors.textMuted },
  refCode: { fontSize: FontSize.xxl, fontFamily: FontFamily.number, color: Colors.accent, letterSpacing: 4 },
  refHint: { fontSize: FontSize.xs, fontFamily: FontFamily.body, color: Colors.textMuted, marginTop: 2 },
  copyBtn: { width: 44, height: 44, borderRadius: 22, overflow: 'hidden' },
  copyBtnGrad: { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 22 },
});
