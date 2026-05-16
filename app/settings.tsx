import { router } from "expo-router";
import { useContext } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthContext } from "../context/AuthContext";
import { ThemeContext } from "../context/ThemeContext";

export default function SettingsScreen() {
  const ctx = useContext(ThemeContext);
  const auth = useContext(AuthContext);

  if (!ctx) return null;

  const { theme } = ctx;

  const settingsItems = [
    {
      icon: "🎨",
      title: "Themes",
      subtitle: "Change app colors and premium themes",
      route: "/theme-settings",
    },
    {
      icon: "💎",
      title: "Pricing",
      subtitle:
        auth?.profile?.plan === "premium"
          ? "You are currently on Premium"
          : "Upgrade your plan and unlock premium features",
      route: "/pricing",
    },
    {
      icon: "👤",
      title: "Account",
      subtitle: auth?.profile?.first_name?.trim()
        ? `${auth.profile.first_name.trim()} • ${auth?.user?.email ?? ""}`
        : (auth?.user?.email ?? "Manage your account"),
      route: "/account-settings",
    },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.screen }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
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
              style={{ color: theme.text, fontSize: 28, fontWeight: "900" }}
            >
              Settings
            </Text>
            <Text style={{ color: theme.muted, marginTop: 4 }}>
              Manage your app preferences
            </Text>
          </View>
        </View>

        {settingsItems.map((item) => (
          <TouchableOpacity
            key={item.title}
            onPress={() => router.push(item.route as any)}
            activeOpacity={0.85}
            style={{
              backgroundColor: theme.card,
              borderColor: theme.border,
              borderWidth: 1,
              borderRadius: 18,
              padding: 16,
              marginBottom: 14,
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <View
              style={{
                width: 46,
                height: 46,
                borderRadius: 14,
                backgroundColor: theme.primarySoft,
                justifyContent: "center",
                alignItems: "center",
                marginRight: 14,
              }}
            >
              <Text style={{ fontSize: 22 }}>{item.icon}</Text>
            </View>

            <View style={{ flex: 1 }}>
              <Text
                style={{ color: theme.text, fontSize: 17, fontWeight: "900" }}
              >
                {item.title}
              </Text>
              <Text style={{ color: theme.muted, fontSize: 13, marginTop: 4 }}>
                {item.subtitle}
              </Text>
            </View>

            <Text style={{ color: theme.muted, fontSize: 22 }}>›</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
