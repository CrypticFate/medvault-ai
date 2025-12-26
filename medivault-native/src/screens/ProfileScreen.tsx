/**
 * MediVault AI - Profile Screen
 * Comprehensive user profile management with medical data
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import {
  User,
  Edit2,
  Save,
  X,
  Phone,
  Calendar as CalendarIcon,
  MapPin,
  Heart,
  Ruler,
  Weight,
  AlertCircle,
  Activity,
  Pill,
  Shield,
  Camera,
} from "lucide-react-native";
import { Header } from "../components/common";
import {
  colors,
  spacing,
  fontSize,
  fontWeight,
  borderRadius,
  shadows,
} from "../theme";
import { useAuthStore } from "../store/useAuthStore";
import { saveUserProfile } from "../services/firebaseDatabaseService";
import { UserProfile } from "../types";

/**
 * Profile screen component
 */
const ProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user, userProfile } = useAuthStore();

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState<Partial<UserProfile>>({});

  // Initialize form data from user profile
  useEffect(() => {
    if (userProfile) {
      setFormData(userProfile);
    }
  }, [userProfile]);

  const handleBack = () => {
    if (isEditing) {
      Alert.alert(
        "Discard Changes?",
        "You have unsaved changes. Are you sure you want to go back?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Discard",
            style: "destructive",
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setFormData(userProfile || {});
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!user?.uid) return;

    setIsSaving(true);
    try {
      const updatedProfile: UserProfile = {
        ...formData,
        uid: user.uid,
        email: user.email || formData.email || "",
        createdAt: userProfile?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as UserProfile;

      await saveUserProfile(updatedProfile);

      // Update auth store (will trigger re-fetch)
      const { useAuthStore: authStore } = require("../store/useAuthStore");
      const state = authStore.getState();
      state.userProfile = updatedProfile;

      Alert.alert("Success", "Profile updated successfully!");
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving profile:", error);
      Alert.alert("Error", "Failed to save profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const updateField = (field: keyof UserProfile, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const getInitials = () => {
    const name = formData.displayName || user?.displayName || "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const calculateAge = (dateOfBirth?: string) => {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age;
  };

  const memberSince = userProfile?.createdAt
    ? new Date(userProfile.createdAt).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      })
    : "Recently";

  return (
    <View style={styles.container}>
      <Header title="My Profile" onBack={handleBack} />

      {/* Edit Button - Absolute positioned */}
      {!isEditing && (
        <TouchableOpacity
          onPress={handleEdit}
          style={styles.editButtonAbsolute}
          activeOpacity={0.7}
        >
          <Edit2 size={20} color={colors.primary[600]} />
        </TouchableOpacity>
      )}

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={styles.headerCard}>
          <View style={styles.headerGradient} />
          <View style={styles.headerContent}>
            {/* Avatar */}
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{getInitials()}</Text>
              </View>
              {isEditing && (
                <TouchableOpacity
                  style={styles.cameraButton}
                  activeOpacity={0.8}
                >
                  <Camera size={16} color={colors.white} />
                </TouchableOpacity>
              )}
            </View>

            {/* User Info */}
            <Text style={styles.headerName}>
              {formData.displayName || user?.displayName || "User"}
            </Text>
            <Text style={styles.headerEmail}>{user?.email}</Text>
            <Text style={styles.headerMember}>Member since {memberSince}</Text>
          </View>
        </View>

        {/* Personal Information */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <User size={20} color={colors.primary[600]} />
            <Text style={styles.sectionTitle}>Personal Information</Text>
          </View>

          <View style={styles.card}>
            <InputField
              label="Full Name"
              value={formData.displayName || ""}
              onChangeText={(value) => updateField("displayName", value)}
              editable={isEditing}
              placeholder="Enter your full name"
            />
            <InputField
              label="Phone Number"
              value={formData.phone || ""}
              onChangeText={(value) => updateField("phone", value)}
              editable={isEditing}
              placeholder="+880 XXX-XXXXXXX"
              keyboardType="phone-pad"
              icon={<Phone size={16} color={colors.gray[400]} />}
            />
            <InputField
              label="Date of Birth"
              value={formData.dateOfBirth || ""}
              onChangeText={(value) => updateField("dateOfBirth", value)}
              editable={isEditing}
              placeholder="YYYY-MM-DD"
              icon={<CalendarIcon size={16} color={colors.gray[400]} />}
              caption={
                formData.dateOfBirth
                  ? `Age: ${calculateAge(formData.dateOfBirth)} years`
                  : undefined
              }
            />
            <SelectField
              label="Gender"
              value={formData.gender || ""}
              onChangeText={(value) => updateField("gender", value)}
              editable={isEditing}
              options={[
                { label: "Male", value: "male" },
                { label: "Female", value: "female" },
                { label: "Other", value: "other" },
                { label: "Prefer not to say", value: "prefer-not-to-say" },
              ]}
            />
            <InputField
              label="Address"
              value={formData.address || ""}
              onChangeText={(value) => updateField("address", value)}
              editable={isEditing}
              placeholder="Enter your address"
              multiline
              numberOfLines={2}
              icon={<MapPin size={16} color={colors.gray[400]} />}
            />
          </View>
        </View>

        {/* Medical Information */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Heart size={20} color={colors.red[500]} />
            <Text style={styles.sectionTitle}>Medical Information</Text>
          </View>

          <View style={styles.card}>
            <SelectField
              label="Blood Type"
              value={formData.bloodType || ""}
              onChangeText={(value) => updateField("bloodType", value)}
              editable={isEditing}
              options={[
                { label: "A+", value: "A+" },
                { label: "A-", value: "A-" },
                { label: "B+", value: "B+" },
                { label: "B-", value: "B-" },
                { label: "AB+", value: "AB+" },
                { label: "AB-", value: "AB-" },
                { label: "O+", value: "O+" },
                { label: "O-", value: "O-" },
              ]}
            />

            {/* Height */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Height</Text>
              <View style={styles.measurementRow}>
                <View style={styles.measurementInput}>
                  <TextInput
                    style={styles.input}
                    value={formData.height?.value?.toString() || ""}
                    onChangeText={(value) =>
                      updateField("height", {
                        value: parseFloat(value) || 0,
                        unit: formData.height?.unit || "cm",
                      })
                    }
                    editable={isEditing}
                    placeholder="0"
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.measurementUnit}>
                  <Text style={styles.unitText}>
                    {formData.height?.unit || "cm"}
                  </Text>
                </View>
              </View>
            </View>

            {/* Weight */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Weight</Text>
              <View style={styles.measurementRow}>
                <View style={styles.measurementInput}>
                  <TextInput
                    style={styles.input}
                    value={formData.weight?.value?.toString() || ""}
                    onChangeText={(value) =>
                      updateField("weight", {
                        value: parseFloat(value) || 0,
                        unit: formData.weight?.unit || "kg",
                      })
                    }
                    editable={isEditing}
                    placeholder="0"
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.measurementUnit}>
                  <Text style={styles.unitText}>
                    {formData.weight?.unit || "kg"}
                  </Text>
                </View>
              </View>
            </View>

            <InputField
              label="Known Allergies"
              value={formData.allergies || ""}
              onChangeText={(value) => updateField("allergies", value)}
              editable={isEditing}
              placeholder="List any allergies (medications, food, etc.)"
              multiline
              numberOfLines={2}
              icon={<AlertCircle size={16} color={colors.orange[500]} />}
            />
            <InputField
              label="Chronic Conditions"
              value={formData.chronicConditions || ""}
              onChangeText={(value) => updateField("chronicConditions", value)}
              editable={isEditing}
              placeholder="List any chronic health conditions"
              multiline
              numberOfLines={2}
              icon={<Activity size={16} color={colors.blue[500]} />}
            />
            <InputField
              label="Current Medications"
              value={formData.currentMedications || ""}
              onChangeText={(value) => updateField("currentMedications", value)}
              editable={isEditing}
              placeholder="List medications you're currently taking"
              multiline
              numberOfLines={2}
              icon={<Pill size={16} color={colors.purple[500]} />}
            />
          </View>
        </View>

        {/* Emergency Contact */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <AlertCircle size={20} color={colors.orange[500]} />
            <Text style={styles.sectionTitle}>Emergency Contact</Text>
          </View>

          <View style={styles.card}>
            <InputField
              label="Contact Name"
              value={formData.emergencyContactName || ""}
              onChangeText={(value) =>
                updateField("emergencyContactName", value)
              }
              editable={isEditing}
              placeholder="Emergency contact person"
            />
            <InputField
              label="Contact Phone"
              value={formData.emergencyContactPhone || ""}
              onChangeText={(value) =>
                updateField("emergencyContactPhone", value)
              }
              editable={isEditing}
              placeholder="+880 XXX-XXXXXXX"
              keyboardType="phone-pad"
              icon={<Phone size={16} color={colors.gray[400]} />}
            />
          </View>
        </View>

        {/* Insurance Information */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Shield size={20} color={colors.green[600]} />
            <Text style={styles.sectionTitle}>Insurance Information</Text>
          </View>

          <View style={styles.card}>
            <InputField
              label="Insurance Provider"
              value={formData.insuranceProvider || ""}
              onChangeText={(value) => updateField("insuranceProvider", value)}
              editable={isEditing}
              placeholder="Insurance company name"
            />
            <InputField
              label="Insurance ID / Policy Number"
              value={formData.insuranceId || ""}
              onChangeText={(value) => updateField("insuranceId", value)}
              editable={isEditing}
              placeholder="Policy or member ID"
            />
          </View>
        </View>

        {/* Edit Mode Buttons */}
        {isEditing && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleCancel}
              activeOpacity={0.8}
              disabled={isSaving}
            >
              <X size={20} color={colors.gray[600]} />
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={handleSave}
              activeOpacity={0.8}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <>
                  <Save size={20} color={colors.white} />
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Bottom padding */}
        <View style={{ height: spacing["8"] }} />
      </ScrollView>
    </View>
  );
};

// Reusable Input Field Component
const InputField: React.FC<{
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  editable: boolean;
  placeholder?: string;
  multiline?: boolean;
  numberOfLines?: number;
  keyboardType?: any;
  icon?: React.ReactNode;
  caption?: string;
}> = ({
  label,
  value,
  onChangeText,
  editable,
  placeholder,
  multiline,
  numberOfLines,
  keyboardType,
  icon,
  caption,
}) => {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View
        style={[
          styles.inputContainer,
          multiline && styles.inputContainerMultiline,
        ]}
      >
        {icon && <View style={styles.inputIcon}>{icon}</View>}
        <TextInput
          style={[styles.input, icon ? styles.inputWithIcon : undefined]}
          value={value}
          onChangeText={onChangeText}
          editable={editable}
          placeholder={placeholder}
          placeholderTextColor={colors.gray[400]}
          multiline={multiline}
          numberOfLines={numberOfLines}
          keyboardType={keyboardType}
          textAlignVertical={multiline ? "top" : "center"}
        />
      </View>
      {caption && <Text style={styles.fieldCaption}>{caption}</Text>}
    </View>
  );
};

// Reusable Select Field Component
const SelectField: React.FC<{
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  editable: boolean;
  options: Array<{ label: string; value: string }>;
}> = ({ label, value, onChangeText, editable, options }) => {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {editable ? (
        <View style={styles.optionsContainer}>
          {options.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.optionButton,
                value === option.value && styles.optionButtonSelected,
              ]}
              onPress={() => onChangeText(option.value)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.optionText,
                  value === option.value && styles.optionTextSelected,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={
              options.find((opt) => opt.value === value)?.label || "Not set"
            }
            editable={false}
            placeholderTextColor={colors.gray[400]}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing["6"],
  },
  editButton: {
    padding: spacing["2"],
  },
  editButtonAbsolute: {
    position: "absolute",
    top: 60,
    right: spacing["6"],
    zIndex: 10,
    padding: spacing["2"],
    backgroundColor: colors.white,
    borderRadius: borderRadius.full,
    ...shadows.md,
  },

  // Header Card
  headerCard: {
    backgroundColor: colors.primary[600],
    borderRadius: borderRadius["4xl"],
    padding: spacing["8"],
    marginBottom: spacing["6"],
    overflow: "hidden",
    ...shadows.lg,
  },
  headerGradient: {
    position: "absolute",
    top: -40,
    right: -40,
    width: 150,
    height: 150,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 75,
  },
  headerContent: {
    alignItems: "center",
    position: "relative",
    zIndex: 1,
  },
  avatarContainer: {
    marginBottom: spacing["4"],
    position: "relative",
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: "rgba(255,255,255,0.3)",
  },
  avatarText: {
    fontSize: fontSize["3xl"],
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  cameraButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary[700],
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.white,
  },
  headerName: {
    fontSize: fontSize["2xl"],
    fontWeight: fontWeight.bold,
    color: colors.white,
    marginBottom: spacing["1"],
  },
  headerEmail: {
    fontSize: fontSize.sm,
    color: colors.primary[100],
    marginBottom: spacing["1"],
  },
  headerMember: {
    fontSize: fontSize.xs,
    color: colors.primary[200],
    textTransform: "uppercase",
    letterSpacing: 1,
  },

  // Section
  section: {
    marginBottom: spacing["6"],
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing["2"],
    marginBottom: spacing["4"],
    paddingHorizontal: spacing["2"],
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },

  // Card
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius["3xl"],
    padding: spacing["5"],
    gap: spacing["4"],
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.border.light,
  },

  // Field Group
  fieldGroup: {
    gap: spacing["2"],
  },
  fieldLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semiBold,
    color: colors.text.primary,
    marginBottom: spacing["1"],
  },
  fieldCaption: {
    fontSize: fontSize.xs,
    color: colors.text.secondary,
    marginTop: spacing["1"],
  },

  // Input Container
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border.light,
    paddingHorizontal: spacing["4"],
    minHeight: 48,
  },
  inputContainerMultiline: {
    minHeight: 80,
    alignItems: "flex-start",
    paddingVertical: spacing["3"],
  },
  inputIcon: {
    marginRight: spacing["2"],
  },
  input: {
    flex: 1,
    fontSize: fontSize.base,
    color: colors.text.primary,
    paddingVertical: spacing["2"],
  },
  inputWithIcon: {
    paddingLeft: 0,
  },

  // Measurement Row
  measurementRow: {
    flexDirection: "row",
    gap: spacing["3"],
  },
  measurementInput: {
    flex: 1,
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border.light,
    paddingHorizontal: spacing["4"],
    minHeight: 48,
    justifyContent: "center",
  },
  measurementUnit: {
    width: 60,
    backgroundColor: colors.primary[50],
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.primary[200],
    alignItems: "center",
    justifyContent: "center",
  },
  unitText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semiBold,
    color: colors.primary[700],
  },

  // Options
  optionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing["2"],
  },
  optionButton: {
    paddingHorizontal: spacing["4"],
    paddingVertical: spacing["2"],
    borderRadius: borderRadius.xl,
    backgroundColor: colors.gray[100],
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  optionButtonSelected: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[600],
  },
  optionText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text.secondary,
  },
  optionTextSelected: {
    color: colors.primary[700],
    fontWeight: fontWeight.semiBold,
  },

  // Action Buttons
  actionButtons: {
    flexDirection: "row",
    gap: spacing["3"],
    marginTop: spacing["4"],
  },
  button: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing["2"],
    paddingVertical: spacing["4"],
    borderRadius: borderRadius.xl,
    ...shadows.sm,
  },
  cancelButton: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  cancelButtonText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semiBold,
    color: colors.gray[600],
  },
  saveButton: {
    backgroundColor: colors.primary[600],
  },
  saveButtonText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
});

export default ProfileScreen;
