import React, { createContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  UserData,
  MiningHistoryItem,
  loadUserData,
  saveUserData,
  defaultUserData,
  generateReferralCode,
  calculateMiningEarnings,
  getActiveBoostersFiltered,
  getTodayString,
  calculateStreak,
  getStreakReward,
  saveHistory,
  loadHistory,
} from '@/services/gameService';
import {
  setupNotifications,
  scheduleBoosterExpiryReminder,
  cancelAllNotifications,
  scheduleCheckinReminder,
  scheduleMiningReminder,
} from '@/services/notificationService';
import { MINING_BASE_RATE } from '@/constants/config';
import type { ActiveBooster } from '@/services/gameService';

interface AppContextType {
  user: UserData;
  isLoading: boolean;
  currentHashRate: number;
  currentMultiplier: number;
  miningHistory: MiningHistoryItem[];
  setupUser: (danaNumber: string, invitedBy?: string) => Promise<void>;
  startMining: () => void;
  stopMining: () => void;
  claimCheckin: () => Promise<number>;
  claimSpin: (amount: number, type: string, value: number) => Promise<void>;
  watchAd: () => Promise<number>;
  addReferral: () => Promise<number>;
  rentBooster: (boosterId: string, multiplier: number, hours: number, cost: number) => Promise<boolean>;
  requestWithdrawal: (amount: number) => Promise<{ success: boolean; message: string }>;
  refreshUser: () => Promise<void>;
  toggleNotifications: (enabled: boolean) => Promise<void>;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserData>({ ...defaultUserData });
  const [isLoading, setIsLoading] = useState(true);
  const [currentHashRate, setCurrentHashRate] = useState(0);
  const [currentMultiplier, setCurrentMultiplier] = useState(1);
  const [miningHistory, setMiningHistory] = useState<MiningHistoryItem[]>([]);
  const miningIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    Promise.all([loadUserData(), loadHistory()]).then(([data, history]) => {
      setUser(data);
      setMiningHistory(history);
      setIsLoading(false);
      if (data.notificationsEnabled) {
        setupNotifications().catch(() => {});
      }
    });
  }, []);

  const startMiningTick = useCallback((userData?: UserData) => {
    if (miningIntervalRef.current) clearInterval(miningIntervalRef.current);
    miningIntervalRef.current = setInterval(() => {
      const now = Date.now();
      setUser((prev) => {
        const activeBoosters = getActiveBoostersFiltered(prev.activeBoosters, now);
        const multiplier = activeBoosters.reduce((m, b) => Math.max(m, b.multiplier), 1);
        const hashRate = MINING_BASE_RATE * multiplier * 60;
        setCurrentHashRate(hashRate);
        setCurrentMultiplier(multiplier);

        const { earned, hashCount } = calculateMiningEarnings(prev, now);
        if (earned <= 0) return prev;

        const updated: UserData = {
          ...prev,
          balance: prev.balance + earned,
          totalEarned: prev.totalEarned + earned,
          lastMiningTime: now,
          totalHashCount: prev.totalHashCount + hashCount,
          activeBoosters,
        };
        saveUserData(updated);
        return updated;
      });
    }, 3000);
  }, []);

  useEffect(() => {
    if (user.miningActive) {
      startMiningTick(user);
    } else {
      if (miningIntervalRef.current) clearInterval(miningIntervalRef.current);
      setCurrentHashRate(0);
      setCurrentMultiplier(1);
    }
    return () => {
      if (miningIntervalRef.current) clearInterval(miningIntervalRef.current);
    };
  }, [user.miningActive]);

  const appendHistory = useCallback(async (item: Omit<MiningHistoryItem, 'id' | 'timestamp'>) => {
    const newItem: MiningHistoryItem = {
      ...item,
      id: `hist_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      timestamp: Date.now(),
    };
    setMiningHistory((prev) => {
      const updated = [...prev, newItem].slice(-30);
      saveHistory(updated);
      return updated;
    });
  }, []);

  const setupUser = useCallback(async (danaNumber: string, invitedBy?: string) => {
    const referralCode = generateReferralCode(danaNumber);
    const now = Date.now();
    const newUser: UserData = {
      ...defaultUserData,
      danaNumber,
      referralCode,
      isOnboarded: true,
      lastMiningTime: now,
      notificationsEnabled: true,
      invitedBy,
    };
    await saveUserData(newUser);
    setUser(newUser);
    await setupNotifications().catch(() => {});
  }, []);

  const startMining = useCallback(() => {
    setUser((prev) => {
      const updated = { ...prev, miningActive: true, lastMiningTime: Date.now() };
      saveUserData(updated);
      return updated;
    });
    appendHistory({ type: 'start', label: 'Mining dimulai', icon: 'play-circle-filled', color: '#00FF7F' });
  }, [appendHistory]);

  const stopMining = useCallback(() => {
    if (miningIntervalRef.current) clearInterval(miningIntervalRef.current);
    setCurrentHashRate(0);
    setCurrentMultiplier(1);
    setUser((prev) => {
      const updated = { ...prev, miningActive: false };
      saveUserData(updated);
      return updated;
    });
    appendHistory({ type: 'stop', label: 'Mining dihentikan', icon: 'stop-circle', color: '#FF4757' });
  }, [appendHistory]);

  const claimCheckin = useCallback(async (): Promise<number> => {
    return new Promise<number>((resolve) => {
      setUser((prev) => {
        const newStreak = calculateStreak(prev.checkinStreak, prev.lastStreakDate);
        const reward = getStreakReward(newStreak);
        const updated = {
          ...prev,
          balance: prev.balance + reward,
          totalEarned: prev.totalEarned + reward,
          lastCheckinDate: getTodayString(),
          checkinStreak: newStreak,
          lastStreakDate: getTodayString(),
        };
        saveUserData(updated);
        setTimeout(() => {
          appendHistory({
            type: 'checkin',
            label: `Check-in harian (streak ${newStreak})`,
            amount: reward,
            icon: 'event-available',
            color: '#00FF7F',
          });
          resolve(reward);
        }, 0);
        return updated;
      });
    });
  }, [appendHistory]);

  const claimSpin = useCallback(async (amount: number, type: string, value: number) => {
    setUser((prev) => {
      let updated = { ...prev, lastSpinDate: getTodayString() };
      if (type === 'cash') {
        updated.balance = prev.balance + amount;
        updated.totalEarned = prev.totalEarned + amount;
      } else if (type === 'booster_basic' || type === 'booster_pro') {
        const multiplier = type === 'booster_pro' ? 5 : 2;
        const booster: ActiveBooster = {
          id: `spin_${Date.now()}`,
          boosterId: type === 'booster_pro' ? 'pro' : 'basic',
          multiplier,
          expiresAt: Date.now() + value * 3600000,
        };
        updated.activeBoosters = [...prev.activeBoosters, booster];
      }
      saveUserData(updated);
      return updated;
    });
    appendHistory({
      type: 'spin',
      label: type === 'cash' ? `Spin: +${amount}` : `Spin: Booster ${value}j`,
      amount: type === 'cash' ? amount : undefined,
      icon: 'casino',
      color: '#8B5CF6',
    });
  }, [appendHistory]);

  const watchAd = useCallback(async (): Promise<number> => {
    const reward = 10;
    const today = getTodayString();
    setUser((prev) => {
      const todayCount = prev.todayAdsDate === today ? prev.todayAdsCount : 0;
      if (todayCount >= 20) return prev;
      const updated = {
        ...prev,
        balance: prev.balance + reward,
        totalEarned: prev.totalEarned + reward,
        totalAdsWatched: prev.totalAdsWatched + 1,
        todayAdsCount: todayCount + 1,
        todayAdsDate: today,
      };
      saveUserData(updated);
      return updated;
    });
    appendHistory({ type: 'reward', label: 'Reward aktivitas harian', amount: reward, icon: 'stars', color: '#FFD700' });
    return reward;
  }, [appendHistory]);

  const addReferral = useCallback(async (): Promise<number> => {
    const reward = 500;
    setUser((prev) => {
      const updated = {
        ...prev,
        balance: prev.balance + reward,
        totalEarned: prev.totalEarned + reward,
        referralCount: prev.referralCount + 1,
      };
      saveUserData(updated);
      return updated;
    });
    appendHistory({ type: 'referral', label: 'Referral valid', amount: reward, icon: 'group-add', color: '#4ECDC4' });
    return reward;
  }, [appendHistory]);

  const rentBooster = useCallback(async (
    boosterId: string,
    multiplier: number,
    hours: number,
    cost: number
  ): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      setUser((prev) => {
        if (prev.balance < cost) {
          setTimeout(() => resolve(false), 0);
          return prev;
        }
        const booster: ActiveBooster = {
          id: `${boosterId}_${Date.now()}`,
          boosterId,
          multiplier,
          expiresAt: Date.now() + hours * 3600000,
        };
        const updated = {
          ...prev,
          balance: prev.balance - cost,
          activeBoosters: [...prev.activeBoosters, booster],
        };
        saveUserData(updated);
        setTimeout(() => {
          appendHistory({
            type: 'booster',
            label: `Booster ${boosterId} aktif ${hours}j`,
            amount: cost,
            icon: 'bolt',
            color: '#FF8C42',
          });
          if (prev.notificationsEnabled) {
            scheduleBoosterExpiryReminder(booster.id, boosterId, booster.expiresAt).catch(() => {});
          }
          resolve(true);
        }, 0);
        return updated;
      });
    });
  }, [appendHistory]);

  const requestWithdrawal = useCallback(async (
    amount: number
  ): Promise<{ success: boolean; message: string }> => {
    return new Promise((resolve) => {
      const today = getTodayString();
      setUser((prev) => {
        if (prev.balance < amount || amount < 10000) {
          setTimeout(() => resolve({ success: false, message: 'Saldo tidak mencukupi' }), 0);
          return prev;
        }
        if (prev.lastWithdrawalDate === today) {
          setTimeout(() => resolve({ success: false, message: 'Penarikan hanya 1x per hari' }), 0);
          return prev;
        }
        if (prev.totalAdsWatched < 350) {
          setTimeout(() => resolve({ success: false, message: `Butuh ${350 - prev.totalAdsWatched} aktivitas lagi` }), 0);
          return prev;
        }
        const updated = {
          ...prev,
          balance: prev.balance - amount,
          lastWithdrawalDate: today,
        };
        saveUserData(updated);
        setTimeout(() => {
          appendHistory({ type: 'withdraw', label: 'Tarik saldo', amount, icon: 'send', color: '#FF6B9D' });
          resolve({ success: true, message: `Penarikan Rp${amount.toLocaleString('id')} berhasil dikirim ke ${prev.danaNumber}` });
        }, 0);
        return updated;
      });
    });
  }, [appendHistory]);

  const refreshUser = useCallback(async () => {
    const data = await loadUserData();
    setUser(data);
  }, []);

  const toggleNotifications = useCallback(async (enabled: boolean) => {
    setUser((prev) => {
      const updated = { ...prev, notificationsEnabled: enabled };
      saveUserData(updated);
      return updated;
    });
    if (enabled) {
      await scheduleCheckinReminder().catch(() => {});
      await scheduleMiningReminder().catch(() => {});
    } else {
      await cancelAllNotifications().catch(() => {});
    }
  }, []);

  return (
    <AppContext.Provider
      value={{
        user,
        isLoading,
        currentHashRate,
        currentMultiplier,
        miningHistory,
        setupUser,
        startMining,
        stopMining,
        claimCheckin,
        claimSpin,
        watchAd,
        addReferral,
        rentBooster,
        requestWithdrawal,
        refreshUser,
        toggleNotifications,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
