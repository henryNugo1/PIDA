import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useContext } from "react";
import {
  ScrollView,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthContext } from "../context/AuthContext";
import { ThemeContext } from "../context/ThemeContext";

const paidPlans = ["mini", "standard", "premium"];

const formatPlanName = (plan?: string | null) => {
  if (plan === "mini") return "Mini Plan";
  if (plan === "standard") return "Standard Plan";
  if (plan === "premium") return "Premium Plan";
  return "Free Plan";
};

type SettingsItemProps = {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  subtitle: string;
  badge?: string;
  theme: any;
  onPress: () => void;
};

function SectionLabel({ children, theme }: { children: string; theme: any }) {
  return (
    <Text
      style={{
        color: theme.muted,
        fontSize: 12,
        fontWeight: "900",
        textTransform: "uppercase",
        letterSpacing: 0.8,
        marginBottom: 10,
        marginTop: 4,
      }}
    >
      {children}
    </Text>
  );
}

function SettingsItem({
  icon,
  title,
  subtitle,
  badge,
  theme,
  onPress,
}: SettingsItemProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.86}
      style={{
        backgroundColor: theme.card,
        borderColor: theme.border,
        borderWidth: 1,
        borderRadius: 20,
        padding: 15,
        marginBottom: 12,
        flexDirection: "row",
        alignItems: "center",
        gap: 13,
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 5 },
        elevation: 2,
      }}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 15,
          backgroundColor: theme.primarySoft,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Feather name={icon} size={20} color={theme.primary} />
      </View>

      <View style={{ flex: 1, minWidth: 0 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Text
            numberOfLines={1}
            style={{
              color: theme.text,
              fontSize: 16,
              fontWeight: "900",
              flexShrink: 1,
            }}
          >
            {title}
          </Text>

          {!!badge && (
            <View
              style={{
                backgroundColor: theme.primarySoft,
                borderColor: theme.primary,
                borderWidth: 1,
                borderRadius: 999,
                paddingHorizontal: 8,
                paddingVertical: 3,
              }}
            >
              <Text
                style={{
                  color: theme.primary,
                  fontSize: 10,
                  fontWeight: "900",
                }}
              >
                {badge}
              </Text>
            </View>
          )}
        </View>

        <Text
          numberOfLines={2}
          style={{
            color: theme.muted,
            fontSize: 12,
            lineHeight: 17,
            fontWeight: "700",
            marginTop: 4,
          }}
        >
          {subtitle}
        </Text>
      </View>

      <Feather name="chevron-right" size={18} color={theme.muted} />
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const ctx = useContext(ThemeContext);
  const auth = useContext(AuthContext);
  const { width } = useWindowDimensions();

  if (!ctx) return null;

  const { theme } = ctx;
  const isNarrowPhone = width < 380;
  const profile = auth?.profile;
  const plan = profile?.plan ?? "free";
  const isTrialActive = auth?.trialStatus.isTrialActive ?? false;
  const isPaidPlan = paidPlans.includes(plan);
  const displayName =
    profile?.first_name?.trim() || profile?.last_name?.trim() || "there";
  const email = auth?.user?.email ?? "No email found";
  const credits = profile?.ai_credits ?? 0;
  const planLabel = isTrialActive ? "Standard Trial" : formatPlanName(plan);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.screen }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          padding: isNarrowPhone ? 16 : 20,
          paddingBottom: 70,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 18,
            gap: 12,
          }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.78}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              backgroundColor: theme.card,
              borderWidth: 1,
              borderColor: theme.border,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Feather name="arrow-left" size={21} color={theme.text} />
          </TouchableOpacity>

          <View style={{ flex: 1, minWidth: 0 }}>
            <Text
              numberOfLines={1}
              style={{
                color: theme.text,
                fontSize: isNarrowPhone ? 25 : 28,
                fontWeight: "900",
              }}
            >
              Settings
            </Text>
            <Text
              numberOfLines={2}
              style={{
                color: theme.muted,
                marginTop: 4,
                fontSize: 13,
                lineHeight: 18,
                fontWeight: "700",
              }}
            >
              Account, pricing, credits and app preferences
            </Text>
          </View>
        </View>

        <View
          style={{
            backgroundColor: theme.card,
            borderColor: theme.border,
            borderWidth: 1,
            borderRadius: 22,
            padding: 16,
            marginBottom: 18,
            shadowColor: "#000",
            shadowOpacity: 0.08,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 6 },
            elevation: 2,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 13,
            }}
          >
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 19,
                backgroundColor: theme.primarySoft,
                borderColor: theme.primary,
                borderWidth: 1,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Feather name="user" size={24} color={theme.primary} />
            </View>

            <View style={{ flex: 1, minWidth: 0 }}>
              <Text
                numberOfLines={1}
                style={{
                  color: theme.text,
                  fontSize: 19,
                  fontWeight: "900",
                }}
              >
                Hi, {displayName}
              </Text>
              <Text
                numberOfLines={1}
                style={{
                  color: theme.muted,
                  fontSize: 12,
                  fontWeight: "700",
                  marginTop: 4,
                }}
              >
                {email}
              </Text>
            </View>
          </View>

          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 9,
              marginTop: 16,
            }}
          >
            <View
              style={{
                flexGrow: 1,
                flexBasis: isNarrowPhone ? "100%" : 135,
                backgroundColor: theme.innerCard,
                borderColor: theme.border,
                borderWidth: 1,
                borderRadius: 15,
                padding: 12,
              }}
            >
              <Text
                style={{
                  color: theme.muted,
                  fontSize: 11,
                  fontWeight: "900",
                  textTransform: "uppercase",
                  letterSpacing: 0.7,
                }}
              >
                Current Plan
              </Text>
              <Text
                style={{
                  color: theme.text,
                  fontSize: 14,
                  fontWeight: "900",
                  marginTop: 5,
                }}
              >
                {planLabel}
              </Text>
            </View>

            <View
              style={{
                flexGrow: 1,
                flexBasis: isNarrowPhone ? "100%" : 135,
                backgroundColor:
                  isPaidPlan || isTrialActive
                    ? theme.primarySoft
                    : theme.innerCard,
                borderColor:
                  isPaidPlan || isTrialActive ? theme.primary : theme.border,
                borderWidth: 1,
                borderRadius: 15,
                padding: 12,
              }}
            >
              <Text
                style={{
                  color: isPaidPlan || isTrialActive ? theme.primary : theme.muted,
                  fontSize: 11,
                  fontWeight: "900",
                  textTransform: "uppercase",
                  letterSpacing: 0.7,
                }}
              >
                Goach Credits
              </Text>
              <Text
                style={{
                  color: isPaidPlan || isTrialActive ? theme.primary : theme.text,
                  fontSize: 14,
                  fontWeight: "900",
                  marginTop: 5,
                }}
              >
                {credits} available
              </Text>
            </View>
          </View>
        </View>

        <SectionLabel theme={theme}>Account</SectionLabel>

        <SettingsItem
          icon="user"
          title="Account"
          subtitle="Profile, sign out and account security"
          theme={theme}
          onPress={() => router.push("/account-settings" as any)}
        />

        <SectionLabel theme={theme}>Billing</SectionLabel>

        <SettingsItem
          icon="credit-card"
          title="Plans and Pricing"
          subtitle="Choose or change your monthly Goach plan"
          badge={isPaidPlan || isTrialActive ? planLabel : undefined}
          theme={theme}
          onPress={() => router.push("/pricing" as any)}
        />

        <SettingsItem
          icon="zap"
          title="Credit Packs"
          subtitle="Buy one-time Goach credits without changing your plan"
          theme={theme}
          onPress={() =>
            router.push(
              { pathname: "/pricing", params: { tab: "credits" } } as any,
            )
          }
        />

        <SectionLabel theme={theme}>Preferences</SectionLabel>

        <SettingsItem
          icon="bell"
          title="Reminders"
          subtitle="Manage mindset reminders and notification timing"
          theme={theme}
          onPress={() => router.push("/reminder" as any)}
        />

        <SettingsItem
          icon="sun"
          title="Appearance"
          subtitle="Switch between Daylight and Carbon Black"
          theme={theme}
          onPress={() => router.push("/theme-settings" as any)}
        />

        <SectionLabel theme={theme}>Records</SectionLabel>

        <SettingsItem
          icon="archive"
          title="History"
          subtitle="View completed and failed goals"
          theme={theme}
          onPress={() => router.push("/history" as any)}
        />

        <SectionLabel theme={theme}>App</SectionLabel>

        <SettingsItem
          icon="info"
          title="About"
          subtitle="Learn what this app is built to help you do"
          theme={theme}
          onPress={() => router.push("/about-us" as any)}
        />

        <SettingsItem
          icon="shield"
          title="Privacy Policy"
          subtitle="How PIDA handles account, goal and payment data"
          theme={theme}
          onPress={() => router.push("/privacy-policy" as any)}
        />

        <SettingsItem
          icon="file-text"
          title="Terms of Service"
          subtitle="The rules for using PIDA and Goach"
          theme={theme}
          onPress={() => router.push("/terms-of-service" as any)}
        />

        <SettingsItem
          icon="rotate-ccw"
          title="Refund Policy"
          subtitle="Subscriptions, top-ups and cancellation rules"
          theme={theme}
          onPress={() => router.push("/refund-policy" as any)}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
