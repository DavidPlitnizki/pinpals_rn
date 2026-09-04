// Mock native modules that have no JS implementation in test env
jest.mock('@rnmapbox/maps', () => ({
  MapView: 'MapView',
  Camera: 'Camera',
  PointAnnotation: 'PointAnnotation',
  MarkerView: 'MarkerView',
  ShapeSource: 'ShapeSource',
  SymbolLayer: 'SymbolLayer',
  setAccessToken: jest.fn(),
}));

jest.mock('@react-native-firebase/app', () => ({}));
jest.mock('@react-native-firebase/auth', () => () => ({
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  onAuthStateChanged: jest.fn(() => () => {}),
  currentUser: null,
}));
jest.mock('@react-native-firebase/analytics', () => ({
  getAnalytics: jest.fn(),
  logEvent: jest.fn(),
  setUserId: jest.fn(),
  setUserProperty: jest.fn(),
}));
jest.mock('@react-native-firebase/crashlytics', () => ({
  getCrashlytics: jest.fn(),
  log: jest.fn(),
  recordError: jest.fn(),
  setAttributes: jest.fn(),
  setUserId: jest.fn(),
}));

// Both shapes on purpose. React Native's index reaches this module through `.default`, so a
// mock with only the named export leaves `Alert` itself undefined for anything importing it
// from 'react-native' — and every component that calls `Alert.alert` then throws in tests.
jest.mock('react-native/Libraries/Alert/Alert', () => {
  const alert = jest.fn();
  return { alert, default: { alert } };
});

// Component tests render pieces of screens rather than whole trees, so there is no provider
// above them to report real insets. Individual tests override this when the inset values
// themselves are what is under test.
jest.mock('react-native-safe-area-context', () => {
  const { View } = jest.requireActual<typeof import('react-native')>('react-native');
  const insets = { top: 47, bottom: 34, left: 0, right: 0 };
  return {
    useSafeAreaInsets: () => insets,
    SafeAreaView: View,
    SafeAreaProvider: View,
    initialWindowMetrics: { frame: { x: 0, y: 0, width: 393, height: 852 }, insets },
  };
});

// The real icon set loads its font asynchronously and calls setState when that lands, which
// arrives outside any act() and drowns component tests in warnings. A host component with the
// same props renders the same shape as far as a test can tell.
jest.mock('@expo/vector-icons', () => {
  const icon = 'Icon';
  return new Proxy({} as Record<string, unknown>, { get: () => icon });
});

// expo-image installs a global observer at import time that has no counterpart in the Jest
// environment. Component tests only need it to render something with the same props.
jest.mock('expo-image', () => {
  const { Image } = jest.requireActual<typeof import('react-native')>('react-native');
  return { Image };
});

jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(() => Promise.resolve({ canceled: true, assets: [] })),
  MediaTypeOptions: { Images: 'Images' },
}));

// The address book has no counterpart in the Jest environment. Defaults to "refused", which is
// the path the companion field has to keep working on. Shaped like expo-contacts 57's current
// API — `Contact.getAllDetails`, not the legacy `getContactsAsync`, which is a stub that throws.
jest.mock('expo-contacts', () => ({
  ContactField: { FULL_NAME: 'fullName' },
  ContactsSortOrder: { GivenName: 'givenName' },
  Contact: { getAllDetails: jest.fn(() => Promise.resolve([])) },
  requestPermissionsAsync: jest.fn(() =>
    Promise.resolve({ granted: false, canAskAgain: true, status: 'denied' })
  ),
  getPermissionsAsync: jest.fn(() =>
    Promise.resolve({ granted: false, canAskAgain: true, status: 'undetermined' })
  ),
}));

jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  getCurrentPositionAsync: jest.fn(() =>
    Promise.resolve({ coords: { latitude: 0, longitude: 0 } }),
  ),
  hasServicesEnabledAsync: jest.fn(() => Promise.resolve(true)),
}));
