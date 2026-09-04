import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../tokens';

const PILL_HEIGHT = 56;
const SIDE_PADDING = 16;
const BORDER_WIDTH = 1;

// How tall the bar is above the safe area. Exported so anything that has to float clear of it
// — the onboarding hint that points down at a tab — does not have to guess.
export const TAB_BAR_HEIGHT = PILL_HEIGHT + BORDER_WIDTH;

const ICONS: Record<string, { active: string; inactive: string }> = {
  map: { active: 'map', inactive: 'map-outline' },
  remembrance: { active: 'bookmark', inactive: 'bookmark-outline' },
  profile: { active: 'person', inactive: 'person-outline' },
};

// Expo Router (SDK 56+) no longer allows importing `BottomTabBarProps` from
// `@react-navigation/bottom-tabs` in app code — this mirrors just the fields this
// component actually reads off the tabBar render-prop it's handed by expo-router's `Tabs`.
interface AnimatedTabBarProps {
  state: { index: number; routes: { key: string; name: string }[] };
  descriptors: Record<string, { options: { title?: string } }>;
  navigation: {
    emit: (event: { type: string; target: string; canPreventDefault: true }) => {
      defaultPrevented: boolean;
    };
    navigate: (name: string) => void;
  };
}

export default function AnimatedTabBar(props: AnimatedTabBarProps) {
  const { state, descriptors, navigation } = props;
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const tabCount = state.routes.length;
  const tabWidth = (width - SIDE_PADDING * 2) / tabCount;
  const pillWidth = tabWidth - 8;

  const pillX = useRef(new Animated.Value(state.index * tabWidth)).current;

  useEffect(() => {
    Animated.spring(pillX, {
      toValue: state.index * tabWidth,
      useNativeDriver: true,
      damping: 18,
      stiffness: 180,
      mass: 0.8,
    }).start();
  }, [state.index, tabWidth, pillX]);

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <View style={[styles.bar, { width: width - SIDE_PADDING * 2 }]}>
        {/* sliding pill */}
        <Animated.View
          style={[
            styles.pill,
            {
              width: pillWidth,
              transform: [{ translateX: pillX }],
              marginLeft: 4,
            },
          ]}
        />

        {/* tab items */}
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label = options.title ?? route.name;
          const isFocused = state.index === index;
          const iconSet = ICONS[route.name] ?? { active: 'ellipse', inactive: 'ellipse-outline' };

          const iconColor = isFocused ? Colors.brand.primary : Colors.neutral[400];

          function onPress() {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
          }

          return (
            <Pressable key={route.key} style={styles.tab} onPress={onPress} accessibilityRole="tab">
              <Ionicons
                name={(isFocused ? iconSet.active : iconSet.inactive) as never}
                size={22}
                color={iconColor}
              />
              <Text style={[styles.label, { color: iconColor }]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderTopWidth: BORDER_WIDTH,
    borderTopColor: Colors.neutral[200],
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  bar: {
    flexDirection: 'row',
    height: PILL_HEIGHT,
    marginHorizontal: SIDE_PADDING,
    position: 'relative',
  },
  pill: {
    position: 'absolute',
    height: PILL_HEIGHT - 8,
    top: 4,
    borderRadius: 14,
    backgroundColor: Colors.neutral[100],
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    zIndex: 1,
  },
  label: {
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
});
