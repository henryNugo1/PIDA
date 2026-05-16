import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { useContext, useEffect, useMemo, useState } from "react";
import {
  Modal,
  Platform,
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

type ReminderItem = {
  id: string;
  text: string;
  createdAt: string;
};

type ReminderSettings = {
  notificationsEnabled: boolean;
  notificationsPerDay: number;
};

type PopupAction = {
  text: string;
  style?: "default" | "cancel" | "destructive";
  onPress?: () => void;
};

const REMINDER_STORAGE_KEY_BASE = "goaltracker_reminders";
const REMINDER_SETTINGS_KEY_BASE = "goaltracker_reminder_settings";
const REMINDER_NOTIFICATION_SOURCE = "goaltracker_motivation_reminder";
const REMINDER_NOTIFICATION_CHANNEL_ID = "goaltracker-reminders-v2";
const REMINDER_NOTIFICATION_SOUND = "notification.wav";

const getRandomInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const buildRandomDailyTimes = (count: number) => {
  const unique = new Set<string>();

  while (unique.size < count) {
    const hour = getRandomInt(9, 21);
    const minute = getRandomInt(0, 59);
    unique.add(`${hour}:${minute}`);
  }

  return Array.from(unique)
    .map((item) => {
      const [hour, minute] = item.split(":").map(Number);
      return { hour, minute };
    })
    .sort((a, b) => {
      if (a.hour !== b.hour) return a.hour - b.hour;
      return a.minute - b.minute;
    });
};

const clearReminderNotifications = async (userId?: string | null) => {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();

  const reminderNotifications = scheduled.filter((item) => {
    const data = item.content?.data as Record<string, unknown> | undefined;

    if (!data) return false;
    if (data.source !== REMINDER_NOTIFICATION_SOURCE) return false;

    if (userId) {
      return data.userId === userId;
    }

    return true;
  });

  for (const item of reminderNotifications) {
    await Notifications.cancelScheduledNotificationAsync(item.identifier);
  }
};

const scheduleReminderNotifications = async (
  reminders: ReminderItem[],
  settings: ReminderSettings,
  userId?: string | null,
) => {
  await clearReminderNotifications(userId);

  if (!userId) return;

  if (!settings.notificationsEnabled) return;
  if (!reminders.length) return;

  const permission = await Notifications.getPermissionsAsync();
  let granted =
    permission.granted ||
    permission.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;

  if (!granted) {
    const requested = await Notifications.requestPermissionsAsync();
    granted =
      requested.granted ||
      requested.ios?.status ===
        Notifications.IosAuthorizationStatus.PROVISIONAL;
  }

  if (!granted) return;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(
      REMINDER_NOTIFICATION_CHANNEL_ID,
      {
        name: "GoalTracker Reminders",
        importance: Notifications.AndroidImportance.HIGH,
        sound: REMINDER_NOTIFICATION_SOUND,
      },
    );
  }

  const dailyCount = Math.max(1, Math.min(7, settings.notificationsPerDay));

  const times = buildRandomDailyTimes(dailyCount);

  for (const time of times) {
    const randomReminder =
      reminders[Math.floor(Math.random() * reminders.length)];

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Stay Focused 💡",
        body: randomReminder.text,
        sound: REMINDER_NOTIFICATION_SOUND,
        data: {
          source: REMINDER_NOTIFICATION_SOURCE,
          userId,
          reminderId: randomReminder.id,
        },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: time.hour,
        minute: time.minute,
        channelId: REMINDER_NOTIFICATION_CHANNEL_ID,
      },
    });
  }
};

