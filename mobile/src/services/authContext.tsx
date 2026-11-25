import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../lib/supabase";
import { AppUser, UserProfile, DailyTask, SyncedAccountStats, SkillLevel, UserInterest } from "../types";
import {
  INITIAL_USER_ADULT,
  INITIAL_PROFILE_ADULT,
  INITIAL_USER_MINOR,
  INITIAL_PROFILE_MINOR,
  INITIAL_DAILY_TASKS,
  INITIAL_SYNCED_ACCOUNTS,
} from "./mockData";

export interface MobileStudentProfile {
  id: string;
  name?: string;
  email?: string;
  age_band?: "13-15" | "16-18" | "18+";
  target_role?: string;
  targetRole?: string;
  graduation_year?: string;
  gradeLevel?: string;
  onboarding_completed?: boolean;
  avatar_url?: string;
  bio?: string;
  headline?: string;
  isPublic?: boolean;
  primaryGoal?: string;
  interests?: UserInterest[];
}

export interface StudentStats {
  streakDays: number;
  totalPoints: number;
}

interface AuthContextType {
  // Session & Auth state
  user: AppUser | null;
  profile: MobileStudentProfile | null;
  stats: StudentStats;
  session: any | null;
  isLoading: boolean;
  authError: string | null;
  isLoggedIn: boolean;
  onboardingCompleted: boolean;
  isMinor: boolean;

  // Real actions
  loginWithEmail: (email: string, password?: string) => Promise<{ error?: string }>;
  signUpWithEmail: (name: string, email: string, password?: string, dob?: string) => Promise<{ error?: string }>;
  loginWithApple: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  completeOnboarding: (data: { targetRole: string; graduationYear?: string; ageBand?: string }) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  retryAuth: () => Promise<void>;
  refreshStats: () => Promise<void>;

  // Tool / Dashboard compatibility
  dailyTasks: DailyTask[];
  syncedAccounts: SyncedAccountStats;
  streakDays: number;
  totalPoints: number;
  toggleTask: (taskId: string) => void;
  updateEffectiveLevel: (interestId: string, level: SkillLevel) => void;
  switchPersona: (role: "adult" | "minor") => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const CACHE_KEY_PROFILE = "edworld_mobile_cached_profile";
const CACHE_KEY_STATS = "edworld_mobile_cached_stats";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<any | null>(null);
  const [user, setUser] = useState<AppUser | null>(null);
  const [profile, setProfile] = useState<MobileStudentProfile | null>(null);
  const [stats, setStats] = useState<StudentStats>({ streakDays: 0, totalPoints: 0 });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Fallback compatibility mock states
  const [dailyTasks, setDailyTasks] = useState<DailyTask[]>(INITIAL_DAILY_TASKS);
  const [syncedAccounts] = useState<SyncedAccountStats>(INITIAL_SYNCED_ACCOUNTS);

  const fetchProfileAndStats = useCallback(async (userId: string, userEmail?: string, userName?: string) => {
    try {
      // 1. Fetch Profile
      const { data: profileData, error: profileErr } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      let resolvedProfile: MobileStudentProfile;
      if (profileData && !profileErr) {
        resolvedProfile = {
          id: userId,
          name: profileData.name || profileData.full_name || userName || userEmail?.split("@")[0] || "Student",
          email: profileData.email || userEmail || "",
          age_band: profileData.age_band || "18+",
          target_role: profileData.target_role || profileData.targetRole || "",
          targetRole: profileData.target_role || profileData.targetRole || "",
          graduation_year: profileData.graduation_year || "",
          onboarding_completed: Boolean(profileData.onboarding_completed),
          avatar_url: profileData.avatar_url,
          bio: profileData.bio,
          headline: profileData.headline,
        };
      } else {
        // Fallback default profile if not in DB yet
        resolvedProfile = {
          id: userId,
          name: userName || userEmail?.split("@")[0] || "Student",
          email: userEmail || "",
          age_band: "18+",
          onboarding_completed: false,
        };
      }

      setProfile(resolvedProfile);
      await AsyncStorage.setItem(CACHE_KEY_PROFILE, JSON.stringify(resolvedProfile));

      // 2. Fetch Stats from user_stats or points
      let streak = 0;
      let points = 0;
      try {
        const { data: statsData } = await supabase
          .from("user_stats")
          .select("points, current_streak, streak_days")
          .eq("user_id", userId)
          .single();

        if (statsData) {
          streak = statsData.current_streak ?? statsData.streak_days ?? 0;
          points = statsData.points ?? 0;
        }
      } catch {
        // Fallback gracefully to 0
        streak = 0;
        points = 0;
      }

      const resolvedStats: StudentStats = { streakDays: streak, totalPoints: points };
      setStats(resolvedStats);
      await AsyncStorage.setItem(CACHE_KEY_STATS, JSON.stringify(resolvedStats));

      // Update AppUser
      setUser({
        uid: userId,
        name: resolvedProfile.name || "Student",
        email: resolvedProfile.email || "",
        ageBand: (resolvedProfile.age_band as any) || "18+",
        createdAt: new Date().toISOString(),
      });
      setAuthError(null);
    } catch (err: any) {
      console.warn("Failed to fetch student profile and stats:", err);
      // Attempt to load from offline cache
      const cachedProfile = await AsyncStorage.getItem(CACHE_KEY_PROFILE);
      const cachedStats = await AsyncStorage.getItem(CACHE_KEY_STATS);
      if (cachedProfile) {
        try {
          const parsed = JSON.parse(cachedProfile);
          setProfile(parsed);
          setUser({
            uid: userId,
            name: parsed.name || "Student",
            email: parsed.email || "",
            ageBand: (parsed.age_band as any) || "18+",
            createdAt: new Date().toISOString(),
          });
        } catch {}
      }
      if (cachedStats) {
        try {
          setStats(JSON.parse(cachedStats));
        } catch {}
      }
      setAuthError("Failed to load user profile. Please check your network connection.");
    }
  }, []);

