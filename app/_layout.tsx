import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack, router, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/use-color-scheme";
import * as Notifications from "expo-notifications";
import { useContext, useEffect } from "react";
import { Platform } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AuthContext, AuthProvider } from "../context/AuthContext";
import { GoalProvider } from "../context/GoalContext";
import { CreditProvider } from "../context/CreditContext";
import { ThemeProvider as AppThemeProvider } from "../context/ThemeContext";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function RootNavigator() {
  const auth = useContext(AuthContext);
  const segments = useSegments();

  useEffect(() => {
    if (!auth || auth.loading) return;

    const currentRoute = segments[0];
    const isAuthScreen = currentRoute === "login" || currentRoute === "signup";

    if (!auth.user && !isAuthScreen) {
      router.replace("/login");
      return;
    }

    if (auth.user && isAuthScreen) {
      router.replace("/(tabs)");
    }
  }, [auth?.user, auth?.loading, segments]);

  if (!auth || auth.loading) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="modal"
        options={{ presentation: "modal", title: "Modal" }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    const setupNotifications = async () => {
      const { status } = await Notifications.requestPermissionsAsync();

      if (status !== "granted") {
        console.log("Notification permission not granted");
        return;
      }

      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
          name: "default",
          importance: Notifications.AndroidImportance.MAX,
          sound: "default",
          vibrationPattern: [0, 250, 250, 250],
        });
      }
    };

    setupNotifications();
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppThemeProvider>
          <GoalProvider>
            <CreditProvider>
              <ThemeProvider
                value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
              >
                <RootNavigator />
                <StatusBar style="auto" />
              </ThemeProvider>
            </CreditProvider>
          </GoalProvider>
        </AppThemeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
