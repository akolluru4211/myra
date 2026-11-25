import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useMobileAuth } from "../services/authContext";

const TARGET_ROLES = [
  "Software Engineer",
  "Full Stack Developer",
  "Data Scientist",
  "Frontend Engineer",
  "Backend Developer",
  "Product Designer",
];

export default function OnboardingScreen() {
  const { user, profile, completeOnboarding, signOut } = useMobileAuth();
  const [targetRole, setTargetRole] = useState(profile?.targetRole || profile?.target_role || "Software Engineer");
  const [graduationYear, setGraduationYear] = useState(profile?.graduation_year || "2026");
  const [isCustomRole, setIsCustomRole] = useState(false);
  const [customRole, setCustomRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    const chosenRole = isCustomRole ? customRole.trim() : targetRole;
    if (!chosenRole) {
      setError("Please select or enter your target career role.");
      return;
    }

    setLoading(true);
    setError(null);
    const res = await completeOnboarding({
      targetRole: chosenRole,
      graduationYear: graduationYear.trim(),
    });
    setLoading(false);
    if (!res.success) {
      setError(res.error || "Failed to save profile. Please retry.");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.stepTag}>STEP 1 OF 1</Text>
          <Text style={styles.title}>Complete Your Student Profile</Text>
          <Text style={styles.subtitle}>
            Welcome, {user?.name || "Student"}! Tell us your primary career track so Myra and your dashboard can personalize practice tasks.
          </Text>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Target Role Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Target Career Track</Text>
          <View style={styles.chipGrid}>
            {TARGET_ROLES.map((role) => {
              const selected = !isCustomRole && targetRole === role;
              return (
                <TouchableOpacity
                  key={role}
                  style={[styles.chip, selected && styles.chipSelected]}
                  onPress={() => {
                    setTargetRole(role);
                    setIsCustomRole(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                    {role}
                  </Text>
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity
              style={[styles.chip, isCustomRole && styles.chipSelected]}
              onPress={() => setIsCustomRole(true)}
              activeOpacity={0.7}
            >
              <Text style={[styles.chipText, isCustomRole && styles.chipTextSelected]}>
                + Other Role
              </Text>
            </TouchableOpacity>
          </View>

          {isCustomRole && (
            <TextInput
              style={styles.textInput}
              placeholder="e.g. AI Research Engineer"
              placeholderTextColor="#94a3b8"
              value={customRole}
              onChangeText={setCustomRole}
              autoFocus
            />
          )}
        </View>

        {/* Expected Graduation Year */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Expected Graduation / Passout Year</Text>
          <TextInput
            style={styles.textInput}
            placeholder="2026"
            placeholderTextColor="#94a3b8"
            keyboardType="number-pad"
            value={graduationYear}
            onChangeText={setGraduationYear}
          />
        </View>

        {/* Single Primary Action */}
        <TouchableOpacity
          style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
          onPress={handleSubmit}
          activeOpacity={0.8}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <Text style={styles.primaryButtonText}>Finish Setup &amp; Enter Dashboard</Text>
          )}
        </TouchableOpacity>

        {/* Sign Out Option */}
        <TouchableOpacity style={styles.signOutButton} onPress={signOut} activeOpacity={0.7}>
          <Text style={styles.signOutText}>Sign In with a Different Account</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#ffffff" },
  container: { padding: 24, justifyContent: "center", minHeight: "100%" },
  header: { marginBottom: 28 },
  stepTag: { fontSize: 11, fontWeight: "800", color: "#059669", letterSpacing: 1, marginBottom: 6 },
  title: { fontSize: 24, fontWeight: "900", color: "#0f172a", marginBottom: 8 },
  subtitle: { fontSize: 13, color: "#64748b", lineHeight: 20 },
  errorBox: {
    backgroundColor: "#fef2f2",
    borderColor: "#fecaca",
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
  },
  errorText: { color: "#dc2626", fontSize: 12, fontWeight: "600", textAlign: "center" },
  section: { marginBottom: 24 },
  sectionLabel: { fontSize: 13, fontWeight: "800", color: "#1e293b", marginBottom: 10 },
  chipGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#ffffff",
    marginBottom: 8,
    marginRight: 8,
  },
  chipSelected: {
    borderColor: "#059669",
    backgroundColor: "#ecfdf5",
  },
  chipText: { fontSize: 13, fontWeight: "600", color: "#475569" },
  chipTextSelected: { color: "#059669", fontWeight: "700" },
  textInput: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: "#0f172a",
    marginTop: 6,
  },
  primaryButton: {
    backgroundColor: "#059669", // Primary green button
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 8,
  },
  primaryButtonDisabled: { opacity: 0.6 },
  primaryButtonText: { color: "#ffffff", fontSize: 14, fontWeight: "800" },
  signOutButton: { alignItems: "center", marginTop: 18, paddingVertical: 8 },
  signOutText: { color: "#64748b", fontSize: 12, fontWeight: "600" },
});
