import React, {
  createContext,
  useContext,
  useLayoutEffect,
  useState,
} from "react";

export interface ThemeInfo {
  name: string;
  label: string;
  isDark?: boolean;
}

export const THEMES: ThemeInfo[] = [
  { name: "classic", label: "Classic (Default)", isDark: false },
  { name: "cobalt", label: "Cobalt", isDark: false },
  { name: "emerald", label: "Emerald", isDark: false },
  { name: "charcoal", label: "Charcoal", isDark: true },
  { name: "studio", label: "Studio", isDark: true },
  { name: "cyber", label: "Cyber", isDark: true },
  { name: "daylight", label: "Daylight", isDark: false },
  { name: "earth", label: "Earth", isDark: false },
  { name: "sunset", label: "Sunset", isDark: true },
  { name: "glacier", label: "Glacier", isDark: false },
];

interface ThemeContextType {
  currentTheme: string;
  setTheme: (themeName: string) => void;
  themes: ThemeInfo[];
  isDarkMode: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currentTheme, setCurrentTheme] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("core_theme");
      if (stored && THEMES.some((t) => t.name === stored)) {
        return stored;
      }
    }
    return "classic";
  });

  const activeThemeInfo =
    THEMES.find((t) => t.name === currentTheme) || THEMES[0];

  useLayoutEffect(() => {
    document.documentElement.setAttribute("data-theme", currentTheme);
    document.documentElement.setAttribute(
      "data-theme-mode",
      activeThemeInfo.isDark ? "dark" : "light",
    );
    localStorage.setItem("core_theme", currentTheme);
  }, [currentTheme, activeThemeInfo]);

  return (
    <ThemeContext.Provider
      value={{
        currentTheme,
        setTheme: setCurrentTheme,
        themes: THEMES,
        isDarkMode: !!activeThemeInfo.isDark,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

export default ThemeContext;