  const restoreSession = useCallback(async () => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const { data: { session: currentSession }, error } = await supabase.auth.getSession();
      if (error) {
        setAuthError(error.message);
        setSession(null);
        setUser(null);
        setProfile(null);
      } else if (currentSession?.user) {
        setSession(currentSession);
        await fetchProfileAndStats(
          currentSession.user.id,
          currentSession.user.email,
          currentSession.user.user_metadata?.full_name || currentSession.user.user_metadata?.name
        );
      } else {
        setSession(null);
        setUser(null);
        setProfile(null);
      }
    } catch (err: any) {
      setAuthError(err.message || "Unable to restore session. Please retry.");
    } finally {
      setIsLoading(false);
    }
  }, [fetchProfileAndStats]);

  useEffect(() => {
    restoreSession();

    // Listen to Supabase auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (newSession?.user) {
        setSession(newSession);
        await fetchProfileAndStats(
          newSession.user.id,
          newSession.user.email,
          newSession.user.user_metadata?.full_name || newSession.user.user_metadata?.name
        );
        setIsLoading(false);
      } else {
        setSession(null);
        setUser(null);
        setProfile(null);
        setStats({ streakDays: 0, totalPoints: 0 });
        setIsLoading(false);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [restoreSession, fetchProfileAndStats]);

  const loginWithEmail = async (email: string, password?: string): Promise<{ error?: string }> => {
    setIsLoading(true);
    setAuthError(null);
    try {
      if (password) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          setIsLoading(false);
          setAuthError(error.message);
          return { error: error.message };
        }
        if (data.session) {
          setSession(data.session);
          await fetchProfileAndStats(data.user.id, data.user.email);
        }
      } else {
        // Fallback demo/dev mode if password omitted
        const mockUid = "demo-user-" + Math.abs(email.split("").reduce((a, b) => ((a << 5) - a + b.charCodeAt(0)) | 0, 0));
        const demoProfile: MobileStudentProfile = {
          id: mockUid,
          name: email.split("@")[0],
          email,
          age_band: "18+",
          onboarding_completed: true,
          targetRole: "Full Stack Developer",
        };
        setProfile(demoProfile);
        setUser({
          uid: mockUid,
          name: demoProfile.name || "Student",
          email,
          ageBand: "18+",
          createdAt: new Date().toISOString(),
        });
        setStats({ streakDays: 1, totalPoints: 50 });
      }
      setIsLoading(false);
      return {};
    } catch (err: any) {
      setIsLoading(false);
      const msg = err.message || "Sign in failed";
      setAuthError(msg);
      return { error: msg };
    }
  };

  const signUpWithEmail = async (
    name: string,
    email: string,
    password?: string,
    dob?: string
  ): Promise<{ error?: string }> => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const isUnder18 = dob ? dob > "2008-01-01" : false;
      const ageBand = isUnder18 ? "13-15" : "18+";

      if (password) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name,
              name,
              age_band: ageBand,
            },
          },
        });
        if (error) {
          setIsLoading(false);
          setAuthError(error.message);
          return { error: error.message };
        }
        if (data.user) {
          const newProfile: MobileStudentProfile = {
            id: data.user.id,
            name,
            email,
            age_band: ageBand,
            onboarding_completed: false,
          };
          setProfile(newProfile);
          setUser({
            uid: data.user.id,
            name,
            email,
            ageBand,
            createdAt: new Date().toISOString(),
          });
        }
      } else {
        // Fallback demo signup
        const mockUid = "demo-signup-" + Date.now();
        const demoProfile: MobileStudentProfile = {
          id: mockUid,
          name,
          email,
          age_band: ageBand,
          onboarding_completed: false,
        };
        setProfile(demoProfile);
        setUser({
          uid: mockUid,
          name,
          email,
          ageBand,
          createdAt: new Date().toISOString(),
        });
      }
      setIsLoading(false);
      return {};
    } catch (err: any) {
      setIsLoading(false);
      const msg = err.message || "Registration failed";
      setAuthError(msg);
      return { error: msg };
    }
  };

  const loginWithApple = async () => {
    // Demo/Production fallback
    setUser(INITIAL_USER_ADULT);
    setProfile({
      id: INITIAL_USER_ADULT.uid,
      name: INITIAL_USER_ADULT.name,
      email: INITIAL_USER_ADULT.email,
      age_band: "18+",
      onboarding_completed: true,
      targetRole: "Software Engineer",
    });
    setStats({ streakDays: 3, totalPoints: 120 });
    setIsLoading(false);
  };

  const loginWithGoogle = async () => {
    setUser(INITIAL_USER_ADULT);
    setProfile({
      id: INITIAL_USER_ADULT.uid,
      name: INITIAL_USER_ADULT.name,
      email: INITIAL_USER_ADULT.email,
      age_band: "18+",
      onboarding_completed: true,
      targetRole: "Software Engineer",
    });
    setStats({ streakDays: 3, totalPoints: 120 });
    setIsLoading(false);
  };

  const completeOnboarding = async (data: {
    targetRole: string;
    graduationYear?: string;
    ageBand?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    try {
      if (user?.uid) {
        // Save to Supabase profiles
        await supabase
          .from("profiles")
          .update({
            target_role: data.targetRole,
            graduation_year: data.graduationYear || null,
            age_band: data.ageBand || profile?.age_band || "18+",
            onboarding_completed: true,
            updated_at: new Date().toISOString(),
          })
          .eq("id", user.uid);
      }

      const updatedProfile: MobileStudentProfile = {
        ...(profile || { id: user?.uid || "user", email: user?.email || "" }),
        targetRole: data.targetRole,
        target_role: data.targetRole,
        graduation_year: data.graduationYear,
        age_band: (data.ageBand as any) || profile?.age_band || "18+",
        onboarding_completed: true,
      };

      setProfile(updatedProfile);
      await AsyncStorage.setItem(CACHE_KEY_PROFILE, JSON.stringify(updatedProfile));
      return { success: true };
    } catch (err: any) {
      console.warn("Failed to complete onboarding:", err);
      return { success: false, error: err.message || "Failed to save profile" };
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      await supabase.auth.signOut();
    } catch {}
    // Clear account-specific screen state and cached data
    await AsyncStorage.removeItem(CACHE_KEY_PROFILE);
    await AsyncStorage.removeItem(CACHE_KEY_STATS);
    setSession(null);
    setUser(null);
    setProfile(null);
    setStats({ streakDays: 0, totalPoints: 0 });
    setAuthError(null);
    setIsLoading(false);
  };

  const retryAuth = async () => {
    await restoreSession();
  };

  const refreshStats = async () => {
    if (user?.uid) {
      await fetchProfileAndStats(user.uid, user.email, user.name);
    }
  };

  const toggleTask = (taskId: string) => {
    setDailyTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const nextCompleted = !t.completed;
          if (nextCompleted) {
            setStats((s) => ({ ...s, streakDays: s.streakDays + 1, totalPoints: s.totalPoints + 20 }));
          }
          return { ...t, completed: nextCompleted };
        }
        return t;
      })
    );
  };

  const updateEffectiveLevel = (interestId: string, level: SkillLevel) => {
    // Compatibility
  };

  const switchPersona = (role: "adult" | "minor") => {
    if (role === "minor") {
      setUser(INITIAL_USER_MINOR);
      setProfile({
        ...INITIAL_PROFILE_MINOR,
        id: INITIAL_USER_MINOR.uid,
        name: INITIAL_USER_MINOR.name,
        email: INITIAL_USER_MINOR.email,
        age_band: "13-15",
        onboarding_completed: true,
      });
    } else {
      setUser(INITIAL_USER_ADULT);
      setProfile({
        ...INITIAL_PROFILE_ADULT,
        id: INITIAL_USER_ADULT.uid,
        name: INITIAL_USER_ADULT.name,
        email: INITIAL_USER_ADULT.email,
        age_band: "18+",
        onboarding_completed: true,
      });
    }
  };

  const isLoggedIn = Boolean(user);
  const onboardingCompleted = Boolean(profile?.onboarding_completed);
  const isMinor = profile?.age_band === "13-15" || profile?.age_band === "16-18";

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        stats,
        session,
        isLoading,
        authError,
        isLoggedIn,
        onboardingCompleted,
        isMinor,
        loginWithEmail,
        signUpWithEmail,
        loginWithApple,
        loginWithGoogle,
        completeOnboarding,
        signOut,
        retryAuth,
        refreshStats,
        dailyTasks,
        syncedAccounts,
        streakDays: stats.streakDays,
        totalPoints: stats.totalPoints,
        toggleTask,
        updateEffectiveLevel,
        switchPersona,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useMobileAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useMobileAuth must be used within an AuthProvider");
  }
  return context;
}
