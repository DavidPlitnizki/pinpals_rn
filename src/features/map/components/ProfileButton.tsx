import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Colors, Spacing, Typography } from "../../../design-system/tokens";
import { UserProfile } from "../../../models/types";
import { getInitials } from "../utils/getInitials";

interface Props {
  profile: UserProfile;
  onPress: () => void;
}

export function ProfileButton({ profile, onPress }: Props) {
  return (
    <SafeAreaView style={styles.wrap} pointerEvents="box-none">
      <TouchableOpacity style={styles.btn} onPress={onPress}>
        {profile.avatarUri ? (
          <Image source={{ uri: profile.avatarUri }} style={styles.avatar} />
        ) : (
          <Text style={styles.initials}>{getInitials(profile.name)}</Text>
        )}
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    top: 0,
    right: 0,
    paddingTop: Spacing.s16,
    paddingRight: Spacing.s16,
  },
  btn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.brand.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
    overflow: "hidden",
  },
  avatar: { width: 44, height: 44 },
  initials: {
    ...Typography.subheadline,
    color: Colors.white,
    fontWeight: "700",
  },
});
