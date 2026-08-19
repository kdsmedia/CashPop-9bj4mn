import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  setJSExceptionHandler,
  setNativeExceptionHandler,
} from 'react-native-exception-handler';

const CRASH_KEY = '@cashpop/last-crash';

const saveCrash = async (text: string) => {
  try {
    await AsyncStorage.setItem(CRASH_KEY, `${new Date().toISOString()}\n${text}`.slice(0, 4000));
  } catch {}
};

export function installCrashReporter() {
  setJSExceptionHandler((error, isFatal) => {
    saveCrash(
      `JS ${isFatal ? 'FATAL' : 'non-fatal'}: ${error?.name}: ${error?.message}\n${error?.stack ?? ''}`
    );
  }, true);

  setNativeExceptionHandler((exceptionString) => {
    saveCrash(`NATIVE: ${exceptionString}`);
  });
}

export async function getLastCrash(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(CRASH_KEY);
  } catch {
    return null;
  }
}

export async function clearLastCrash(): Promise<void> {
  try {
    await AsyncStorage.removeItem(CRASH_KEY);
  } catch {}
}
