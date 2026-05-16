import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { AuthContext } from "./AuthContext";
import { themes } from "../utils/theme";

type ThemeType = keyof typeof themes;

type ThemeContextType = {
  theme: (typeof themes)[keyof typeof themes];
  themeKey: ThemeType;
  setTheme: (key: ThemeType) => void;
};

export const ThemeContext = createContext<ThemeContextType | null>(null);

const DEFAULT_THEME: ThemeType = "carbonBlack";
const THEME_STORAGE_KEY_BASE = "goaltracker_theme";

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const auth = useContext(AuthContext);
  const userId = auth?.user?.id ?? null;
  const [themeKey, setThemeKey] = useState<ThemeType>(DEFAULT_THEME);

  const getThemeStorageKey = () => {
    if (!userId) return null;
    return `${THEME_STORAGE_KEY_BASE}:${userId}`;
  };

  useEffect(() => {
    const loadTheme = async () => {
      const storageKey = getThemeStorageKey();

      if (!storageKey) {
        setThemeKey(DEFAULT_THEME);
        return;
      }

      const savedTheme = await AsyncStorage.getItem(storageKey);

      if (savedTheme && savedTheme in themes) {
        setThemeKey(savedTheme as ThemeType);
      } else {
        setThemeKey(DEFAULT_THEME);
      }
    };

    loadTheme();
  }, [userId]);

  const setTheme = async (key: ThemeType) => {
    setThemeKey(key);

    const storageKey = getThemeStorageKey();
    if (!storageKey) return;

    await AsyncStorage.setItem(storageKey, key);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme: themes[themeKey],
        themeKey,
        setTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};
