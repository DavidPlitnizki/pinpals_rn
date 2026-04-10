import { Ionicons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useEffect, useRef } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../tokens';

const PILL_HEIGHT = 56;
const SIDE_PADDING = 16;

const ICONS: Record<string, { active: string; inactive: string }> = {
  map: { active: 'map', inactive: 'map-outline' },
  remembrance: { active: 'bookmark', inactive: 'bookmark-outline' },
  profile: { active: 'person', inactive: 'person-outline' },
};

export default function AnimatedTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
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
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
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
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.neutral[100],
    alignItems: 'center',
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
