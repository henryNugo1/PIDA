import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useContext, useState } from "react";
import {
  Image,
  ScrollView,
  Modal,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Goal, GoalContext, PlanGuideItem } from "../context/GoalContext";
import { ThemeContext } from "../context/ThemeContext";

type ExtendedPlanGuideItem = PlanGuideItem & {
  imageKey?: string;
  imageUri?: string;
};

type PopupAction = {
  text: string;
  style?: "default" | "cancel" | "destructive";
  onPress?: () => void;
};

const getShiftImageSource = (imageKey?: string) => {
  switch (imageKey) {
    case "gym-1":
      return require("../assets/images/Gym/edgar-chaparro-sHfo3WOgGTU-unsplash.jpg");
    case "gym-2":
      return require("../assets/images/Gym/brett-jordan-U2q73PfHFpM-unsplash.jpg");
    case "gym-3":
      return require("../assets/images/Gym/lorenzo-hamers-jvIaut-V9a4-unsplash.jpg");
    case "gym-4":
      return require("../assets/images/Gym/sven-mieke-Lx_GDv7VA9M-unsplash.jpg");
    case "gym-5":
      return require("../assets/images/Gym/victor-freitas-WvDYdXDzkhs-unsplash.jpg");

    case "workout-1":
      return require("../assets/images/Workout/cagin-kargi-Qzp60FT380E-unsplash.jpg");
    case "workout-2":
      return require("../assets/images/Workout/gordon-cowie-ISg1JhN_vFk-unsplash.jpg");
    case "workout-3":
      return require("../assets/images/Workout/jonathan-borba-lrQPTQs7nQQ-unsplash.jpg");
    case "workout-4":
      return require("../assets/images/Workout/kike-vega-F2qh3yjz6Jk-unsplash.jpg");
    case "workout-5":
      return require("../assets/images/Workout/logan-weaver-lgnwvr-amgv9YUg-MA-unsplash.jpg");

    case "meditation-1":
      return require("../assets/images/Meditation/jared-rice-NTyBbu66_SI-unsplash.jpg");
    case "meditation-2":
      return require("../assets/images/Meditation/colton-sturgeon-6KkYYqTEDwQ-unsplash.jpg");
    case "meditation-3":
      return require("../assets/images/Meditation/chelsea-gates-n8L1VYaypcw-unsplash.jpg");
    case "meditation-4":
      return require("../assets/images/Meditation/levi-xu-dOhJtfXJZfw-unsplash.jpg");
    case "meditation-5":
      return require("../assets/images/Meditation/ethan-rougon-zWIWNeEg4Uo-unsplash.jpg");

    case "cooking-1":
      return require("../assets/images/Cooking/ahmadreza-rezaie-9x6QkgB722w-unsplash.jpg");
    case "cooking-2":
      return require("../assets/images/Cooking/joseph-gonzalez-zcUgjyqEwe8-unsplash.jpg");
    case "cooking-3":
      return require("../assets/images/Cooking/myles-tan-IWCljYv1TJw-unsplash.jpg");
    case "cooking-4":
      return require("../assets/images/Cooking/tim-zankert-ZWweujwrLEM-unsplash.jpg");
    case "cooking-5":
      return require("../assets/images/Cooking/the-design-lady-Z9QhA1aGXck-unsplash.jpg");

    case "money-1":
      return require("../assets/images/Money/adam-nir-wTO6MWpMrJk-unsplash.jpg");
    case "money-2":
      return require("../assets/images/Money/alexander-grey-8lnbXtxFGZw-unsplash.jpg");
    case "money-3":
      return require("../assets/images/Money/art-rachen-yJpjLD3c9bU-unsplash.jpg");
    case "money-4":
      return require("../assets/images/Money/brano-heYdDdq0cbE-unsplash.jpg");
    case "money-5":
      return require("../assets/images/Money/elena-mozhvilo-nhYK4qIv9Pg-unsplash.jpg");

    case "study-1":
      return require("../assets/images/Studying/christin-hume-k2Kcwkandwg-unsplash.jpg");
    case "study-2":
      return require("../assets/images/Studying/joel-muniz-XqXJJhK-c08-unsplash (1).jpg");
    case "study-3":
      return require("../assets/images/Studying/ioann-mark-kuznietsov-P6uqpNyXcI4-unsplash.jpg");
    case "study-4":
      return require("../assets/images/Studying/jessica-ruscello-OQSCtabGkSY-unsplash.jpg");
    case "study-5":
      return require("../assets/images/Studying/matias-north-v8DSLoY80Xk-unsplash.jpg");

    case "sleep-1":
      return require("../assets/images/Sleeping/alexander-possingham-CeWNEEsHPbA-unsplash.jpg");
    case "sleep-2":
      return require("../assets/images/Sleeping/charlesdeluvio-S2AcayPkszE-unsplash.jpg");
    case "sleep-3":
      return require("../assets/images/Sleeping/phil-desforges-m4bcgrz4jn0-unsplash.jpg");
    case "sleep-4":
      return require("../assets/images/Sleeping/becca-schultz-l6BenhrIc2w-unsplash.jpg");
    case "sleep-5":
      return require("../assets/images/Sleeping/nathan-waters-zukdSYdFB_A-unsplash.jpg");

    default:
      return null;
  }
};

