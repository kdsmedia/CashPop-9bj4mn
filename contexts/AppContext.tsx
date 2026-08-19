import React, { createContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  UserData,
  loadUserData,
  saveUserData,
  defaultUserData,
  generateReferralCode,
  calculateMiningEarnings,
  getActiveBoostersFiltered,
  getTodayString,
} from '@/services/gameService';
import { MINING_BASE_RATE } from '@/constants/config';
import type { ActiveBooster } from '@/services/gameService';

interface AppContextType {
  user: UserData;
  isLoading: boolean;
  currentHashRate: number;
  currentMultiplier: number;
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
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserData>({ ...defaultUserData });
  const [isLoading, setIsLoading] = useState(true);
  const [currentHashRate, setCurrentHashRate] = useState(0);
  const [currentMultiplier, setCurrentMultiplier] = useState(1);
  const miningIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    loadUserData().then((data) => {
      setUser(data);
      setIsLoading(false);
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
      invitedBy,
    };
    await saveUserData(newUser);
    setUser(newUser);
  }, []);

  const startMining = useCallback(() => {
    setUser((prev) => {
      const updated = { ...prev, miningActive: true, lastMiningTime: Date.now() };
      saveUserData(updated);
      return updated;
    });
  }, []);

  const stopMining = useCallback(() => {
    if (miningIntervalRef.current) clearInterval(miningIntervalRef.current);
    setUser((prev) => {
      const updated = { ...prev, miningActive: false };
      saveUserData(updated);
      return updated;
    });
    setCurrentHashRate(0);
  }, []);

  const claimCheckin = useCallback(async (): Promise<number> => {
    const reward = 200;
    setUser((prev) => {
      const updated = {
        ...prev,
        balance: prev.balance + reward,
        totalEarned: prev.totalEarned + reward,
        lastCheckinDate: getTodayString(),
      };
      saveUserData(updated);
      return updated;
    });
    return reward;
  }, []);

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
  }, []);

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
    return reward;
  }, []);

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
    return reward;
  }, []);

  const rentBooster = useCallback(async (
    boosterId: string,
    multiplier: number,
    hours: number,
    cost: number
  ): Promise<boolean> => {
    let success = false;
    setUser((prev) => {
      if (prev.balance < cost) return prev;
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
      success = true;
      return updated;
    });
    await new Promise((r) => setTimeout(r, 50));
    return success;
  }, []);

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
        result = { success: false, message: `Butuh ${350 - prev.totalAdsWatched} video lagi` };
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
    return result;
  }, []);

  const refreshUser = useCallback(async () => {
    const data = await loadUserData();
    setUser(data);
  }, []);

  return (
    <AppContext.Provider
      value={{
        user,
        isLoading,
        currentHashRate,
        currentMultiplier,
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
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
