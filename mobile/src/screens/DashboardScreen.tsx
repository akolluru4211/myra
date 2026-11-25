import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useMobileAuth } from "../services/authContext";

interface DashboardTask {
  id: string;
  title: string;
  subtitle: string;
  points: number;
  icon: string;
  tabTarget?: "interviews" | "resumes" | "jobs" | "mentors";
  isUpcoming?: boolean;
}

export default function DashboardScreen({ navigation }: any) {
  const { profile, user, streakDays, totalPoints, isLoading, authError, retryAuth, refreshStats, signOut } = useMobileAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [activeTasks, setActiveTasks] = useState<DashboardTask[]>([]);
  const [hasLoadedTasks, setHasLoadedTasks] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshStats();
    setRefreshing(false);
  }, [refreshStats]);

  useEffect(() => {
    // Generate adaptive tasks according to student profile & target role
    const target = profile?.targetRole || profile?.target_role || "Software Engineering";
    const tasks: DashboardTask[] = [
      {
        id: "task-interview-1",
        title: "AI Mock Technical Interview",
        subtitle: `Calibrated to ${target} foundations • 5 min`,
        points: 40,
        icon: "🎙️",
        tabTarget: "interviews",
      },
      {
        id: "task-resume-1",
        title: "ATS Resume Keyword Calibration",
        subtitle: "Align project bullets to industry standards • 3 min",
        points: 20,
        icon: "📄",
        tabTarget: "resumes",
      },
      {
        id: "task-upcoming-portfolio",
        title: "Portfolio Project Review",
        subtitle: "Automated codebase inspection & rubric rating",
        points: 50,
        icon: "✨",
        isUpcoming: true,
      },
    ];
    setActiveTasks(tasks);
    setHasLoadedTasks(true);
  }, [profile]);

  // Loading Skeleton State
  if (isLoading && !profile) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#059669" />
          <Text style={styles.loadingText}>Loading student profile &amp; statistics...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error State with Retry
  if (authError && !profile) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Failed to Load Dashboard</Text>
          <Text style={styles.errorDescription}>{authError}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={retryAuth} activeOpacity={0.8}>
            <Text style={styles.retryButtonText}>Retry Connection</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isMinor = profile?.age_band === "13-15" || profile?.age_band === "16-18";
  const studentName = profile?.name || user?.name || "Student";
  const trackLabel = isMinor ? `${profile?.age_band || "13-18"} Track` : "Career Track (18+)";

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#059669" />}
      >
        {/* Header Bar */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>STUDENT DASHBOARD</Text>
            <Text style={styles.userName}>{studentName}</Text>
          </View>
          <View style={[styles.badge, isMinor ? styles.minorBadge : styles.adultBadge]}>
            <Text style={[styles.badgeText, isMinor ? styles.minorBadgeText : styles.adultBadgeText]}>
              {trackLabel}
            </Text>
          </View>
        </View>

        {/* Primary Action Card (Single green primary call-to-action per screen guidelines) */}
        <View style={styles.primaryActionCard}>
          <View style={styles.primaryActionHeader}>
            <Text style={styles.primaryActionTag}>TODAY&apos;S PRIMARY GOAL</Text>
            <Text style={styles.primaryActionTitle}>AI Interview Practice</Text>
            <Text style={styles.primaryActionSubtitle}>
              Complete a 5-minute targeted AI session to keep your streak active.
            </Text>
          </View>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation?.navigate("interviews")}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>Start Practice (+40 XP)</Text>
          </TouchableOpacity>
        </View>

        {/* Streak & Skill Points Card (Displaying real data, showing 0 when 0) */}
        <View style={styles.statsCard}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>CURRENT STREAK</Text>
            <Text style={styles.statValue}>🔥 {streakDays} {streakDays === 1 ? "Day" : "Days"}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>SKILL POINTS</Text>
            <Text style={styles.statValue}>⚡ {totalPoints} XP</Text>
          </View>
        </View>

        {/* Today's Adaptive Tasks */}
        <Text style={styles.sectionTitle}>ADAPTIVE PRACTICE SESSIONS</Text>

        {!hasLoadedTasks || activeTasks.length === 0 ? (
          <View style={styles.emptyStateCard}>
            <Text style={styles.emptyStateTitle}>No Activities Scheduled</Text>
            <Text style={styles.emptyStateSubtitle}>
              You have completed all planned practice sessions for today. Pull down to refresh.
            </Text>
          </View>
        ) : (
          activeTasks.map((task) => (
            <TouchableOpacity
              key={task.id}
              style={[styles.taskCard, task.isUpcoming && styles.taskCardUpcoming]}
              onPress={() => {
                if (task.tabTarget) {
                  navigation?.navigate(task.tabTarget);
                }
              }}
              activeOpacity={task.isUpcoming ? 1 : 0.7}
              disabled={task.isUpcoming}
            >
              <View style={styles.taskIconContainer}>
                <Text style={styles.taskIcon}>{task.icon}</Text>
              </View>
              <View style={styles.taskContent}>
                <View style={styles.taskTitleRow}>
                  <Text style={styles.taskTitle}>{task.title}</Text>
                  {task.isUpcoming && (
                    <View style={styles.upcomingBadge}>
                      <Text style={styles.upcomingBadgeText}>Upcoming</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.taskSubtitle}>{task.subtitle}</Text>
              </View>
              {!task.isUpcoming && (
                <Text style={styles.taskPoints}>+{task.points} XP</Text>
              )}
            </TouchableOpacity>
          ))
        )}

        {/* Career & Networking Section (18+ only) */}
        {!isMinor && (
          <>
            <Text style={styles.sectionTitle}>CAREER DISCOVERY</Text>
            <View style={styles.row}>
              <TouchableOpacity
                style={[styles.actionCard, { marginRight: 8 }]}
                onPress={() => navigation?.navigate("jobs")}
                activeOpacity={0.8}
              >
                <Text style={styles.actionIcon}>💼</Text>
                <Text style={styles.actionTitle}>Job Board</Text>
                <Text style={styles.actionSubtitle}>Verified opportunities</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionCard, { marginLeft: 8 }]}
                onPress={() => navigation?.navigate("mentors")}
                activeOpacity={0.8}
              >
                <Text style={styles.actionIcon}>🤝</Text>
                <Text style={styles.actionTitle}>Mentors</Text>
                <Text style={styles.actionSubtitle}>Industry leaders</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Sign Out / Account Switch Action */}
        <TouchableOpacity style={styles.accountAction} onPress={signOut} activeOpacity={0.7}>
          <Text style={styles.accountActionText}>Sign Out ({studentName})</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#ffffff" },
  container: { padding: 20, paddingBottom: 40 },
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  loadingText: { marginTop: 12, fontSize: 13, color: "#64748b", fontWeight: "600" },
  errorIcon: { fontSize: 36, marginBottom: 8 },
  errorTitle: { fontSize: 18, fontWeight: "800", color: "#0f172a", marginBottom: 6 },
  errorDescription: { fontSize: 13, color: "#64748b", textAlign: "center", marginBottom: 16, lineHeight: 18 },
  retryButton: {
    backgroundColor: "#059669",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: { color: "#ffffff", fontSize: 13, fontWeight: "700" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  headerLeft: { flex: 1 },
  greeting: { fontSize: 11, color: "#059669", fontWeight: "800", letterSpacing: 0.8 },
  userName: { fontSize: 22, fontWeight: "900", color: "#0f172a", marginTop: 2 },
  badge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 16 },
  minorBadge: { backgroundColor: "#fef3c7" },
  adultBadge: { backgroundColor: "#ecfdf5" },
  badgeText: { fontSize: 11, fontWeight: "800" },
  minorBadgeText: { color: "#92400e" },
  adultBadgeText: { color: "#059669" },

  // Primary Call-To-Action Card
  primaryActionCard: {
    backgroundColor: "#0f172a",
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
  },
  primaryActionHeader: { marginBottom: 14 },
  primaryActionTag: { fontSize: 10, fontWeight: "800", color: "#34d399", letterSpacing: 0.8 },
  primaryActionTitle: { fontSize: 17, fontWeight: "900", color: "#ffffff", marginTop: 4 },
  primaryActionSubtitle: { fontSize: 12, color: "#94a3b8", marginTop: 4, lineHeight: 16 },
  primaryButton: {
    backgroundColor: "#059669",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  primaryButtonText: { color: "#ffffff", fontSize: 13, fontWeight: "800" },

  // Stats Card
  statsCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 12,
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 24,
  },
  statBox: { flex: 1, alignItems: "center" },
  statDivider: { width: 1, backgroundColor: "#e2e8f0" },
  statLabel: { fontSize: 10, fontWeight: "800", color: "#64748b", marginBottom: 4 },
  statValue: { fontSize: 16, fontWeight: "900", color: "#0f172a" },

  sectionTitle: { fontSize: 11, fontWeight: "800", color: "#64748b", letterSpacing: 0.8, marginBottom: 12 },
  emptyStateCard: {
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 16,
  },
  emptyStateTitle: { fontSize: 14, fontWeight: "800", color: "#0f172a", marginBottom: 4 },
  emptyStateSubtitle: { fontSize: 12, color: "#64748b", textAlign: "center", lineHeight: 16 },

  taskCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  taskCardUpcoming: {
    backgroundColor: "#f8fafc",
    borderColor: "#e2e8f0",
    opacity: 0.85,
  },
  taskIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  taskIcon: { fontSize: 18 },
  taskContent: { flex: 1 },
  taskTitleRow: { flexDirection: "row", alignItems: "center" },
  taskTitle: { fontSize: 13, fontWeight: "700", color: "#0f172a" },
  upcomingBadge: {
    backgroundColor: "#e2e8f0",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 6,
  },
  upcomingBadgeText: { fontSize: 9, fontWeight: "700", color: "#475569" },
  taskSubtitle: { fontSize: 11, color: "#64748b", marginTop: 2 },
  taskPoints: { fontSize: 12, fontWeight: "800", color: "#059669" },

  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20 },
  actionCard: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  actionIcon: { fontSize: 20, marginBottom: 6 },
  actionTitle: { fontSize: 13, fontWeight: "800", color: "#0f172a" },
  actionSubtitle: { fontSize: 11, color: "#64748b", marginTop: 2 },

  accountAction: {
    marginTop: 10,
    alignItems: "center",
    paddingVertical: 12,
  },
  accountActionText: { color: "#dc2626", fontSize: 12, fontWeight: "700" },
});
