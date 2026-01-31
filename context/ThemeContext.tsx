import React, { createContext, useContext, useEffect, useState } from "react";
import { useColorScheme as useDeviceColorScheme } from "react-native";
import * as SecureStore from "expo-secure-store";

type ThemeMode = "light" | "dark" | "system";

interface ThemeContextType {
  theme: ThemeMode;
  colorScheme: "light" | "dark";
  setTheme: (theme: ThemeMode) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const deviceColorScheme = useDeviceColorScheme();
  const [theme, setThemeState] = useState<ThemeMode>("system");

  useEffect(() => {
    const loadTheme = async () => {
      const savedTheme = await SecureStore.getItemAsync("user-theme");
      if (savedTheme) {
        setThemeState(savedTheme as ThemeMode);
      }
    };
    loadTheme();
  }, []);

  const setTheme = async (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    await SecureStore.setItemAsync("user-theme", newTheme);
  };

  const colorScheme =
    theme === "system" ? (deviceColorScheme ?? "light") : theme;

  return (
    <ThemeContext.Provider value={{ theme, colorScheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useAppTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useAppTheme must be used within a ThemeProvider");
  }
  return context;
};
