"use client";
import { useThemeMode } from "../contexts/ThemeContext";
import Head from "next/head";
import ThemeToggle from "./ThemeToggle";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { ToastContainer } from "react-toastify";
import { motion } from "motion/react";

function Layout({ children }: { children: React.ReactNode }) {
  const { mode } = useThemeMode();

  return (
    <div
      className={`min-h-screen flex flex-col transition-colors duration-300 ${
        mode === "dark"
          ? "bg-gray-900"
          : "bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-50"
      }`}
    >
      <Head>
        <title>MetaNode Stake DApp</title>
        <meta
          name="description"
          content="MetaNode Stake DApp - 安全、透明、高收益的去中心化质押服务"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className={`sticky top-0 z-50 backdrop-blur-lg border-b shadow-sm flex-shrink-0 ${
          mode === "dark"
            ? "bg-gray-800/80 border-gray-700/50 text-white"
            : "bg-white/80 border-gray-200/50 text-gray-900"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="flex items-center space-x-3"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-sm">M</span>
              </div>
              <div>
                <h1
                  className={`text-xl font-bold ${
                    mode === "dark" ? "text-white" : "text-gray-900"
                  }`}
                >
                  MetaNode
                </h1>
                <p
                  className={`text-xs -mt-1 ${
                    mode === "dark" ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  Stake DApp
                </p>
              </div>
            </motion.div>

            {/* Navigation & Controls */}
            <div className="flex items-center space-x-4">
              {/* Theme Info */}
              <div
                className={`hidden sm:flex items-center space-x-2 text-xs ${
                  mode === "dark" ? "text-gray-400" : "text-gray-500"
                }`}
              >
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>{mode === "dark" ? "深色主题" : "浅色主题"}</span>
              </div>

              {/* Theme Toggle */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <ThemeToggle />
              </motion.div>

              {/* Connect Button */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="ml-2"
              >
                <ConnectButton />
              </motion.div>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content - 使用flex-1自动填充剩余空间 */}
      <main className="flex-1 flex flex-col">{children}</main>

      {/* Footer - 始终贴底 */}
      <motion.footer
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
        className={`border-t backdrop-blur-sm flex-shrink-0 mt-auto ${
          mode === "dark"
            ? "border-gray-700/50 bg-gray-800/50 text-white"
            : "border-gray-200/50 bg-white/50 text-gray-900"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-6 h-6 bg-gradient-to-br from-blue-600 to-purple-600 rounded-md flex items-center justify-center">
                <span className="text-white font-bold text-xs">M</span>
              </div>
              <span
                className={`text-lg font-semibold ${
                  mode === "dark" ? "text-white" : "text-gray-900"
                }`}
              >
                MetaNode Stake
              </span>
            </div>
            <p
              className={`text-sm mx-auto ${
                mode === "dark" ? "text-gray-400" : "text-gray-600"
              }`}
            >
              基于以太坊的去中心化质押平台，为您提供安全、透明、高收益的质押服务
            </p>
            <div
              className={`flex items-center justify-center space-x-6 text-xs ${
                mode === "dark" ? "text-gray-500" : "text-gray-500"
              }`}
            >
              <span>© 2024 MetaNode</span>
              <span>•</span>
              <span>安全可靠</span>
              <span>•</span>
              <span>开源透明</span>
            </div>
          </div>
        </div>
      </motion.footer>

      {/* Toast Container */}
      <ToastContainer
        position="top-right"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme={mode === "dark" ? "dark" : "light"}
        toastClassName={`backdrop-blur-sm border shadow-lg rounded-xl ${
          mode === "dark"
            ? "bg-gray-800/90 text-white border-gray-700/50"
            : "bg-white/90 text-gray-900 border-gray-200/50"
        }`}
        progressClassName="bg-gradient-to-r from-blue-500 to-purple-500"
      />
    </div>
  );
}

export default Layout;