export default function ReminderScreen() {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const contentMaxWidth = isTablet ? 900 : width;

  const themeContext = useContext(ThemeContext);
  const theme = themeContext?.theme;
  const auth = useContext(AuthContext);
  const userId = auth?.user?.id ?? null;
  const hasPremiumAccess = auth?.trialStatus.hasPremiumAccess ?? false;

  const getUserStorageKey = (baseKey: string) => {
    if (!userId) return null;
    return `${baseKey}:${userId}`;
  };

  const reminderLimit = hasPremiumAccess ? 7 : 3;
  const dailyNotificationLimit = hasPremiumAccess ? 7 : 3;

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

  const [input, setInput] = useState("");
  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [notificationsPerDay] = useState(7);

  const [showPopup, setShowPopup] = useState(false);
  const [popupTitle, setPopupTitle] = useState("");
  const [popupMessage, setPopupMessage] = useState("");
  const [popupActions, setPopupActions] = useState<PopupAction[]>([]);

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

  useEffect(() => {
    const loadReminderData = async () => {
      try {
        const reminderStorageKey = getUserStorageKey(REMINDER_STORAGE_KEY_BASE);
        const reminderSettingsKey = getUserStorageKey(
          REMINDER_SETTINGS_KEY_BASE,
        );

        if (!reminderStorageKey || !reminderSettingsKey) {
          setReminders([]);
          setNotificationsEnabled(true);
          await clearReminderNotifications();
          return;
        }

        const [savedReminders, savedSettings] = await Promise.all([
          AsyncStorage.getItem(reminderStorageKey),
          AsyncStorage.getItem(reminderSettingsKey),
        ]);

        if (savedReminders) {
          setReminders(JSON.parse(savedReminders));
        }

        if (savedSettings) {
          const parsed: ReminderSettings = JSON.parse(savedSettings);
          setNotificationsEnabled(parsed.notificationsEnabled);
        }
      } catch (error) {
        console.log("Failed to load reminder data:", error);
      } finally {
        setIsLoaded(true);
      }
    };

    loadReminderData();
  }, [userId]);

  useEffect(() => {
    if (!isLoaded) return;

    const saveReminderData = async () => {
      try {
        const reminderStorageKey = getUserStorageKey(REMINDER_STORAGE_KEY_BASE);
        const reminderSettingsKey = getUserStorageKey(
          REMINDER_SETTINGS_KEY_BASE,
        );

        if (!reminderStorageKey || !reminderSettingsKey) return;

        await Promise.all([
          AsyncStorage.setItem(reminderStorageKey, JSON.stringify(reminders)),
          AsyncStorage.setItem(
            reminderSettingsKey,
            JSON.stringify({
              notificationsEnabled,
              notificationsPerDay,
            }),
          ),
        ]);
      } catch (error) {
        console.log("Failed to save reminder data:", error);
      }
    };

    saveReminderData();
  }, [reminders, notificationsEnabled, notificationsPerDay, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;

    scheduleReminderNotifications(
      reminders,
      {
        notificationsEnabled,
        notificationsPerDay: dailyNotificationLimit,
      },
      userId,
    ).catch((error) => {
      console.log("Failed to schedule reminder notifications:", error);
    });
  }, [
    reminders,
    notificationsEnabled,
    notificationsPerDay,
    dailyNotificationLimit,
    isLoaded,
    userId,
  ]);

  const sortedReminders = useMemo(() => {
    return [...reminders].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [reminders]);

  const handleAddReminder = () => {
    const trimmed = input.trim();

    if (!trimmed) {
      openPopup("Empty Field", "Please enter a motivation, rule or guideline.");
      return;
    }

    if (reminders.length >= reminderLimit) {
      if (!hasPremiumAccess) {
        openPopup(
          "Premium Reminder Limit",
          "Free users can save up to 3 motivations, rules or guidelines. Upgrade to Premium to save up to 7 and receive more daily mindset reminders.",
          [
            {
              text: "Maybe Later",
              style: "cancel",
            },
            {
              text: "Upgrade",
              onPress: () => router.push("/pricing" as any),
            },
          ],
        );
        return;
      }

      openPopup(
        "Limit Reached",
        "You can only save up to 7 motivations, rules or guidelines.",
      );
      return;
    }

    const newReminder: ReminderItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      text: trimmed,
      createdAt: new Date().toISOString(),
    };

    setReminders((prev) => [newReminder, ...prev]);
    setInput("");
  };

  const handleDeleteReminder = (id: string) => {
    openPopup(
      "Delete Statement",
      "Are you sure you want to remove this saved statement?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            setReminders((prev) => prev.filter((item) => item.id !== id));
          },
        },
      ],
    );
  };

  const toggleNotificationsEnabled = () => {
    setNotificationsEnabled((prev) => !prev);
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
        contentContainerStyle={{
          padding: 20,
          paddingBottom: 40,
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
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 8,
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
                marginRight: 12,
              }}
            >
              <Text style={{ color: UI.text, fontSize: 18, fontWeight: "800" }}>
                ←
              </Text>
            </TouchableOpacity>

            <Text
              style={{
                color: UI.text,
                fontSize: 28,
                fontWeight: "800",
              }}
            >
              Reminder
            </Text>
          </View>

          <Text
            style={{
              color: UI.muted,
              fontSize: 14,
              marginBottom: 20,
              lineHeight: 22,
            }}
          >
            Save motivations, personal rules and mindset reminders.
          </Text>

          <View
            style={{
              backgroundColor: UI.card,
              borderRadius: 18,
              borderWidth: 1,
              borderColor: UI.border,
              padding: 16,
              marginBottom: 18,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  color: UI.text,
                  fontSize: 15,
                  fontWeight: "700",
                }}
              >
                Notifications
              </Text>

              <TouchableOpacity
                onPress={toggleNotificationsEnabled}
                style={{
                  backgroundColor: notificationsEnabled
                    ? UI.primary
                    : UI.innerCard,
                  borderWidth: 1,
                  borderColor: notificationsEnabled ? UI.primary : UI.border,
                  borderRadius: 999,
                  paddingVertical: 8,
                  paddingHorizontal: 14,
                }}
              >
                <Text
                  style={{
                    color: UI.text,
                    fontWeight: "700",
                  }}
                >
                  {notificationsEnabled ? "On" : "Off"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View
            style={{
              backgroundColor: UI.card,
              borderRadius: 18,
              borderWidth: 1,
              borderColor: UI.border,
              padding: 16,
              marginBottom: 18,
            }}
          >
            <Text
              style={{
                color: UI.muted,
                fontSize: 12,
                fontWeight: "700",
                textTransform: "uppercase",
                letterSpacing: 0.8,
                marginBottom: 10,
              }}
            >
              Add Motivation / Rules / Guidelines
            </Text>

            <TextInput
              placeholder="Write a rule, mindset or motivational reminder for yourself..."
              placeholderTextColor={UI.muted}
              value={input}
              onChangeText={setInput}
              multiline
              style={{
                minHeight: 110,
                backgroundColor: UI.innerCard,
                borderWidth: 1,
                borderColor: UI.border,
                borderRadius: 14,
                paddingHorizontal: 14,
                paddingVertical: 14,
                color: UI.text,
                fontSize: 15,
                textAlignVertical: "top",
                marginBottom: 14,
              }}
            />

            <TouchableOpacity
              onPress={handleAddReminder}
              style={{
                backgroundColor: UI.primary,
                paddingVertical: 13,
                borderRadius: 12,
              }}
            >
              <Text
                style={{
                  color: UI.text,
                  textAlign: "center",
                  fontWeight: "700",
                  fontSize: 15,
                }}
              >
                Save Statement
              </Text>
            </TouchableOpacity>
          </View>

          <View
            style={{
              backgroundColor: UI.card,
              borderRadius: 18,
              borderWidth: 1,
              borderColor: UI.border,
              padding: 16,
              marginBottom: 18,
            }}
          >
            <Text
              style={{
                color: UI.muted,
                fontSize: 12,
                fontWeight: "700",
                textTransform: "uppercase",
                letterSpacing: 0.8,
                marginBottom: 12,
              }}
            >
              Saved Motivations / Rules / Guidelines
            </Text>

            <Text
              style={{
                color: UI.muted,
                fontSize: 13,
                lineHeight: 20,
                marginBottom: 12,
              }}
            >
              {reminders.length}/{reminderLimit} saved
            </Text>

            {!hasPremiumAccess && (
              <Text
                style={{
                  color: UI.muted,
                  fontSize: 12,
                  lineHeight: 18,
                  marginBottom: 12,
                }}
              >
                Free plan includes 3 saved statements and 3 daily notifications.
              </Text>
            )}

            <View>
              {sortedReminders.map((item) => (
                <View
                  key={item.id}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    backgroundColor: UI.innerCard,
                    borderWidth: 1,
                    borderColor: UI.border,
                    borderRadius: 14,
                    paddingVertical: 12,
                    paddingLeft: 14,
                    paddingRight: 10,
                    marginBottom: 10,
                    width: "100%",
                  }}
                >
                  <Text
                    style={{
                      flex: 1,
                      color: UI.text,
                      fontSize: 14,
                      fontWeight: "600",
                      lineHeight: 20,
                      marginRight: 10,
                    }}
                  >
                    {item.text}
                  </Text>

                  <TouchableOpacity
                    onPress={() => handleDeleteReminder(item.id)}
                    style={{
                      backgroundColor: "#dc2626",
                      borderRadius: 10,
                      paddingVertical: 6,
                      paddingHorizontal: 10,
                    }}
                  >
                    <Text
                      style={{
                        color: "#ffffff",
                        fontSize: 12,
                        fontWeight: "700",
                      }}
                    >
                      Remove
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
