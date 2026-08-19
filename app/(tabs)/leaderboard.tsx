import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/hooks/useApp';
import { Colors, Spacing, Radius, FontSize, FontFamily } from '@/constants/theme';
import { formatRupiah } from '@/services/gameService';
import { MOCK_LEADERBOARD } from '@/constants/config';

interface LeaderboardEntry {
  id: string;
  name: string;
  danaNumber: string;
  totalEarned: number;
  referralCode: string;
  isCurrentUser?: boolean;
}

function RankBadge({ rank }: { rank: number }) {
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, { toValue: 1, tension: 60, friction: 6, delay: rank * 60, useNativeDriver: true }).start();
  }, []);

  const config = rank === 1
    ? { bg: ['#FFD700', '#FFA500'], icon: 'emoji-events', color: '#000' }
    : rank === 2
    ? { bg: ['#C0C0C0', '#A0A0A0'], icon: 'emoji-events', color: '#000' }
    : rank === 3
    ? { bg: ['#CD7F32', '#A0522D'], icon: 'emoji-events', color: '#fff' }
    : { bg: [Colors.bgCard, Colors.bgCardAlt], icon: '', color: Colors.textMuted };

  return (
    <Animated.View style={[styles.rankBadge, { transform: [{ scale: scaleAnim }] }]}>
      {rank <= 3 ? (
        <LinearGradient colors={config.bg as any} style={styles.rankBadgeGrad}>
          <MaterialIcons name={config.icon as any} size={rank === 1 ? 18 : 16} color={config.color} />
        </LinearGradient>
      ) : (
        <View style={[styles.rankBadgeGrad, { backgroundColor: Colors.bgSurface }]}>
          <Text style={styles.rankNum}>{rank}</Text>
        </View>
      )}
    </Animated.View>
  );
}

function LeaderboardListItem({ entry, rank, fadeAnim }: { entry: LeaderboardEntry; rank: number; fadeAnim: Animated.Value }) {
  const slideIn = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.spring(slideIn, { toValue: 0, tension: 60, friction: 9, delay: rank * 50, useNativeDriver: true }).start();
  }, []);

  return (
    <Animated.View style={[{ transform: [{ translateY: slideIn }], opacity: fadeAnim }]}>
      <LinearGradient
        colors={entry.isCurrentUser ? ['#1A1A4A', '#12124A'] : ['#10102E', '#161640']}
        style={[styles.listItem, entry.isCurrentUser && styles.listItemCurrent]}
      >
        <RankBadge rank={rank} />
        <View style={[styles.listAvatar, { backgroundColor: entry.isCurrentUser ? Colors.primary + '22' : Colors.bgSurface }]}>
          <Text style={[styles.listAvatarText, { color: entry.isCurrentUser ? Colors.primary : Colors.textMuted }]}>
            {entry.name.charAt(0)}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.listName, { color: entry.isCurrentUser ? Colors.primary : Colors.textPrimary }]}>
            {entry.name}
          </Text>
          <Text style={styles.listDana}>{entry.danaNumber}</Text>
        </View>
        <View style={styles.listEarnedWrap}>
          <Text style={[styles.listEarned, { color: entry.isCurrentUser ? Colors.primary : Colors.accent }]}>
            {formatRupiah(entry.totalEarned)}
          </Text>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

