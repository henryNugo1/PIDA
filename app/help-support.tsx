import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useContext, useState } from "react";
import {
  Alert,
  Linking,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthContext } from "../context/AuthContext";
import { ThemeContext } from "../context/ThemeContext";

const SUPPORT_EMAIL = "support@mypida.com";

const issueTypes = [
  "Billing or refund",
  "Credits or subscription",
  "Account access",
  "Report a problem",
  "Privacy or account deletion",
  "Something else",
];

export default function HelpSupportScreen() {
  const themeContext = useContext(ThemeContext);
  const auth = useContext(AuthContext);
  const { width } = useWindowDimensions();
  const [issueType, setIssueType] = useState(issueTypes[0]);
  const [message, setMessage] = useState("");

  if (!themeContext) return null;

  const { theme } = themeContext;
  const isNarrowPhone = width < 380;
  const accountEmail = auth?.user?.email ?? "Not signed in";

  const contactSupport = async () => {
    const subject = encodeURIComponent(`PIDA support: ${issueType}`);
    const body = encodeURIComponent(
      [
        `Account email: ${accountEmail}`,
        `Issue type: ${issueType}`,
        "Paddle transaction ID (for billing issues):",
        "",
        "What happened:",
        message.trim() || "Please describe the issue here.",
        "",
        "Please do not include card numbers, passwords, or security codes.",
      ].join("\n"),
    );
    const mailUrl = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;

    try {
      await Linking.openURL(mailUrl);
    } catch {
      Alert.alert(
        "Contact support",
        `Open your email app and send your message to ${SUPPORT_EMAIL}.`,
      );
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.screen }}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
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
            gap: 12,
            marginBottom: 18,
          }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            activeOpacity={0.78}
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
              style={{
                color: theme.text,
                fontSize: isNarrowPhone ? 24 : 28,
                fontWeight: "900",
              }}
            >
              Help & Support
            </Text>
            <Text
              style={{
                color: theme.muted,
                marginTop: 4,
                fontSize: 13,
                lineHeight: 18,
                fontWeight: "700",
              }}
            >
              We usually respond within 2 business days
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
            marginBottom: 16,
          }}
        >
          <Text style={{ color: theme.text, fontSize: 18, fontWeight: "900" }}>
            What can we help with?
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 9, marginTop: 14 }}>
            {issueTypes.map((type) => {
              const selected = issueType === type;
              return (
                <TouchableOpacity
                  key={type}
                  onPress={() => setIssueType(type)}
                  activeOpacity={0.82}
                  style={{
                    borderWidth: 1,
                    borderColor: selected ? theme.primary : theme.border,
                    backgroundColor: selected ? theme.primarySoft : theme.innerCard,
                    borderRadius: 14,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                  }}
                >
                  <Text
                    style={{
                      color: selected ? theme.primary : theme.text,
                      fontSize: 12,
                      fontWeight: "900",
                    }}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text
            style={{
              color: theme.muted,
              fontSize: 12,
              fontWeight: "900",
              marginTop: 18,
              marginBottom: 8,
              textTransform: "uppercase",
            }}
          >
            Tell us what happened
          </Text>
          <TextInput
            value={message}
            onChangeText={setMessage}
            multiline
            textAlignVertical="top"
            placeholder="Include what you expected, what happened, and any error message you saw."
            placeholderTextColor={theme.muted}
            style={{
              minHeight: 140,
              color: theme.text,
              backgroundColor: theme.innerCard,
              borderColor: theme.border,
              borderWidth: 1,
              borderRadius: 16,
              padding: 14,
              fontSize: 14,
              lineHeight: 21,
              fontWeight: "700",
            }}
          />

          <TouchableOpacity
            onPress={contactSupport}
            activeOpacity={0.86}
            style={{
              marginTop: 14,
              minHeight: 54,
              borderRadius: 16,
              backgroundColor: theme.primary,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 9,
            }}
          >
            <Feather name="mail" size={19} color={theme.screen} />
            <Text style={{ color: theme.screen, fontSize: 15, fontWeight: "900" }}>
              Email PIDA Support
            </Text>
          </TouchableOpacity>
        </View>

        <View
          style={{
            backgroundColor: theme.primarySoft,
            borderColor: theme.primary,
            borderWidth: 1,
            borderRadius: 18,
            padding: 15,
          }}
        >
          <Text style={{ color: theme.primary, fontSize: 14, fontWeight: "900" }}>
            Keep your account safe
          </Text>
          <Text
            style={{
              color: theme.muted,
              fontSize: 12,
              lineHeight: 19,
              fontWeight: "700",
              marginTop: 6,
            }}
          >
            PIDA support will never ask for your password, full card number, PIN,
            or one-time security code.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
