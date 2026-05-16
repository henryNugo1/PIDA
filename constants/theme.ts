/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from "react-native";

const tintColorLight = "#0a7ea4";
const tintColorDark = "#fff";

export const themes = {
  lightClean: {
    name: "Light Clean",
    access: "free",
    effect: "clean",
    screen: "#f8fafc",
    card: "#ffffff",
    innerCard: "#f1f5f9",
    border: "#dbeafe",
    text: "#0f172a",
    muted: "#64748b",
    primary: "#2563eb",
    primarySoft: "rgba(37,99,235,0.12)",
  },

  carbonBlack: {
    name: "Carbon Black",
    access: "free",
    effect: "clean",
    screen: "#050505",
    card: "#0f0f0f",
    innerCard: "#171717",
    border: "#262626",
    text: "#ffffff",
    muted: "#a3a3a3",
    primary: "#2563eb",
    primarySoft: "rgba(37,99,235,0.18)",
  },

  lavaFlow: {
    name: "Lava Flow",
    access: "premium",
    effect: "lava",
    screen: "#120505",
    card: "#1f0a0a",
    innerCard: "#2a0f0f",
    border: "#7f1d1d",
    text: "#fff7ed",
    muted: "#fed7aa",
    primary: "#f97316",
    primarySoft: "rgba(249,115,22,0.18)",
  },

  iceCrystal: {
    name: "Ice Crystal",
    access: "premium",
    effect: "ice",
    screen: "#eff6ff",
    card: "#ffffff",
    innerCard: "#dbeafe",
    border: "#93c5fd",
    text: "#0f172a",
    muted: "#475569",
    primary: "#0284c7",
    primarySoft: "rgba(2,132,199,0.15)",
  },

  cyberNeon: {
    name: "Cyber Neon",
    access: "premium",
    effect: "neon",
    screen: "#020617",
    card: "#0f172a",
    innerCard: "#111827",
    border: "#22d3ee",
    text: "#ecfeff",
    muted: "#67e8f9",
    primary: "#06b6d4",
    primarySoft: "rgba(6,182,212,0.18)",
  },

  royalGold: {
    name: "Royal Gold",
    access: "premium",
    effect: "luxury",
    screen: "#0c0a09",
    card: "#1c1917",
    innerCard: "#292524",
    border: "#854d0e",
    text: "#fef3c7",
    muted: "#d6d3d1",
    primary: "#f59e0b",
    primarySoft: "rgba(245,158,11,0.18)",
  },

  emeraldMatrix: {
    name: "Emerald Matrix",
    access: "premium",
    effect: "matrix",
    screen: "#03140c",
    card: "#052e16",
    innerCard: "#064e3b",
    border: "#047857",
    text: "#ecfdf5",
    muted: "#6ee7b7",
    primary: "#10b981",
    primarySoft: "rgba(16,185,129,0.18)",
  },

  midnightPurple: {
    name: "Midnight Purple",
    access: "premium",
    effect: "cosmic",
    screen: "#12051f",
    card: "#1e1033",
    innerCard: "#2e1065",
    border: "#6d28d9",
    text: "#f5f3ff",
    muted: "#c4b5fd",
    primary: "#8b5cf6",
    primarySoft: "rgba(139,92,246,0.2)",
  },
} as const;

export const Colors = {
  light: {
    text: "#0f172a", // deep slate (clean readability)
    background: "#f8fafc", // soft white (not harsh white)
    tint: "#2563eb", // your brand blue
    icon: "#64748b", // muted slate
    tabIconDefault: "#94a3b8",
    tabIconSelected: "#2563eb",
  },
  dark: {
    text: "#ffffff",
    background: "#050505", // carbon black (matches your theme)
    tint: "#2563eb",
    icon: "#a3a3a3",
    tabIconDefault: "#525252",
    tabIconSelected: "#ffffff",
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: "system-ui",
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: "ui-serif",
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: "ui-rounded",
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
