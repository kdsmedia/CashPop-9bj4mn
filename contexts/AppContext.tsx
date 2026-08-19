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
  addHistoryItem,
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
        setupNotifications();
      }
    });
  }, []);

  useEffect(() => {
    if (user.miningActive) {
      startMiningTick();
    }
    return () => {
      if (miningIntervalRef.current) clearInterval(miningIntervalRef.current);
    };
  }, [user.miningActive, user.activeBoosters]);

  const appendHistory = useCallback(async (item: Omit<MiningHistoryItem, 'id' | 'timestamp'>) => {
    setMiningHistory((prev) => {
      const newItem: MiningHistoryItem = {
        ...item,
        id: `hist_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        timestamp: Date.now(),
      };
      const updated = [...prev, newItem].slice(-30);
      addHistoryItem(prev, item);
      return updated;
    });
  }, []);

  const startMiningTick = useCallback(() => {
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
    await setupNotifications();
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
    setUser((prev) => {
      const updated = { ...prev, miningActive: false };
      saveUserData(updated);
      return updated;
    });
    setCurrentHashRate(0);
    appendHistory({ type: 'stop', label: 'Mining dihentikan', icon: 'stop-circle', color: '#FF4757' });
  }, [appendHistory]);

  const claimCheckin = useCallback(async (): Promise<number> => {
    let reward = 200;
    setUser((prev) => {
      const newStreak = calculateStreak(prev.checkinStreak, prev.lastStreakDate);
      reward = getStreakReward(newStreak);
      const updated = {
        ...prev,
        balance: prev.balance + reward,
        totalEarned: prev.totalEarned + reward,
        lastCheckinDate: getTodayString(),
        checkinStreak: newStreak,
        lastStreakDate: getTodayString(),
      };
      saveUserData(updated);
      return updated;
    });
    await new Promise((r) => setTimeout(r, 50));
    appendHistory({
      type: 'checkin',
      label: `Check-in harian`,
      amount: reward,
      icon: 'event-available',
      color: '#00FF7F',
    });
    return reward;
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
    appendHistory({ type: 'reward', label: `Reward aktivitas`, amount: reward, icon: 'stars', color: '#FFD700' });
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
    let success = false;
    let boosterRef: ActiveBooster | null = null;
    setUser((prev) => {
      if (prev.balance < cost) return prev;
      const booster: ActiveBooster = {
        id: `${boosterId}_${Date.now()}`,
        boosterId,
        multiplier,
        expiresAt: Date.now() + hours * 3600000,
      };
      boosterRef = booster;
      const updated = {
        ...prev,
        balance: prev.balance - cost,
        activeBoosters: [...prev.activeBoosters, booster],
      };
      saveUserData(updated);
      success = true;
      return updated;
    });
    await new Promise((r) => setTimeout(r, 50));
    if (success && boosterRef) {
      appendHistory({
        type: 'booster',
        label: `Booster ${boosterId} aktif ${hours}j`,
        amount: cost,
        icon: 'bolt',
        color: '#FF8C42',
      });
      if (user.notificationsEnabled) {
        scheduleBoosterExpiryReminder(boosterRef.id, boosterId, boosterRef.expiresAt);
      }
    }
    return success;
  }, [appendHistory, user.notificationsEnabled]);

  const requestWithdrawal = useCallback(async (
    amount: number
  ): Promise<{ success: boolean; message: string }> => {
    const today = getTodayString();
    let result = { success: false, message: '' };
    setUser((prev) => {
      if (prev.balance < amount || amount < 10000) {
        result = { success: false, message: 'Saldo tidak mencukupi' };
        return prev;
      }
      if (prev.lastWithdrawalDate === today) {
        result = { success: false, message: 'Penarikan hanya 1× per hari' };
        return prev;
      }
      if (prev.totalAdsWatched < 350) {
        result = { success: false, message: `Butuh ${350 - prev.totalAdsWatched} aktivitas lagi` };
        return prev;
      }
      const updated = {
        ...prev,
        balance: prev.balance - amount,
        lastWithdrawalDate: today,
      };
      saveUserData(updated);
      result = { success: true, message: `Penarikan Rp${amount.toLocaleString('id')} berhasil dikirim ke ${prev.danaNumber}` };
      return updated;
    });
    await new Promise((r) => setTimeout(r, 50));
    if (result.success) {
      appendHistory({ type: 'withdraw', label: `Tarik saldo`, amount, icon: 'send', color: '#FF6B9D' });
    }
    return result;
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
      await scheduleCheckinReminder();
      await scheduleMiningReminder();
    } else {
      await cancelAllNotifications();
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
