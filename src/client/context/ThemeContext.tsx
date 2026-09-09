import React, { createContext, useContext, useEffect, useState } from "react";

export interface ThemeInfo {
  name: string;
  label: string;
  cssUrl: string;
  isDark?: boolean;
}

export const THEMES: ThemeInfo[] = [
  {
    name: "paper",
    label: "Paper (Default)",
    cssUrl:
      "https://cdn.jsdelivr.net/npm/bootswatch@3.4.1/paper/bootstrap.min.css",
    isDark: false,
  },
  {
    name: "cosmo",
    label: "Cosmo",
    cssUrl:
      "https://cdn.jsdelivr.net/npm/bootswatch@3.4.1/cosmo/bootstrap.min.css",
    isDark: false,
  },
  {
    name: "flatly",
    label: "Flatly",
    cssUrl:
      "https://cdn.jsdelivr.net/npm/bootswatch@3.4.1/flatly/bootstrap.min.css",
    isDark: false,
  },
  {
    name: "darkly",
    label: "Darkly",
    cssUrl:
      "https://cdn.jsdelivr.net/npm/bootswatch@3.4.1/darkly/bootstrap.min.css",
    isDark: true,
  },
  {
    name: "slate",
    label: "Slate",
    cssUrl:
      "https://cdn.jsdelivr.net/npm/bootswatch@3.4.1/slate/bootstrap.min.css",
    isDark: true,
  },
  {
    name: "cyborg",
    label: "Cyborg",
    cssUrl:
      "https://cdn.jsdelivr.net/npm/bootswatch@3.4.1/cyborg/bootstrap.min.css",
    isDark: true,
  },
  {
    name: "lumen",
    label: "Lumen",
    cssUrl:
      "https://cdn.jsdelivr.net/npm/bootswatch@3.4.1/lumen/bootstrap.min.css",
    isDark: false,
  },
  {
    name: "sandstone",
    label: "Sandstone",
    cssUrl:
      "https://cdn.jsdelivr.net/npm/bootswatch@3.4.1/sandstone/bootstrap.min.css",
    isDark: false,
  },
  {
    name: "superhero",
    label: "Superhero",
    cssUrl:
      "https://cdn.jsdelivr.net/npm/bootswatch@3.4.1/superhero/bootstrap.min.css",
    isDark: true,
  },
  {
    name: "yeti",
    label: "Yeti",
    cssUrl:
      "https://cdn.jsdelivr.net/npm/bootswatch@3.4.1/yeti/bootstrap.min.css",
    isDark: false,
  },
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
      return localStorage.getItem("mono_theme") || "paper";
    }
    return "paper";
  });

  const activeThemeInfo =
    THEMES.find((t) => t.name === currentTheme) || THEMES[0];

  useEffect(() => {
    let linkTag = document.getElementById("bootstrap-theme") as HTMLLinkElement;
    if (!linkTag) {
      linkTag = document.createElement("link");
      linkTag.id = "bootstrap-theme";
      linkTag.rel = "stylesheet";
      document.head.appendChild(linkTag);
    }
    linkTag.href = activeThemeInfo.cssUrl;
    localStorage.setItem("mono_theme", currentTheme);
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
