import { useContext, useEffect, useMemo, useRef } from "react";
import {
  Animated,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GoalContext } from "../../context/GoalContext";
import { ThemeContext } from "../../context/ThemeContext";

const { width } = Dimensions.get("window");

export default function MeScreen() {
  const themeContext = useContext(ThemeContext);
  const goalContext = useContext(GoalContext);

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.8)).current;

  const theme = themeContext?.theme;

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

  if (!goalContext) return null;

  const { currentStreak, failedChances, highestStreak, lastUnlockedBadge } =
    goalContext;

  const chancesLeft = Math.max(0, 3 - failedChances);
  const chancePercent = (chancesLeft / 3) * 100;

  const badgeEmoji = useMemo(() => {
    if (highestStreak >= 365) return "👑";
    if (highestStreak >= 180) return "🏆";
    if (highestStreak >= 90) return "💎";
    if (highestStreak >= 30) return "🥇";
    if (highestStreak >= 14) return "🚀";
    if (highestStreak >= 7) return "🔥";
    return "⭐";
  }, [highestStreak]);

  const badgeLabel = useMemo(() => {
    if (highestStreak >= 365) return "Legend";
    if (highestStreak >= 180) return "Master";
    if (highestStreak >= 90) return "Diamond";
    if (highestStreak >= 30) return "Gold";
    if (highestStreak >= 14) return "Rising";
    if (highestStreak >= 7) return "On Fire";
    return "Starter";
  }, [highestStreak]);

  const motivationalText = useMemo(() => {
    if (currentStreak >= 30) return "You are building serious momentum.";
    if (currentStreak >= 14) return "You are no longer starting — you are becoming consistent.";
    if (currentStreak >= 7) return "Solid progress. Keep the fire alive.";
    if (currentStreak >= 1) return "A small streak can become a big identity.";
    return "Start today. Your streak begins with one win.";
  }, [currentStreak]);

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 1.06,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.85,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    pulse.start();

    return () => {
      pulse.stop();
    };
  }, [glowAnim, scaleAnim]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: UI.screen }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.headerTitle, { color: UI.text }]}>Me</Text>
        <Text style={[styles.headerSubtitle, { color: UI.muted }]}>
          Your consistency profile
        </Text>

        {/* TOP HERO CARD */}
        <View
          style={[
            styles.heroCard,
            {
              backgroundColor: UI.card,
              borderColor: UI.border,
            },
          ]}
        >
          {/* CENTER BADGE */}
          <Animated.View
            style={[
              styles.badgeGlowWrap,
              {
                backgroundColor: UI.primarySoft,
                transform: [{ scale: scaleAnim }],
                opacity: glowAnim,
              },
            ]}
          >
            <View
              style={[
                styles.badgeOuter,
                {
                  borderColor: UI.primary,
                  backgroundColor: UI.innerCard ?? UI.card,
                },
              ]}
            >
              <View
                style={[
                  styles.badgeInner,
                  {
                    backgroundColor: UI.primarySoft,
                  },
                ]}
              >
                <Text style={styles.badgeEmoji}>{badgeEmoji}</Text>
              </View>
            </View>
          </Animated.View>

          <Text style={[styles.badgeTitle, { color: UI.text }]}>
            {lastUnlockedBadge || badgeLabel}
          </Text>
          <Text style={[styles.badgeSubtitle, { color: UI.muted }]}>
            Personal achievement badge
          </Text>

          {/* STREAK UNDER BADGE */}
          <View style={styles.streakSection}>
            <Text style={[styles.streakLabel, { color: UI.muted }]}>
              Current Streak
            </Text>
            <Text style={[styles.streakValue, { color: UI.primary }]}>
              🔥 {currentStreak}
            </Text>
            <Text style={[styles.streakMessage, { color: UI.text }]}>
              {motivationalText}
            </Text>
          </View>
        </View>

        {/* STATS */}
        <View style={styles.statsRow}>
          <View
            style={[
              styles.statCard,
              {
                backgroundColor: UI.card,
                borderColor: UI.border,
              },
            ]}
          >
            <Text style={[styles.statLabel, { color: UI.muted }]}>
              Highest Streak
            </Text>
            <Text style={[styles.statValue, { color: UI.text }]}>
              {highestStreak}
            </Text>
          </View>

          <View
            style={[
              styles.statCard,
              {
                backgroundColor: UI.card,
                borderColor: UI.border,
              },
            ]}
          >
            <Text style={[styles.statLabel, { color: UI.muted }]}>
              Chances Left
            </Text>
            <Text style={[styles.statValue, { color: UI.text }]}>
              {chancesLeft}/3
            </Text>
          </View>
        </View>

        {/* CHANCES BAR */}
        <View
          style={[
            styles.sectionCard,
            {
              backgroundColor: UI.card,
              borderColor: UI.border,
            },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: UI.text }]}>
            Recovery Meter
          </Text>
          <Text style={[styles.sectionSubtext, { color: UI.muted }]}>
            You have {chancesLeft} out of 3 chances remaining.
          </Text>

          <View
            style={[
              styles.progressTrack,
              { backgroundColor: UI.innerCard ?? "#0f172a" },
            ]}
          >
            <View
              style={[
                styles.progressFill,
                {
                  width: `${chancePercent}%`,
                  backgroundColor: UI.primary,
                },
              ]}
            />
          </View>
        </View>

        {/* LAST BADGE */}
        {lastUnlockedBadge ? (
          <View
            style={[
              styles.sectionCard,
              {
                backgroundColor: UI.card,
                borderColor: UI.border,
              },
            ]}
          >
            <Text style={[styles.sectionTitle, { color: UI.text }]}>
              Latest Unlock
            </Text>

            <View
              style={[
                styles.unlockCard,
                {
                  backgroundColor: UI.primarySoft,
                  borderColor: UI.primary,
                },
              ]}
            >
              <Text style={styles.unlockEmoji}>🎉</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.unlockTitle, { color: UI.text }]}>
                  {lastUnlockedBadge}
                </Text>
                <Text style={[styles.unlockText, { color: UI.muted }]}>
                  Keep going to unlock even stronger badge levels.
                </Text>
              </View>
            </View>
          </View>
        ) : null}

        {/* CUSTOMIZATION IDEAS BLOCK */}
        <View
          style={[
            styles.sectionCard,
            {
              backgroundColor: UI.card,
              borderColor: UI.border,
            },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: UI.text }]}>
            Profile Style
          </Text>
          <Text style={[styles.customItem, { color: UI.muted }]}>
            • Center hero badge with premium circular design
          </Text>
          <Text style={[styles.customItem, { color: UI.muted }]}>
            • Animated streak focus for a stronger visual hierarchy
          </Text>
          <Text style={[styles.customItem, { color: UI.muted }]}>
            • Compact stat cards for a cleaner dashboard feel
          </Text>
          <Text style={[styles.customItem, { color: UI.muted }]}>
            • Easy upgrade later to real badge images or avatar system
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 30,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
  },
  headerSubtitle: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 18,
  },
  heroCard: {
    borderWidth: 1,
    borderRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 26,
    paddingBottom: 24,
    alignItems: "center",
  },
  badgeGlowWrap: {
    width: 144,
    height: 144,
    borderRadius: 72,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  badgeOuter: {
    width: 122,
    height: 122,
    borderRadius: 61,
    borderWidth: 2.5,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeInner: {
    width: 92,
    height: 92,
    borderRadius: 46,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeEmoji: {
    fontSize: 42,
  },
  badgeTitle: {
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
  },
  badgeSubtitle: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: "500",
    textAlign: "center",
  },
  streakSection: {
    marginTop: 22,
    alignItems: "center",
  },
  streakLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  streakValue: {
    marginTop: 6,
    fontSize: 40,
    fontWeight: "900",
    textAlign: "center",
  },
  streakMessage: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
    maxWidth: width * 0.72,
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  statCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 22,
    paddingVertical: 18,
    paddingHorizontal: 14,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
  },
  statValue: {
    fontSize: 26,
    fontWeight: "900",
  },
  sectionCard: {
    marginTop: 16,
    borderWidth: 1,
    borderRadius: 22,
    padding: 18,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
  },
  sectionSubtext: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 18,
  },
  progressTrack: {
    marginTop: 14,
    height: 12,
    borderRadius: 999,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
  },
  unlockCard: {
    marginTop: 14,
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  unlockEmoji: {
    fontSize: 28,
  },
  unlockTitle: {
    fontSize: 16,
    fontWeight: "800",
  },
  unlockText: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
  },
  customItem: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
  },
});