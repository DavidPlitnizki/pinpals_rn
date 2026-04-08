import { NativeTabs } from "expo-router/unstable-native-tabs";
import { Colors } from "../../design-system/tokens";

export default function TabLayout() {
  return (
    <NativeTabs tintColor={Colors.brand.primary}>
      <NativeTabs.Trigger name="map">
        <NativeTabs.Trigger.Icon sf="map" />
        <NativeTabs.Trigger.Label>Map</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="explore">
        <NativeTabs.Trigger.Icon sf="magnifyingglass" />
        <NativeTabs.Trigger.Label>Explore</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="my-places">
        <NativeTabs.Trigger.Icon sf="bookmark" />
        <NativeTabs.Trigger.Label>My Places</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Icon sf="person" />
        <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
