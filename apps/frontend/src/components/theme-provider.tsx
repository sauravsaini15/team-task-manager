"use client";

import * as React from "react";

type Theme = "dark" | "light" | "system";

type ThemeProviderContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const ThemeProviderContext = React.createContext<ThemeProviderContextValue>({
  theme: "system",
  setTheme: () => null
});

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "teamtask-theme"
}: {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}) {
  const [theme, setThemeState] = React.useState<Theme>(() => {
    if (typeof window === "undefined") return defaultTheme;
    return (localStorage.getItem(storageKey) as Theme | null) || defaultTheme;
  });

  React.useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");

    const resolved =
      theme === "system"
        ? window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light"
        : theme;

    root.classList.add(resolved);
    root.style.colorScheme = resolved;
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    localStorage.setItem(storageKey, newTheme);
    setThemeState(newTheme);
  };

  return <ThemeProviderContext.Provider value={{ theme, setTheme }}>{children}</ThemeProviderContext.Provider>;
}

export function useTheme() {
  const context = React.useContext(ThemeProviderContext);
  if (!context) throw new Error("useTheme must be used inside ThemeProvider");
  return context;
}
