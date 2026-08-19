import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const requestNotificationPermission = async (): Promise<boolean> => {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    return finalStatus === 'granted';
  } catch {
    return false;
  }
};

export const scheduleCheckinReminder = async () => {
  try {
    await Notifications.cancelScheduledNotificationAsync('checkin-reminder').catch(() => {});
    await Notifications.scheduleNotificationAsync({
      identifier: 'checkin-reminder',
      content: {
        title: 'CashPoP — Check-in Harian',
        body: 'Jangan lupa check-in hari ini dan klaim bonusmu!',
        data: { type: 'checkin' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 8,
        minute: 0,
      },
    });
  } catch {}
};

export const scheduleMiningReminder = async () => {
  try {
    await Notifications.cancelScheduledNotificationAsync('mining-summary').catch(() => {});
    await Notifications.scheduleNotificationAsync({
      identifier: 'mining-summary',
      content: {
        title: 'CashPoP — Ringkasan Mining',
        body: 'Cek hasil mining kamu hari ini dan tarik saldo ke DANA!',
        data: { type: 'mining' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 21,
        minute: 0,
      },
    });
  } catch {}
};

export const scheduleBoosterExpiryReminder = async (
  boosterId: string,
  boosterName: string,
  expiresAt: number
) => {
  try {
    const notifyAt = expiresAt - 60 * 60 * 1000; // 1 hour before
    if (notifyAt <= Date.now()) return;
    const identifier = `booster-expiry-${boosterId}`;
    await Notifications.cancelScheduledNotificationAsync(identifier).catch(() => {});
    await Notifications.scheduleNotificationAsync({
      identifier,
      content: {
        title: 'CashPoP — Booster Hampir Habis',
        body: `${boosterName} akan berakhir dalam 1 jam. Perpanjang sekarang!`,
        data: { type: 'booster', boosterId },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(notifyAt),
      },
    });
  } catch {}
};

export const cancelAllNotifications = async () => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {}
};

export const setupNotifications = async () => {
  try {
    const granted = await requestNotificationPermission();
    if (granted) {
      await scheduleCheckinReminder();
      await scheduleMiningReminder();
    }
    return granted;
  } catch {
    return false;
  }
};
