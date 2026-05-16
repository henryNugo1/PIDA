import { router } from "expo-router";
import { ReactNode, useContext, useEffect, useRef, useState } from "react";
import {
  Animated,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthContext } from "../context/AuthContext";
import { ThemeContext } from "../context/ThemeContext";
import { themes } from "../utils/theme";

type ThemeOptionCardProps = {
  themeKeyName: string;
  value: any;
  selected: boolean;
  locked: boolean;
  onPress: () => void;
  children?: ReactNode;
};

function ThemeOptionCard({
  themeKeyName,
  value,
  selected,
  locked,
  onPress,
}: ThemeOptionCardProps) {
  const lavaPan = useRef(new Animated.Value(0)).current;
  const lavaPulse = useRef(new Animated.Value(0)).current;

  const showLavaPreview = value.effect === "lava" && value.cardBackgroundImage;

  useEffect(() => {
    if (!showLavaPreview) return;

    const panLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(lavaPan, {
          toValue: 1,
          duration: 8500,
          useNativeDriver: true,
        }),
        Animated.timing(lavaPan, {
          toValue: 0,
          duration: 8500,
          useNativeDriver: true,
        }),
      ]),
    );

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(lavaPulse, {
          toValue: 1,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(lavaPulse, {
          toValue: 0,
          duration: 2200,
          useNativeDriver: true,
        }),
      ]),
    );

    panLoop.start();
    pulseLoop.start();

    return () => {
      panLoop.stop();
      pulseLoop.stop();
    };
  }, [showLavaPreview, lavaPan, lavaPulse]);

  const lavaTranslateX = lavaPan.interpolate({
    inputRange: [0, 1],
    outputRange: [-14, 14],
  });

  const lavaScale = lavaPan.interpolate({
    inputRange: [0, 1],
    outputRange: [1.08, 1.16],
  });

  const lavaOpacity = lavaPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.74, 0.92],
  });

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={{
        backgroundColor: value.card,
        padding: 16,
        borderRadius: 18,
        marginBottom: 14,
        borderWidth: selected ? 2 : 1,
        borderColor: selected ? value.primary : value.border,
        overflow: "hidden",
      }}
    >
      {showLavaPreview && (
        <>
          <Animated.View
            pointerEvents="none"
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
            }}
          >
            <Animated.Image
              source={value.cardBackgroundImage}
              resizeMode="cover"
              fadeDuration={0}
              style={{
                position: "absolute",
                top: -10,
                right: -18,
                bottom: -10,
                left: -18,
                opacity: lavaOpacity,
                transform: [
                  { translateX: lavaTranslateX },
                  { scale: lavaScale },
                ],
              }}
            />
          </Animated.View>

          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
              backgroundColor: "rgba(8,5,4,0.48)",
            }}
          />
        </>
      )}

      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
        }}
      >
        <View>
          <Text
            style={{
              color: value.text,
              fontSize: 17,
              fontWeight: "900",
            }}
          >
            {value.name}
          </Text>

          <Text style={{ color: value.muted, marginTop: 4, fontSize: 13 }}>
            {selected
              ? "Currently active"
              : locked
                ? "Premium theme"
                : "Tap to apply"}
          </Text>
        </View>

        <Text
          style={{
            color: selected ? value.primary : value.muted,
            fontSize: 20,
          }}
        >
          {selected ? "✓" : locked ? "🔒" : ""}
        </Text>
      </View>

      <View style={{ flexDirection: "row", marginTop: 12 }}>
        {[value.screen, value.card, value.innerCard, value.primary].map(
          (color, index) => (
            <View
              key={`${themeKeyName}-${index}`}
              style={{
                width: 26,
                height: 26,
                borderRadius: 8,
                backgroundColor: color,
                marginRight: 8,
                borderWidth: 1,
                borderColor: value.border,
              }}
            />
          ),
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function ThemeSettingsScreen() {
  const ctx = useContext(ThemeContext);
  const auth = useContext(AuthContext);

  if (!ctx) return null;

  const { theme, themeKey, setTheme } = ctx;
  const hasPremiumAccess = auth?.trialStatus.hasPremiumAccess ?? false;
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.screen }}>
      {showPremiumModal && (
        <Modal transparent animationType="fade">
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.68)",
              justifyContent: "center",
              alignItems: "center",
              padding: 20,
            }}
          >
            <View
              style={{
                width: "100%",
                maxWidth: 420,
                backgroundColor: theme.card,
                borderRadius: 24,
                padding: 22,
                borderWidth: 1,
                borderColor: theme.primary,
              }}
            >
              <Text
                style={{
                  color: theme.text,
                  fontSize: 22,
                  fontWeight: "900",
                  marginBottom: 8,
                }}
              >
                Premium Theme
              </Text>

              <Text
                style={{
                  color: theme.muted,
                  fontSize: 14,
                  lineHeight: 22,
                  marginBottom: 18,
                }}
              >
                Free users can use Light Clean and Carbon Black. Start your
                trial or upgrade to unlock all premium themes.
              </Text>

              <TouchableOpacity
                onPress={() => {
                  setShowPremiumModal(false);
                  router.push("/pricing" as any);
                }}
                style={{
                  backgroundColor: theme.primary,
                  paddingVertical: 14,
                  borderRadius: 15,
                  alignItems: "center",
                  marginBottom: 10,
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "900" }}>
                  View Premium
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setShowPremiumModal(false)}
                style={{
                  backgroundColor: theme.innerCard,
                  paddingVertical: 13,
                  borderRadius: 15,
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: theme.border,
                }}
              >
                <Text style={{ color: theme.text, fontWeight: "800" }}>
                  Maybe Later
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

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
              style={{ color: theme.text, fontSize: 26, fontWeight: "900" }}
            >
              Themes
            </Text>
            <Text style={{ color: theme.muted, marginTop: 4 }}>
              Choose your app appearance
            </Text>
          </View>
        </View>

        {Object.entries(themes).map(([key, value]) => {
          const selected = key === themeKey;
          const freeThemeKeys = ["lightClean", "carbonBlack"];
          const locked = !hasPremiumAccess && !freeThemeKeys.includes(key);

          return (
            <ThemeOptionCard
              key={key}
              themeKeyName={key}
              value={value}
              selected={selected}
              locked={locked}
              onPress={() => {
                if (locked) {
                  setShowPremiumModal(true);
                  return;
                }

                setTheme(key as any);
              }}
            />
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}
