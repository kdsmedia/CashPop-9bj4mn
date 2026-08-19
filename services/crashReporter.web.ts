// Web stub — react-native-exception-handler is native-only, no-op on web

export function installCrashReporter(): void {
  // no-op on web
}

export async function getLastCrash(): Promise<string | null> {
  return null;
}

export async function clearLastCrash(): Promise<void> {
  // no-op on web
}
