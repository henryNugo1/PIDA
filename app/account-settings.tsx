import { router } from "expo-router";
import { useContext, useState } from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthContext } from "../context/AuthContext";
import { ThemeContext } from "../context/ThemeContext";

export default function AccountSettingsScreen() {
  const auth = useContext(AuthContext);
  const ctx = useContext(ThemeContext);

  if (!ctx) return null;

  const { theme } = ctx;
  const [signingOut, setSigningOut] = useState(false);
  const profile = auth?.profile;
  const displayName =
    profile?.first_name?.trim() ||
    [profile?.middle_name, profile?.last_name]
      .filter(Boolean)
      .join(" ")
      .trim() ||
    "User";

  const firstLetter = displayName.charAt(0).toUpperCase();
  const plan = profile?.plan ?? "free";
  const aiCredits = plan === "free" ? 0 : (profile?.ai_credits ?? 0);

  const handleSignOut = async () => {
    if (signingOut) return;

    if (!auth) {
      router.replace("/login");
      return;
    }

    try {
      setSigningOut(true);
      await auth.signOut();
      router.replace("/login");
    } catch (error: any) {
      console.log("SIGN OUT ERROR:", error);
      Alert.alert(
        "Sign Out Failed",
        error?.message ?? "Something went wrong while signing out.",
      );
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.screen }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 70 }}>
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 24,
          }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              backgroundColor: theme.card,
              borderWidth: 1,
              borderColor: theme.border,
              justifyContent: "center",
              alignItems: "center",
              marginRight: 12,
            }}
          >
            <Text style={{ color: theme.text, fontSize: 18 }}>←</Text>
          </TouchableOpacity>

          <View>
            <Text
              style={{ color: theme.text, fontSize: 26, fontWeight: "900" }}
            >
              Account
            </Text>
            <Text style={{ color: theme.muted, marginTop: 4 }}>
              Profile, plan and security
            </Text>
          </View>
        </View>

        {/* Profile Card */}
        <View
          style={{
            backgroundColor: theme.card,
            borderColor: theme.border,
            borderWidth: 1,
            borderRadius: 24,
            padding: 20,
            marginBottom: 16,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 22,
                backgroundColor: theme.primarySoft,
                justifyContent: "center",
                alignItems: "center",
                marginRight: 14,
                borderWidth: 1,
                borderColor: theme.primary,
              }}
            >
              <Text
                style={{
                  color: theme.primary,
                  fontSize: 28,
                  fontWeight: "900",
                }}
              >
                {firstLetter}
              </Text>
            </View>

            <View style={{ flex: 1 }}>
              <Text
                style={{ color: theme.text, fontSize: 21, fontWeight: "900" }}
              >
                {displayName}
              </Text>

              <Text style={{ color: theme.muted, marginTop: 5, fontSize: 13 }}>
                {auth?.user?.email ?? "No email found"}
              </Text>
            </View>
          </View>

          <View
            style={{
              marginTop: 18,
              alignSelf: "flex-start",
              backgroundColor: plan === "premium" ? "#f59e0b" : theme.innerCard,
              borderColor: plan === "premium" ? "#fbbf24" : theme.border,
              borderWidth: 1,
              borderRadius: 999,
              paddingVertical: 7,
              paddingHorizontal: 14,
            }}
          >
            <Text
              style={{
                color: plan === "premium" ? "#111827" : theme.text,
                fontWeight: "900",
                fontSize: 12,
                textTransform: "uppercase",
              }}
            >
              {plan} plan
            </Text>
          </View>
        </View>

        {/* Plan Card */}
        <View
          style={{
            backgroundColor: theme.card,
            borderColor: theme.border,
            borderWidth: 1,
            borderRadius: 22,
            padding: 18,
            marginBottom: 16,
          }}
        >
          <Text
            style={{
              color: theme.text,
              fontSize: 17,
              fontWeight: "900",
              marginBottom: 14,
            }}
          >
            Subscription
          </Text>

          <InfoRow icon="💎" label="Current Plan" value={plan} theme={theme} />
          <InfoRow
            icon="⚡"
            label="AI Credits"
            value={`${aiCredits} credits`}
            theme={theme}
          />

          <InfoRow
            icon="⏳"
            label="Trial Ends"
            value={
              profile?.trial_ends_at
                ? new Date(profile.trial_ends_at).toDateString()
                : "Not set"
            }
            theme={theme}
            last
          />

          <TouchableOpacity
            onPress={() => router.push("/pricing" as any)}
            style={{
              marginTop: 16,
              backgroundColor: theme.primary,
              paddingVertical: 14,
              borderRadius: 16,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "900" }}>
              Upgrade to Premium
            </Text>
          </TouchableOpacity>
        </View>

        {/* Personal Info */}
        <View
          style={{
            backgroundColor: theme.card,
            borderColor: theme.border,
            borderWidth: 1,
            borderRadius: 22,
            padding: 18,
            marginBottom: 16,
          }}
        >
          <Text
            style={{
              color: theme.text,
              fontSize: 17,
              fontWeight: "900",
              marginBottom: 14,
            }}
          >
            Personal Information
          </Text>

          <InfoRow
            icon="👤"
            label="First Name"
            value={profile?.first_name ?? "Not set"}
            theme={theme}
          />
          <InfoRow
            icon="👤"
            label="Middle Name"
            value={profile?.middle_name ?? "Not set"}
            theme={theme}
          />
          <InfoRow
            icon="👤"
            label="Last Name"
            value={profile?.last_name ?? "Not set"}
            theme={theme}
          />

          <InfoRow
            icon="🚻"
            label="Gender"
            value={profile?.gender ?? "Not set"}
            theme={theme}
          />
          <InfoRow
            icon="🎂"
            label="Date of Birth"
            value={profile?.date_of_birth ?? "Not set"}
            theme={theme}
            last
          />
        </View>

        {/* Security */}
        <View
          style={{
            backgroundColor: theme.card,
            borderColor: theme.border,
            borderWidth: 1,
            borderRadius: 22,
            padding: 18,
            marginBottom: 16,
          }}
        >
          <Text
            style={{
              color: theme.text,
              fontSize: 17,
              fontWeight: "900",
              marginBottom: 14,
            }}
          >
            Security
          </Text>

          <InfoRow
            icon="📧"
            label="Email"
            value={auth?.user?.email ?? "No email"}
            theme={theme}
            last
          />
        </View>

        {/* Sign Out */}
        <TouchableOpacity
          onPress={handleSignOut}
          disabled={signingOut}
          style={{
            backgroundColor: "#dc2626",
            padding: 16,
            borderRadius: 18,
            alignItems: "center",
            marginTop: 6,
            opacity: signingOut ? 0.6 : 1,
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "900", fontSize: 15 }}>
            {signingOut ? "Signing Out..." : "Sign Out"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({
  icon,
  label,
  value,
  theme,
  last,
}: {
  icon: string;
  label: string;
  value: string;
  theme: any;
  last?: boolean;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 13,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: theme.border,
      }}
    >
      <Text style={{ fontSize: 20, marginRight: 12 }}>{icon}</Text>

      <View style={{ flex: 1 }}>
        <Text style={{ color: theme.muted, fontSize: 12, fontWeight: "700" }}>
          {label}
        </Text>
        <Text
          style={{
            color: theme.text,
            marginTop: 4,
            fontSize: 15,
            fontWeight: "800",
          }}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}
