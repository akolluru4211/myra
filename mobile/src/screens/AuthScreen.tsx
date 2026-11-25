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

export default function AuthScreen() {
  const { loginWithApple, loginWithGoogle, loginWithEmail, signUpWithEmail, authError } = useMobileAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [dob, setDob] = useState("2003-05-15");
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const isUnder18 = dob > "2008-01-01";

  const handleSubmit = async () => {
    setLocalError(null);
    if (!email || !email.includes("@")) {
      setLocalError("Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setLocalError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    if (isSignUp) {
      const res = await signUpWithEmail(name || "Student", email, password, dob);
      if (res?.error) {
        setLocalError(res.error);
      }
    } else {
      const res = await loginWithEmail(email, password);
      if (res?.error) {
        setLocalError(res.error);
      }
    }
    setLoading(false);
  };

  const errorMessage = localError || authError;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.brandHeader}>
          <Text style={styles.brandLogo}>Edworld Co.</Text>
          <Text style={styles.tagline}>Personalized Career &amp; Skills Growth</Text>
        </View>

        <View style={styles.authCard}>
          <Text style={styles.authTitle}>{isSignUp ? "Create Your Account" : "Welcome Back"}</Text>
          <Text style={styles.authSubtitle}>
            {isSignUp ? "Sign up to track learning, mock interviews, and resumes." : "Sign in to access your dashboard and skills."}
          </Text>

          {errorMessage ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          {/* Apple Sign In */}
          <TouchableOpacity
            style={styles.appleButton}
            onPress={() => loginWithApple()}
            activeOpacity={0.8}
            disabled={loading}
          >
            <Text style={styles.appleButtonText}> Sign in with Apple</Text>
          </TouchableOpacity>

          {/* Google Sign In */}
          <TouchableOpacity
            style={styles.googleButton}
            onPress={() => loginWithGoogle()}
            activeOpacity={0.8}
            disabled={loading}
          >
            <Text style={styles.googleButtonText}>Continue with Google</Text>
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or continue with email</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Form fields */}
          {isSignUp && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Alex Rivera"
                placeholderTextColor="#94a3b8"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email Address</Text>
            <TextInput
              style={styles.textInput}
              placeholder="alex.rivera@example.com"
              placeholderTextColor="#94a3b8"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Password</Text>
            <TextInput
              style={styles.textInput}
              placeholder="••••••••"
              placeholderTextColor="#94a3b8"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          {isSignUp && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Date of Birth (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="2004-05-15"
                placeholderTextColor="#94a3b8"
                value={dob}
                onChangeText={setDob}
              />
              {isUnder18 && (
                <View style={styles.minorNotice}>
                  <Text style={styles.minorNoticeText}>
                    Class 9-12 Track: Safety guidelines apply with focused learning content.
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Primary Action Button (White, Black, Green styling) */}
          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            activeOpacity={0.8}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text style={styles.submitBtnText}>
                {isSignUp ? "Create Student Account" : "Sign In with Email"}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.toggleRow}
            onPress={() => {
              setIsSignUp(!isSignUp);
              setLocalError(null);
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.toggleText}>
              {isSignUp ? "Already have an account? Sign In" : "New to Edworld? Create Account"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#ffffff" },
  scrollContent: { padding: 24, justifyContent: "center", minHeight: "100%" },
  brandHeader: { alignItems: "center", marginBottom: 28 },
  brandLogo: { fontSize: 32, fontWeight: "900", color: "#0f172a", letterSpacing: -0.5 },
  tagline: { fontSize: 13, color: "#64748b", marginTop: 4, fontWeight: "500" },
  authCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  authTitle: { fontSize: 20, fontWeight: "800", color: "#0f172a", textAlign: "center", marginBottom: 4 },
  authSubtitle: { fontSize: 12, color: "#64748b", textAlign: "center", marginBottom: 20 },
  errorBanner: {
    backgroundColor: "#fef2f2",
    borderColor: "#fecaca",
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
  },
  errorText: { color: "#dc2626", fontSize: 12, fontWeight: "600", textAlign: "center" },
  appleButton: {
    backgroundColor: "#000000",
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 10,
  },
  appleButtonText: { color: "#ffffff", fontSize: 14, fontWeight: "700" },
  googleButton: {
    backgroundColor: "#f8fafc",
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    marginBottom: 16,
  },
  googleButtonText: { color: "#0f172a", fontSize: 14, fontWeight: "600" },
  dividerRow: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#e2e8f0" },
  dividerText: { fontSize: 11, color: "#94a3b8", marginHorizontal: 8, textTransform: "uppercase" },
  inputGroup: { marginBottom: 14 },
  inputLabel: { fontSize: 12, fontWeight: "700", color: "#334155", marginBottom: 6 },
  textInput: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: "#0f172a",
  },
  minorNotice: {
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#bbf7d0",
    padding: 8,
    borderRadius: 8,
    marginTop: 6,
  },
  minorNoticeText: { color: "#166534", fontSize: 11, fontWeight: "600" },
  submitBtn: {
    backgroundColor: "#059669", // Primary Green Action
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 14,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: "#ffffff", fontSize: 14, fontWeight: "800" },
  toggleRow: { alignItems: "center", paddingVertical: 6 },
  toggleText: { color: "#059669", fontSize: 12, fontWeight: "700" },
});
