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
import SmoothModal from "../components/ui/SmoothModal";
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
  const [isOpeningEmail, setIsOpeningEmail] = useState(false);
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);

  if (!themeContext) return null;

  const { theme } = themeContext;
  const isNarrowPhone = width < 380;
  const accountEmail = auth?.user?.email ?? "Not signed in";
  const canContactSupport = message.trim().length > 0 && !isOpeningEmail;

  const contactSupport = async () => {
    if (!canContactSupport) return;

    const supportMessage = message.trim();
    const subject = encodeURIComponent(`PIDA support: ${issueType}`);
    const body = encodeURIComponent(
      [
        `Account email: ${accountEmail}`,
        `Issue type: ${issueType}`,
        "Paddle transaction ID (for billing issues):",
        "",
        "What happened:",
        supportMessage,
        "",
        "Please do not include card numbers, passwords, or security codes.",
      ].join("\n"),
    );
    const mailUrl = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;

    try {
      setIsOpeningEmail(true);
      await Linking.openURL(mailUrl);
      setMessage("");
      setShowEmailConfirmation(true);
    } catch {
      Alert.alert(
        "Contact support",
        `Open your email app and send your message to ${SUPPORT_EMAIL}.`,
      );
    } finally {
      setIsOpeningEmail(false);
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
            disabled={!canContactSupport}
            activeOpacity={0.86}
            accessibilityState={{ disabled: !canContactSupport }}
            style={{
              marginTop: 14,
              minHeight: 54,
              borderRadius: 16,
              backgroundColor: canContactSupport ? theme.primary : theme.innerCard,
              borderColor: canContactSupport ? theme.primary : theme.border,
              borderWidth: 1,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 9,
            }}
          >
            <Feather
              name="mail"
              size={19}
              color={canContactSupport ? theme.screen : theme.muted}
            />
            <Text
              style={{
                color: canContactSupport ? theme.screen : theme.muted,
                fontSize: 15,
                fontWeight: "900",
              }}
            >
              {isOpeningEmail ? "Opening email..." : "Email PIDA Support"}
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

      <SmoothModal
        visible={showEmailConfirmation}
        onRequestClose={() => setShowEmailConfirmation(false)}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            padding: 22,
            backgroundColor: "rgba(0,0,0,0.62)",
          }}
        >
          <View
            style={{
              width: "100%",
              maxWidth: 430,
              alignSelf: "center",
              backgroundColor: theme.card,
              borderColor: theme.border,
              borderWidth: 1,
              borderRadius: 22,
              padding: 20,
              shadowColor: "#000",
              shadowOpacity: 0.24,
              shadowRadius: 22,
              shadowOffset: { width: 0, height: 10 },
              elevation: 10,
            }}
          >
            <View
              style={{
                width: 52,
                height: 52,
                borderRadius: 18,
                backgroundColor: theme.primarySoft,
                borderColor: theme.primary,
                borderWidth: 1,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
              }}
            >
              <Feather name="check" size={25} color={theme.primary} />
            </View>

            <Text style={{ color: theme.text, fontSize: 22, fontWeight: "900" }}>
              Email ready
            </Text>
            <Text
              style={{
                color: theme.muted,
                fontSize: 14,
                lineHeight: 21,
                fontWeight: "700",
                marginTop: 8,
              }}
            >
              Your support message was prepared in your email app. Tap Send
              there to deliver it to PIDA Support.
            </Text>

            <TouchableOpacity
              onPress={() => setShowEmailConfirmation(false)}
              activeOpacity={0.86}
              accessibilityRole="button"
              style={{
                minHeight: 52,
                marginTop: 20,
                borderRadius: 15,
                backgroundColor: theme.primary,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{ color: theme.screen, fontSize: 15, fontWeight: "900" }}
              >
                Got it
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SmoothModal>
    </SafeAreaView>
  );
}
