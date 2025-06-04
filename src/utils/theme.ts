// 主题相关的工具函数

export interface ThemeClasses {
  bg: string;
  text: string;
  border: string;
  hover?: string;
  focus?: string;
}

export const cardStyles: ThemeClasses = {
  bg: "bg-white/90 dark:bg-gray-800/90",
  text: "text-gray-900 dark:text-white",
  border: "border-gray-200/50 dark:border-gray-700/50",
  hover: "hover:shadow-lg",
};

export const inputStyles: ThemeClasses = {
  bg: "bg-white dark:bg-gray-600",
  text: "text-gray-900 dark:text-white",
  border: "border-gray-200 dark:border-gray-500",
  focus: "focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500",
};

export const buttonStyles = {
  primary:
    "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white",
  success:
    "bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white",
  warning:
    "bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white",
  secondary:
    "bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white",
};

export const textStyles = {
  heading: "text-gray-900 dark:text-white",
  subheading: "text-gray-600 dark:text-gray-400",
  muted: "text-gray-500 dark:text-gray-400",
  accent: "text-blue-600 dark:text-blue-300",
};

export const backgroundStyles = {
  card: "bg-white/90 dark:bg-gray-800/90",
  input: "bg-white dark:bg-gray-600",
  hover: "hover:bg-gray-50 dark:hover:bg-gray-700",
  accent: {
    blue: "bg-blue-50/80 dark:bg-blue-900/20",
    green: "bg-emerald-50/80 dark:bg-emerald-900/20",
    amber: "bg-amber-50/80 dark:bg-amber-900/20",
    purple: "bg-purple-50/80 dark:bg-purple-900/20",
  },
};

export const borderStyles = {
  default: "border-gray-200/50 dark:border-gray-700/50",
  input: "border-gray-200 dark:border-gray-500",
  accent: {
    blue: "border-blue-100 dark:border-blue-700/50",
    green: "border-emerald-100 dark:border-emerald-700/50",
    amber: "border-amber-100 dark:border-amber-700/50",
    purple: "border-purple-100 dark:border-purple-700/50",
  },
};

// 组合样式函数
export const getCardClasses = (variant: "default" | "accent" = "default") => {
  const base = `backdrop-blur-sm border rounded-2xl shadow-sm transition-all duration-300 ${cardStyles.bg} ${borderStyles.default}`;
  if (variant === "accent") {
    return `${base} hover:shadow-lg`;
  }
  return base;
};

export const getInputClasses = (variant: "default" | "search" = "default") => {
  const base = `px-4 py-3 rounded-xl transition-all duration-200 outline-none ${inputStyles.bg} ${inputStyles.text} ${inputStyles.border} ${inputStyles.focus}`;
  if (variant === "search") {
    return `${base} placeholder-gray-500 dark:placeholder-gray-400`;
  }
  return `${base} placeholder-gray-500 dark:placeholder-gray-400 disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:text-gray-500 dark:disabled:text-gray-500`;
};

export const getButtonClasses = (
  variant: keyof typeof buttonStyles = "primary"
) => {
  return `${buttonStyles[variant]} font-semibold py-3 px-6 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md flex items-center justify-center space-x-2`;
};
