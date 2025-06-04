import React from "react";
import { useThemeMode } from "../contexts/ThemeContext";

export type Theme = "light" | "dark";

const ThemeToggle: React.FC = () => {
  const { mode, toggleTheme } = useThemeMode();

  return (
    <button
      onClick={toggleTheme}
      className={`
        relative inline-flex items-center justify-center
        w-12 h-6 rounded-full transition-colors duration-200 ease-in-out
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
        ${
          mode === "dark"
            ? "bg-blue-600 hover:bg-blue-700"
            : "bg-gray-200 hover:bg-gray-300"
        }
      `}
      aria-label={`切换到${mode === "light" ? "深色" : "浅色"}主题`}
    >
      <span
        className={`
          inline-block w-4 h-4 rounded-full bg-white shadow transform transition-transform duration-200 ease-in-out
          ${mode === "dark" ? "translate-x-6" : "translate-x-1"}
        `}
      />
      <span className="sr-only">
        {mode === "light" ? "浅色主题" : "深色主题"}
      </span>

      {/* 太阳图标 */}
      <svg
        className={`
          absolute left-1 w-3 h-3 text-yellow-500 transition-opacity duration-200
          ${mode === "light" ? "opacity-100" : "opacity-0"}
        `}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fillRule="evenodd"
          d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
          clipRule="evenodd"
        />
      </svg>

      {/* 月亮图标 */}
      <svg
        className={`
          absolute right-1 w-3 h-3 text-blue-300 transition-opacity duration-200
          ${mode === "dark" ? "opacity-100" : "opacity-0"}
        `}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
      </svg>
    </button>
    // <Tooltip title={`切换到${mode === "light" ? "深色" : "浅色"}主题`}>
    //   <IconButton
    //     onClick={toggleTheme}
    //     color="inherit"
    //     sx={{
    //       ml: 1,
    //       backgroundColor: "rgba(255, 255, 255, 0.1)",
    //       "&:hover": {
    //         backgroundColor: "rgba(255, 255, 255, 0.2)",
    //       },
    //     }}
    //   >
    //     {mode === "light" ? <Brightness4 /> : <Brightness7 />}
    //   </IconButton>
    // </Tooltip>
  );
};

export default ThemeToggle;
