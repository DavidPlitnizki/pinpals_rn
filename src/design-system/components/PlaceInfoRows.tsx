import { Ionicons } from '@expo/vector-icons';
import React, { useCallback } from 'react';
import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Colors, Spacing, Typography } from '../tokens';

export interface PlaceInfo {
  address?: string;
  phone?: string;
  website?: string;
  latitude?: number;
  longitude?: number;
}

interface Props {
  info: PlaceInfo;
  compact?: boolean;
}

function Row({
  icon,
  text,
  onPress,
  compact,
  lines,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  text: string;
  onPress?: () => void;
  compact?: boolean;
  lines: number;
}) {
  const textStyle = [compact ? styles.textCompact : styles.text, onPress ? styles.link : null];
  const content = (
    <>
      <Ionicons
        name={icon}
        size={compact ? 14 : 18}
        color={onPress ? Colors.brand.primary : Colors.neutral[500]}
      />
      <Text style={textStyle} numberOfLines={lines}>
        {text}
      </Text>
    </>
  );

  if (!onPress) return <View style={styles.row}>{content}</View>;
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      {content}
    </TouchableOpacity>
  );
}

// Every contact detail a place actually has — address, phone, website, coordinates — with the
// rows that can be acted on (call, open site) wired up. Shared by the place detail screen and
// the map callouts so both show the same set, and both simply omit what isn't known.
export function PlaceInfoRows({ info, compact }: Props) {
  const { address, phone, website, latitude, longitude } = info;

  const handleCall = useCallback(() => {
    if (phone) void Linking.openURL(`tel:${phone}`);
  }, [phone]);

  const handleOpenWebsite = useCallback(() => {
    if (website) void Linking.openURL(website);
  }, [website]);

  const hasCoords = latitude !== undefined && longitude !== undefined;
  if (!address && !phone && !website && !hasCoords) return null;

  return (
    <View style={compact ? styles.containerCompact : styles.container}>
      {address ? <Row icon="location-outline" text={address} compact={compact} lines={3} /> : null}
      {phone ? (
        <Row icon="call-outline" text={phone} onPress={handleCall} compact={compact} lines={1} />
      ) : null}
      {website ? (
        <Row
          icon="globe-outline"
          text={website.replace(/^https?:\/\//, '')}
          onPress={handleOpenWebsite}
          compact={compact}
          lines={1}
        />
      ) : null}
      {hasCoords ? (
        <Row
          icon="navigate-outline"
          text={`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`}
          compact={compact}
          lines={1}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.s12 },
  containerCompact: { gap: Spacing.s4, alignSelf: 'stretch' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s8,
  },
  text: {
    ...Typography.subheadline,
    color: Colors.neutral[700],
    flex: 1,
  },
  textCompact: {
    ...Typography.caption,
    color: Colors.neutral[600],
    flex: 1,
  },
  link: {
    color: Colors.brand.primary,
    fontWeight: '600',
  },
});
