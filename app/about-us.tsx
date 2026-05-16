import { router } from "expo-router";
import { useContext } from "react";
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemeContext } from "../context/ThemeContext";

export default function AboutUsScreen() {
  const themeContext = useContext(ThemeContext);
  const theme = themeContext?.theme;
  const { width } = useWindowDimensions();

  const isNarrowPhone = width < 380;
  const isTablet = width >= 768;
  const isLargeTablet = width >= 1024;

  const contentMaxWidth = isLargeTablet ? 1000 : isTablet ? 860 : width;
  const screenPadding = isTablet ? 28 : 20;
  const cardPadding = isTablet ? 20 : 16;

  const UI = theme ?? {
    screen: "#111b30e6",
    card: "#111827",
    innerCard: "#0f172a",
    border: "#1f2937",
    text: "#ffffff",
    muted: "#94a3b8",
    primary: "#2563eb",
    primarySoft: "rgba(37,99,235,0.16)",
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: UI.screen }}>
      <ScrollView
        contentContainerStyle={{
          padding: screenPadding,
          paddingBottom: 60,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={{
            width: "100%",
            maxWidth: contentMaxWidth,
            alignSelf: "center",
          }}
        >
          <View
            style={{
              flexDirection: isNarrowPhone ? "column" : "row",
              alignItems: isNarrowPhone ? "flex-start" : "center",
              marginBottom: 20,
              gap: isNarrowPhone ? 12 : 0,
            }}
          >
            <TouchableOpacity
              onPress={() => router.back()}
              style={{
                backgroundColor: UI.card,
                padding: 10,
                borderRadius: 10,
                width: 50,
                alignItems: "center",
                borderWidth: 1,
                borderColor: UI.border,
                marginRight: isNarrowPhone ? 0 : 12,
              }}
            >
              <Text style={{ color: UI.text, fontWeight: "700" }}>←</Text>
            </TouchableOpacity>

            <View style={{ flexShrink: 1 }}>
              <Text
                style={{
                  color: UI.text,
                  fontSize: 28,
                  fontWeight: "800",
                  marginBottom: 6,
                }}
              >
                About Us
              </Text>

              <Text
                style={{
                  color: UI.muted,
                  fontSize: 14,
                  lineHeight: 22,
                }}
              >
                Learn more about GoalTracker Pro and where future updates will
                appear.
              </Text>
            </View>
          </View>

          <View
            style={{
              backgroundColor: UI.card,
              padding: cardPadding,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: UI.border,
              marginBottom: 18,
            }}
          >
            <Text
              style={{
                color: UI.text,
                fontSize: 18,
                fontWeight: "800",
                marginBottom: 10,
              }}
            >
              What GoalTracker Pro Does
            </Text>

            <Text
              style={{
                color: UI.muted,
                fontSize: 14,
                lineHeight: 22,
              }}
            >
              GoalTracker Pro helps you plan, track, and complete your goals
              based on real schedules and routines. You can create goals, assign
              time shifts, attach images, and stay organized as your routine
              grows.
            </Text>
          </View>

          <View
            style={{
              backgroundColor: UI.card,
              padding: cardPadding,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: UI.border,
            }}
          >
            <Text
              style={{
                color: UI.text,
                fontSize: 18,
                fontWeight: "800",
                marginBottom: 10,
              }}
            >
              Social Media (Coming Soon)
            </Text>

            <Text
              style={{
                color: UI.muted,
                fontSize: 14,
                lineHeight: 22,
                marginBottom: 14,
              }}
            >
              Your future social links and community updates can appear here.
            </Text>

            <View
              style={{
                backgroundColor: UI.innerCard,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: UI.border,
                padding: 14,
              }}
            >
              <Text style={{ color: UI.muted, marginBottom: 8 }}>
                Instagram
              </Text>
              <Text style={{ color: UI.muted, marginBottom: 8 }}>
                Twitter / X
              </Text>
              <Text style={{ color: UI.muted }}>LinkedIn</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
