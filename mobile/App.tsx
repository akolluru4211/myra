import React, { useState } from "react";
import { StatusBar } from "expo-status-bar";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import { AuthProvider, useMobileAuth } from "./src/services/authContext";
import AuthScreen from "./src/screens/AuthScreen";
import OnboardingScreen from "./src/screens/OnboardingScreen";
import DashboardScreen from "./src/screens/DashboardScreen";
import ResumeViewerScreen from "./src/screens/ResumeViewerScreen";
import InterviewStudioScreen from "./src/screens/InterviewStudioScreen";
import JobBoardScreen from "./src/screens/JobBoardScreen";
import NetworkingScreen from "./src/screens/NetworkingScreen";

export type MobileTab = "dashboard" | "resumes" | "interviews" | "jobs" | "mentors";

function AppRootContent() {
  const { user, profile, isLoading, authError, retryAuth } = useMobileAuth();
  const [currentTab, setCurrentTab] = useState<MobileTab>("dashboard");

  // 1. Initial Session Restoration Loading State
  if (isLoading && !user && !profile) {
    return (
      <SafeAreaView style={styles.splashContainer}>
        <StatusBar style="dark" />
        <View style={styles.splashContent}>
          <Text style={styles.splashLogo}>Edworld Co.</Text>
          <Text style={styles.splashTagline}>Personalized Career &amp; Skills Growth</Text>
          <ActivityIndicator size="large" color="#059669" style={styles.splashSpinner} />
          <Text style={styles.splashLoadingNote}>Restoring session...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // 2. Retryable Error State when connection/session restore fails
  if (authError && !user && !profile) {
    return (
      <SafeAreaView style={styles.splashContainer}>
        <StatusBar style="dark" />
        <View style={styles.splashContent}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Unable to Connect</Text>
          <Text style={styles.errorDescription}>{authError}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={retryAuth} activeOpacity={0.8}>
            <Text style={styles.retryButtonText}>Retry Connection</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // 3. Unauthenticated State -> Show Sign In / Auth Screen
  if (!user) {
    return (
      <View style={styles.fullScreen}>
        <StatusBar style="dark" />
        <AuthScreen />
      </View>
    );
  }

  // 4. Incomplete Setup -> Show Onboarding Screen
  const onboardingCompleted = Boolean(profile?.onboarding_completed);
  if (!onboardingCompleted) {
    return (
      <View style={styles.fullScreen}>
        <StatusBar style="dark" />
        <OnboardingScreen />
      </View>
    );
  }

  // 5. Authenticated & Onboarded -> Show Student Shell with Tabs
  const renderScreen = () => {
    switch (currentTab) {
      case "dashboard":
        return <DashboardScreen navigation={{ navigate: (tab: MobileTab) => setCurrentTab(tab) }} />;
      case "resumes":
        return <ResumeViewerScreen />;
      case "interviews":
        return <InterviewStudioScreen />;
      case "jobs":
        return <JobBoardScreen />;
      case "mentors":
        return <NetworkingScreen />;
      default:
        return <DashboardScreen navigation={{ navigate: (tab: MobileTab) => setCurrentTab(tab) }} />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.mainContent}>{renderScreen()}</View>

      {/* Bottom Navigation Bar */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setCurrentTab("dashboard")}
          activeOpacity={0.7}
        >
          <Text style={styles.navIcon}>🏠</Text>
          <Text style={[styles.navText, currentTab === "dashboard" && styles.navActiveText]}>
            Home
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setCurrentTab("interviews")}
          activeOpacity={0.7}
        >
          <Text style={styles.navIcon}>🎙️</Text>
          <Text style={[styles.navText, currentTab === "interviews" && styles.navActiveText]}>
            Interview
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setCurrentTab("resumes")}
          activeOpacity={0.7}
        >
          <Text style={styles.navIcon}>📄</Text>
          <Text style={[styles.navText, currentTab === "resumes" && styles.navActiveText]}>
            Resumes
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setCurrentTab("jobs")}
          activeOpacity={0.7}
        >
          <Text style={styles.navIcon}>💼</Text>
          <Text style={[styles.navText, currentTab === "jobs" && styles.navActiveText]}>
            Jobs
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setCurrentTab("mentors")}
          activeOpacity={0.7}
        >
          <Text style={styles.navIcon}>🤝</Text>
          <Text style={[styles.navText, currentTab === "mentors" && styles.navActiveText]}>
            Mentors
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRootContent />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  fullScreen: { flex: 1, backgroundColor: "#ffffff" },
  container: { flex: 1, backgroundColor: "#ffffff" },
  mainContent: { flex: 1 },
  splashContainer: { flex: 1, backgroundColor: "#ffffff", justifyContent: "center", alignItems: "center" },
  splashContent: { alignItems: "center", padding: 24 },
  splashLogo: { fontSize: 32, fontWeight: "900", color: "#0f172a", letterSpacing: -0.5 },
  splashTagline: { fontSize: 13, color: "#64748b", marginTop: 4, fontWeight: "500" },
  splashSpinner: { marginTop: 28 },
  splashLoadingNote: { marginTop: 12, fontSize: 12, color: "#94a3b8", fontWeight: "600" },
  errorIcon: { fontSize: 40, marginBottom: 12 },
  errorTitle: { fontSize: 20, fontWeight: "800", color: "#0f172a", marginBottom: 6 },
  errorDescription: { fontSize: 13, color: "#64748b", textAlign: "center", marginBottom: 20, maxWidth: 300 },
  retryButton: {
    backgroundColor: "#059669",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: { color: "#ffffff", fontSize: 13, fontWeight: "700" },
  bottomNav: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingVertical: 10,
    backgroundColor: "#ffffff",
    justifyContent: "space-around",
  },
  navItem: { alignItems: "center" },
  navIcon: { fontSize: 18, marginBottom: 2 },
  navText: { fontSize: 10, fontWeight: "700", color: "#94a3b8" },
  navActiveText: { color: "#059669" },
});
