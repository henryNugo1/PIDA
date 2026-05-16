import { Session, User } from "@supabase/supabase-js";
import { createContext, ReactNode, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type SubscriptionStatus =
  | "none"
  | "trialing"
  | "active"
  | "cancelled"
  | "past_due"
  | "expired";

type Profile = {
  id: string;
  email: string | null;
  first_name: string | null;
  middle_name: string | null;
  last_name: string | null;
  gender: string | null;
  date_of_birth: string | null;
  plan: "free" | "premium";
  ai_credits: number;
  trial_started_at: string | null;
  trial_ends_at: string | null;
  trial_used: boolean;
  subscription_status: SubscriptionStatus;
  subscription_provider: string | null;
  subscription_id: string | null;
  customer_id: string | null;
  cancel_at_period_end: boolean;
  current_period_ends_at: string | null;
  billing_email: string | null;
  created_at: string | null;
};

type TrialStatus = {
  isTrialActive: boolean;
  isTrialExpired: boolean;
  trialDaysLeft: number;
  hasPremiumAccess: boolean;
  canStartTrial: boolean;
  subscriptionStatus: SubscriptionStatus;
  cancelAtPeriodEnd: boolean;
};

type AuthContextType = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  trialStatus: TrialStatus;
  refreshProfile: () => Promise<void>;
  signUp: (
    email: string,
    password: string,
    profileData: {
      first_name: string;
      middle_name?: string;
      last_name: string;
      gender?: string;
      date_of_birth?: string;
    },
  ) => Promise<{ error?: string }>;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
};

const defaultTrialStatus: TrialStatus = {
  isTrialActive: false,
  isTrialExpired: false,
  trialDaysLeft: 0,
  hasPremiumAccess: false,
  canStartTrial: false,
  subscriptionStatus: "none",
  cancelAtPeriodEnd: false,
};

const getTrialStatus = (profile: Profile | null): TrialStatus => {
  if (!profile) return defaultTrialStatus;

  const now = new Date();
  const subscriptionStatus = profile.subscription_status ?? "none";
  const cancelAtPeriodEnd = profile.cancel_at_period_end ?? false;

  const trialEnd = profile.trial_ends_at
    ? new Date(profile.trial_ends_at)
    : null;
  const currentPeriodEnd = profile.current_period_ends_at
    ? new Date(profile.current_period_ends_at)
    : null;

  const trialDiffMs = trialEnd ? trialEnd.getTime() - now.getTime() : 0;
  const isTrialActive = subscriptionStatus === "trialing" && trialDiffMs > 0;
  const isTrialExpired =
    Boolean(profile.trial_used) &&
    Boolean(trialEnd) &&
    trialDiffMs <= 0 &&
    subscriptionStatus !== "active";

  const trialDaysLeft = isTrialActive
    ? Math.max(0, Math.ceil(trialDiffMs / (1000 * 60 * 60 * 24)))
    : 0;

  const hasActivePaidAccess =
    profile.plan === "premium" && subscriptionStatus === "active";

  const hasCancelledAccess =
    subscriptionStatus === "cancelled" &&
    Boolean(currentPeriodEnd) &&
    currentPeriodEnd!.getTime() > now.getTime();

  const hasPremiumAccess =
    isTrialActive || hasActivePaidAccess || hasCancelledAccess;

  const canStartTrial =
    profile.plan === "free" &&
    subscriptionStatus === "none" &&
    !profile.trial_used;

  return {
    isTrialActive,
    isTrialExpired,
    trialDaysLeft,
    hasPremiumAccess,
    canStartTrial,
    subscriptionStatus,
    cancelAtPeriodEnd,
  };
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const trialStatus = getTrialStatus(profile);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      console.log("Fetch profile error:", error.message);
      setProfile(null);
      return;
    }

    setProfile(data as Profile);
  };

  const refreshProfile = async () => {
    if (!user) return;
    await fetchProfile(user.id);
  };

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const currentSession = data.session;
      const currentUser = currentSession?.user ?? null;

      setSession(currentSession);
      setUser(currentUser);

      if (currentUser) {
        await fetchProfile(currentUser.id);
      } else {
        setProfile(null);
      }

      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, currentSession) => {
        const currentUser = currentSession?.user ?? null;

        setSession(currentSession);
        setUser(currentUser);

        if (currentUser) {
          await fetchProfile(currentUser.id);
        } else {
          setProfile(null);
        }

        setLoading(false);
      },
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

const signUp = async (
  email: string,
  password: string,
  profileData: {
    first_name: string;
    middle_name?: string;
    last_name: string;
    gender?: string;
    date_of_birth?: string;
  },
) => {
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: profileData.first_name,
        middle_name: profileData.middle_name ?? null,
        last_name: profileData.last_name,
        gender: profileData.gender ?? null,
        date_of_birth: profileData.date_of_birth ?? null,
      },
    },
  });

  if (error) return { error: error.message };

  return {};
};


  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) return { error: error.message };
    return {};
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        trialStatus,
        refreshProfile,
        signUp,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
