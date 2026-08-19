import {
  getCrashlytics,
  log as crashlyticsLog,
  recordError,
  setAttributes,
  setUserId as setCrashlyticsUserId,
} from '@react-native-firebase/crashlytics';

// A network failure is the single most common source of "why did this screen just show
// nothing" reports, and console.log (what every catch block here used before) is invisible
// once the app is out of a dev session — recordError sends it to Crashlytics as a non-fatal,
// with the request context attached, so it's visible without having to repro locally.
export function reportNetworkError(source: string, error: unknown, context?: string): void {
  const err = error instanceof Error ? error : new Error(String(error));
  crashlyticsLog(getCrashlytics(), `[${source}] ${context ?? 'request failed'}`);
  recordError(getCrashlytics(), err, source);
}

// For failures outside a network call (storage, auth, native module calls) that are still
// worth seeing in Crashlytics but aren't necessarily fatal to the flow they're in.
export function reportError(source: string, error: unknown, context?: string): void {
  const err = error instanceof Error ? error : new Error(String(error));
  if (context) crashlyticsLog(getCrashlytics(), `[${source}] ${context}`);
  recordError(getCrashlytics(), err, source);
}

export function setCrashReportingUserId(uid: string | null): void {
  void setCrashlyticsUserId(getCrashlytics(), uid ?? '');
}

export function setCrashReportingUserContext(attributes: Record<string, string>): void {
  void setAttributes(getCrashlytics(), attributes);
}

// Catches what would otherwise be a silent white-screen crash: JS exceptions ErrorUtils
// doesn't route anywhere by default, and promise rejections nobody awaited/caught. Both are
// reported as non-fatals (the JS error handler chains to the previous handler so React
// Native's own red-box/native crash behavior for `isFatal` errors is preserved).
export function installGlobalCrashHandlers(): void {
  const previousHandler = ErrorUtils.getGlobalHandler();
  ErrorUtils.setGlobalHandler((error, isFatal) => {
    recordError(getCrashlytics(), error, isFatal ? 'fatal_js_error' : 'js_error');
    previousHandler(error, isFatal);
  });

  // No published types for this module — it's the same untyped tracker React Native's own
  // dev-mode "Possible Unhandled Promise Rejection" warning is built on.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const rejectionTracking = require('promise/setimmediate/rejection-tracking');
  rejectionTracking.enable({
    allRejections: true,
    onUnhandled: (id: number, error: unknown) => {
      const err = error instanceof Error ? error : new Error(String(error));
      recordError(getCrashlytics(), err, 'unhandled_promise_rejection');
    },
    onHandled: () => {},
  });
}
