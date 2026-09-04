/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  setupFiles: ['./jest.setup.ts'],
  transformIgnorePatterns: [
    'node_modules/(?!(' +
      'expo|' +
      'expo-router|' +
      'expo-constants|' +
      // Component tests pull in the icon set, which reaches expo-font and expo-asset; both
      // ship untranspiled ESM.
      'expo-font|' +
      'expo-asset|' +
      'expo-web-browser|' +
      'expo-linking|' +
      'expo-clipboard|' +
      'expo-image-picker|' +
      'expo-file-system|' +
      'expo-location|' +
      'expo-modules-core|' +
      '@expo|' +
      'react-native|' +
      '@react-native|' +
      '@react-native-community|' +
      '@rnmapbox|' +
      'zustand|' +
      '@react-native-firebase' +
      ')/)',
  ],
  moduleNameMapper: {
    '^@react-native-async-storage/async-storage$':
      require.resolve('@react-native-async-storage/async-storage/jest/async-storage-mock'),
  },
};