const getHistoryCardImage = (goal: Goal) => {
  const planGuide = (goal.planGuide ?? []) as ExtendedPlanGuideItem[];

  const imageWithUri = planGuide.find((item) => item.imageUri);
  if (imageWithUri?.imageUri) {
    return { uri: imageWithUri.imageUri };
  }

  const imageWithKey = planGuide.find((item) => item.imageKey);
  if (imageWithKey?.imageKey) {
    return getShiftImageSource(imageWithKey.imageKey);
  }

  return null;
};

const formatSelectedDaysFull = (days?: string) => {
  const parsed = String(days ?? "")
    .split(" ")
    .filter(Boolean);

  return parsed.length > 0 ? parsed.join(", ") : "No selected days";
};

const formatFullDateRangePart = (dateString: string) =>
  new Date(dateString).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export default function HistoryScreen() {
  const context = useContext(GoalContext);
  const { width } = useWindowDimensions();

  const isVeryNarrowPhone = width < 340;
  const isNarrowPhone = width < 380;
  const isTablet = width >= 768;
  const isLargeTablet = width >= 1024;

  const contentMaxWidth = isLargeTablet ? 1100 : isTablet ? 950 : width;
  const screenPadding = isTablet ? 28 : 20;

  const themeContext = useContext(ThemeContext);
  const theme = themeContext?.theme;
  const [showPopup, setShowPopup] = useState(false);
  const [popupTitle, setPopupTitle] = useState("");
  const [popupMessage, setPopupMessage] = useState("");
  const [popupActions, setPopupActions] = useState<PopupAction[]>([]);

  const UI = theme ?? {
    screen: "#111b30e6",
    card: "#111827",
    innerCard: "#0f172a",
    border: "#1f2937",
    text: "#ffffff",
    muted: "#94a3b8",
    primary: "#2563eb",
    primarySoft: "rgba(37,99,235,0.16)",

    imageOverlaySolid: "rgba(15,23,42,0.96)",
    imageOverlayStrong: "rgba(15,23,42,1)",
    imageOverlay90: "rgba(15,23,42,0.92)",
    imageOverlay80: "rgba(15,23,42,0.80)",
    imageOverlay60: "rgba(15,23,42,0.58)",
    imageOverlay30: "rgba(15,23,42,0.30)",
    imageOverlay10: "rgba(15,23,42,0.10)",
    imageShade: "rgba(0,0,0,0.15)",
  };
  if (!context) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: UI.screen }}>
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <Text style={{ color: UI.text }}>Context not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const openPopup = (
    title: string,
    message: string,
    actions: PopupAction[] = [{ text: "OK" }],
  ) => {
    setPopupTitle(title);
    setPopupMessage(message);
    setPopupActions(actions);
    setShowPopup(true);
  };

  const closePopup = () => {
    setShowPopup(false);
    setPopupTitle("");
    setPopupMessage("");
    setPopupActions([]);
  };

  const { historyGoals, restoreGoal, deleteHistoryGoal } = context;

  const handleRestoreGoal = (goal: Goal) => {
    openPopup("Restore Goal", "Restore this goal back to active goals?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Restore",
        onPress: () => {
          restoreGoal(goal);
          router.push(`/edit-goal?id=${goal.id}`);
        },
      },
    ]);
  };

  const handleDeleteHistoryGoal = (goalId: string) => {
    openPopup(
      "Delete Permanently",
      "This will remove the goal from History permanently.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteHistoryGoal(goalId),
        },
      ],
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: UI.screen }}>
      <Modal
        visible={showPopup}
        transparent
        animationType="fade"
        onRequestClose={closePopup}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.6)",
            justifyContent: "center",
            alignItems: "center",
            padding: 20,
          }}
        >
          <View
            style={{
              width: "100%",
              maxWidth: 400,
              backgroundColor: UI.card,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: UI.border,
              padding: 20,
            }}
          >
            <Text
              style={{
                color: UI.text,
                fontSize: 18,
                fontWeight: "800",
                marginBottom: 8,
              }}
            >
              {popupTitle}
            </Text>

            <Text
              style={{
                color: UI.muted,
                fontSize: 14,
                lineHeight: 22,
                marginBottom: 20,
              }}
            >
              {popupMessage}
            </Text>

            <View
              style={{
                flexDirection: "row",
                justifyContent: "flex-end",
                gap: 10,
                flexWrap: "wrap",
              }}
            >
              {popupActions.map((action, index) => {
                const isDestructive = action.style === "destructive";
                const isCancel = action.style === "cancel";

                return (
                  <TouchableOpacity
                    key={`${action.text}-${index}`}
                    onPress={() => {
                      closePopup();
                      action.onPress?.();
                    }}
                    style={{
                      minWidth: 90,
                      paddingVertical: 11,
                      paddingHorizontal: 16,
                      borderRadius: 12,
                      backgroundColor: isDestructive
                        ? "#dc2626"
                        : isCancel
                          ? UI.innerCard
                          : UI.primary,
                      borderWidth: isCancel ? 1 : 0,
                      borderColor: isCancel ? UI.border : "transparent",
                    }}
                  >
                    <Text
                      style={{
                        color: "#ffffff",
                        textAlign: "center",
                        fontWeight: "700",
                      }}
                    >
                      {action.text}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
      <ScrollView
        contentContainerStyle={{ padding: screenPadding, paddingBottom: 100 }}
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
              marginBottom: 22,
              gap: isNarrowPhone ? 12 : 0,
            }}
          >
            <TouchableOpacity
              onPress={() => router.back()}
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                backgroundColor: UI.card,
                borderWidth: 1,
                borderColor: UI.border,
                justifyContent: "center",
                alignItems: "center",
                marginRight: isNarrowPhone ? 0 : 12,
              }}
            >
              <Text style={{ color: UI.text, fontSize: 18, fontWeight: "800" }}>
                ←
              </Text>
            </TouchableOpacity>

            <View style={{ flexShrink: 1 }}>
              <Text
                style={{
                  color: UI.text,
                  fontSize: 28,
                  fontWeight: "800",
                  letterSpacing: 0.3,
                }}
              >
                History
              </Text>
              <Text
                style={{
                  color: UI.muted,
                  marginTop: 4,
                  fontSize: 13,
                }}
              >
                Completed and failed goals archive
              </Text>
            </View>
          </View>

          {historyGoals.length === 0 ? (
            <View
              style={{
                backgroundColor: UI.card,
                borderRadius: 18,
                padding: 22,
                borderWidth: 1,
                borderColor: UI.border,
              }}
            >
              <Text
                style={{
                  color: UI.text,
                  fontSize: 18,
                  fontWeight: "700",
                }}
              >
                No completed or failed goals yet
              </Text>
              <Text
                style={{
                  color: UI.muted,
                  marginTop: 8,
                  lineHeight: 20,
                }}
              >
                Completed goals or failed goals will appear here automatically
                after their final shift ends.
              </Text>
            </View>
          ) : (
            historyGoals.map((goal) => {
              const cardImage = getHistoryCardImage(goal);
              const fullDateRange = `${formatFullDateRangePart(
                goal.startDate,
              )} - ${formatFullDateRangePart(goal.endDate ?? goal.startDate)}`;

              const isFailed = goal.status === "Failed";

              const badgeBackground = isFailed
                ? "rgba(239, 68, 68, 0.18)"
                : "rgba(16, 185, 129, 0.18)";

              const badgeBorder = isFailed ? "#ef4444" : "#10b981";
              const badgeText = isFailed ? "#ef4444" : "#10b981";
              const badgeLabel = isFailed ? "FAILED" : "COMPLETED";

              return (
                <View
                  key={goal.id}
                  style={{
                    backgroundColor: UI.card,
                    borderRadius: 20,
                    marginBottom: 18,
                    borderWidth: 1,
                    borderColor: UI.border,
                    overflow: "hidden",
                    shadowColor: "#000",
                    shadowOpacity: 0.2,
                    shadowRadius: 8,
                    shadowOffset: { width: 0, height: 4 },
                    elevation: 4,
                  }}
                >
                  <View
                    style={{
                      height: 170,
                      position: "relative",
                      backgroundColor: UI.innerCard,
                      overflow: "hidden",
                    }}
                  >
                    {cardImage ? (
                      <Image
                        source={cardImage}
                        fadeDuration={0}
                        resizeMode="cover"
                        style={{
                          position: "absolute",
                          top: 0,
                          right: 0,
                          bottom: 0,
                          width: isTablet ? "62%" : "70%",
                          height: "100%",
                        }}
                      />
                    ) : (
                      <View
                        style={{
                          position: "absolute",
                          top: 0,
                          right: 0,
                          bottom: 0,
                          width: isTablet ? "62%" : "70%",
                          backgroundColor: UI.border,
                        }}
                      />
                    )}

                    <View
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        bottom: 0,
                        width: "42%",
                        backgroundColor: UI.imageOverlaySolid,
                      }}
                    />

                    <LinearGradient
                      colors={[
                        UI.imageOverlayStrong,
                        UI.imageOverlayStrong,
                        UI.imageOverlay90,
                        UI.imageOverlay80,
                        UI.imageOverlay60,
                        UI.imageOverlay30,
                        UI.imageOverlay10,
                        "transparent",
                      ]}
                      locations={[0, 0.12, 0.24, 0.4, 0.58, 0.74, 0.88, 1]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{
                        position: "absolute",
                        top: 0,
                        left: "30%",
                        bottom: 0,
                        width: "42%",
                      }}
                    />

                    <View
                      style={{
                        position: "absolute",
                        top: 0,
                        right: 0,
                        bottom: 0,
                        width: isTablet ? "62%" : "70%",
                        backgroundColor: UI.imageShade,
                      }}
                    />

                    <View
                      style={{
                        paddingHorizontal: 16,
                        paddingVertical: 14,
                        height: 170,
                        justifyContent: "center",
                      }}
                    >
                      <View>
                        <Text
                          style={{
                            color: UI.text,
                            fontSize: 22,
                            fontWeight: "900",
                            lineHeight: 22,
                            maxWidth: isTablet
                              ? "78%"
                              : isVeryNarrowPhone
                                ? "60%"
                                : "68%",
                            marginBottom: 10,
                          }}
                          numberOfLines={2}
                        >
                          {goal.title}
                        </Text>

                        <View
                          style={{
                            alignSelf: "flex-start",
                            backgroundColor: badgeBackground,
                            borderWidth: 1,
                            borderColor: badgeBorder,
                            paddingVertical: 6,
                            paddingHorizontal: 12,
                            borderRadius: 999,
                          }}
                        >
                          <Text
                            style={{
                              color: badgeText,
                              fontWeight: "800",
                              fontSize: 11,
                              letterSpacing: 0.3,
                            }}
                          >
                            {badgeLabel}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  <View style={{ padding: isTablet ? 20 : 18 }}>
                    <View
                      style={{
                        backgroundColor: UI.innerCard,
                        borderRadius: 16,
                        padding: isTablet ? 16 : 14,
                        marginBottom: 14,
                      }}
                    >
                      <Text
                        style={{
                          color: UI.muted,
                          fontSize: 12,
                          fontWeight: "700",
                          marginBottom: 6,
                          textTransform: "uppercase",
                          letterSpacing: 0.8,
                        }}
                      >
                        Selected Days
                      </Text>
                      <Text
                        style={{
                          color: UI.text,
                          fontSize: 15,
                          fontWeight: "600",
                        }}
                      >
                        {formatSelectedDaysFull(goal.days)}
                      </Text>

                      <Text
                        style={{
                          color: UI.muted,
                          fontSize: 12,
                          fontWeight: "700",
                          marginTop: 14,
                          marginBottom: 6,
                          textTransform: "uppercase",
                          letterSpacing: 0.8,
                        }}
                      >
                        Date Range
                      </Text>
                      <Text
                        style={{
                          color: UI.text,
                          fontSize: 15,
                          fontWeight: "600",
                          lineHeight: 22,
                        }}
                      >
                        {fullDateRange}
                      </Text>
                    </View>

                    <View
                      style={{
                        flexDirection: isVeryNarrowPhone ? "column" : "row",
                        gap: 10,
                      }}
                    >
                      <TouchableOpacity
                        onPress={() => handleRestoreGoal(goal)}
                        style={{
                          flex: 1,
                          backgroundColor: UI.primary,
                          paddingVertical: 13,
                          borderRadius: 12,
                          minHeight: 48,
                          justifyContent: "center",
                        }}
                      >
                        <Text
                          numberOfLines={1}
                          adjustsFontSizeToFit
                          minimumFontScale={0.85}
                          style={{
                            color: UI.text,
                            textAlign: "center",
                            fontWeight: "700",
                            fontSize: 14,
                          }}
                        >
                          Restore
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => handleDeleteHistoryGoal(goal.id)}
                        style={{
                          flex: 1,
                          backgroundColor: "#dc2626",
                          paddingVertical: 13,
                          borderRadius: 12,
                          minHeight: 48,
                          justifyContent: "center",
                        }}
                      >
                        <Text
                          numberOfLines={1}
                          adjustsFontSizeToFit
                          minimumFontScale={0.85}
                          style={{
                            color: UI.text,
                            textAlign: "center",
                            fontWeight: "700",
                            fontSize: 14,
                          }}
                        >
                          Delete
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
