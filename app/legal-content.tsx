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
import { ThemeContext } from "../context/ThemeContext";

type LegalSection = {
  title: string;
  body: string[];
};

type LegalScreenProps = {
  title: string;
  subtitle: string;
  lastUpdated: string;
  sections: LegalSection[];
};

const fallbackTheme = {
  screen: "#050914",
  card: "#111827",
  innerCard: "#0f172a",
  border: "#1f2937",
  text: "#ffffff",
  muted: "#94a3b8",
  primary: "#60a5fa",
  primarySoft: "rgba(96,165,250,0.16)",
};

export function LegalScreen({
  title,
  subtitle,
  lastUpdated,
  sections,
}: LegalScreenProps) {
  const themeContext = useContext(ThemeContext);
  const theme = themeContext?.theme ?? fallbackTheme;
  const { width } = useWindowDimensions();

  const isNarrowPhone = width < 380;
  const isTablet = width >= 768;
  const contentMaxWidth = isTablet ? 820 : width;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.screen }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          padding: isTablet ? 28 : 20,
          paddingBottom: 70,
        }}
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
                borderRadius: 16,
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
                  fontSize: isNarrowPhone ? 24 : 29,
                  fontWeight: "900",
                }}
              >
                {title}
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
                {subtitle}
              </Text>
            </View>
          </View>

          <View
            style={{
              backgroundColor: theme.card,
              borderColor: theme.border,
              borderWidth: 1,
              borderRadius: 24,
              padding: 18,
              marginBottom: 16,
              shadowColor: "#000",
              shadowOpacity: 0.08,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 6 },
              elevation: 2,
            }}
          >
            <Text
              style={{
                color: theme.primary,
                fontSize: 12,
                fontWeight: "900",
                textTransform: "uppercase",
                letterSpacing: 0.8,
                marginBottom: 8,
              }}
            >
              Last updated
            </Text>
            <Text
              style={{
                color: theme.text,
                fontSize: 18,
                lineHeight: 25,
                fontWeight: "900",
              }}
            >
              {lastUpdated}
            </Text>
            <Text
              style={{
                color: theme.muted,
                fontSize: 13,
                lineHeight: 21,
                fontWeight: "700",
                marginTop: 10,
              }}
            >
              These terms are written in simple language so users can understand
              how PIDA works before using the app.
            </Text>
          </View>

          {sections.map((section) => (
            <View
              key={section.title}
              style={{
                backgroundColor: theme.card,
                borderColor: theme.border,
                borderWidth: 1,
                borderRadius: 22,
                padding: 16,
                marginBottom: 14,
              }}
            >
              <Text
                style={{
                  color: theme.text,
                  fontSize: 18,
                  fontWeight: "900",
                  marginBottom: 10,
                }}
              >
                {section.title}
              </Text>

              {section.body.map((paragraph) => (
                <Text
                  key={paragraph}
                  style={{
                    color: theme.muted,
                    fontSize: 14,
                    lineHeight: 22,
                    fontWeight: "700",
                    marginBottom: 9,
                  }}
                >
                  {paragraph}
                </Text>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
