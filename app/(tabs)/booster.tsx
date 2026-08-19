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
import { Colors, Spacing, Radius, FontSize, FontFamily } from '@/constants/theme';
import { BOOSTERS } from '@/constants/config';
import { formatRupiah, getActiveBoostersFiltered } from '@/services/gameService';

interface BoosterRentModalProps {
  booster: typeof BOOSTERS[0] | null;
  visible: boolean;
  onClose: () => void;
  onRent: (hours: number, cost: number) => void;
  balance: number;
}

function BoosterRentModal({ booster, visible, onClose, onRent, balance }: BoosterRentModalProps) {
  if (!booster) return null;
  const slideAnim = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 10, useNativeDriver: true }).start();
    } else {
      slideAnim.setValue(300);
    }
  }, [visible]);

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={mStyles.overlay}>
        <Animated.View style={[mStyles.modal, { transform: [{ translateY: slideAnim }] }]}>
          <LinearGradient colors={['#10102E', '#0D1635']} style={mStyles.inner}>
            <View style={mStyles.header}>
              <View style={[mStyles.icon, { backgroundColor: booster.color + '22' }]}>
                <MaterialIcons name={booster.icon as any} size={28} color={booster.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={mStyles.title}>{booster.name}</Text>
                <Text style={[mStyles.multi, { color: booster.color }]}>{booster.description}</Text>
              </View>
              <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                <MaterialIcons name="close" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={mStyles.sectionTitle}>Pilih Durasi Sewa</Text>

            <View style={mStyles.priceGrid}>
              {booster.prices.map((p) => {
                const canAfford = balance >= p.price;
                return (
                  <TouchableOpacity
                    key={p.duration}
                    style={[mStyles.priceCard, !canAfford && mStyles.priceCardDisabled]}
                    onPress={() => canAfford && onRent(p.duration, p.price)}
                    disabled={!canAfford}
                    activeOpacity={0.85}
                  >
                    <LinearGradient
                      colors={canAfford ? [booster.color + '22', booster.color + '11'] : ['#1A1A3A', '#1A1A3A']}
                      style={mStyles.priceGrad}
                    >
                      <Text style={[mStyles.duration, { color: canAfford ? booster.color : Colors.textMuted }]}>{p.label}</Text>
                      <Text style={[mStyles.price, { color: canAfford ? Colors.textPrimary : Colors.textMuted }]}>{formatRupiah(p.price)}</Text>
                      {!canAfford && <Text style={mStyles.noBalance}>Saldo kurang</Text>}
                    </LinearGradient>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={mStyles.balanceRow}>
              <MaterialIcons name="account-balance-wallet" size={16} color={Colors.textMuted} />
              <Text style={mStyles.balanceText}>Saldo: <Text style={{ fontFamily: FontFamily.number, color: Colors.primary }}>{formatRupiah(balance)}</Text></Text>
            </View>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
}

const mStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  modal: { borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, overflow: 'hidden' },
  inner: { padding: Spacing.lg, gap: Spacing.md, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, borderWidth: 1, borderColor: Colors.border },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  icon: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: FontSize.lg, fontFamily: FontFamily.bodySemibold, color: Colors.textPrimary },
  multi: { fontSize: FontSize.sm, fontFamily: FontFamily.bodyMedium },
  sectionTitle: { fontSize: FontSize.md, fontFamily: FontFamily.bodyMedium, color: Colors.textSecondary },
  priceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  priceCard: { width: '47%', borderRadius: Radius.md, overflow: 'hidden' },
  priceCardDisabled: { opacity: 0.5 },
  priceGrad: { padding: Spacing.md, gap: 4, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  duration: { fontSize: FontSize.md, fontFamily: FontFamily.button },
  price: { fontSize: FontSize.lg, fontFamily: FontFamily.number },
  noBalance: { fontSize: FontSize.xs, fontFamily: FontFamily.body, color: Colors.error },
  balanceRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.border },
  balanceText: { fontSize: FontSize.sm, fontFamily: FontFamily.body, color: Colors.textMuted },
});

export default function BoosterScreen() {
  const { user, rentBooster } = useApp();
  const { showAlert } = useAlert();
  const insets = useSafeAreaInsets();

  const [selectedBooster, setSelectedBooster] = useState<typeof BOOSTERS[0] | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [cardAnims] = useState(() => BOOSTERS.map(() => new Animated.Value(40)));

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    Animated.stagger(100, cardAnims.map((a) => Animated.spring(a, { toValue: 0, tension: 60, friction: 9, useNativeDriver: true }))).start();
  }, []);

  const now = Date.now();
  const activeBoosters = getActiveBoostersFiltered(user.activeBoosters, now);

  const handleRent = async (hours: number, cost: number) => {
    if (!selectedBooster) return;
    setSelectedBooster(null);
    await new Promise((r) => setTimeout(r, 200));
    const success = await rentBooster(selectedBooster.id, selectedBooster.multiplier, hours, cost);
    if (success) {
      showAlert('Booster Aktif!', `${selectedBooster.name} (${selectedBooster.multiplier}×) aktif selama ${hours >= 168 ? '7 hari' : hours >= 120 ? '5 hari' : hours >= 72 ? '3 hari' : '24 jam'}`);
    } else {
      showAlert('Gagal', 'Saldo tidak mencukupi');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 16, paddingBottom: Spacing.xxl }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* Header */}
          <View style={styles.pageHeader}>
            <Text style={styles.pageTitle}>Power Booster</Text>
            <Text style={styles.pageSubtitle}>Percepat mining dengan booster premium</Text>
          </View>

          {/* Balance display */}
          <View style={styles.balCard}>
            <LinearGradient colors={['rgba(255,215,0,0.08)', 'rgba(255,140,66,0.08)']} style={styles.balGrad}>
              <MaterialIcons name="account-balance-wallet" size={22} color={Colors.primary} />
              <View>
                <Text style={styles.balLabel}>Saldo Tersedia</Text>
                <Text style={styles.balValue}>{formatRupiah(user.balance)}</Text>
              </View>
              <Text style={styles.balHint}>Untuk sewa booster</Text>
            </LinearGradient>
          </View>

          {/* Active boosters */}
          {activeBoosters.length > 0 && (
            <View style={styles.activeSection}>
              <Text style={styles.sectionTitle}>Booster Aktif</Text>
              {activeBoosters.map((ab) => {
                const bDef = BOOSTERS.find((b) => b.id === ab.boosterId);
                const rem = Math.max(0, ab.expiresAt - now);
                const h = Math.floor(rem / 3600000);
                const m = Math.floor((rem % 3600000) / 60000);
                return (
                  <View key={ab.id} style={styles.activeBoosterRow}>
                    <LinearGradient colors={['#10102E', '#161640']} style={styles.activeBoosterGrad}>
                      <View style={[styles.activeDot, { backgroundColor: bDef?.color || Colors.primary }]} />
                      <MaterialIcons name={bDef?.icon as any || 'bolt'} size={18} color={bDef?.color || Colors.primary} />
                      <Text style={styles.activeName}>{bDef?.name}</Text>
                      <View style={styles.activeMulti}>
                        <Text style={[styles.activeMultiText, { color: bDef?.color || Colors.primary }]}>{bDef?.multiplier}×</Text>
                      </View>
                      <View style={styles.activeTimer}>
                        <MaterialIcons name="schedule" size={12} color={Colors.textMuted} />
                        <Text style={styles.activeTimerText}>{h}j {m}m tersisa</Text>
                      </View>
                    </LinearGradient>
                  </View>
                );
              })}
            </View>
          )}

          {/* Booster Grid (2×2) */}
          <Text style={styles.sectionTitle}>Paket Booster</Text>
          <View style={styles.boosterGrid}>
            {BOOSTERS.map((b, i) => {
              const isActive = activeBoosters.some((ab) => ab.boosterId === b.id);
              return (
                <Animated.View key={b.id} style={[styles.boosterCardWrap, { transform: [{ translateY: cardAnims[i] }] }]}>
                  <TouchableOpacity
                    style={[styles.boosterCard, isActive && styles.boosterCardActive]}
                    onPress={() => setSelectedBooster(b)}
                    activeOpacity={0.85}
                  >
                    <LinearGradient
                      colors={[b.color + '18', b.color + '08', Colors.bgCard]}
                      style={styles.boosterGrad}
                    >
                      {isActive && (
                        <View style={[styles.activeBadge, { backgroundColor: b.color }]}>
                          <Text style={styles.activeBadgeText}>AKTIF</Text>
                        </View>
                      )}

                      <View style={[styles.boosterIconWrap, { backgroundColor: b.color + '20', borderColor: b.color + '40' }]}>
                        <MaterialIcons name={b.icon as any} size={30} color={b.color} />
                      </View>

                      <Text style={[styles.boosterName, { color: b.color }]}>{b.name}</Text>
                      <Text style={styles.boosterDesc}>{b.description}</Text>

                      <View style={[styles.multiChip, { backgroundColor: b.color + '18', borderColor: b.color + '44' }]}>
                        <MaterialIcons name="bolt" size={14} color={b.color} />
                        <Text style={[styles.multiText, { color: b.color }]}>{b.multiplier}× Hash Rate</Text>
                      </View>

                      <View style={styles.priceRange}>
                        <Text style={styles.priceFrom}>Mulai dari</Text>
                        <Text style={[styles.priceMin, { color: b.color }]}>{formatRupiah(b.prices[0].price)}</Text>
                      </View>

                      <View style={styles.rentBtnRow}>
                        <LinearGradient colors={[b.color, b.color + 'CC']} style={styles.rentBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                          <MaterialIcons name="shopping-cart" size={14} color="#000" />
                          <Text style={styles.rentBtnText}>Sewa</Text>
                        </LinearGradient>
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </View>

          {/* Info */}
          <View style={styles.infoBox}>
            <MaterialIcons name="info-outline" size={16} color={Colors.info} />
            <Text style={styles.infoText}>
              Booster aktif hingga durasi habis meski tidak mining.
            </Text>
          </View>
        </Animated.View>
      </ScrollView>

      <BoosterRentModal
        booster={selectedBooster}
        visible={selectedBooster !== null}
        onClose={() => setSelectedBooster(null)}
        onRent={handleRent}
        balance={user.balance}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: Spacing.md, gap: Spacing.md },
  pageHeader: { marginBottom: Spacing.xs },
  pageTitle: { fontSize: FontSize.xxl, fontFamily: FontFamily.title, color: Colors.textPrimary },
  pageSubtitle: { fontSize: FontSize.sm, fontFamily: FontFamily.body, color: Colors.textMuted, marginTop: 4 },
  balCard: { borderRadius: Radius.xl, overflow: 'hidden' },
  balGrad: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.md, borderRadius: Radius.xl, borderWidth: 1, borderColor: 'rgba(255,215,0,0.2)' },
  balLabel: { fontSize: FontSize.xs, fontFamily: FontFamily.body, color: Colors.textMuted },
  balValue: { fontSize: FontSize.xl, fontFamily: FontFamily.number, color: Colors.primary },
  balHint: { marginLeft: 'auto', fontSize: FontSize.xs, fontFamily: FontFamily.body, color: Colors.textMuted },
  activeSection: { gap: Spacing.sm },
  sectionTitle: { fontSize: FontSize.md, fontFamily: FontFamily.bodySemibold, color: Colors.textSecondary },
  activeBoosterRow: { borderRadius: Radius.md, overflow: 'hidden' },
  activeBoosterGrad: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, gap: 10, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border },
  activeDot: { width: 8, height: 8, borderRadius: 4 },
  activeName: { flex: 1, fontSize: FontSize.sm, fontFamily: FontFamily.bodyMedium, color: Colors.textPrimary },
  activeMulti: { backgroundColor: 'rgba(255,215,0,0.1)', borderRadius: Radius.sm, paddingHorizontal: 8, paddingVertical: 4 },
  activeMultiText: { fontSize: FontSize.sm, fontFamily: FontFamily.number },
  activeTimer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  activeTimerText: { fontSize: FontSize.xs, fontFamily: FontFamily.body, color: Colors.textMuted },
  boosterGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  boosterCardWrap: { width: '48.5%' },
  boosterCard: { borderRadius: Radius.lg, overflow: 'hidden' },
  boosterCardActive: { borderWidth: 2, borderColor: Colors.primary },
  boosterGrad: { padding: Spacing.md, gap: Spacing.sm, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', position: 'relative' },
  activeBadge: { position: 'absolute', top: 8, right: 8, borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 3 },
  activeBadgeText: { fontSize: 9, fontFamily: FontFamily.button, color: '#000' },
  boosterIconWrap: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  boosterName: { fontSize: FontSize.sm, fontFamily: FontFamily.bodySemibold, textAlign: 'center' },
  boosterDesc: { fontSize: FontSize.xs, fontFamily: FontFamily.body, color: Colors.textMuted, textAlign: 'center' },
  multiChip: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1 },
  multiText: { fontSize: FontSize.xs, fontFamily: FontFamily.button },
  priceRange: { alignItems: 'center' },
  priceFrom: { fontSize: FontSize.xs, fontFamily: FontFamily.body, color: Colors.textMuted },
  priceMin: { fontSize: FontSize.md, fontFamily: FontFamily.number },
  rentBtnRow: { width: '100%', borderRadius: Radius.sm, overflow: 'hidden' },
  rentBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: Radius.sm },
  rentBtnText: { fontSize: FontSize.sm, fontFamily: FontFamily.button, color: '#000' },
  infoBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: 'rgba(78,205,196,0.08)', borderRadius: Radius.md, padding: Spacing.md, borderWidth: 1, borderColor: 'rgba(78,205,196,0.2)' },
  infoText: { flex: 1, fontSize: FontSize.xs, fontFamily: FontFamily.body, color: Colors.textSecondary, lineHeight: 18 },
});
