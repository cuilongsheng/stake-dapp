import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { ThemeProvider as MuiThemeProvider } from "@mui/material/styles";
import { CssBaseline } from "@mui/material";
import { PaletteMode } from "@mui/material";
import { getTheme } from "../theme";

interface ThemeContextType {
  mode: PaletteMode;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // 初始化时总是使用浅色主题，避免水合错误
  const [mode, setMode] = useState<PaletteMode>("light");
  const [isHydrated, setIsHydrated] = useState(false);

  // 客户端水合后读取 localStorage
  useEffect(() => {
    setIsHydrated(true);
    const savedTheme = localStorage.getItem("themeMode") as PaletteMode;
    if (savedTheme && (savedTheme === "light" || savedTheme === "dark")) {
      setMode(savedTheme);
    }
  }, []);

  // 切换主题
  const toggleTheme = () => {
    const newMode = mode === "light" ? "dark" : "light";
    setMode(newMode);
  };

  // 保存主题设置到 localStorage
  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem("themeMode", mode);
      // 在html元素上设置dark class来配合Tailwind的dark模式
      if (mode === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  }, [mode, isHydrated]);

  const theme = getTheme(mode);

  const contextValue: ThemeContextType = {
    mode,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};

// 自定义 hook 来使用主题上下文
export const useThemeMode = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useThemeMode must be used within a ThemeProvider");
  }
  return context;
};
