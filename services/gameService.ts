import AsyncStorage from '@react-native-async-storage/async-storage';
import { MINING_BASE_RATE, SPIN_PRIZES, STREAK_REWARDS } from '@/constants/config';

export interface UserData {
  danaNumber: string;
  referralCode: string;
  balance: number;
  totalEarned: number;
  hashRate: number;
  miningActive: boolean;
  lastMiningTime: number;
  totalAdsWatched: number;
  lastCheckinDate: string;
  lastSpinDate: string;
  lastWithdrawalDate: string;
  withdrawalCount: number;
  todayAdsCount: number;
  todayAdsDate: string;
  referralCount: number;
  activeBoosters: ActiveBooster[];
  totalHashCount: number;
  isOnboarded: boolean;
  invitedBy?: string;
  // Streak
  checkinStreak: number;
  lastStreakDate: string;
  // Notifications
  notificationsEnabled: boolean;
  // Mining history
  miningHistory: MiningHistoryItem[];
}

export interface ActiveBooster {
  id: string;
  boosterId: string;
  multiplier: number;
  expiresAt: number;
}

export interface MiningHistoryItem {
  id: string;
  type: 'start' | 'stop' | 'reward' | 'checkin' | 'spin' | 'referral' | 'booster' | 'withdraw';
  label: string;
  amount?: number;
  timestamp: number;
  icon: string;
  color: string;
}

const STORAGE_KEY = 'cashpop_userdata_v2';
const HISTORY_KEY = 'cashpop_history';

export const defaultUserData: UserData = {
  danaNumber: '',
  referralCode: '',
  balance: 0,
  totalEarned: 0,
  hashRate: 0,
  miningActive: false,
  lastMiningTime: 0,
  totalAdsWatched: 0,
  lastCheckinDate: '',
  lastSpinDate: '',
  lastWithdrawalDate: '',
  withdrawalCount: 0,
  todayAdsCount: 0,
  todayAdsDate: '',
  referralCount: 0,
  activeBoosters: [],
  totalHashCount: 0,
  isOnboarded: false,
  checkinStreak: 0,
  lastStreakDate: '',
  notificationsEnabled: true,
  miningHistory: [],
};

export const loadUserData = async (): Promise<UserData> => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...defaultUserData, ...parsed };
    }
    // Migrate from old key
    const oldRaw = await AsyncStorage.getItem('cashpop_userdata');
    if (oldRaw) {
      const parsed = JSON.parse(oldRaw);
      const migrated = { ...defaultUserData, ...parsed };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
      return migrated;
    }
  } catch {}
  return { ...defaultUserData };
};

export const saveUserData = async (data: UserData): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
};

export const loadHistory = async (): Promise<MiningHistoryItem[]> => {
  try {
    const raw = await AsyncStorage.getItem(HISTORY_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
};

export const saveHistory = async (history: MiningHistoryItem[]): Promise<void> => {
  try {
    // Keep max 30 entries
    const trimmed = history.slice(-30);
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
  } catch {}
};

export const addHistoryItem = async (
  existing: MiningHistoryItem[],
  item: Omit<MiningHistoryItem, 'id' | 'timestamp'>
): Promise<MiningHistoryItem[]> => {
  const newItem: MiningHistoryItem = {
    ...item,
    id: `hist_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    timestamp: Date.now(),
  };
  const updated = [...existing, newItem].slice(-30);
  await saveHistory(updated);
  return updated;
};

export const generateReferralCode = (danaNumber: string): string => {
  const cleaned = danaNumber.replace(/\D/g, '');
  return cleaned.slice(-6);
};

export const calculateMiningEarnings = (
  user: UserData,
  now: number
): { earned: number; hashCount: number } => {
  if (!user.miningActive || user.lastMiningTime === 0) {
    return { earned: 0, hashCount: 0 };
  }
  const elapsedMinutes = (now - user.lastMiningTime) / 60000;
  const multiplier = getActiveMultiplier(user.activeBoosters, now);
  const rate = MINING_BASE_RATE * multiplier;
  const earned = Math.floor(elapsedMinutes * rate * 100) / 100;
  const hashCount = Math.floor(elapsedMinutes * 60 * multiplier);
  return { earned, hashCount };
};

export const getActiveMultiplier = (boosters: ActiveBooster[], now: number): number => {
  const valid = boosters.filter((b) => b.expiresAt > now);
  if (valid.length === 0) return 1;
  return valid.reduce((max, b) => Math.max(max, b.multiplier), 1);
};

export const getActiveBoostersFiltered = (boosters: ActiveBooster[], now: number): ActiveBooster[] => {
  return boosters.filter((b) => b.expiresAt > now);
};

export const getTodayString = (): string => {
  return new Date().toDateString();
};

export const canCheckin = (lastDate: string): boolean => {
  return lastDate !== getTodayString();
};

export const canSpin = (lastDate: string): boolean => {
  return lastDate !== getTodayString();
};

export const calculateStreak = (
  currentStreak: number,
  lastStreakDate: string
): number => {
  const today = getTodayString();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toDateString();

  if (lastStreakDate === today) return currentStreak; // already checked in today
  if (lastStreakDate === yesterdayStr) return currentStreak + 1; // consecutive day
  return 1; // streak broken
};

export const getStreakReward = (streak: number): number => {
  // Get highest milestone reward for current streak
  let reward = STREAK_REWARDS[0].reward;
  for (const milestone of STREAK_REWARDS) {
    if (streak >= milestone.days) {
      reward = milestone.reward;
    }
  }
  return reward;
};

export const canWithdraw = (user: UserData): { canWithdraw: boolean; reason?: string } => {
  if (user.balance < 10000) {
    return { canWithdraw: false, reason: `Saldo minimum Rp10.000 (saldo: Rp${user.balance.toLocaleString('id')})` };
  }
  if (user.totalAdsWatched < 350) {
    const remaining = 350 - user.totalAdsWatched;
    return { canWithdraw: false, reason: `Butuh ${remaining} aktivitas lagi (total: ${user.totalAdsWatched}/350)` };
  }
  if (user.lastWithdrawalDate === getTodayString()) {
    return { canWithdraw: false, reason: 'Penarikan hanya 1× per hari' };
  }
  return { canWithdraw: true };
};

export const getWeightedSpinPrize = () => {
  const totalWeight = SPIN_PRIZES.reduce((s, p) => s + p.weight, 0);
  let rand = Math.random() * totalWeight;
  for (let i = 0; i < SPIN_PRIZES.length; i++) {
    rand -= SPIN_PRIZES[i].weight;
    if (rand <= 0) return { prize: SPIN_PRIZES[i], index: i };
  }
  return { prize: SPIN_PRIZES[0], index: 0 };
};

export const formatRupiah = (amount: number): string => {
  return `Rp${Math.floor(amount).toLocaleString('id-ID')}`;
};

export const formatHashRate = (rate: number): string => {
  if (rate >= 1000) return `${(rate / 1000).toFixed(2)} KH/s`;
  return `${rate.toFixed(2)} H/s`;
};

export const formatTimestamp = (ts: number): string => {
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mo} ${hh}:${mm}`;
};