export default function LeaderboardScreen() {
  const { user } = useApp();
  const insets = useSafeAreaInsets();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 9, useNativeDriver: true }),
    ]).start();
  }, []);

  // Build leaderboard with current user inserted
  const userEntry: LeaderboardEntry = {
    id: 'me',
    name: 'Kamu',
    danaNumber: user.danaNumber,
    totalEarned: user.totalEarned,
    referralCode: user.referralCode,
    isCurrentUser: true,
  };

  const allEntries: LeaderboardEntry[] = [...MOCK_LEADERBOARD, userEntry]
    .sort((a, b) => b.totalEarned - a.totalEarned);

  const top10 = allEntries.slice(0, 10);
  const userRank = allEntries.findIndex((e) => e.id === 'me') + 1;
  const userInTop10 = top10.findIndex((e) => e.id === 'me') !== -1;

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 16, paddingBottom: Spacing.xxl }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          {/* Header */}
          <View style={styles.pageHeader}>
            <Text style={styles.pageTitle}>Papan Peringkat</Text>
            <Text style={styles.pageSubtitle}>Top 10 miner terbaik</Text>
          </View>

          {/* Top 3 Podium */}
          <LinearGradient colors={['#10102E', '#0D1635']} style={styles.podiumCard}>
            <View style={styles.podium}>
              {/* 2nd place */}
              {top10[1] && (
                <Animated.View style={[styles.podiumItem, styles.podiumSecond, { opacity: fadeAnim }]}>
                  <View style={[styles.podiumAvatar, { borderColor: '#C0C0C0' }]}>
                    <Text style={styles.podiumAvatarText}>{top10[1].name.charAt(0)}</Text>
                  </View>
                  <View style={[styles.podiumBase, styles.podiumBase2nd]}>
                    <Text style={styles.podiumRankText}>2</Text>
                  </View>
                  <Text style={styles.podiumName} numberOfLines={1}>{top10[1].name}</Text>
                  <Text style={[styles.podiumEarned, { color: '#C0C0C0' }]}>{formatRupiah(top10[1].totalEarned)}</Text>
                </Animated.View>
              )}

              {/* 1st place */}
              {top10[0] && (
                <Animated.View style={[styles.podiumItem, styles.podiumFirst, { opacity: fadeAnim }]}>
                  <MaterialIcons name="emoji-events" size={24} color="#FFD700" style={{ marginBottom: 4 }} />
                  <View style={[styles.podiumAvatar, { borderColor: '#FFD700', width: 60, height: 60, borderRadius: 30 }]}>
                    <Text style={[styles.podiumAvatarText, { fontSize: 22 }]}>{top10[0].name.charAt(0)}</Text>
                  </View>
                  <View style={[styles.podiumBase, styles.podiumBase1st]}>
                    <Text style={[styles.podiumRankText, { fontSize: 20 }]}>1</Text>
                  </View>
                  <Text style={[styles.podiumName, { color: Colors.primary }]} numberOfLines={1}>{top10[0].name}</Text>
                  <Text style={[styles.podiumEarned, { color: Colors.primary, fontSize: FontSize.md }]}>{formatRupiah(top10[0].totalEarned)}</Text>
                </Animated.View>
              )}

              {/* 3rd place */}
              {top10[2] && (
                <Animated.View style={[styles.podiumItem, styles.podiumThird, { opacity: fadeAnim }]}>
                  <View style={[styles.podiumAvatar, { borderColor: '#CD7F32' }]}>
                    <Text style={styles.podiumAvatarText}>{top10[2].name.charAt(0)}</Text>
                  </View>
                  <View style={[styles.podiumBase, styles.podiumBase3rd]}>
                    <Text style={styles.podiumRankText}>3</Text>
                  </View>
                  <Text style={styles.podiumName} numberOfLines={1}>{top10[2].name}</Text>
                  <Text style={[styles.podiumEarned, { color: '#CD7F32' }]}>{formatRupiah(top10[2].totalEarned)}</Text>
                </Animated.View>
              )}
            </View>
          </LinearGradient>

          {/* Leaderboard List (4-10) */}
          <View style={styles.listSection}>
            {top10.slice(3).map((entry, idx) => (
              <LeaderboardListItem key={entry.id} entry={entry} rank={idx + 4} fadeAnim={fadeAnim} />
            ))}
          </View>

          {/* User Position (if not in top 10) */}
          {!userInTop10 && (
            <View style={styles.myPositionSection}>
              <Text style={styles.myPositionLabel}>Posisi Kamu</Text>
              <LinearGradient
                colors={['#1A1A4A', '#12124A']}
                style={[styles.listItem, styles.listItemCurrent, { borderColor: Colors.primary }]}
              >
                <RankBadge rank={userRank} />
                <View style={[styles.listAvatar, { backgroundColor: Colors.primary + '22' }]}>
                  <Text style={[styles.listAvatarText, { color: Colors.primary }]}>K</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.listName, { color: Colors.primary }]}>Kamu</Text>
                  <Text style={styles.listDana}>{user.danaNumber}</Text>
                </View>
                <View style={styles.listEarnedWrap}>
                  <Text style={[styles.listEarned, { color: Colors.primary }]}>
                    {formatRupiah(user.totalEarned)}
                  </Text>
                  <Text style={styles.listRankNote}>#{userRank}</Text>
                </View>
              </LinearGradient>
              <Text style={styles.myPositionHint}>
                Mining lebih banyak untuk naik peringkat!
              </Text>
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: Spacing.md, gap: Spacing.md },
  pageHeader: { marginBottom: Spacing.xs },
  pageTitle: { fontSize: FontSize.xxl, fontFamily: FontFamily.title, color: Colors.textPrimary },
  pageSubtitle: { fontSize: FontSize.sm, fontFamily: FontFamily.body, color: Colors.textMuted, marginTop: 4 },

  podiumCard: { borderRadius: Radius.xl, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border },
  podium: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: Spacing.md },
  podiumItem: { alignItems: 'center', flex: 1 },
  podiumFirst: { marginBottom: 0 },
  podiumSecond: { marginBottom: -10 },
  podiumThird: { marginBottom: -20 },
  podiumAvatar: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, backgroundColor: Colors.bgSurface, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  podiumAvatarText: { fontSize: FontSize.lg, fontFamily: FontFamily.title, color: Colors.textPrimary },
  podiumBase: { width: '100%', alignItems: 'center', justifyContent: 'center', borderTopLeftRadius: 8, borderTopRightRadius: 8 },
  podiumBase1st: { height: 60, backgroundColor: 'rgba(255,215,0,0.2)', borderWidth: 1, borderColor: 'rgba(255,215,0,0.4)' },
  podiumBase2nd: { height: 44, backgroundColor: 'rgba(192,192,192,0.15)', borderWidth: 1, borderColor: 'rgba(192,192,192,0.3)' },
  podiumBase3rd: { height: 32, backgroundColor: 'rgba(205,127,50,0.15)', borderWidth: 1, borderColor: 'rgba(205,127,50,0.3)' },
  podiumRankText: { fontSize: FontSize.lg, fontFamily: FontFamily.title, color: Colors.textPrimary },
  podiumName: { fontSize: FontSize.xs, fontFamily: FontFamily.bodySemibold, color: Colors.textSecondary, marginTop: 4, textAlign: 'center' },
  podiumEarned: { fontSize: FontSize.xs, fontFamily: FontFamily.number, marginTop: 2, textAlign: 'center' },

  listSection: { gap: Spacing.xs },

  listItem: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, gap: Spacing.sm, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border },
  listItemCurrent: { borderColor: Colors.primary, borderWidth: 2 },

  rankBadge: { width: 32, height: 32 },
  rankBadgeGrad: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  rankNum: { fontSize: FontSize.sm, fontFamily: FontFamily.title, color: Colors.textMuted },

  listAvatar: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  listAvatarText: { fontSize: FontSize.md, fontFamily: FontFamily.title },

  listName: { fontSize: FontSize.sm, fontFamily: FontFamily.bodySemibold, color: Colors.textPrimary },
  listDana: { fontSize: FontSize.xs, fontFamily: FontFamily.body, color: Colors.textMuted, marginTop: 2 },
  listEarnedWrap: { alignItems: 'flex-end' },
  listEarned: { fontSize: FontSize.sm, fontFamily: FontFamily.number },
  listRankNote: { fontSize: FontSize.xs, fontFamily: FontFamily.body, color: Colors.textMuted, marginTop: 2 },

  myPositionSection: { gap: Spacing.sm },
  myPositionLabel: { fontSize: FontSize.md, fontFamily: FontFamily.bodySemibold, color: Colors.textSecondary },
  myPositionHint: { fontSize: FontSize.xs, fontFamily: FontFamily.body, color: Colors.textMuted, textAlign: 'center' },
});
