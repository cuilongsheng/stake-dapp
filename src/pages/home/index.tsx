"use client";

import {
  MetaNodeStakeAddress,
  MetaNodeStakeAbi,
} from "@/contracts/metaNodeStake";
import type { NextPage } from "next";
import { useEffect, useMemo, useState } from "react";
import {
  useAccount,
  useBalance,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { formatEther } from "viem";
import { toast } from "react-toastify";
import DepositePool from "@/components/depositePool";
import { useReadContract } from "@/hooks/useReadContract";
import { motion } from "motion/react";
import { useThemeMode } from "@/contexts/ThemeContext";

const Home: NextPage = () => {
  const { address, isConnected } = useAccount();
  const { mode } = useThemeMode();
  const { data: balance, refetch: refetchBalance } = useBalance({
    address: address,
  });

  // 获取质押池信息
  const { data: poolLength } = useReadContract({
    address: MetaNodeStakeAddress,
    abi: MetaNodeStakeAbi,
    functionName: "poolLength",
  });

  const ids = useMemo(() => {
    const _length = Number(poolLength) || 0;
    return Array.from({ length: _length }, (_, i) => i);
  }, [poolLength]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-4xl mx-auto px-4 py-8 space-y-8"
    >
      {/* 顶部信息卡片 */}
      <motion.div variants={itemVariants} className="space-y-4">
        <div className="text-center mb-8">
          <h1
            className={`text-3xl font-bold mb-2 ${
              mode === "dark" ? "text-white" : "text-gray-900"
            }`}
          >
            MetaNode 质押平台
          </h1>
          <p
            className={`${mode === "dark" ? "text-gray-400" : "text-gray-600"}`}
          >
            安全、透明、高收益的去中心化质押服务
          </p>
        </div>

        {/* 钱包状态卡片 */}
        <div
          className={`backdrop-blur-sm border rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 ${
            mode === "dark"
              ? "bg-gray-800/80 border-gray-700/50"
              : "bg-white/80 border-gray-200/50"
          }`}
        >
          <div className="grid md:grid-cols-2 gap-4">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className={`rounded-xl p-4 border ${
                mode === "dark"
                  ? "bg-gradient-to-r from-blue-900/50 to-indigo-900/50 border-blue-700/50"
                  : "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100"
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <div>
                  <p
                    className={`text-sm font-medium ${
                      mode === "dark" ? "text-blue-300" : "text-blue-600"
                    }`}
                  >
                    钱包状态
                  </p>
                  <p
                    className={`font-semibold ${
                      mode === "dark" ? "text-blue-100" : "text-blue-900"
                    }`}
                  >
                    {isConnected ? "已连接" : "未连接"}
                  </p>
                  {isConnected && address && (
                    <p
                      className={`text-xs mt-1 font-mono ${
                        mode === "dark" ? "text-blue-400" : "text-blue-500"
                      }`}
                    >
                      {`${address.slice(0, 6)}...${address.slice(-4)}`}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className={`rounded-xl p-4 border ${
                mode === "dark"
                  ? "bg-gradient-to-r from-green-900/50 to-emerald-900/50 border-green-700/50"
                  : "bg-gradient-to-r from-green-50 to-emerald-50 border-green-100"
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                <div>
                  <p
                    className={`text-sm font-medium ${
                      mode === "dark" ? "text-green-300" : "text-green-600"
                    }`}
                  >
                    钱包余额
                  </p>
                  <p
                    className={`font-semibold ${
                      mode === "dark" ? "text-green-100" : "text-green-900"
                    }`}
                  >
                    {isConnected &&
                    balance?.value &&
                    (balance?.value as bigint) > 0
                      ? `${Number(
                          formatEther(balance?.value as bigint)
                        ).toFixed(4)} ${balance?.symbol || ""}`
                      : "0.0000 ETH"}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* 质押池列表 */}
      <motion.div variants={itemVariants} className="space-y-6">
        {ids?.length && address ? (
          <motion.div variants={containerVariants} className="grid gap-6">
            {ids.map((pid, index) => (
              <motion.div
                key={pid}
                variants={itemVariants}
                custom={index}
                whileHover={{ y: -2 }}
                transition={{ duration: 0.2 }}
              >
                <DepositePool
                  pid={pid}
                  walletAddress={address}
                  refetchBalance={refetchBalance || (() => {})}
                />
              </motion.div>
            ))}
          </motion.div>
        ) : ids?.length ? (
          <motion.div variants={itemVariants} className="text-center py-12">
            <div
              className={`backdrop-blur-sm border rounded-2xl p-8 shadow-sm ${
                mode === "dark"
                  ? "bg-gray-800/80 border-gray-700/50"
                  : "bg-white/80 border-gray-200/50"
              }`}
            >
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                  mode === "dark" ? "bg-gray-700" : "bg-gray-100"
                }`}
              >
                <svg
                  className={`w-8 h-8 ${
                    mode === "dark" ? "text-gray-400" : "text-gray-400"
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <h3
                className={`text-lg font-semibold mb-2 ${
                  mode === "dark" ? "text-white" : "text-gray-900"
                }`}
              >
                请先连接钱包
              </h3>
              <p
                className={`${
                  mode === "dark" ? "text-gray-400" : "text-gray-600"
                }`}
              >
                连接您的钱包以开始质押并获得奖励
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div variants={itemVariants} className="text-center py-12">
            <div
              className={`backdrop-blur-sm border rounded-2xl p-8 shadow-sm ${
                mode === "dark"
                  ? "bg-gray-800/80 border-gray-700/50"
                  : "bg-white/80 border-gray-200/50"
              }`}
            >
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                  mode === "dark" ? "bg-gray-700" : "bg-gray-100"
                }`}
              >
                <svg
                  className={`w-8 h-8 ${
                    mode === "dark" ? "text-gray-400" : "text-gray-400"
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
              </div>
              <h3
                className={`text-lg font-semibold mb-2 ${
                  mode === "dark" ? "text-white" : "text-gray-900"
                }`}
              >
                暂无质押池
              </h3>
              <p
                className={`${
                  mode === "dark" ? "text-gray-400" : "text-gray-600"
                }`}
              >
                质押池正在加载中，请稍候...
              </p>
            </div>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default Home;
