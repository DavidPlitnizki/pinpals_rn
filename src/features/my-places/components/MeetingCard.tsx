import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { PinCard } from "../../../design-system/components/PinCard";
import { Colors, Radii, Spacing, Typography } from "../../../design-system/tokens";
import { Meeting } from "../../../models/types";

interface Props {
  meeting: Meeting;
}

export function MeetingCard({ meeting }: Props) {
  const date = new Date(meeting.date);
  return (
    <PinCard style={styles.card}>
      <View style={styles.row}>
        <View style={styles.dateBox}>
          <Text style={styles.day}>{date.getDate()}</Text>
          <Text style={styles.month}>
            {date.toLocaleString("default", { month: "short" })}
          </Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={1}>
            {meeting.title}
          </Text>
          {meeting.description ? (
            <Text style={styles.description} numberOfLines={1}>
              {meeting.description}
            </Text>
          ) : null}
          <Text style={styles.time}>
            {date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </Text>
        </View>
      </View>
    </PinCard>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: Spacing.s8 },
  row: { flexDirection: "row", alignItems: "center", gap: Spacing.s12 },
  dateBox: {
    width: 48,
    height: 48,
    borderRadius: Radii.sm,
    backgroundColor: Colors.brand.light,
    alignItems: "center",
    justifyContent: "center",
  },
  day: { ...Typography.headline, color: Colors.brand.dark, lineHeight: 20 },
  month: {
    ...Typography.caption,
    color: Colors.brand.primary,
    textTransform: "uppercase",
  },
  info: { flex: 1 },
  title: { ...Typography.headline, color: Colors.neutral[900], marginBottom: 2 },
  description: { ...Typography.subheadline, color: Colors.neutral[500], marginBottom: 2 },
  time: { ...Typography.caption, color: Colors.neutral[400] },
});
