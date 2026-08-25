// Network tracing for development only.
//
// These calls used to be plain console.log, which meant release builds wrote every API URL
// and every full response body into the device log — including, for weather requests, the
// user's coordinates. Metro replaces __DEV__ with a literal false in release, so the whole
// call is dropped by dead-code elimination there.
//
// Pass objects rather than JSON.stringify(...) at the call site: the argument expression is
// evaluated before this function can decide anything, so a stringify in the arguments would
// still cost main-thread work in release even though nothing gets printed.
export function debugLog(...args: unknown[]): void {
  if (__DEV__) console.log(...args);
}
