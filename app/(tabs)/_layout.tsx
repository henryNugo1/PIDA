import { Tabs } from "expo-router";
import React, { useContext } from "react";

import { HapticTab } from "@/components/haptic-tab";
import { Ionicons } from "@expo/vector-icons";
import { ThemeContext } from "../../context/ThemeContext";

export default function TabLayout() {
  const themeContext = useContext(ThemeContext);
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

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarActiveTintColor: UI.primary,
        tabBarInactiveTintColor: UI.muted,
        tabBarStyle: {
          backgroundColor: UI.card,
          borderTopColor: UI.border,
          borderTopWidth: 1,
          height: 110,
          paddingTop: 6,
          paddingBottom: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <Ionicons name="home" size={28} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="ai-bot"
        options={{
          title: "AI Bot",
          tabBarIcon: ({ color }) => (
            <Ionicons name="sparkles" size={28} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="me"
        options={{
          title: "Me",
          tabBarIcon: ({ color }) => (
            <Ionicons name="person-circle" size={28} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
