import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack, router, useRootNavigationState, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import * as Notifications from "expo-notifications";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Platform } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import PidaBloomSplash from "../components/PidaBloomSplash";
import { AuthContext, AuthProvider } from "../context/AuthContext";
import { CreditProvider } from "../context/CreditContext";
import { GoalProvider } from "../context/GoalContext";
import {
  ThemeContext,
  ThemeProvider as AppThemeProvider,
} from "../context/ThemeContext";
import { debugLog } from "../utils/debugLog";

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
  const rootNavigationState = useRootNavigationState();
  const segments = useSegments();

  const currentRoute = segments[0];
  const isAuthCallbackScreen = currentRoute === "auth";
  const isResetPasswordScreen = currentRoute === "reset-password";
  const isCompleteProfileScreen = currentRoute === "complete-profile";

  useEffect(() => {
    if (!rootNavigationState?.key) return;
    if (!auth || auth.loading || auth.profileLoading) return;

    const isAuthScreen =
      currentRoute === "login" ||
      currentRoute === "signup" ||
      isAuthCallbackScreen ||
      currentRoute === "complete-profile" ||
      currentRoute === "reset-password";

    if (isResetPasswordScreen) return;

    if (!auth.user && !isAuthScreen) {
      router.replace("/login");
      return;
    }

    if (
      auth.user &&
      auth.shouldCompleteProfile &&
      !isCompleteProfileScreen
    ) {
      router.replace("/complete-profile");
      return;
    }

    if (auth.user && !auth.shouldCompleteProfile && isAuthScreen) {
      router.replace("/(tabs)");
    }
  }, [
    auth,
    auth?.loading,
    auth?.profileLoading,
    auth?.shouldCompleteProfile,
    auth?.user,
    currentRoute,
    isAuthCallbackScreen,
    isCompleteProfileScreen,
    isResetPasswordScreen,
    rootNavigationState?.key,
  ]);

  if (!auth || auth.loading || auth.profileLoading) return null;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "fade_from_bottom",
        animationDuration: 220,
        gestureEnabled: true,
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="auth/callback" />
      <Stack.Screen name="complete-profile" />
      <Stack.Screen name="reset-password" />
      <Stack.Screen name="privacy-policy" />
      <Stack.Screen name="terms-of-service" />
      <Stack.Screen name="refund-policy" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="modal"
        options={{ presentation: "modal", title: "Modal" }}
      />
    </Stack>
  );
}

function ThemedAppShell() {
  const ctx = useContext(ThemeContext);
  const [showPidaSplash, setShowPidaSplash] = useState(true);

  const appTheme = ctx?.theme;
  const isLightTheme = ctx?.themeKey === "lightClean";
  const finishPidaSplash = useCallback(() => {
    setShowPidaSplash(false);
  }, []);

  const navigationTheme = useMemo(() => {
    if (!appTheme) return isLightTheme ? DefaultTheme : DarkTheme;

    const baseTheme = isLightTheme ? DefaultTheme : DarkTheme;

    return {
      ...baseTheme,
      colors: {
        ...baseTheme.colors,
        primary: appTheme.primary,
        background: appTheme.screen,
        card: appTheme.card,
        text: appTheme.text,
        border: appTheme.border,
        notification: appTheme.primary,
      },
    };
  }, [appTheme, isLightTheme]);

  return (
    <ThemeProvider value={navigationTheme}>
      <RootNavigator />
      <StatusBar
        style={isLightTheme ? "dark" : "light"}
        backgroundColor={appTheme?.screen ?? "#050505"}
      />
      {showPidaSplash && <PidaBloomSplash onFinish={finishPidaSplash} />}
    </ThemeProvider>
  );
}

export default function RootLayout() {
  useEffect(() => {
    const setupNotifications = async () => {
      const { status } = await Notifications.requestPermissionsAsync();

      if (status !== "granted") {
        debugLog("Notification permission not granted");
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
              <ThemedAppShell />
            </CreditProvider>
          </GoalProvider>
        </AppThemeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
