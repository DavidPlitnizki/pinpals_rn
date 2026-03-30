import React from "react";
import { Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PinButton } from "../../../design-system/components/PinButton";
import { PinTextField } from "../../../design-system/components/PinTextField";
import { Colors, Radii, Spacing, Typography } from "../../../design-system/tokens";

interface Props {
  visible: boolean;
  noteText: string;
  notePhotoUri: string | undefined;
  onChangeText: (t: string) => void;
  onPickPhoto: () => void;
  onRemovePhoto: () => void;
  onSave: () => void;
  onClose: () => void;
}

export function AddNoteModal({
  visible,
  noteText,
  notePhotoUri,
  onChangeText,
  onPickPhoto,
  onRemovePhoto,
  onSave,
  onClose,
}: Props) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <View style={styles.header}>
          <Text style={styles.title}>Add Note</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancel}>Cancel</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
          <PinTextField
            label="Note"
            value={noteText}
            onChangeText={onChangeText}
            placeholder="Write your memory..."
            multiline
          />

          <View style={styles.photoSection}>
            {notePhotoUri ? (
              <View>
                <Image
                  source={{ uri: notePhotoUri }}
                  style={styles.previewPhoto}
                  resizeMode="cover"
                />
                <TouchableOpacity style={styles.removePhotoBtn} onPress={onRemovePhoto}>
                  <Text style={styles.removePhotoText}>Remove Photo</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <PinButton
                title="Add Photo"
                onPress={onPickPhoto}
                variant="secondary"
                fullWidth
              />
            )}
          </View>

          <PinButton title="Save Note" onPress={onSave} fullWidth size="lg" />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.neutral[50] },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.s20,
    paddingVertical: Spacing.s16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[100],
    backgroundColor: Colors.white,
  },
  title: { ...Typography.title3, color: Colors.neutral[900] },
  cancel: { ...Typography.body, color: Colors.brand.primary },
  content: { flex: 1, padding: Spacing.s20 },
  photoSection: { marginVertical: Spacing.s16 },
  previewPhoto: {
    width: "100%",
    height: 200,
    borderRadius: Radii.md,
    marginBottom: Spacing.s8,
  },
  removePhotoBtn: { alignItems: "center", marginBottom: Spacing.s8 },
  removePhotoText: { ...Typography.subheadline, color: Colors.error },
});
